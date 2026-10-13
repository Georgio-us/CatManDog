"""Build readable research documentation and a reusable offer dataset"""
import datetime
import html
import json
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
read = lambda name: json.loads((ROOT / name).read_text())
inventory = read('assortment.json')
recipes = inventory['recipes']
by_id = {r['id']: r for r in recipes}
live = read('retail-live.json')
evidence = read('retail-evidence.json')['pages']
extra = read('retail-extra.json')

def retailer(url):
    domain = urlparse(url).hostname or ''
    return next((label for key, label in [('kiwoko','Kiwoko'),('tiendanimal','Tiendanimal'),('miscota','Miscota'),('leonardo-catfood','LEONARDO - официальный магазин'),('vanypets','Vanypets'),('farmaciasdirect','Farmaciasdirect')] if key in domain), domain)

offers = []
for page in live:
    for offer in page['offers']:
        offers.append(dict(offer, recipeId=page['recipeId'], checkedAt=page['checkedAt'], retailer=retailer(offer['sourceUrl']), purchasePrice=None))
for page in evidence:
    if not page['recipeId']:
        continue
    for variant in page['variants']:
        offers.append(dict(recipeId=page['recipeId'], grams=variant['grams'], quantity=1, priceEUR=variant['price'], currency='EUR', retailer=retailer(page['url']), sourceUrl=page['url'], checkedAt='2026-10-11', indexMetadata=page.get('indexMetadata'), availability='OutOfStock' if variant['stock']=='out_of_stock' else 'not_verified', evidenceType=page['evidenceType'], conditions='Цена одной упаковки из прочитанной веб-карточки или поискового индекса, купон и подписка не применены, наличие требует проверки', promotionNote=variant['evidence'], purchasePrice=None))
offers.extend(dict(o, checkedAt='2026-10-11', purchasePrice=None) for o in extra)

# Keep price history but suppress exact duplicate observations
unique = {}
for offer in offers:
    key = (offer['recipeId'], offer['grams'], offer['quantity'], offer['retailer'], offer['sourceUrl'], offer['priceEUR'], offer['evidenceType'])
    unique[key] = offer
offers = list(unique.values())
current_keys = {(o['recipeId'], o['grams'], o['quantity'], o['retailer']) for o in offers if o['evidenceType'].startswith('live_')}
for o in offers:
    o['pricePerKgEUR'] = round(o['priceEUR'] / (o['grams'] * o['quantity'] / 1000), 2)
    o['perBagEUR'] = round(o['priceEUR'] / o['quantity'], 2)
    o['inOriginalAssortment'] = o['grams'] in by_id[o['recipeId']]['weightsGrams']
    o['supersededByLiveOffer'] = not o['evidenceType'].startswith('live_') and (o['recipeId'],o['grams'],o['quantity'],o['retailer']) in current_keys
    o['purchaseReady'] = o['evidenceType'].startswith('live_') and o['availability'] == 'InStock' and o['inOriginalAssortment']

skus = []
for recipe in recipes:
    all_weights = set(recipe['weightsGrams']) | {o['grams'] for o in offers if o['recipeId']==recipe['id']}
    for grams in sorted(all_weights):
        matching = [o for o in offers if o['recipeId']==recipe['id'] and o['grams']==grams]
        active = [o for o in matching if not o['supersededByLiveOffer'] and o['evidenceType']!='historical_comparator' and o['availability']!='OutOfStock' and o['quantity']==1]
        direct_stock = [o for o in matching if o['purchaseReady'] and o['quantity']==1]
        skus.append(dict(id=f"{recipe['id']}-{grams}g",recipeId=recipe['id'],brand=recipe['brand'],name=recipe['name'],grams=grams,purchasePrice=None,inOriginalAssortment=grams in recipe['weightsGrams'],offerCount=len(matching),retailerCount=len({o['retailer'] for o in active}),minimumObservedEUR=min((o['priceEUR'] for o in active),default=None),minimumListedInStockEUR=min((o['priceEUR'] for o in direct_stock),default=None),minimumDeliveredToValenciaEUR=None,offers=matching))

summary = dict(recipes=len(recipes),originalSkus=sum(len(r['weightsGrams']) for r in recipes),recipesWithOffers=len({o['recipeId'] for o in offers}),originalSkusWithOffers=sum(s['inOriginalAssortment'] and s['offerCount']>0 for s in skus),observations=len(offers),liveObservations=sum(o['evidenceType'].startswith('live_') for o in offers),retailers=sorted({o['retailer'] for o in offers}),missingOriginalSkus=[s['id'] for s in skus if s['inOriginalAssortment'] and not s['offerCount']])
dataset=dict(updatedOn='2026-10-11',scope='Dry cat food only',summary=summary,notes=inventory['notes'],recipes=recipes,skus=skus,offers=offers)
(ROOT/'retail-prices.json').write_text(json.dumps(dataset,ensure_ascii=False,indent=2))

