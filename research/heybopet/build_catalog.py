"""Document the complete public Heybo Pet catalogue without pricing or prioritisation"""
import html
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PAGES = Path('/tmp/cmd-heybo-pages')
INDEX = json.loads(Path('/tmp/cmd-heybo-itemlist.json').read_text())
clean = lambda s: s.replace('—','-').replace('–','-').rstrip('.').strip()
classifications = {
 'HBZH-ICB-20': ('Лотки','Автоматический лоток','Базовая модель открытой серии','Tuya Smart, очистка и опорожнение наполнителя'),
 'HBZH-ICB-21': ('Лотки','Автоматический лоток','Pro','Обновлённый механизм очистки, увеличенный контейнер отходов'),
 'HBZH-ICB-15': ('Лотки','Автоматический лоток','Lite, компактная модель','Компактная конструкция, Tuya Smart'),
 'HBZH-ICB-24': ('Лотки','Автоматический лоток','XL Pro','Управление и журнал данных через Tuya Smart'),
 'HBZH-ICB-19': ('Лотки','Автоматический лоток','XL','Заявлен для 2-3 кошек, выдвижной контейнер отходов'),
 'HBZH-ICB-16': ('Лотки','Автоматический лоток','Standard','Стандартная модель открытой серии с Tuya Smart'),
 'HBZH-HRC-01': ('Лотки','Обычный закрытый лоток','Вход с щётками для шерсти','Щётки на входе и ступенька для сбора наполнителя, 3 цвета'),
 'HBHD-PWF-FC30L': ('Поилки','Фонтан-поилка','Струя из крана, LED-окно','3 л, сталь 304, тройная фильтрация'),
 'HBHD-IWF-32': ('Поилки','Фонтан-поилка с приложением','Tuya Smart','3,2 л, сталь 304, тройная фильтрация, мониторинг уровня воды'),
 'HBHD-PWF-R32L': ('Поилки','Фонтан-поилка','Струя из крана','3,2 л, нержавеющая сталь, разборная конструкция'),
 'HBHD-PWF-SSSB30L': ('Поилки','Фонтан-поилка','Квадратная, индукционное питание','3 л, нержавеющая сталь, угольный фильтр'),
 'HBHQ-PWF-SF032L': ('Поилки','Фонтан-поилка с приложением','Серия SF','3,2 л, нержавеющая сталь, тройная фильтрация, Tuya Smart'),
 'HBZYH-PFW-04LR': ('Кормушки','Автоматическая кормушка','Одна миска, без заявленной камеры','4 л, Tuya Smart, до 4 кормлений в день'),
 'HBJH-PFV-4L': ('Кормушки','Автоматическая кормушка с камерой','Встроенная HD-камера','4 л, Tuya Smart, программирование порций'),
 'HBJH-PFV-5LB': ('Кормушки','Автоматическая кормушка','Одна миска, без заявленной камеры','7 л, Tuya Smart, отсек для влагопоглотителя'),
 'HBJH-PFV-7L': ('Кормушки','Автоматическая кормушка с камерой','Pro, встроенная HD-камера','7 л, Tuya Smart, программирование порций'),
 'HBZH-PFV-45L': ('Кормушки','Автоматическая кормушка с камерой','Встроенная HD-камера','4,5 л, Tuya Smart, миска из стали 304'),
 'HBZH-PFW-7L': ('Кормушки','Автоматическая кормушка с двумя мисками','Две миски','7 л, миски из стали 304, Tuya Smart'),
 'HBZH-PDB-HG100': ('Сушка и уход','Сушильный бокс для животных','Закрытая камера с контролем температуры','ABS+PC, питание AC 110-240 В'),
 'HBZH-FFC-01': ('Приготовление еды','Прибор для приготовления свежей еды','Измельчение, смешивание и приготовление','Низкотемпературное приготовление, Wi-Fi 2,4 ГГц, Tuya'),
 'heybopet-MAT-001': ('Аксессуары','Коврик под лоток','Защита поверхности и сбор наполнителя','Водостойкая поверхность, противоскользящая основа')
}
notes={
 'HBJH-PFV-5LB':['Объём в спецификации - 7 л, не 5 л, код модели не является обозначением вместимости','Камера в этой карточке не заявлена'],
 'HBZH-PFV-45L':['Объём - 4,5 л, не 45 л'],
 'HBHD-PWF-SSSB30L':['Индукционная передача питания не подтверждает наличие батареи или автономную работу'],
 'HBHD-PWF-R32L':['В структурированной спецификации указана Tuya, но список основных функций не описывает управление через приложение - уточнить конфигурацию'],
 'HBZH-HRC-01':['Самоочистка не заявлена в предметном описании, не относить к автоматическим лоткам','SEO-заголовок и общий Product Type ошибочно относят модель к автоматическим и открытым лоткам'],
 'HBZH-ICB-15':['Открытая конструкция заявлена производителем, соответствие конкретных фотографий и конструкции требует уточнения'],
 'HBZH-ICB-19':['Открытая конструкция заявлена производителем, соответствие конкретных фотографий и конструкции требует уточнения'],
 'HBZH-PDB-HG100':['В общей сводке указаны CE/FCC/RoHS, в списке функций упомянута CE, подтверждающие документы не проверены'],
 'HBZH-FFC-01':['Числовая вместимость и диапазон температур не найдены в опубликованной спецификации']
}
old = json.JSONDecoder().raw_decode(Path('heybopet-products.js').read_text().split('=',1)[1].strip())[0]
existing={v.get('manufacturerSku') or v.get('model') for family in old for v in family.get('variants',[])}
products=[]
for item in INDEX['itemListElement']:
 url=item['url']; source=PAGES/(url.rsplit('/',1)[-1]+'.html')
 entities=[]
 for raw in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',source.read_text(),re.S):
  d=json.loads(raw)
  if d.get('@type')=='WebPage' and isinstance(d.get('mainEntity'),dict):entities.append(d['mainEntity'])
 assert len(entities)==1, url
 entity=entities[0];model=entity['identifier'];category,kind,subtype,difference=classifications[model]
 props={x['name']:x['value'] for x in entity.get('additionalProperty',[])}
 technical={k:v for k,v in props.items() if k not in ['Model','Product Type','MOQ','Lead Time','Stock','Certifications','Stock Location','Buyer Type','Customization']}
 model_notes=list(notes.get(model,[]))
 if 'Dual WiFi' in technical.get('Connectivity',''):model_notes.append('Dual WiFi 2.4GHz не подтверждает поддержку диапазона 5 ГГц')
 images=entity.get('image',[])
 if model=='HBZH-ICB-19' and any('mat-001' in u for u in images):model_notes.append('В галерее есть файлы с кодом MAT-001 - перед публикацией проверить соответствие фотографий модели')
 products.append(dict(model=model,category=category,type=kind,subtype=subtype,nameOriginal=clean(entity['name']),nameCatalogue=clean(item['item']['name']),difference=difference,capacityDeclared=technical.get('Capacity'),specificationsDeclared=technical,sourceUrl=url,imageSourceUrls=images,existingInCatManDog=model in existing,retailPrice=None,purchasePrice=None,quotationStatus='awaiting_supplier',priority=None,notes=model_notes,verifiedOn='2026-10-12'))
