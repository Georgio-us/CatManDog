"""Check public manufacturer names, product types and declared pack sizes"""
from collect import *

def main():
    discovery=json.loads((ROOT/'additional-discovery.json').read_text());jobs=set()
    for r in discovery:
        for u,t in r.get('links',{}).items():
            if 'hillspet' in u and '/cat-food/' in u and re.search('pouch|canned|stew',u):jobs.add(u)
            if 'advance-affinity' in u and '/gato/comida-gato/' in u:jobs.add(u)
            if 'acana' in u and 'premium-pate' in u:jobs.add(u)
            if 'orijenpetfoods.com/en-US/cats/cat-food/' in u:jobs.add(u)
    # The first listing page omits two ACANA recipes
    jobs.update(['https://emea.acana.com/es-ES/para-gatos/eu-premium-pate-cat-beef-recipe%C2%A0.html','https://emea.acana.com/en/cats/cat-food/eu-premium-pate-cat-chicken-recipe-1.html'])
    result=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for u,s in zip(sorted(jobs),pool.map(fetch,sorted(jobs))):
            h=re.search(r'<h1\b[^>]*>(.*?)</h1>',s,re.S)
            text=clean(re.sub(r'<script\b.*?</script>|<style\b.*?</style>','',s,flags=re.S))
            # Evidence excerpts retain context; no pack weight inferred from a feeding table
            excerpts=[text[max(0,m.start()-100):m.end()+140] for m in re.finditer(r'(?:[0-9]+(?:[.,][0-9]+)?\s*(?:g\b|oz\b)|Tamaños disponibles|Formatos disponibles)',text,re.I)]
            result.append(dict(sourceUrl=u,title=clean(h[1]) if h else None,packEvidence=excerpts[:30],checkedOn=DATE,region='US' if '/en-US/' in u else 'EMEA',purchasePrice=None))
    (ROOT/'manufacturer-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print('Manufacturer product pages',len(result),flush=True)

if __name__=='__main__':main()
