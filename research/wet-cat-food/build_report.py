"""Build a traceable wet-food research dataset and a standalone readable report"""
from collect import *
from collections import Counter
import unicodedata

def norm(s):
    return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',s.lower()).encode('ascii','ignore').decode()).strip()
def read(f): return json.loads((ROOT/f).read_text())
def save(f,d): (ROOT/f).write_text(json.dumps(d,ensure_ascii=False,indent=2))
def safe(s):return html.escape(str(s),quote=True)
def money(x):return 'Не подтверждено' if x is None else f'{x:.2f}'.replace('.',',')+' €'
def packlabel(o):return (str(o['quantity'])+' × ' if o['quantity']>1 else '')+str(o['grams'])+' г'

groups=[]
for f in ['retail-evidence.json','tiendanimal-evidence.json','hills-tiendanimal-evidence.json','supplement-evidence.json']:
    if not (ROOT/f).exists():continue
    for r in read(f):
        if r['offers'] and not re.search('pienso|leche|alimento seco',r['offers'][0]['name'],re.I):groups.append(r['offers'])
# Manufacturer product cards explicitly identify the recipe and each case size
leo={}
for p in read('leonardo-evidence.json'):
    for o in p['offers']:leo.setdefault(o['name'],{})[o['sourceUrl']]=o
groups.extend(list(v.values()) for v in leo.values())
groups.extend([o] for o in read('additional-offers.json'))

# Merge retailer families only with a shared exact unit GTIN and brand
parents=list(range(len(groups)))
def root(i):
    while parents[i]!=i:
        parents[i]=parents[parents[i]];i=parents[i]
    return i
gtins={}
for i,g in enumerate(groups):
    for o in g:
        if not o.get('gtin'):continue
        key=(o['brand'],o['grams'],str(o['gtin']).lstrip('0'))
        if key in gtins:parents[root(i)]=root(gtins[key])
        else:gtins[key]=i
merged={}
for i,g in enumerate(groups):merged.setdefault(root(i),[]).extend(g)

recipes=[];offers=[]
for g in sorted(merged.values(),key=lambda g:(BRANDS.index(g[0]['brand']),g[0]['name'])):
    g=list({(o['retailer'],o['sourceUrl'],o['priceEUR'],o['grams'],o['quantity']):o for o in g}.values())
    brand=g[0]['brand'];name=g[0]['name'].replace('–','-').replace('—','-')
    rid=brand.lower().replace(' ','').replace("'",'')+'-'+hashlib.sha256(norm(name).encode()).hexdigest()[:8]
    assortment=(brand=="Hill's" and not 'mousse' in name.lower() and (re.search('carne y pescado|pollo, pescado|light adult pescado|kitten pollo y pavo|senior vitality pollo y salm|perfect weight salm|sterilised adult pollo y salm',name,re.I) is not None))
    veterinary=bool(re.search(r'prescription|veterinary|renal|recovery|satiety|diabetic|skin & coat|mature consult|senior consult|urinary moderate|adult veterinary',name,re.I))
    for o in g:
        o['recipeId']=rid;o['perUnitEUR']=round(o['priceEUR']/o['quantity'],4);o['pricePerKgEUR']=round(o['priceEUR']/(o['quantity']*o['grams']/1000),2)
        o['shippingIncluded']=False;o['minimumDeliveredToValenciaEUR']=None
        o['conditions']='Публичная цена за указанную комплектацию, купоны и подписка не применены, доставка в Валенсию не проверена'
        if not o['evidenceType'].startswith('live_'):o['conditions']+=' - Веб-индекс может быть старше даты исследования'
    recipes.append(dict(id=rid,brand=brand,name=name,kind='assortment' if assortment else 'recipe',segment='Ветеринарный' if veterinary else 'Повседневный',weightsGrams=sorted({o['grams'] for o in g}),sourceUrls=sorted({o.get('familyUrl',o['sourceUrl']) for o in g}),purchasePrice=None,retailPrice=None,availabilityStatus='requires_confirmation'))
    offers.extend(g)

