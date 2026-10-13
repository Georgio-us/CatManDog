"""Produce an analogue comparison with explicit sample statistics and source links"""
import html
import json
import statistics
from pathlib import Path

ROOT=Path(__file__).resolve().parent
catalog=json.loads((ROOT/'catalogue.json').read_text())
offers=json.loads((ROOT/'analogue-price-evidence.json').read_text())
groups={
 'open':('Открытые автоматические лотки','Открытая архитектура и самоочистка, не закрытые вращающиеся капсулы','Объёмы и размеры части Heybo-моделей не опубликованы, отдельный ценовой коэффициент Lite / Pro / XL установить нельзя'),
 'closed':('Обычные закрытые лотки','Ручная уборка, закрытый корпус','Точного аналога двери для удаления шерсти HRC-01 не найдено, щётка в комплекте не означает щётки на входе'),
 'steel':('Стальные поилки без подтверждённого приложения','Стальной фонтан с насосом и фильтром, примерно 3-3,8 л','Конструкция струи, материал всего резервуара и расходники отличаются, наличие приложения у Heybo R32L нужно уточнить'),
 'smart-water':('Поилки с приложением','Контроль питья и функций через приложение','Catit и Petlibro имеют другой объём и стальную верхнюю часть вместо полного стального резервуара, приложения не Tuya'),
 'induction':('Поилки с беспроводным питанием насоса','Отсутствие проводов внутри водяного узла, не батарейная автономность','Solo 2 и EverSweet 3 Pro отличаются от Heybo объёмом и материалом, версия UVC имеет дополнительную функцию'),
 'wifi-feeder':('Кормушки с Wi-Fi без камеры','Бункер, автоматическое дозирование и расписание через приложение','Ближайшие доступные примеры имеют 3,6-6 л, точная ёмкость Heybo 7 л не совпадает, без Wi-Fi модели не включены'),
 'camera-feeder':('Кормушки с камерой и приложением','Видео и автоматическая выдача сухого корма','В выборке доступных аналогов 4-5 л, для Heybo 7 л соответствие по вместимости неполное, Cecotec 6 л сохранён отдельно без наличия'),
 'dual':('Кормушки с двумя мисками и Wi-Fi','Раздача по двум мискам и расписание через приложение','Доступные аналоги имеют 5 л вместо Heybo 7 л, наличие двух мисок само по себе не гарантирует Wi-Fi'),
 'dry':('Сушильные боксы','Закрытая камера с контролем температуры, не фен или груминг-пылесос','Подтверждённые примеры PETKIT 60 л, у Heybo HG100 вместимость не опубликована, сравнение по типу прибора'),
 'mat':('Коврики под лоток','Защита пола и сбор наполнителя','Размер Heybo не опубликован, материалы и размеры аналогов отличаются, полную водонепроницаемость каждого аналога не утверждаем'),
 'cooker':('Приборы для приготовления еды','Измельчение, смешивание и приготовление свежей еды для животных','Три сопоставимые розничные EUR-цены с подтверждённой покупкой в Испании не найдены')
}
mapping={
 'HBZH-ICB-20':'open','HBZH-ICB-21':'open','HBZH-ICB-15':'open','HBZH-ICB-24':'open','HBZH-ICB-19':'open','HBZH-ICB-16':'open',
 'HBZH-HRC-01':'closed','heybopet-MAT-001':'mat','HBHD-PWF-FC30L':'steel','HBHD-PWF-R32L':'steel',
 'HBHD-IWF-32':'smart-water','HBHQ-PWF-SF032L':'smart-water','HBHD-PWF-SSSB30L':'induction',
 'HBZYH-PFW-04LR':'wifi-feeder','HBJH-PFV-5LB':'wifi-feeder','HBJH-PFV-4L':'camera-feeder','HBJH-PFV-7L':'camera-feeder','HBZH-PFV-45L':'camera-feeder',
 'HBZH-PFW-7L':'dual','HBZH-PDB-HG100':'dry','HBZH-FFC-01':'cooker'
}
shipping_sources=[
 {'retailer':'Neakasa EU','url':'https://eu.neakasa.com/es/pages/shipping-policy','finding':'Испания прямо включена в список стран доставки, стоимость доставки зависит от заказа'},
 {'retailer':'PETKIT EU','url':'https://www.petkit-eu.com/policies/shipping-policy','finding':'Доставка по ЕС, право доставки и тариф определяются по адресу на checkout'},
 {'retailer':'Catit España','url':'https://catit.es/products/fuente-inteligente-pixi','finding':'Испания Peninsular, бесплатная доставка от 39 EUR по условиям страницы'},
 {'retailer':'Castro Electrónica','url':'https://www.castroelectronica.es/es/ajuda/custos-de-envio','finding':'Есть доставка в Испанию, тариф определяется заказом'},
 {'retailer':'Petifo','url':'https://petifo.es/pages/shipping','finding':'Магазин заявляет доставку по ЕС, конкретный адрес не проверен'}
]
excluded_references=[
 {'model':'HBZH-ICB-20','name':'Точная модель Heybo в Vivan Hub','price':136.38,'currency':'USD','url':'https://vivanhub.com/products/hbzh-icb-20-open-top-smart-cat-litter-box-app-controlled-large-capacity-us-eu-stock-heybo','reason':'Совпадает код модели, доставка в Испанию и итоговая стоимость не подтверждены, не включено в EUR-коридор'},
 {'model':'HBZH-FFC-01','name':'ChefPaw Dog Food Maker','price':549,'currency':'USD','url':'https://www.chefpaw.com/products/chefpaw-dog-food-maker','reason':'Функциональный аналог приготовления еды, стандартная доставка в Испанию не подтверждена, долларовая цена не превращена в европейскую розничную'},
 {'model':'HBZH-FFC-01','name':'Robot Kibus','price':299,'currency':'EUR','url':'https://www.kibuspetcare.com/faqs/','reason':'299 EUR названы рыночной стоимостью устройства внутри подписного плана, это не подтверждённая цена отдельной розничной покупки'}
]
summaries=[]
for gid,(name,criteria,limitation) in groups.items():
 candidates=[o for o in offers if o['group']==gid]
 eligible=sorted([o for o in candidates if o['eligibleForRange']],key=lambda o:o['priceUsedEUR'])
 prices=[o['priceUsedEUR'] for o in eligible]
 summaries.append(dict(id=gid,name=name,comparisonCriteria=criteria,limitation=limitation,offerIds=[o['id'] for o in candidates],eligibleOfferIds=[o['id'] for o in eligible],sampleSize=len(prices),minimumEUR=min(prices) if prices else None,meanEUR=round(statistics.mean(prices),2) if prices else None,medianEUR=round(statistics.median(prices),2) if prices else None,maximumEUR=max(prices) if prices else None,minimumOfferId=eligible[0]['id'] if eligible else None,maximumOfferId=eligible[-1]['id'] if eligible else None,representativeOfferId=min(eligible,key=lambda o:abs(o['priceUsedEUR']-statistics.mean(prices)))['id'] if eligible else None))
