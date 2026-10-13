"""Preserve Miscota catalogue evidence and exact publicly priced product packs"""
from collect import *

def metaval(s,key,attr='itemprop'):
    for t in re.findall(r'<meta\b[^>]*>',s,re.I):
        a=attrs(t)
        if a.get(attr)==key:return a.get('content')

def product(u):
    s=fetch(u);result={'url':u,'offers':[]}
    h=re.search(r'<h1\b[^>]*>(.*?)</h1>',s,re.S);name=clean(h[1]) if h else ''
    result['name']=name
    for n in nodes(s):
        if not isinstance(n,dict) or n.get('@type')!='Product':continue
        o=n.get('offers',{}); o=o[0] if isinstance(o,list) and o else o
        result['structuredProduct']={k:v for k,v in n.items() if k not in ['review','aggregateRating','description']}
    # Meta tags are preserved for review, not blindly paired with a pack size
    result['metadata']={k:metaval(s,k) for k in ['price','priceCurrency','gtin13','weight','availability']}
    result['packEvidence']=[clean(m)[:160] for m in re.findall(r'.{0,80}(?:85\s*(?:gr|g)|200\s*(?:gr|g)|400\s*(?:gr|g)|800\s*(?:gr|g)).{0,80}',s,re.I)][:15]
    return result

def main():
    seeds=[f'https://www.miscota.es/gatos/{b}?page={p}' for b in ['acana','advance','leonardo','hills','royal-canin','orijen'] for p in range(1,7)]
    found={};disc=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for u,s in zip(seeds,pool.map(fetch,seeds)):
            selected={a:t for a,t in links(s,u).items() if '/gatos/' in a and re.search('h[uú]med|pat[eé]|filet|pouch|salsa|gelatina|lata|sobre|pulled',t,re.I) and len(a.split('/'))>=6 and not '?page=' in a}
            found.update(selected);disc.append({'url':u,'products':selected,'bytes':len(s)})
            print('Miscota listing',u,len(selected),flush=True)
    (ROOT/'miscota-discovery.json').write_text(json.dumps(disc,ensure_ascii=False,indent=2))
    result=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for i,r in enumerate(pool.map(product,found),1):
            result.append(r)
            if i%20==0:print('Miscota products',i,'/',len(found),flush=True)
    (ROOT/'miscota-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print('Done',len(result),flush=True)

if __name__=='__main__':main()