# Extra public web evidence is used when direct reading of Miscota is unavailable
miscota_map={
 'comida-humeda-pollo-extra-filete-gatos':'LEONARDO Extra Filete Pollo',
 'pr-520387':'LEONARDO Quality Selection Rico en apetitosa ternera',
 'pr-511545':'Acana Premium Paté Pollo y Pescado lata para gatitos',
 'pr-511546':'Acana Premium Paté Cordero lata para gatos',
 'pr-511543':'Acana Premium Paté Salmón y Pollo lata para gatos',
 'pate-gato-lata-ternera':'Acana Premium Paté Ternera lata para gatos',
 'pr-511544':'Acana Premium Paté Atún y Pollo lata para gatos',
 'pollo-pate-gatos-adultos':'Acana Premium Paté Pollo lata para gatos',
 'pr-520953':'LEONARDO Finest Selection Puro en Pollo',
 'pr-520952':'LEONARDO Finest Selection Puro en Pavo',
 'pouches-gato-men-carne-17821':'LEONARDO Finest Selection Menú de carne',
 'pr-521846':'LEONARDO Quality Selection Kitten',
 'comida-humeda-puro-ave-gatos':'LEONARDO Quality Selection Puro en ave',
 'comida-humeda-rico-pato-gatos':'LEONARDO Quality Selection Rico en sabroso pato',
 'comida-humeda-superior-pato-pollo-zanahoria-gatos':'LEONARDO Superior Selection Pato con pollo & zanahorias',
 'royal-canin-kitten-instinctive-gravy':'Royal Canin Kitten sobre en salsa para gatos',
 'indoor-salsa-12x85-gr':'Royal Canin Indoor Sterilised sobre en salsa para gatos',
 'pr-516770':'Advance Sterilized Adult Bacalao sobres para gatos',
}
for file in ['web-miscota-products.txt','web-extra-evidence.txt']:
    for sec in re.split(r'(?m)(?=^[^\n]+ - Miscota España \(https://)',(ROOT/file).read_text()):
        h=re.match(r'[^\n]+ - Miscota España \((https://[^)]+)\)',sec)
        if not h:continue
        url=h[1];target=miscota_map.get(url.rsplit('/',1)[-1]);r=next((r for r in recipes if r['name']==target),None)
        if not r:continue
        body=re.split('Compra 2|Comprados juntos|También te gustarán',sec)[0]
        for m in re.finditer(r'(?:(\d+)\s*x\s*)?(\d+)\s*(?:GR|gr|g)\s+(\d+,\d{2})€',body):
            qty=int(m[1] or 1);grams=int(m[2]);price=float(m[3].replace(',','.'))
            if grams not in r['weightsGrams']:r['weightsGrams'].append(grams);r['weightsGrams'].sort()
            offers.append(dict(recipeId=r['id'],brand=r['brand'],name=r['name'],quantity=qty,grams=grams,priceEUR=price,currency='EUR',sourceUrl=url,retailer='Miscota',availability='not_verified',evidenceType='web_index_product_page',checkedOn=DATE,purchasePrice=None,perUnitEUR=round(price/qty,4),pricePerKgEUR=round(price/(qty*grams/1000),2),shippingIncluded=False,minimumDeliveredToValenciaEUR=None,conditions='Цена из прочитанной веб-карточки, индекс может быть старше даты исследования, наличие и доставка не подтверждены'))

offers=list({(o['recipeId'],o['retailer'],o['sourceUrl'],o['grams'],o['quantity'],o['priceEUR']):o for o in offers}.values())
skus=[]
for r in recipes:
    for grams in r['weightsGrams']:
        matches=[o for o in offers if o['recipeId']==r['id'] and o['grams']==grams]
        eligible=[o for o in matches if o['availability']!='OutOfStock']
        direct=[o for o in eligible if o['quantity']==1]
        live=[o for o in direct if o['evidenceType'].startswith('live_') and o['availability']=='InStock']
        skus.append(dict(id=r['id']+f'-{grams}g',recipeId=r['id'],name=r['name'],brand=r['brand'],grams=grams,purchasePrice=None,minimumSinglePackObservedEUR=min((o['priceEUR'] for o in direct),default=None),minimumSinglePackListedInStockEUR=min((o['priceEUR'] for o in live),default=None),minimumPerUnitInMultipackEUR=min((o['perUnitEUR'] for o in eligible if o['quantity']>1),default=None),minimumDeliveredToValenciaEUR=None,retailerCount=len({o['retailer'] for o in matches}),offers=matches))

