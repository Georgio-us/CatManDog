"""Build the reviewed treats/care inventory, preserving unresolved retailer pack errors separately"""
from collect import *
from collections import Counter
import unicodedata

def norm(s):return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',s.lower()).encode('ascii','ignore').decode()).strip()
def safe(s):return html.escape(str(s),quote=True)
def money(v):return 'Не подтверждено' if v is None else f'{v:.2f}'.replace('.',',')+' €'
def amount(v):return f'{v:g}'.replace('.',',')
def presentation(o):return (str(o['quantity'])+' × ' if o['quantity']>1 else '')+amount(o['amount'])+' '+('г' if o['unit']=='g' else 'мл' if o['unit']=='ml' else 'шт')
def brand(b):return 'GimCat' if b in ['Gimcat','Gimborn','Gimpet'] else b

def category(name):
    s=norm(name)
    if re.search('malta|malt|bezopet',s):return 'Мальт-пасты и снеки'
    if 'aceite' in s:return 'Масла для кожи и шерсти'
    if re.search('dental|dentale|plaque',s):return 'Уход за зубами'
    if re.search('grasbits|soft gras|hierba gatera en bandeja|semillas|grass kit',s):return 'Кошачья трава'
    if re.search('probiot|fortiflora',s):return 'Пробиотики'
    if re.search('lomo|freezebit',s):return 'Мясные и рыбные деликатесы'
    if re.search('broth|stew|sopa|dashi',s):return 'Супы и мясные топперы'
    if re.search('bites|bocaditos|sticks|palitos|pops|pop n|yums|crispy|hearts|trio mix',s):return 'Мягкие и хрустящие снеки'
    if re.search('creamy|churu|liquid|milky',s):return 'Кремовые лакомства'
    if re.search('taurina|multivit|vitaminica|kitten pasta|senior pasta',s):return 'Другие пищевые добавки'
    return None

raw=json.loads((ROOT/'retail-evidence.json').read_text())
groups=[];quarantine=[];unresolved=[]
for r in raw:
    if not r['products']:continue
    name=r['products'][0]['name'];cat=category(name)
    if not cat:continue
    if r['products'][0]['brand']=='Applaws' and 'lomo' not in norm(name):continue
    if r['products'][0]['brand']=='Kit Cat' and 'freezebit' not in norm(name):continue
    valid=[]
    base=next((o for o in r['offers'] if not re.search('_B\d+$',o.get('retailerSku') or '')),None)
    for o in r['offers']:
        o['brand']=brand(o['brand']);o['category']=cat
        reason=None
        if o['unit']=='g' and o['amount']>1000:reason='Вес одной единицы выглядит ошибочным, требуется подтверждение упаковки'
        m=re.search('_B(\d+)$',o.get('retailerSku') or '')
        if m and base and o['quantity']!=base['quantity']*int(m[1]):reason='Количество в URL противоречит комплекту базового SKU, цена за грамм не рассчитана'
        if reason:quarantine.append(dict(o,reviewReason=reason));continue
        valid.append(o)
    if valid:groups.append(valid)
    else:unresolved.append(dict(name=name,brand=brand(r['products'][0]['brand']),category=cat,sourceUrl=r['url'],reason='Точная комплектация или цена не подтверждена',purchasePrice=None))

# Official-store variants preserve each flavour independently
official=json.loads((ROOT/'official-store-evidence.json').read_text())
for o in official['offers']:
    cat=category(o['name'])
    if cat:groups.append([dict(o,category=cat)])

