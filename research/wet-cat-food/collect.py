"""Read public wet-cat-food catalogues without browser automation or account access"""
import concurrent.futures, hashlib, html, json, re, subprocess
from pathlib import Path
from urllib.parse import urljoin, unquote

ROOT = Path(__file__).resolve().parent
CACHE = Path('/tmp/catmandog-wet-research'); CACHE.mkdir(exist_ok=True)
DATE = '2026-10-13'
BRANDS = ['Royal Canin', "Hill's", 'Advance', 'Leonardo', 'Acana', 'Orijen']

def fetch(url):
    path = CACHE / (hashlib.sha256(url.encode()).hexdigest()+'.html')
    if path.exists(): return path.read_text()
    p = subprocess.run(['curl','-L','--max-time','35','-sS',url],capture_output=True,text=True)
    if p.returncode: return ''
    path.write_text(p.stdout)
    return p.stdout

def clean(s): return ' '.join(html.unescape(re.sub('<[^>]+>',' ',s)).split())
def attrs(s): return {k:html.unescape(v) for k,v in re.findall(r'([\w:-]+)=["\']([^"\']*)["\']',s)}
def links(s,base):
    return {urljoin(base,html.unescape(a)):clean(b) for a,b in re.findall(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',s,re.S)}
def nodes(s):
    result=[]
    for raw in re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',s,re.S):
        try: d=json.loads(raw)
        except ValueError: continue
        result.extend(d if isinstance(d,list) else [d])
    return result

def pack(url):
    path=unquote(url).lower()
    m=re.search(r'/(?:([0-9]+)(?:-latas|-sobres|-bolsas|-uds)?-x-)?([0-9]+(?:[.-][0-9]+)?)-(kg|g)(?:-|/)',path)
    if not m:return None
    return {'quantity':int(m[1] or 1),'grams':round(float(m[2].replace('-','.'))*(1000 if m[3]=='kg' else 1))}

def retailer_product(url):
    s=fetch(url); out=[]
    for n in nodes(s):
        if not isinstance(n,dict) or n.get('@type') not in ['ProductGroup','Product']:continue
        brand=n.get('brand',{});brand=brand.get('name','') if isinstance(brand,dict) else brand
        if not any(b.lower() in brand.lower() for b in BRANDS):continue
        for v in n.get('hasVariant',[n]):
            u=v.get('url',url); p=pack(u);o=v.get('offers',{})
            if isinstance(o,list):o=o[0] if o else {}
            if not p or not o.get('price') or o.get('priceCurrency')!='EUR':continue
            image=v.get('image',n.get('image'))
            if isinstance(image,list):image=image[0] if image else None
            out.append(dict(p,name=n.get('name'),brand=brand,priceEUR=float(o['price']),currency='EUR',sourceUrl=u,familyUrl=url,retailer='Kiwoko' if 'kiwoko' in url else 'Tiendanimal',retailerSku=v.get('sku'),gtin=v.get('gtin13') or v.get('gtin'),imageUrl=image,availability=o.get('availability','').rsplit('/',1)[-1] or 'not_verified',evidenceType='live_public_structured_offer',checkedOn=DATE,purchasePrice=None))
    return {'url':url,'offers':out,'error':None if out else 'No exact publicly priced pack found'}

def leonardo_page(url):
    s=fetch(url);out=[]
    for tag in re.findall(r'<input\b[^>]*data-variantproduct-url[^>]*>',s):
        a=attrs(tag);u=a.get('data-variantproduct-url','');m=re.search(r'-(\d+)-x-(\d+)-g',u)
        if not m:continue
        out.append(dict(brand='Leonardo',name='LEONARDO '+a.get('data-variantproduct-manufacturer-title','').strip()+' '+a.get('data-variantproduct-title','').strip(),quantity=int(m[1]),grams=int(m[2]),sourceUrl=u,familyUrl=u,priceEUR=float(a['data-variantproduct-price']) if a.get('data-variantproduct-price') else None,imageUrl=a.get('data-variantproduct-coverimage'),availability='InStock' if a.get('data-variantproduct-is-available')=='1' else 'OutOfStock',retailer='LEONARDO - официальный магазин',evidenceType='live_public_variant_metadata',checkedOn=DATE,purchasePrice=None))
    return {'url':url,'offers':out,'productLinks':{u:t for u,t in links(s,url).items() if '/leonardo-' in u}}

def main():
    seeds=[]
    for domain in ['www.kiwoko.com','www.tiendanimal.es']:
        path='/gatos/comida-para-gatos/comida-humeda-para-gatos/' if 'kiwoko' in domain else '/gatos/comida-para-gatos/comida-humeda/'
        for start in range(0,1200,200): seeds.append(f'https://{domain}{path}?start={start}&sz=200')
    lbase='https://es.leonardo-catfood.com/productos/alimento-humedo'
    lseeds=[lbase]+[lbase+'/latas/'+x for x in ['quality-selection','superior-selection','extra-filete']]+[lbase+'/pouches/'+x for x in ['finest-selection','pulled-beef']]
    jobs=set(); discovery=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for url,s in zip(seeds,pool.map(fetch,seeds)):
            found={u:t for u,t in links(s,url).items() if u.endswith('_M.html') and re.search('royal-canin|hill_s|hills-|leonardo|acana|orijen|advance',u,re.I) and ('humeda' in u or 'humedo' in u or 'humidos' in u)}
            jobs.update(found);discovery.append({'url':url,'products':found,'bytes':len(s)})
            print('Listing',url,len(found),flush=True)
        lp=list(pool.map(leonardo_page,lseeds))
    # Leonardo variants are explicit, and selected links are checked later for additional packs
    (ROOT/'discovery.json').write_text(json.dumps(discovery,ensure_ascii=False,indent=2))
    (ROOT/'leonardo-evidence.json').write_text(json.dumps(lp,ensure_ascii=False,indent=2))
    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for i,r in enumerate(pool.map(retailer_product,sorted(jobs)),1):
            results.append(r)
            if i%15==0:
                (ROOT/'retail-evidence.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
                print('Products',i,'/',len(jobs),'Offers',sum(len(x['offers']) for x in results),flush=True)
    (ROOT/'retail-evidence.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    print('Done',len(jobs),'product pages',sum(len(x['offers']) for x in results),'retail offers',flush=True)

if __name__=='__main__':main()