sitemap=[e.text for e in ET.fromstring(Path('/tmp/cmd-heybo-sitemap.txt').read_text()).iter() if e.tag.endswith('loc') and '/es/products/' in (e.text or '')]
model_urls={p['sourceUrl'] for p in products};landings=[u for u in sitemap if u not in model_urls]
assert len(products)==INDEX['numberOfItems']==21
assert len({p['model'] for p in products})==21
counts=dict(Counter(p['category'] for p in products))
data=dict(verifiedOn='2026-10-12',scope='Полный публичный каталог Heybo Pet, без ранжирования и исследования цен',catalogueSource='https://www.heybopet.com/es/products',sitemapSource='https://www.heybopet.com/sitemap.xml',coverage=dict(catalogueModels=21,verifiedProductPages=21,sitemapSpanishProductPaths=len(sitemap),nonProductLandingPages=landings),categoryCounts=counts,existingModels=len(existing),newlyDocumentedModels=[p['model'] for p in products if not p['existingInCatManDog']],products=products)
(ROOT/'catalogue.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
escape=lambda s:html.escape(str(s),quote=True)
cards=[]
for category in counts:
 rows=[]
 for p in products:
  if p['category']!=category:continue
  specs=''.join('<li>'+escape(clean(k))+': '+escape(clean(v))+'</li>' for k,v in p['specificationsDeclared'].items())
  annotations=''.join('<li>'+escape(clean(n))+'</li>' for n in p['notes'])
  photos=''.join(f'<a href="{escape(u)}" target="_blank" rel="noopener noreferrer">Фото {i+1}</a> ' for i,u in enumerate(p['imageSourceUrls']))
  existing_label='Есть на сайте' if p['existingInCatManDog'] else 'Не добавлена на сайт'
  rows.append(f'<tr data-search="{escape((p["model"]+" "+p["type"]+" "+p["subtype"]).lower())}"><td><strong>{escape(p["model"])}</strong><span class="muted">{existing_label}</span></td><td><strong>{escape(p["type"])}</strong><span>{escape(p["subtype"])}</span><p>{escape(p["difference"])}</p></td><td><a href="{escape(p["sourceUrl"])}" target="_blank" rel="noopener noreferrer">{escape(p["nameOriginal"])}</a><span class="muted">{escape(p["nameCatalogue"])}</span><details><summary>Данные карточки и ссылки на фотографии</summary><ul>{specs}</ul>{("<ul class=notes>"+annotations+"</ul>") if annotations else ""}<div class="photos">{photos}</div></details></td></tr>')
 cards.append(f'<section data-category="{escape(category)}"><h2>{escape(category)} <small>{counts[category]} моделей</small></h2><div class="scroll"><table><thead><tr><th>Модель</th><th>Тип и отличия</th><th>Официальное название и источник</th></tr></thead><tbody>'+''.join(rows)+'</tbody></table></div></section>')
summary=''.join(f'<div class="stat"><strong>{n}</strong>{escape(c)}</div>' for c,n in counts.items())
options=''.join(f'<option>{escape(c)}</option>' for c in counts)
doc='''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Heybo Pet - полный публичный каталог</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f7f3;color:#20251e;font-family:system-ui,-apple-system,sans-serif;line-height:1.5}main{max-width:1240px;margin:auto;padding:40px 24px}h1{font-size:clamp(28px,4vw,44px);line-height:1.15}h2{font-size:24px;margin:0 0 18px}small{font-size:14px;font-weight:400;color:#66705f;margin-left:12px}a{color:#36572c;text-underline-offset:3px}.eyebrow{font-size:13px;letter-spacing:1px;text-transform:uppercase}.stats{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.stat{background:#e2efb5;padding:12px 16px;border-radius:12px}.stat strong{font-size:24px;margin-right:10px}.intro,section{background:white;border:1px solid #dfe3d8;border-radius:18px;padding:24px;margin:20px 0}.intro p{margin:8px 0}.filters{display:flex;gap:14px;flex-wrap:wrap;align-items:center}input,select{font:inherit;background:white;border:1px solid #cbd2c2;padding:10px 14px;border-radius:10px}.scroll{overflow:auto}table{width:100%;min-width:850px;border-collapse:collapse}th,td{padding:16px 12px;vertical-align:top;border-bottom:1px solid #e4e8de;text-align:left}th{font-size:12px;color:#63705b}td:first-child{width:190px}td:nth-child(2){width:290px}td span{display:block}td p{font-size:14px;margin:8px 0}.muted{color:#737b6b;font-size:12px;margin-top:6px}details{margin-top:12px;font-size:13px}summary{cursor:pointer;color:#36572c}.notes{color:#836320}.photos{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}li{margin:6px 0}[hidden]{display:none}@media(max-width:700px){main{padding:24px 14px}.intro,section{padding:16px}input{width:100%}}@media print{body{background:white}.filters{display:none}section{break-inside:avoid}main{padding:0}}</style></head><body><main><div class="eyebrow">CatManDog · исследование поставщика · 12 октября 2026</div><h1>Heybo Pet - полный публичный каталог</h1>'''
doc+='<p>21 точная модель, 6 категорий, каждая модель сохранена отдельно для будущего сопоставления с предложением поставщика</p><div class="stats">'+summary+'</div>'
doc+='<div class="intro"><p><strong>Объём исследования</strong></p><p>Проверены все 21 товарные карточки из текущего каталога и карты сайта, ещё 3 адреса в разделе products являются страницами товарных направлений, отдельными моделями они не считаются</p><p>17 моделей уже представлены в CatManDog внутри 7 семейств, дополнительно документированы HRC-01, HG100, FFC-01 и MAT-001, текущий ассортимент сайта не изменён</p><p>Приоритеты не назначены, розничные цены не исследовались, закупочные цены остаются пустыми до предложения поставщика</p><p>В категории лотков - 6 автоматических моделей и один обычный закрытый лоток с щётками, HRC-01 не считается самоочищающимся</p><p>Характеристики показаны как заявления производителя, ссылки на оригинальные фотографии сохранены для следующего этапа, фотографии не скачивались</p><p>Общая рекламная формулировка о безопасности, доставке и сертификации не заменяет сведения о конкретной модели</p><p><a href="https://www.heybopet.com/es/products" target="_blank" rel="noopener noreferrer">Каталог производителя</a> · <a href="https://www.heybopet.com/sitemap.xml" target="_blank" rel="noopener noreferrer">Карта сайта</a></p></div>'
doc+='<div class="filters"><label for="category">Категория</label><select id="category"><option value="">Все категории</option>'+options+'</select><input id="search" type="search" aria-label="Поиск модели или типа" placeholder="Модель, тип или серия"></div><p id="count" class="muted" aria-live="polite"></p>'+''.join(cards)
doc+='''<script>const category=document.querySelector('#category'),search=document.querySelector('#search');function filter(){let count=0;for(const section of document.querySelectorAll('section')){let matches=0;for(const row of section.querySelectorAll('tbody tr')){row.hidden=!row.dataset.search.includes(search.value.trim().toLowerCase());if(!row.hidden)matches++}section.hidden=(category.value&&section.dataset.category!==category.value)||!matches;if(!section.hidden)count+=matches}document.querySelector('#count').textContent='Показано моделей - '+count}category.addEventListener('change',filter);search.addEventListener('input',filter);filter();</script></main></body></html>'''
(ROOT/'catalogue.html').write_text(doc)
print(json.dumps({'categories':counts,'models':len(products),'existing':len(existing),'new':data['newlyDocumentedModels'],'imageReferences':sum(len(p['imageSourceUrls']) for p in products)},ensure_ascii=False,indent=2))
