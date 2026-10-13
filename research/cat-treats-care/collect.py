"""Collect public Spanish cat treats and everyday-care SKU evidence, without browser control"""
import concurrent.futures, hashlib, html, json, re, subprocess
from pathlib import Path
from urllib.parse import urljoin, unquote

ROOT=Path(__file__).resolve().parent
CACHE=Path('/tmp/catmandog-treats-care');CACHE.mkdir(exist_ok=True)
DATE='2026-10-13'
BRAND_PATTERN=r'churu|ciao|inaba|dashi|catit|gimcat|gimpet|beaphar|vitakraft|applaws|thrive|kit.cat|dentalife|pro-plan|proplan|plaqueoff|swedencare|grizzly|vetoquinol|dechra|trixie'

def fetch(url):
    p=CACHE/(hashlib.sha256(url.encode()).hexdigest()+'.html')
    if p.exists():return p.read_text()
    r=subprocess.run(['curl','-L','--max-time','30','-sS',url],capture_output=True,text=True)
    if r.returncode:return ''
    p.write_text(r.stdout);return r.stdout
def clean(s):return ' '.join(html.unescape(re.sub('<[^>]+>',' ',s)).split())
def attrs(t):return {k:html.unescape(v) for k,v in re.findall(r'([\w:-]+)=["\']([^"\']*)["\']',t)}
def links(s,u):return {urljoin(u,html.unescape(a)):clean(b) for a,b in re.findall(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',s,re.S)}
def nodes(s):
    out=[]
    for x in re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',s,re.S):
        try:d=json.loads(x)
        except ValueError:continue
        out.extend(d if isinstance(d,list) else [d])
    return out
def pack(url):
    p=unquote(url).lower()
    # A variant URL expresses the retailer's priced presentation, not necessarily the manufacturer base pack
    m=re.search(r'(?:/|-)(?:([0-9]+)(?:-latas|-sobres|-bolsas|-bolsitas|-uds\.?|-unidades|-tubos|-tubitos)?-?x-?)?([0-9]+(?:[.-][0-9]+)?)-?(kg|g|gr|ml|l)(?:-|/)',p)
    if m:
        unit='ml' if m[3] in ['ml','l'] else 'g'
        amount=float(m[2].replace('-','.'))*(1000 if m[3] in ['kg','l'] else 1)
        quantity=int(m[1] or 1)
        return dict(quantity=quantity,amount=round(amount,3),unit=unit,packLabel=(str(quantity)+' × ' if quantity>1 else '')+str(round(amount,3)).rstrip('0').rstrip('.')+' '+unit)
    m=re.search(r'/(\d+)-(uds|unidades|tubos|sobres|dosis|comprimidos)(?:-|/)',p)
    if m:return dict(quantity=1,amount=int(m[1]),unit='шт',packLabel=m[0].strip('/-'))
    return None
def relevant(name,url):
    s=name.lower()
    if not re.search(BRAND_PATTERN,name+' '+url,re.I):return False
    if 'perros' in s and 'gatos' not in s and 'mascotas' not in s:return False
    return not re.search(r'pienso|comida húmeda|comida humeda|antiparas|pipeta|collar|shampoo|champú|arenero|difusor|renal|urinary|urinaria|flutd|flexifit|transport|cortau|cepillo|brushing|hydra care|relajante|relax|educador|catcomfort|spray calm|aceite de cbd',s)
def product(url):
    s=fetch(url);out=[];products=[]
    for n in nodes(s):
        if not isinstance(n,dict) or n.get('@type') not in ['ProductGroup','Product']:continue
        if not relevant(n.get('name',''),url):continue
        b=n.get('brand',{});b=b.get('name','') if isinstance(b,dict) else b
        desc=clean(n.get('description',''))
        for v in n.get('hasVariant',[n]):
            u=v.get('url',url);pk=pack(u);o=v.get('offers',{})
            if isinstance(o,list):o=o[0] if o else {}
            img=v.get('image',n.get('image'));img=img[0] if isinstance(img,list) and img else img
            record=dict(brand=b,name=n.get('name'),variantName=v.get('name'),sourceUrl=u,familyUrl=url,gtin=v.get('gtin13') or v.get('gtin'),retailerSku=v.get('sku'),imageUrl=img,pack=pk,declaredProperties=v.get('additionalProperty',n.get('additionalProperty')),descriptionEvidence=desc,checkedOn=DATE,purchasePrice=None)
            products.append(record)
            if pk and o.get('price') and o.get('priceCurrency')=='EUR':
                out.append(dict(record,**pk,priceEUR=float(o['price']),currency='EUR',retailer='Kiwoko' if 'kiwoko' in url else 'Tiendanimal',seller=o.get('seller'),availability=o.get('availability','').rsplit('/',1)[-1] or 'not_verified',evidenceType='live_public_structured_offer',shippingIncluded=False,deliveredToValenciaEUR=None))
    return dict(url=url,offers=out,products=products,error=None if out else 'Exact priced presentation not confirmed')

def main():
    seeds=[
      'https://www.kiwoko.com/marcas/churu/?sz=200',
      'https://www.kiwoko.com/gatos/comida-para-gatos/snacks-para-gatos/?start=0&sz=200',
      'https://www.kiwoko.com/gatos/comida-para-gatos/snacks-para-gatos/?start=200&sz=200',
      'https://www.kiwoko.com/gatos/comida-para-gatos/maltas-y-hierbas/malta/?sz=200',
      'https://www.kiwoko.com/gatos/comida-para-gatos/maltas-y-hierbas/hierbas/?sz=200',
      'https://www.kiwoko.com/gatos/higiene-para-gatos/salud-del-gato/?start=0&sz=200',
      'https://www.tiendanimal.es/marcas/churu/?sz=200',
      'https://www.tiendanimal.es/gatos/snacks/?start=0&sz=200',
      'https://www.tiendanimal.es/gatos/snacks/?start=200&sz=200',
      'https://www.tiendanimal.es/gatos/snacks/maltas/?sz=200',
      'https://www.tiendanimal.es/gatos/snacks/hierbas/?sz=200',
      'https://www.tiendanimal.es/gatos/productos-para-la-salud/aceites/?sz=200',
      'https://www.tiendanimal.es/gatos/productos-para-la-salud/higiene-bucal/?sz=200',
    ]
    jobs={};disc=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for u,s in zip(seeds,pool.map(fetch,seeds)):
            selected={a:t for a,t in links(s,u).items() if a.endswith('_M.html') and relevant(t,a)}
            jobs.update(selected);disc.append(dict(url=u,products=selected,bytes=len(s)))
            print('Listing',u,len(selected),flush=True)
    (ROOT/'discovery.json').write_text(json.dumps(disc,ensure_ascii=False,indent=2))
    result=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for i,r in enumerate(pool.map(product,jobs),1):
            result.append(r)
            if i%20==0:
                (ROOT/'retail-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
                print('Products',i,'/',len(jobs),'Offers',sum(len(x['offers']) for x in result),flush=True)
    (ROOT/'retail-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print('Done',len(result),'pages',sum(len(x['offers']) for x in result),'offers',flush=True)

if __name__=='__main__':main()