bygroup={s['id']:s for s in summaries}
model_comparisons=[dict(model=p['model'],category=p['category'],name=p['type'],groupId=mapping[p['model']],comparisonStatus='functional_analogues_not_identical_sku' if mapping[p['model']]!='cooker' else 'insufficient_local_retail_evidence',supplierPurchasePriceEUR=None,proposedCatManDogPriceEUR=None,minimumEUR=bygroup[mapping[p['model']]]['minimumEUR'],meanEUR=bygroup[mapping[p['model']]]['meanEUR'],maximumEUR=bygroup[mapping[p['model']]]['maximumEUR']) for p in catalog['products']]
dataset=dict(checkedOn='2026-10-12',scope='Розничные аналоги всех 21 моделей Heybo Pet, Испания и европейские магазины',methodology='Минимум, среднее арифметическое и максимум найденной выборки предложений без явно указанного отсутствия товара, не статистика всего рынка и не цены поставщика',shippingIncluded=False,valenciaPostcodeCheckoutVerified=False,groups=summaries,models=model_comparisons,offers=offers,excludedReferences=excluded_references,shippingSources=shipping_sources,platformNotes={'Amazon':'Актуальные точные предложения в EUR с подтверждённой фасовкой и комплектацией не получены, цифры из обзоров и старые сниппеты не использованы','Temu':'Найдены карточки, воспроизводимая цена для Испании без персональных условий не подтверждена, в диапазон не включено'})
(ROOT/'analogue-prices.json').write_text(json.dumps(dataset,ensure_ascii=False,indent=2))
e=lambda x:html.escape(str(x),quote=True)
money=lambda p:'Не установлен' if p is None else f'{p:.2f}'.replace('.',',')+' €'
byoffer={o['id']:o for o in offers}
def endpoint(s,side):
 oid=s[side+'OfferId']
 if not oid:return '<span class="muted">Нет сопоставимых предложений</span>'
 o=byoffer[oid];url=o.get('evidenceSourceUrl') or o['sourceUrl']
 return '<a href="'+e(url)+'" target="_blank" rel="noopener noreferrer">'+e(o['retailer'])+'</a><span class="muted">'+e(o['name'])+'</span>'
