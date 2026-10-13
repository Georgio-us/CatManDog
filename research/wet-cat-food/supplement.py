from collect import *

urls=[
 'https://www.kiwoko.com/alimentacion-gato/85-g-advance-gastroenteric-pollo-sobre-para-gatos/ADV925978.html',
 'https://www.tiendanimal.es/advance-gastroenteric-pollo-sobre-para-gatos/ADV925978_M.html',
 'https://www.kiwoko.com/gatos/comida-para-gatos/comida-humeda-para-gatos/royal-canin-instinctive-sobre-en-salsa-para-gatos/ROY404025_M.html',
]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:r=list(pool.map(retailer_product,urls))
(ROOT/'supplement-evidence.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
print([(x['url'],len(x['offers'])) for x in r])
