from collect import *

seeds=[
 'https://www.kiwoko.com/marcas/applaws/?sz=200',
 'https://www.kiwoko.com/gatos/comida-para-gatos/snacks-para-gatos/?sz=200',
 'https://www.tiendanimal.es/marcas/kit-cat/?sz=200',
 'https://www.tiendanimal.es/gatos/productos-para-la-salud/aceites/?sz=100',
]
explicit=[
 'https://www.tiendanimal.es/beaphar-aceite-de-salmon-para-perros-y-gatos/BEA11283_M.html',
 'https://www.tiendanimal.es/kit-cat-freezebites-pollo-snack-liofilizado-para-gatos/KTCKC6963_M.html',
]
jobs=set(explicit)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for u,s in zip(seeds,pool.map(fetch,seeds)):
        jobs.update(a for a,t in links(s,u).items() if a.endswith('_M.html') and relevant(t,a))
    # Reparse cached pages with broader presentation syntax, retaining original metadata for audit
    old=json.loads((ROOT/'retail-evidence.json').read_text())
    jobs.update(r['url'] for r in old)
    result=[]
    for i,r in enumerate(pool.map(product,sorted(jobs)),1):
        result.append(r)
        if i%30==0:print('Reparsed',i,'/',len(jobs),flush=True)
(ROOT/'retail-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('Done',len(result),'pages',sum(len(r['offers']) for r in result),'offers')
