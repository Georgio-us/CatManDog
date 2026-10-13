from collect import *

jobs=set()
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    seeds=[f'https://www.tiendanimal.es/marcas/hills/{r}/gato/comida-humeda/?start=0&sz=200' for r in ['hills-science-plan','hills-prescription-diet']]
    for u,s in zip(seeds,pool.map(fetch,seeds)):
        jobs.update(a for a in links(s,u) if a.endswith('_M.html') and re.search('hills|hill_s',a,re.I))
    result=list(pool.map(retailer_product,sorted(jobs)))
(ROOT/'hills-tiendanimal-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('Hills Tiendanimal',len(result),'pages',sum(len(r['offers']) for r in result),'offers')