esc = lambda x: html.escape(str(x), quote=True)
money = lambda value: 'Не подтверждено' if value is None else f'{value:.2f}'.replace('.',',')+' €'
weight = lambda grams: str(grams)+' г' if grams<1000 else str(grams/1000).rstrip('0').rstrip('.').replace('.',',')+' кг'
cards=[]
for recipe in recipes:
    rows=[]
    for sku in (s for s in skus if s['recipeId']==recipe['id']):
        lines=[]
        for o in sorted(sku['offers'],key=lambda o:(o['supersededByLiveOffer'],o['evidenceType']=='historical_comparator',o['quantity']!=1,o['priceEUR'])):
            kind='Прямая проверка' if o['evidenceType'].startswith('live_') else 'Историческая цена' if o['evidenceType']=='historical_comparator' else 'Веб-карточка / индекс'
            stock='В наличии по данным магазина' if o['availability']=='InStock' else 'Нет в наличии' if o['availability']=='OutOfStock' else 'Наличие не подтверждено'
            pack=f"{o['quantity']} × {weight(o['grams'])}" if o['quantity']>1 else weight(o['grams'])
            stale='Предыдущая цена - есть более свежая прямая проверка' if o['supersededByLiveOffer'] else ''
            lines.append(f'<li class="offer"><div><a href="{esc(o["sourceUrl"])}" target="_blank" rel="noopener noreferrer">{esc(o["retailer"])}</a><span class="muted">{esc(pack)} · {esc(kind)} · {esc(o["checkedAt"][:10])}</span><span class="muted">{esc(stock)}</span></div><div class="offer-price">{money(o["priceEUR"])}<span class="muted">{money(o["pricePerKgEUR"])}/кг</span></div><p>{esc(o["conditions"])}{(" · "+esc(o.get("indexMetadata") or "")) if not o["evidenceType"].startswith("live_") else ""}{(" · "+esc(stale)) if stale else ""}</p></li>')
        detail='<details><summary>Все предложения - '+str(len(lines))+'</summary><ul>'+''.join(lines)+'</ul></details>' if lines else '<span class="muted">Подтверждённая розничная цена пока не найдена</span>'
        additional='' if sku['inOriginalAssortment'] else '<span class="flag">Дополнительная фасовка из розницы - проверить версию</span>'
        rows.append(f'<tr data-stock="{int(sku["minimumListedInStockEUR"] is not None)}"><td><strong>{weight(sku["grams"])}</strong>{additional}</td><td>{money(sku["minimumObservedEUR"])}</td><td>{money(sku["minimumListedInStockEUR"])}</td><td>{detail}</td></tr>')
    cards.append(f'<section class="recipe" data-brand="{esc(recipe["brand"])}" data-search="{esc((recipe["brand"]+" "+recipe["name"]).lower())}"><div class="recipe-heading"><h2>{esc(recipe["brand"])} {esc(recipe["name"])}</h2><a href="{esc(recipe["sourceUrl"])}" target="_blank" rel="noopener noreferrer">Источник рецептуры</a></div><div class="table-scroll"><table><thead><tr><th>Упаковка</th><th>Минимум из найденных</th><th>Прямая цена с наличием</th><th>Все цены и источники</th></tr></thead><tbody>'+''.join(rows)+'</tbody></table></div></section>')