manufacturer=read('manufacturer-evidence.json')
international=[r for r in manufacturer if r['region']=='US' and 'Wet Cat Food' in (r['title'] or '') and '/cats/cat-food/' in r['sourceUrl']]
notes=[
 'Исследованы публичные каталоги и розничные предложения на 13 октября 2026, это база для выбора, а не подтверждённый закупочный ассортимент',
 'Рецептура и текстура учитываются отдельно, ассорти не считается отдельной рецептурой',
 'Указан вес одной банки или пакетика и количество единиц в предложении, цена мультипака не выдаётся за цену одиночной упаковки',
 'Минимум относится к найденным предложениям, абсолютный минимум рынка и цена с доставкой в Валенсию не подтверждены',
 'Цены Miscota прочитаны через веб-индекс, прямые страницы возвращали защитную страницу, такие цены не помечены как живые',
 'Amazon: воспроизводимые цены по точным влажным SKU не подтверждены, пустые значения сохранены',
 'Orijen: влажная линейка подтверждена в американском каталоге, покупка в испанской рознице не подтверждена, вынесена отдельно',
 'Напитки, Churu и кремовые лакомства не включены в основную линейку влажных кормов',
 'Закупочные цены пустые, розничные наблюдения не заменяют закупочную цену',
 'Автоматическая сверка бренда, веса и GTIN объединяет карточки магазинов, не объединяет разные текстуры по похожему названию',
 'Официальные страницы без сопоставленной розничной карточки сохранены в приложении, покрытие каталога не заявляется как исчерпывающее',
]
summary=dict(productFamilies=len(recipes),singleRecipeFamilies=sum(r['kind']=='recipe' for r in recipes),assortmentFamilies=sum(r['kind']=='assortment' for r in recipes),skus=len(skus),offers=len(offers),liveOffers=sum(o['evidenceType'].startswith('live_') for o in offers),brandCounts=dict(Counter(r['brand'] for r in recipes)),brandsWithPrices=len(set(r['brand'] for r in recipes)),retailers=sorted(set(o['retailer'] for o in offers)),skusWithAtLeastThreeRetailers=sum(s['retailerCount']>=3 for s in skus),internationalOrijenReferences=len(international))
save('retail-prices.json',dict(updatedOn=DATE,scope='Wet cat food - Spain retail research',summary=summary,notes=notes,recipes=recipes,skus=skus,offers=offers,internationalReferences=international,manufacturerCatalogueReferences=manufacturer))
save('assortment.json',dict(updatedOn=DATE,scope='Wet cat food, confirmed publicly priced Spanish references plus separate manufacturer appendix',brandCounts=summary['brandCounts'],notes=notes,recipes=recipes,internationalReferences=international))

cards=[]
for r in recipes:
    entries=[]
    for s in (s for s in skus if s['recipeId']==r['id']):
        rows=[]
        for o in sorted(s['offers'],key=lambda o:(o['quantity'],o['priceEUR'],o['retailer'])):
            rows.append(f'<tr><td>{safe(o["retailer"])}</td><td>{packlabel(o)}</td><td>{money(o["priceEUR"])}</td><td>{money(o["perUnitEUR"])}</td><td>{money(o["pricePerKgEUR"])}</td><td>{"Нет в наличии" if o["availability"]=="OutOfStock" else "Заявлено в наличии" if o["availability"]=="InStock" else "Не проверено"}<br><small>{"Живая карточка" if o["evidenceType"].startswith("live_") else "Веб-индекс"}</small></td><td><a href="{safe(o["sourceUrl"])}" target="_blank" rel="noopener">Источник</a></td></tr>')
        entries.append(f'<div class="pack"><h3>{s["grams"]} г</h3><p>Одиночная упаковка от <b>{money(s["minimumSinglePackObservedEUR"])}</b> · В мультипаке за единицу от <b>{money(s["minimumPerUnitInMultipackEUR"])}</b> · Магазинов: {s["retailerCount"]}</p><div class="table-wrap"><table><thead><tr><th>Магазин</th><th>Комплектация</th><th>За всё</th><th>За единицу</th><th>За кг</th><th>Наличие / доказательство</th><th>Ссылка</th></tr></thead><tbody>{"".join(rows)}</tbody></table></div></div>')
    cards.append(f'<article class="recipe" data-brand="{safe(r["brand"])}" data-segment="{safe(r["segment"])}" data-search="{safe(norm(r["name"]))}"><div class="eyebrow">{safe(r["brand"])} · {r["segment"]} · {"Ассорти" if r["kind"]=="assortment" else "Рецептура / текстура"}</div><h2>{safe(r["name"])}</h2>{"".join(entries)}</article>')