# Additional exact pack quotes from public web pages, never treated as live checkout prices
extra_map={
 'churu-receta-de-pollo':('Churu','Churu Snack Cremoso de Pollo para gatos'),
 'churu-receta-de-atun':('Churu','Churu Snack Cremoso de Atún para gatos'),
 'churu-receta-de-pollo-con-queso':('Churu','Churu Snack Cremoso de Pollo con Queso para gatos'),
 'churu-receta-de-atun-con-pollo':('Churu','INABA Churu - Atún con Pollo'),
 'pr-503241':('GimCat','GimCat Soft Extra Malta'),
 'pasta-de-malta-para-gato':('Beaphar','Beaphar Pasta de Malta para gatos'),
 'pr-49041':('Beaphar','Beaphar Aceite de Salmón para perros y gatos'),
 'snack-para-gatos-lomo-de-atun':('Applaws','Applaws Lomo de Atún snack para gatos'),
 'freezebites-de-pollo':('Kit Cat','Kit Cat FreezeBites Pollo Snack Liofilizado para gatos'),
}
for sec in re.split(r'(?m)(?=^[^\n]+ - Miscota España \(https://)',(ROOT/'web-retail-evidence.txt').read_text()):
    m=re.match(r'[^\n]+ - Miscota España \((https://[^)]+)\)',sec)
    if not m:continue
    url=m[1];target=extra_map.get(url.rsplit('/',1)[-1])
    if not target:continue
    body=re.split('Compra 2|Comprados juntos|También te gustarán',sec)[0]
    body=re.sub(r'L\d+:\s*|\[Input\]|cite[^]*',' ',body)
    rows=re.findall(r'(?:(\d+)\s*x\s*)?(\d+)\s*(GR|gr|g|ml)\s+(\d+,\d{2})\s*€',body)
    for qty,a,u,p in rows:
        groups.append([dict(brand=target[0],name=target[1],category=category(target[1]),quantity=int(qty or 1),amount=float(a),unit='ml' if u=='ml' else 'g',priceEUR=float(p.replace(',','.')),currency='EUR',sourceUrl=url,familyUrl=url,retailer='Miscota',gtin=None,retailerSku=None,imageUrl=None,availability='not_verified',evidenceType='web_index_product_page',checkedOn=DATE,purchasePrice=None,shippingIncluded=False,deliveredToValenciaEUR=None)])
groups.extend([o] for o in json.loads((ROOT/'additional-reviewed-offers.json').read_text()))

# Manufacturer weight is used only for the exact SKU / GTIN shown in the source
gel_url='https://www.beaphar.es/product/15685-gel-dental-perro-y-gato-100g/'
for r in raw:
    if not r['products'] or 'gel dental' not in norm(r['products'][0]['name']):continue
    for n in nodes(fetch(r['url'])):
        if not isinstance(n,dict) or n.get('@type') not in ['Product','ProductGroup']:continue
        for v in n.get('hasVariant',[n]):
            if str(v.get('gtin13') or v.get('gtin'))!='8711231156856':continue
            o=v.get('offers',{})
            if not isinstance(o,dict) or not o.get('price') or o.get('priceCurrency')!='EUR':continue
            groups.append([dict(brand='Beaphar',name='Beaphar Gel Dental para perros y gatos',category='Уход за зубами',quantity=1,amount=100.0,unit='g',priceEUR=float(o['price']),currency='EUR',sourceUrl=v.get('url') or r['url'],familyUrl=r['url'],retailer='Kiwoko' if 'kiwoko' in r['url'] else 'Tiendanimal',gtin='8711231156856',retailerSku=v.get('sku'),imageUrl=v.get('image'),availability=o.get('availability','').rsplit('/',1)[-1],evidenceType='live_public_structured_offer',packEvidence=gel_url,checkedOn=DATE,purchasePrice=None,shippingIncluded=False,deliveredToValenciaEUR=None)])

parents=list(range(len(groups)))
def root(i):
    while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
    return i
seen={}
for i,g in enumerate(groups):
    for o in g:
        keys=[('name',o['brand'],norm(o['name']))]
        if o.get('gtin'):keys.append(('gtin',o['brand'],str(o['gtin']).lstrip('0')))
        sku=o.get('retailerSku') or ''
        # Known manufacturer article formats, not general marketplace item numbers
        if o['brand']=='Catit' and re.fullmatch(r'(?:CAI)?\d{5}',sku):keys.append(('article','Catit',re.sub('^CAI','',sku)))
        if o['brand']=='Kit Cat' and re.fullmatch(r'(?:KTCKC|KC-)\d{4}',sku):keys.append(('article','Kit Cat',re.sub('^(?:KTCKC|KC-)','',sku)))
        for key in keys:
            if key in seen:parents[root(i)]=root(seen[key])
            else:seen[key]=i
merged={}
for i,g in enumerate(groups):merged.setdefault(root(i),[]).extend(g)