options=''.join(f'<option>{esc(brand)}</option>' for brand in inventory['brandCounts'])
document='''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CatManDog - сухой корм и розничные цены</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f7f3;color:#20251e;font-family:system-ui,-apple-system,sans-serif;line-height:1.5}main{max-width:1280px;margin:auto;padding:40px 24px}h1{font-size:clamp(28px,4vw,46px);line-height:1.12;margin:12px 0 20px}h2{font-size:21px;margin:0}a{color:#335426;text-underline-offset:3px}p{max-width:960px}.eyebrow{font-size:13px;letter-spacing:1px;text-transform:uppercase}.stats{display:flex;flex-wrap:wrap;gap:12px;margin:28px 0}.stat{padding:14px 20px;background:#e2efb5;border-radius:14px}.stat strong{font-size:25px;margin-right:8px}.method{background:white;border:1px solid #dfe3d8;border-radius:18px;padding:22px;margin-bottom:24px}.method p{margin:8px 0}.filters{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:24px 0}label{display:flex;align-items:center;gap:8px}select,input[type=search]{font:inherit;padding:10px 14px;border:1px solid #cbd2c2;background:white;border-radius:10px}input[type=search]{min-width:280px}.recipe{margin:20px 0;background:white;border:1px solid #dfe3d8;border-radius:18px;padding:24px}.recipe-heading{display:flex;justify-content:space-between;gap:20px;margin-bottom:20px;align-items:baseline}.recipe-heading a{white-space:nowrap;font-size:13px}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;min-width:790px}th,td{text-align:left;padding:14px 12px;border-bottom:1px solid #e7eae2;vertical-align:top}th{font-size:12px;color:#60685a;font-weight:600}td:first-child{width:110px}td:nth-child(2),td:nth-child(3){width:165px;font-size:14px}.muted{display:block;color:#697163;font-size:12px}.flag{display:block;color:#836320;font-size:11px;margin-top:8px}details{font-size:14px}summary{cursor:pointer;color:#335426}ul{padding:0;list-style:none}.offer{display:grid;grid-template-columns:1fr auto;gap:8px;padding:14px 0;border-bottom:1px solid #e7eae2}.offer p{grid-column:1/-1;margin:0;color:#73796d;font-size:11px}.offer-price{text-align:right;white-space:nowrap;font-weight:600}.coverage{font-size:13px;color:#60685a}.empty{padding:18px;background:white;border-radius:12px} [hidden]{display:none}@media(max-width:700px){main{padding:24px 14px}.recipe{padding:16px}.recipe-heading{display:block}.recipe-heading a{display:inline-block;margin-top:8px}input[type=search]{min-width:0;width:100%}.filters{align-items:stretch}.filters label{flex-wrap:wrap}}@media print{body{background:white}.filters{display:none}.recipe{break-inside:avoid}main{padding:0}details ul{display:block}}
</style></head><body><main><div class="eyebrow">CatManDog · исследование ассортимента · 11 октября 2026</div><h1>Сухой корм - рецептуры, фасовки и розничные цены</h1>'''
document+=f'<p>Все согласованные рецептуры сохранены, по каждой фасовке собраны отдельные предложения магазинов</p><div class="stats"><div class="stat"><strong>{summary["recipes"]}</strong>рецептур</div><div class="stat"><strong>{summary["originalSkus"]}</strong>исходных SKU</div><div class="stat"><strong>{summary["observations"]}</strong>ценовых наблюдений</div><div class="stat"><strong>{summary["liveObservations"]}</strong>прямых проверок цен</div></div>'
document+='''<div class="method"><p><strong>Как читать цены</strong></p><p>Минимум из найденных - самая низкая цена одной упаковки среди сохранённых предложений без явно указанного отсутствия товара, исторических сравнителей и предыдущих цен, наличие части предложений ещё не подтверждено</p><p>Прямая цена с наличием - минимум одной упаковки из непосредственно прочитанных публичных данных магазина со статусом InStock, доставка по конкретному адресу в Валенсии не проверена</p><p>Стоимость доставки не включена, купоны, подписки и скидки на вторую упаковку не применены к обычной цене, наборы из нескольких упаковок показаны отдельно внутри предложений</p><p>Цены из поискового индекса могут быть устаревшими, дата чтения и возраст индекса показаны отдельно, все найденные значения сохранены как история</p><p>Amazon - актуальные цены напрямую не подтверждены, найденная историческая цена из Idealo сохранена отдельно и исключена из текущего минимума</p><p>Закупочные цены не заполнялись, состав каталога сайта не менялся</p></div>'''
document+=f'<p class="coverage">Розничные предложения найдены для {summary["recipesWithOffers"]} из 70 рецептур и {summary["originalSkusWithOffers"]} из 219 исходных SKU · Без найденной цены остаётся {len(summary["missingOriginalSkus"])} фасовок</p>'
document+='<div class="filters"><label>Бренд <select id="brand"><option value="">Все бренды</option>'+options+'</select></label><input id="search" type="search" aria-label="Поиск рецептуры" placeholder="Поиск рецептуры"><label><input id="stock" type="checkbox">Только строки с прямой ценой и наличием</label></div><p id="shown" class="coverage" aria-live="polite"></p><div id="cards">'+''.join(cards)+'</div><p id="empty" class="empty" hidden>Нет совпадений</p>'
document+='<div class="method"><strong>Расхождения, которые сохраняем для проверки</strong><ul>'+''.join('<li>'+esc(note)+'</li>' for note in inventory['notes'])+'<li>Royal Canin Light Weight Care - в текущей рознице найдены 1,5 / 3 / 8 кг, прежние 400 г / 2 / 3,5 / 10 кг сохранены в исходном перечне, новые размеры отмечены отдельно</li><li>Royal Canin British Shorthair - в рознице также подтверждена упаковка 2 кг</li><li>Название Leonardo Senior 1,8 кг в метаданных страницы ошибочно относится к котятам, заголовок самой карточки и GTIN 4002633753915 подтверждают Senior</li></ul></div>'
document+='''<script>const brand=document.querySelector('#brand'),search=document.querySelector('#search'),stock=document.querySelector('#stock'),cards=[...document.querySelectorAll('.recipe')];function filter(){let count=0;for(const card of cards){let rows=0;for(const row of card.querySelectorAll('tbody tr')){row.hidden=stock.checked&&row.dataset.stock!=='1';if(!row.hidden)rows++}card.hidden=(brand.value&&card.dataset.brand!==brand.value)||!card.dataset.search.includes(search.value.toLowerCase().trim())||!rows;if(!card.hidden)count++}document.querySelector('#shown').textContent='Показано рецептур - '+count;document.querySelector('#empty').hidden=count>0}brand.addEventListener('change',filter);search.addEventListener('input',filter);stock.addEventListener('change',filter);filter();</script></main></body></html>'''
(ROOT/'pricing-report.html').write_text(document)
print(json.dumps(summary,ensure_ascii=False,indent=2))