summary_rows=[]
for s in summaries:
 summary_rows.append(f'<tr><td><a href="#{e(s["id"])}">{e(s["name"])}</a><span class="muted">{s["sampleSize"]} предложений в расчёте</span></td><td><strong>{money(s["minimumEUR"])}</strong>{endpoint(s,"minimum")}</td><td><strong>{money(s["meanEUR"])}</strong><span class="muted">Среднее арифметическое выборки</span></td><td><strong>{money(s["maximumEUR"])}</strong>{endpoint(s,"maximum")}</td></tr>')
sections=[]
for s in summaries:
 rows=[]
 for o in sorted([o for o in offers if o['group']==s['id']],key=lambda o:(not o['eligibleForRange'],o['priceUsedEUR'])):
  stock='В наличии по данным карточки' if o['availability']=='InStock' else 'Нет в наличии' if o['availability']=='OutOfStock' else 'Наличие по адресу не подтверждено'
  verification='Прямая проверка публичных данных' if o['priceEvidenceType'].startswith('live_') else 'Прочитанная веб-карточка' if o['priceEvidenceType']=='opened_product_page' else 'Веб-индекс / список магазина'
  exclusion='' if o['eligibleForRange'] else '<span class="excluded">Не участвует в диапазоне</span>'
  url=o.get('evidenceSourceUrl') or o['sourceUrl']
  rows.append(f'<tr><td><strong>{e(o["name"])}</strong><span class="muted">{e(o["differences"])}</span></td><td><a href="{e(url)}" target="_blank" rel="noopener noreferrer">{e(o["retailer"])}</a></td><td><strong>{money(o["priceUsedEUR"])}</strong>{exclusion}</td><td><span class="muted">{e(stock)} · {e(verification)}</span><p>{e(o.get("verificationNote", "Цена выставлена в найденной карточке, оформление по конкретному индексу не проверено"))}</p></td></tr>')
 models=[m['model'] for m in model_comparisons if m['groupId']==s['id']]
 if s['id']=='cooker':
  detail='<p>Сопоставимый локальный розничный диапазон не установлен</p><ul>'+''.join(f'<li><a href="{e(r["url"])}" target="_blank" rel="noopener noreferrer">{e(r["name"])}</a> - {r["price"]} {r["currency"]} · {e(r["reason"])}</li>' for r in excluded_references if r['model']=='HBZH-FFC-01')+'</ul>'
 else:
  detail='<div class="scroll"><table><thead><tr><th>Аналог и отличие от Heybo</th><th>Магазин</th><th>Цена</th><th>Подтверждение</th></tr></thead><tbody>'+''.join(rows)+'</tbody></table></div>'
 sections.append(f'<section id="{e(s["id"])}"><h2>{e(s["name"])}</h2><p class="models">Heybo - {e(", ".join(models))}</p><p>{e(s["comparisonCriteria"])}</p><p class="limitation">{e(s["limitation"])}</p>'+detail+'</section>')