products=[];offers=[];skus=[]
for g in sorted(merged.values(),key=lambda g:(g[0]['category'],g[0]['brand'],g[0]['name'])):
    g=list({(o['retailer'],o['sourceUrl'],o['quantity'],o['amount'],o['unit'],o['priceEUR']):o for o in g}.values())
    first=g[0];name=first['name'].strip().replace('–','-').replace('—','-')
    rid='tc-'+hashlib.sha256((first['brand']+' '+norm(name)).encode()).hexdigest()[:10]
    product=dict(id=rid,name=name,brand=first['brand'],category=first['category'],sourceUrls=sorted({o.get('familyUrl',o['sourceUrl']) for o in g}),gtins=sorted({str(o['gtin']) for o in g if o.get('gtin')}),purchasePrice=None,priority=None)
    products.append(product)
    for o in g:
        o['productId']=rid;o['totalAmount']=round(o['quantity']*o['amount'],3)
        o['pricePer100EUR']=round(o['priceEUR']/o['totalAmount']*100,3) if o['unit'] in ['g','ml'] else None
        o['pricePerPieceEUR']=round(o['priceEUR']/o['quantity'],4)
        o['conditions']='Обычная публичная цена, без подписки и условных купонов, доставка в Валенсию не проверена'
        if o['evidenceType']=='web_index_product_page':o['conditions']+=' - Веб-индекс может быть старше даты исследования'
    offers.extend(g)
    for quantity,a,u in sorted({(o['quantity'],o['amount'],o['unit']) for o in g}):
        same=[o for o in g if (o['quantity'],o['amount'],o['unit'])==(quantity,a,u)]
        active=[o for o in same if o['availability']!='OutOfStock']
        live=[o for o in active if o['evidenceType'].startswith('live_') and o['availability']=='InStock']
        skus.append(dict(id=rid+f'-{quantity}x{a:g}{u}',productId=rid,brand=first['brand'],name=name,category=first['category'],quantity=quantity,amount=a,unit=u,totalAmount=round(quantity*a,3),purchasePrice=None,retailerCount=len({o['retailer'] for o in same}),minimumObservedEUR=min((o['priceEUR'] for o in active),default=None),meanObservedEUR=round(sum(o['priceEUR'] for o in active)/len(active),2) if active else None,maximumObservedEUR=max((o['priceEUR'] for o in active),default=None),minimumLiveListedInStockEUR=min((o['priceEUR'] for o in live),default=None),minimumDeliveredToValenciaEUR=None,offers=same))

notes=[
 'Лакомства, мальт-пасты, масла, трава, уход за зубами и отдельные пищевые добавки для кошек',
 'Это исследовательская база без приоритетов закупки, повседневный корм и ветеринарные рационы сюда не включены',
 'Мальт-пасты предназначены для проглоченной шерсти, не для прекращения линьки, масла относятся к другому типу добавок',
 'Комплектация берётся из точного предложения, отдельно сохранены количество единиц и вес / объём каждой единицы',
 'Кремовое лакомство 4 × 14 г и набор 40 × 14 г сравниваются по цене за 100 г, минимум за упаковку рассчитывается только для той же комплектации',
 'Пакет со снеками и отдельный стик могут оба называться единицей, для сопоставления используется вес и точная комплектация',
 'Для Catit Creamy сверена европейская версия с 10 г на стик, зарубежные 15 г не подставляются',
 'Ошибки магазинных единиц и количества сохранены в разделе проверки, спорные предложения исключены из расчёта',
 'Минимальная и средняя цены относятся только к найденным предложениям, средняя не является статистикой всего рынка',
 'Прямые публичные карточки отделены от цен веб-индекса Miscota, дата индекса может быть старше даты исследования',
 'Наличие означает заявление магазина, доставка и итоговая стоимость на конкретный адрес Валенсии не подтверждены',
 'Закупочные цены пустые, B2B-поставщик и маржа не предполагаются по розничной цене',
 'Дозировки, лечебные обещания и назначение добавок не создаются, для будущей карточки нужно сверять этикетку точной версии',
 'Thrive подтверждён как реальная линейка производителя и найдена испанская карточка Zooplus, воспроизводимая цена пока не подтверждена',
]
summary=dict(productFamilies=len(products),presentations=len(skus),offers=len(offers),categoryCounts=dict(Counter(p['category'] for p in products)),brandCounts=dict(Counter(p['brand'] for p in products)),retailers=sorted({o['retailer'] for o in offers}),presentationsWithAtLeastThreeRetailers=sum(s['retailerCount']>=3 for s in skus),quarantinedOffers=len(quarantine))
dataset=dict(updatedOn=DATE,scope='Cat treats and everyday-care consumables - Spain public retail',summary=summary,notes=notes,products=products,skus=skus,offers=offers,quarantinedOffers=quarantine,unresolvedProducts=unresolved,manufacturerEvidence=json.loads((ROOT/'manufacturer-evidence.json').read_text()),manufacturerAdditionalReferences=official['discovery'])
for f,data in [('retail-prices.json',dataset),('assortment.json',dict(updatedOn=DATE,summary=summary,notes=notes,products=products,skus=[{k:v for k,v in s.items() if k!='offers'} for s in skus]))]:
    (ROOT/f).write_text(json.dumps(data,ensure_ascii=False,indent=2))

