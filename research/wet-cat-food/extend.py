"""Extend evidence with a second retailer and manufacturer catalogues"""
from collect import *

def main():
    tseeds=[f'https://www.tiendanimal.es/marcas/{brand}/gato/comida-humeda/?start=0&sz=200' for brand in ['royal-canin','hills','advance','acana','leonardo','orijen']]
    manufacturer=[
        'https://emea.acana.com/es-ES/para-gatos?start=0&sz=100',
        'https://www.advance-affinity.com/es/es/wet-cat.html',
        'https://www.hillspet.es/cat-food',
        'https://emea.orijenpetfoods.com/es-ES/para-gatos',
        'https://www.orijenpetfoods.com/en-US/wet-cat.html']
    discovery=[];jobs=set()
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for u,s in zip(tseeds,pool.map(fetch,tseeds)):
            found={a:t for a,t in links(s,u).items() if a.endswith('_M.html') and re.search('royal-canin|hill_s|hills-|leonardo|acana|orijen|advance',a,re.I)}
            jobs.update(found);discovery.append(dict(url=u,products=found,bytes=len(s)))
            print('Tiendanimal listing',u,len(found),flush=True)
        for u,s in zip(manufacturer,pool.map(fetch,manufacturer)):
            found=links(s,u)
            discovery.append(dict(url=u,links=found,bytes=len(s)))
    (ROOT/'additional-discovery.json').write_text(json.dumps(discovery,ensure_ascii=False,indent=2))
    result=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for i,r in enumerate(pool.map(retailer_product,sorted(jobs)),1):
            result.append(r)
            if i%20==0:print('Tiendanimal products',i,'/',len(jobs),flush=True)
    (ROOT/'tiendanimal-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print('Done',len(result),'pages',sum(len(r['offers']) for r in result),'offers',flush=True)

if __name__=='__main__': main()