modelrows=''.join(f'<tr data-search="{e((m["model"]+" "+m["category"]+" "+m["name"]).lower())}"><td><strong>{e(m["model"])}</strong><span class="muted">{e(m["name"])}</span></td><td>{money(m["minimumEUR"])}</td><td>{money(m["meanEUR"])}</td><td>{money(m["maximumEUR"])}</td><td><a href="#{e(m["groupId"])}">Посмотреть аналоги</a></td></tr>' for m in model_comparisons)
doc='''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Heybo Pet - розничные аналоги и цены</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f7f3;color:#20251e;font-family:system-ui,-apple-system,sans-serif;line-height:1.5}main{max-width:1280px;margin:auto;padding:40px 24px}h1{font-size:clamp(28px,4vw,44px);line-height:1.15}h2{font-size:24px;margin:0 0 18px}a{color:#36572c;text-underline-offset:3px}.eyebrow{font-size:13px;letter-spacing:1px;text-transform:uppercase}.stats{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.stat{background:#e2efb5;padding:12px 16px;border-radius:12px}.stat strong{font-size:24px;margin-right:10px}.intro,section{background:white;border:1px solid #dfe3d8;border-radius:18px;padding:24px;margin:20px 0}.intro p{margin:8px 0}.scroll{overflow:auto}table{width:100%;min-width:840px;border-collapse:collapse}th,td{padding:16px 12px;vertical-align:top;border-bottom:1px solid #e4e8de;text-align:left}th{font-size:12px;color:#63705b}td strong,td a{display:block}td:nth-child(3){white-space:nowrap}.muted{display:block;color:#737b6b;font-size:12px;margin-top:6px}td p{font-size:12px;margin:6px 0}.limitation{border-left:3px solid #d6dfc7;padding:10px 14px;background:#f7f9f2;font-size:14px}.models{font-size:13px;color:#5d704c}.excluded{display:block;color:#966324;font-size:11px}input{font:inherit;background:white;border:1px solid #cbd2c2;padding:10px 14px;border-radius:10px;margin-bottom:18px;max-width:100%}.notes li{margin:8px 0}[hidden]{display:none}@media(max-width:700px){main{padding:24px 14px}.intro,section{padding:16px}}@media print{body{background:white}input{display:none}main{padding:0}section{break-inside:avoid}}</style></head><body><main><div class="eyebrow">CatManDog · розничный рынок · 12 октября 2026</div><h1>Heybo Pet - розничные аналоги</h1>'''
doc+=f'<div class="stats"><div class="stat"><strong>21</strong>модель Heybo</div><div class="stat"><strong>{len(offers)}</strong>ценовых предложений</div><div class="stat"><strong>20</strong>моделей с функциональными аналогами</div><div class="stat"><strong>1</strong>модель без локального диапазона</div></div>'
doc+='''<div class="intro"><p><strong>Что означают три цены</strong></p><p>Минимум и максимум - цены найденной выборки сопоставимых предложений, средняя - арифметическое среднее этой выборки, это не статистика всего рынка Испании</p><p>Подборка относится к испанским магазинам и европейским витринам, доставка по конкретному адресу в Валенсии на checkout не оформлялась, стоимость доставки в цены не включена</p><p>Все товары рассматриваются как функциональные аналоги, идентичность оборудования Heybo и других брендов не установлена, различия в ёмкости, конструкции и функциях показаны отдельно</p><p>Для нескольких Heybo-моделей используется общий коридор одной функциональной группы, одинаковые числа не означают одинаковую стоимость их закупки или производства</p><p>Зачёркнутые PVPR, персональные купоны, оптовые скидки и товары с явно указанным отсутствием не участвуют в диапазоне, цены из веб-индекса могут требовать повторной проверки перед покупкой</p><p>Закупочные цены и будущие цены CatManDog не назначены</p></div>'''
doc+='<section><h2>Минимальная, средняя и максимальная цена</h2><div class="scroll"><table><thead><tr><th>Функциональная группа</th><th>Минимум</th><th>Средняя - расчёт</th><th>Максимум</th></tr></thead><tbody>'+''.join(summary_rows)+'</tbody></table></div></section>'
doc+='<section><h2>Сопоставление с каждой моделью Heybo</h2><input type="search" id="search" aria-label="Найти модель Heybo" placeholder="Код модели или категория"><div class="scroll"><table id="models"><thead><tr><th>Модель</th><th>Минимум</th><th>Средняя</th><th>Максимум</th><th>Источники</th></tr></thead><tbody>'+modelrows+'</tbody></table></div></section>'+''.join(sections)
doc+='<section><h2>Точная модель Heybo вне испанского диапазона</h2><p><a href="'+e(excluded_references[0]['url'])+'" target="_blank" rel="noopener noreferrer">HBZH-ICB-20 в Vivan Hub</a> - 136,38 USD, совпадает код модели, доставка в Испанию и итоговая стоимость не подтверждены, цена не включена в EUR-коридор</p></section>'
doc+='<section><h2>Доставка и ограничения источников</h2><ul class="notes">'+''.join(f'<li><a href="{e(s["url"])}" target="_blank" rel="noopener noreferrer">{e(s["retailer"])}</a> - {e(s["finding"])}</li>' for s in shipping_sources)+'</ul><p>Amazon - актуальные сопоставимые предложения напрямую не подтверждены, старые цены из обзоров не использованы</p><p>Temu - найдены карточки, воспроизводимая цена для Испании без персональных условий не подтверждена</p><p>Поля закупочной цены оставлены пустыми, каталог магазина и приоритеты закупки не менялись</p></section>'
doc+='''<script>document.querySelector('#search').addEventListener('input',event=>{const q=event.target.value.trim().toLowerCase();for(const row of document.querySelectorAll('#models tbody tr'))row.hidden=!row.dataset.search.includes(q)});</script></main></body></html>'''
(ROOT/'analogue-report.html').write_text(doc)
print(json.dumps([{k:s[k] for k in ['id','sampleSize','minimumEUR','meanEUR','maximumEUR']} for s in summaries],ensure_ascii=False,indent=2))