cards=[]
for p in products:
    blocks=[]
    for s in (s for s in skus if s['productId']==p['id']):
        rows=[]
        for o in sorted(s['offers'],key=lambda o:(o['priceEUR'],o['retailer'])):
            status='Нет в наличии' if o['availability']=='OutOfStock' else 'Заявлено в наличии' if o['availability']=='InStock' else 'Не проверено'
            evidence='Веб-индекс' if o['evidenceType']=='web_index_product_page' else 'Прямая публичная карточка'
            rows.append(f'<tr><td>{safe(o["retailer"])}</td><td>{money(o["priceEUR"])}</td><td>{money(o["pricePer100EUR"]) if o["pricePer100EUR"] is not None else "Не рассчитано"}</td><td>{status}<br><small>{evidence}</small></td><td><a href="{safe(o["sourceUrl"])}" target="_blank" rel="noopener">Источник</a></td></tr>')
        blocks.append(f'<section class="pack"><h3>{presentation(s)}</h3><p>Минимум <b>{money(s["minimumObservedEUR"])}</b> · Средняя <b>{money(s["meanObservedEUR"])}</b> · Максимум <b>{money(s["maximumObservedEUR"])}</b> · Магазинов: {s["retailerCount"]}</p><div class="table-wrap"><table><thead><tr><th>Магазин</th><th>За всю комплектацию</th><th>За 100 {"мл" if s["unit"]=="ml" else "г"}</th><th>Наличие / источник</th><th>Ссылка</th></tr></thead><tbody>{"".join(rows)}</tbody></table></div></section>')
    cards.append(f'<article data-category="{safe(p["category"])}" data-brand="{safe(p["brand"])}" data-search="{safe(norm(p["name"]))}"><small>{safe(p["category"])} · {safe(p["brand"])}</small><h2>{safe(p["name"])}</h2>{"".join(blocks)}</article>')