appendix=''.join(f'<li><a target="_blank" rel="noopener" href="{safe(r["sourceUrl"])}">{safe(r["title"] or r["sourceUrl"])}</a><br><small>{safe(next((e for e in r["packEvidence"] if "Formatos" in e or "Sizes" in e or "Tamaños" in e), "Фасовки требуют отдельной проверки"))}</small></li>' for r in manufacturer if r['title'])
doc=f'''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CatManDog - влажный корм</title><style>
:root{{font-family:system-ui,sans-serif;color:#202720;background:#f5f6f2}}body{{margin:0}}main{{max-width:1320px;margin:auto;padding:40px 24px}}h1{{font-size:clamp(32px,5vw,56px);letter-spacing:-.045em;margin:12px 0}}h2{{font-size:24px;margin:10px 0}}h3{{font-size:18px}}p,li{{line-height:1.6}}header{{background:#dafa77;padding:32px;border-radius:24px}}.stats{{display:flex;gap:16px;flex-wrap:wrap;margin-top:24px}}.stats span{{background:#ffffffa0;border-radius:12px;padding:14px}}.stats b{{font-size:25px;display:block}}.filters{{display:flex;gap:12px;flex-wrap:wrap;padding:24px 0;position:sticky;top:0;background:#f5f6f2}}input,select{{font:inherit;padding:12px 16px;border:1px solid #ccd1c8;border-radius:12px;background:white}}input{{flex:1;min-width:180px}}.recipe{{background:#fff;border:1px solid #e1e5dd;border-radius:18px;padding:24px;margin:20px 0}}.eyebrow,small{{color:#657061;font-size:13px}}.pack{{padding:4px 0 16px}}.table-wrap{{overflow:auto}}table{{border-collapse:collapse;width:100%;font-size:14px}}th,td{{text-align:left;padding:12px;border-bottom:1px solid #e4e7e0;white-space:nowrap}}th{{background:#f5f7f1}}a{{color:#3f681e}}details{{padding:20px;background:white;border-radius:18px;margin-top:20px}}summary{{cursor:pointer;font-weight:650}}[hidden]{{display:none}}.notice{{border-left:4px solid #9daf6b;padding:0 16px}}@media(max-width:600px){{main{{padding:20px 12px}}header,.recipe{{padding:20px}}.filters{{position:static}}}}
</style><main><header><div>CatManDog · Исследование · 13 октября 2026</div><h1>Влажный корм для кошек</h1><p>Реальные наименования, фасовки и все сохранённые розничные предложения</p><div class="stats"><span><b>{len(recipes)}</b>Наименований в ценовой базе</span><span><b>{len(skus)}</b>Рецептура × вес</span><span><b>{len(offers)}</b>Предложений</span><span><b>{summary['skusWithAtLeastThreeRetailers']}</b>Фасовок с 3+ магазинами</span></div></header>
<p class="notice">Пять брендов имеют подтверждённые испанские ценовые предложения · Orijen сохранён отдельно: влажный корм существует, испанская розничная доступность не подтверждена · Это исследование, каталог магазина не изменён</p>
<details><summary>Методика и ограничения</summary><ul>{''.join('<li>'+safe(n)+'</li>' for n in notes)}</ul><p>Бренды: {safe(summary['brandCounts'])}</p><a href="retail-prices.json">Полная база JSON</a> · <a href="assortment.json">Рецептуры JSON</a></details>
<div class="filters"><label>Поиск <input id="q" placeholder="Sterilised, Kitten, pollo"></label><select id="brand" aria-label="Бренд"><option value="">Все бренды</option>{''.join('<option>'+safe(b)+'</option>' for b in BRANDS if b!='Orijen')}</select><select id="segment" aria-label="Линейка"><option value="">Все линейки</option><option>Повседневный</option><option>Ветеринарный</option></select></div><p id="count"></p>{''.join(cards)}
<details><summary>Orijen - международная линейка без подтверждённой цены в Испании</summary><p>Не включена в испанский ценовой минимум, закупочная цена и приоритет пустые</p><ul>{''.join('<li><a href="'+safe(r['sourceUrl'])+'" target="_blank" rel="noopener">'+safe(r['title'])+'</a><br><small>'+safe(next((e for e in r['packEvidence'] if 'Available Sizes' in e),'Фасовки не подтверждены'))+'</small></li>' for r in international)}</ul></details>
<details><summary>Официальные каталоги - дополнительные рецептуры и источники фасовок</summary><p>Здесь также сохранены позиции, ещё не сопоставленные с ценовой базой — они не считаются товарами с подтверждённой розничной ценой</p><ul>{appendix}</ul></details></main><script>
const q=document.querySelector('#q'),brand=document.querySelector('#brand'),segment=document.querySelector('#segment'),cards=[...document.querySelectorAll('.recipe')];
function update(){{const term=q.value.normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();let n=0;for(const c of cards){{c.hidden=Boolean((brand.value&&c.dataset.brand!==brand.value)||(segment.value&&c.dataset.segment!==segment.value)||(term&&!c.dataset.search.includes(term)));if(!c.hidden)n++}}document.querySelector('#count').textContent='Показано наименований: '+n}}[q,brand,segment].forEach(el=>el.addEventListener('input',update));update();</script></html>'''
(ROOT/'pricing-report.html').write_text(doc)
print(json.dumps(summary,ensure_ascii=False))
