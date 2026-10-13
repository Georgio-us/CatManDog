from collect import *

sources=[
 'https://inabafoods-europe.com/products/pet-type/cat/',
 'https://www.catit.com/es/productos/snacks/creamy-europe/',
 'https://www.beaphar.es/product/12947-pasta-de-malta-gatos-100g/',
 'https://www.beaphar.es/product/11295-aceite-de-salmon-perro-y-gato-425ml/',
 'https://www.beaphar.es/product/15685-gel-dental-perro-y-gato-100g/',
 'https://www.purina.es/gatos/comida-gatos/suplementos',
 'https://es.swedencare.com/products/polvo-gato',
 'https://es.swedencare.com/products/creme-para-gatos',
 'https://kitcat.com.sg/products/treats/freezebites/',
 'https://thrivepetfoods.com/collections/cats',
]
evidence=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for u,s in zip(sources,pool.map(fetch,sources)):
        h=re.search(r'<h1\b[^>]*>(.*?)</h1>',s,re.S)
        text=clean(re.sub(r'<script\b.*?</script>|<style\b.*?</style>','',s,flags=re.S))
        evidence.append(dict(sourceUrl=u,title=clean(h[1]) if h else None,productLinks=links(s,u),packEvidence=[text[max(0,m.start()-70):m.end()+100] for m in re.finditer(r'\b(?:\d+\s*(?:g|ml|tubitos|sobres|tubes)|EAN|Formatos|Contenido)\b',text,re.I)][:35],checkedOn=DATE))
(ROOT/'manufacturer-evidence.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2))

# Public shop catalogue, preserving prices only for product variants with identifiable presentations
official=[];discovery=[]
for base in ['https://catit.es','https://kitcat.es']:
    u=base+'/products.json?limit=250';s=fetch(u)
    try:products=json.loads(s).get('products',[])
    except ValueError:products=[]
    for p in products:
        name=p['title'];body=clean(p.get('body_html') or '')
        if not re.search('creamy|freezebites|filletfresh|purrpuree|purrpurée',name,re.I):continue
        discovery.append(dict(name=name,url=base+'/products/'+p['handle'],packEvidence=[body[max(0,m.start()-65):m.end()+75] for m in re.finditer(r'\b\d+\s*(?:g|gramos|tubos)\b',body,re.I)][:10],variants=[{k:v.get(k) for k in ['id','title','price','sku','available']} for v in p['variants']]))
        presentation=None
        m=re.search(r'(\d+)\s*[x×]\s*(\d+)\s*g\b',name,re.I)
        if m:presentation=dict(quantity=int(m[1]),amount=float(m[2]),unit='g')
        elif base=='https://kitcat.es' and 'freezebites' in name.lower() and (m:=re.search(r'\b(\d+)\s*g\b',name,re.I)):
            presentation=dict(quantity=1,amount=float(m[1]),unit='g')
        elif base=='https://catit.es' and 'creamy' in name.lower() and 'bitz' not in name.lower() and 'cups' not in name.lower() and (m:=re.search(r'(\d+)\s*(?:tubos|tubitos)',name,re.I)):
            presentation=dict(quantity=int(m[1]),amount=10.0,unit='g')
        if not presentation:continue
        for v in p['variants']:
            sku=v.get('sku');title=name+(' - '+v['title'] if v['title']!='Default Title' else '')
            image=next((im['src'] for im in p.get('images',[]) if im.get('id')==v.get('image_id')),None)
            if not image and len(p['variants'])==1 and p.get('images'):image=p['images'][0]['src']
            official.append(dict(brand='Catit' if 'catit.es' in base else 'Kit Cat',name=title,quantity=presentation['quantity'],amount=presentation['amount'],unit=presentation['unit'],packLabel=f'{presentation["quantity"]} × {presentation["amount"]:g} г',priceEUR=float(v['price']),currency='EUR',sourceUrl=base+'/products/'+p['handle']+'?variant='+str(v['id']),familyUrl=base+'/products/'+p['handle'],retailer='Catit España - официальный магазин' if 'catit.es' in base else 'Kit Cat España - официальный магазин',retailerSku=sku,gtin=None,imageUrl=image,availability='InStock' if v.get('available') is True else 'OutOfStock' if v.get('available') is False else 'not_verified',evidenceType='live_public_shop_catalogue',currencyEvidence='Испанская витрина магазина отображает цены в EUR',packEvidence='Название продукта подтверждает количество, вес стика 10 г для европейского Catit Creamy подтверждён производителем',checkedOn=DATE,purchasePrice=None,shippingIncluded=False,deliveredToValenciaEUR=None))
(ROOT/'official-store-evidence.json').write_text(json.dumps(dict(discovery=discovery,offers=official),ensure_ascii=False,indent=2))
print('Manufacturer sources',len(evidence),'Official offers',len(official),'Other product references',len(discovery))