overview=''.join('<tr><td>'+safe(c)+'</td><td>'+str(n)+'</td></tr>' for c,n in summary['categoryCounts'].items())
review=''.join(f'<li><a href="{safe(o["sourceUrl"])}" target="_blank" rel="noopener">{safe(o["name"])}</a> · {money(o["priceEUR"])}<br>{safe(o["reviewReason"])}</li>' for o in quarantine)
refs=''.join('<li><a href="'+safe(r['sourceUrl'])+'" target="_blank" rel="noopener">'+safe(r['title'] or r['sourceUrl'])+'</a></li>' for r in dataset['manufacturerEvidence'])
doc=f'''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CatManDog - лакомства и уход</title><style>
:root{{font-family:system-ui,sans-serif;color:#222b25;background:#f5f6f2}}body{{margin:0}}main{{max-width:1280px;margin:auto;padding:40px 24px}}header{{padding:36px;background:#dafa77;border-radius:24px}}h1{{font-size:clamp(32px,5vw,56px);letter-spacing:-.04em;margin:12px 0}}h2{{font-size:24px}}h3{{font-size:18px}}p,li{{line-height:1.6}}.stats{{display:flex;gap:16px;flex-wrap:wrap}}.stats span{{padding:14px;background:#ffffffa0;border-radius:12px}}.stats b{{font-size:26px;display:block}}article,details{{padding:24px;background:white;border:1px solid #e0e4dc;border-radius:18px;margin:20px 0}}small{{color:#667063}}.filters{{display:flex;gap:12px;flex-wrap:wrap;background:#f5f6f2;padding:20px 0;position:sticky;top:0}}input,select{{font:inherit;padding:12px;border:1px solid #ccd2c8;background:white;border-radius:10px}}input{{min-width:220px}}.table-wrap{{overflow:auto}}table{{width:100%;border-collapse:collapse;font-size:14px}}th,td{{padding:12px;text-align:left;border-bottom:1px solid #e6e9e2;white-space:nowrap}}th{{background:#f6f8f3}}a{{color:#45682c}}summary{{font-weight:650;cursor:pointer}}.notice{{border-left:4px solid #a4b773;padding-left:16px}}[hidden]{{display:none}}@media(max-width:600px){{main{{padding:20px 12px}}header,article,details{{padding:20px}}.filters{{position:static}}}}
</style><main><header><div>CatManDog · Исследование · 13 октября 2026</div><h1>Лакомства и повседневный уход</h1><p>Кремовые лакомства, мясные деликатесы, мальт-пасты, масла и другие полезные позиции</p><div class="stats"><span><b>{len(products)}</b>Наименований в ценовой базе</span><span><b>{len(skus)}</b>Комплектаций</span><span><b>{len(offers)}</b>Предложений</span><span><b>{summary['presentationsWithAtLeastThreeRetailers']}</b>Комплектаций с 3+ магазинами</span></div></header>
<p class="notice">Это исследование ассортимента, каталог сайта не изменён · Закупочные цены пустые · Наличие и доставка на конкретный адрес требуют проверки</p>
<details open><summary>Что покрывает линейка</summary><div class="table-wrap"><table><thead><tr><th>Направление</th><th>Наименований</th></tr></thead><tbody>{overview}</tbody></table></div><p>Мальт-пасты - для проглоченной шерсти · Масла - отдельный тип пищевых добавок · Лакомства не подменяют основной рацион</p></details>
<details><summary>Как читать цены и ограничения</summary><ul>{''.join('<li>'+safe(n)+'</li>' for n in notes)}</ul><p><a href="assortment.json">Номенклатура JSON</a> · <a href="retail-prices.json">Все предложения JSON</a></p></details>
<div class="filters"><input id="q" aria-label="Поиск" placeholder="Churu, Malt, FreezeBites"><select id="cat" aria-label="Категория"><option value="">Все направления</option>{''.join('<option>'+safe(c)+'</option>' for c in summary['categoryCounts'])}</select><select id="brand" aria-label="Бренд"><option value="">Все бренды</option>{''.join('<option>'+safe(b)+'</option>' for b in sorted(summary['brandCounts']))}</select></div><p id="count"></p>{''.join(cards)}
<details><summary>Расхождения комплектаций - исключены из сравнения ({len(quarantine)})</summary><ul>{review}</ul></details>
<details><summary>Позиции, требующие уточнения ({len(unresolved)})</summary><ul>{''.join('<li><a href="'+safe(r['sourceUrl'])+'" target="_blank" rel="noopener">'+safe(r['name'])+'</a> - '+safe(r['reason'])+'</li>' for r in unresolved)}</ul></details>
<details><summary>Производители и дополнительные источники</summary><ul>{refs}<li><a href="https://www.gimborn.eu/user/pages/01.startseite/CATALOGUE%20EN%202026.pdf" target="_blank" rel="noopener">Gimborn - официальный каталог 2026</a></li><li><a href="https://www.zooplus.es/shop/tienda_gatos/snacks_gatos/thrive_snacks/119111" target="_blank" rel="noopener">Thrive - испанская карточка, цена не подтверждена</a></li></ul></details></main><script>
const q=document.querySelector('#q'),cat=document.querySelector('#cat'),brand=document.querySelector('#brand'),cards=[...document.querySelectorAll('article')];function update(){{const t=q.value.normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();let n=0;for(const c of cards){{c.hidden=Boolean((cat.value&&cat.value!==c.dataset.category)||(brand.value&&brand.value!==c.dataset.brand)||(t&&!c.dataset.search.includes(t)));if(!c.hidden)n++}}document.querySelector('#count').textContent='Показано наименований: '+n}}[q,cat,brand].forEach(el=>el.addEventListener('input',update));update();</script></html>'''
(ROOT/'pricing-report.html').write_text(doc)
print(json.dumps(summary,ensure_ascii=False))
