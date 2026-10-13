"""Organize existing evidence into a project registry, without selecting or researching new SKU"""
import html, json, re
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parent
read=lambda p:json.loads((ROOT/p).read_text())
esc=lambda s:html.escape(str(s),quote=True)
studies=[
 dict(id='dry',name='Сухой корм',report='dry-cat-food/pricing-report.html',data='dry-cat-food/assortment.json',scope='Рецептура',unit='рецептур',priceNote='Есть розничные предложения, отдельные фасовки ещё без цены'),
 dict(id='wet',name='Влажный корм',report='wet-cat-food/pricing-report.html',data='wet-cat-food/assortment.json',scope='Наименование / текстура / ассорти',unit='наименований и исполнений',priceNote='Есть розничные предложения, Orijen сохранён отдельно без подтверждённой доступности в Испании'),
 dict(id='treats',name='Лакомства и пищевой уход',report='cat-treats-care/pricing-report.html',data='cat-treats-care/assortment.json',scope='Наименование / исполнение',unit='наименований и исполнений',priceNote='Есть цены по подтверждённым комплектациям, расхождения вынесены в проверку'),
 dict(id='heybo',name='Техника Heybo Pet',report='heybopet/catalogue.html',data='heybopet/catalogue.json',scope='Модель',unit='модель',priceNote='Цена Heybo Pet ожидается, розничные аналоги находятся в отдельном отчёте'),
 dict(id='everyday',name='Миски, игрушки, окна и балконы',report='../CATALOG-RESEARCH.md',data='existing-research.json',scope='Точный товар / вариант',unit='товар',priceNote='Ранее исследованные реальные товары, розничные цены или PVPR есть не у всех'),
 dict(id='gifts',name='Подарки и lifestyle',report='../FAIRE-SOURCING.md',data='existing-research.json',scope='Точный дизайн / вариант',unit='вариантов',priceNote='Есть публичные MSRP, закупочные цены и условия поставки не подтверждены'),
]
entries=[]
def add(study,original_id,name,brand,group,subgroup,packs,sources,**extra):
    entries.append(dict(id=study+':'+original_id,sourceRecordId=original_id,studyId=study,name=name,brand=brand,group=group,subgroup=subgroup,packaging=packs,sourceUrls=sources,selectionStatus='not_selected',**extra))

dry=read('dry-cat-food/assortment.json')
for p in dry['recipes']:
    add('dry',p['id'],p['name'],p['brand'],'Питание','Сухой корм',[str(g)+' г' for g in p['weightsGrams']],[p['sourceUrl']],purchasePrice=p.get('purchasePrice'))
wet=read('wet-cat-food/assortment.json')
for p in wet['recipes']:
    add('wet',p['id'],p['name'],p['brand'],'Питание','Влажный корм',[str(g)+' г' for g in p['weightsGrams']],p['sourceUrls'],purchasePrice=p.get('purchasePrice'),recordKind=p['kind'],segment=p['segment'])
treats=read('cat-treats-care/assortment.json')
care={'Другие пищевые добавки','Кошачья трава','Мальт-пасты и снеки','Масла для кожи и шерсти','Пробиотики','Уход за зубами'}
for p in treats['products']:
    packs=[]
    for s in treats['skus']:
        if s['productId']==p['id']:
            packs.append((str(s['quantity'])+' × ' if s['quantity']>1 else '')+f'{s["amount"]:g} '+('г' if s['unit']=='g' else 'мл' if s['unit']=='ml' else 'шт'))
    add('treats',p['id'],p['name'],p['brand'],'Уход и добавки' if p['category'] in care else 'Лакомства',p['category'],packs,p['sourceUrls'],purchasePrice=p.get('purchasePrice'))
heybo=read('heybopet/catalogue.json')
for p in heybo['products']:
    add('heybo',p['model'],p['nameCatalogue'],'Heybo Pet','Техника и оборудование',p['category'],[p['model']],[p['sourceUrl']],purchasePrice=p.get('purchasePrice'),type=p['type'],quotationStatus=p.get('quotationStatus'))
old=read('existing-research.json')
for p in old['everyday']:
    group={'Игрушки':'Игрушки','Миски и поилки':'Миски и поилки','Окна и балконы':'Окна и балконы'}.get(p['category'],'Аксессуары')
    add('everyday',p['id'],p['name'],p['brand'],group,p['category'],[p['packaging']] if p['packaging'] else [],p['sourceUrls'],purchasePrice=p['purchasePrice'],sourceDocument=p['document'],priceKind=p['priceKind'])
for p in old['gifts']:
    add('gifts',p['id'],p['name'],p['brand'],'Подарки и lifestyle',p['category'],[p['packaging']] if p['packaging'] else [],p['sourceUrls'],purchasePrice=p['purchasePrice'],sourceDocument=p['document'],priceKind=p['priceKind'])
for s in studies:s['recordCount']=sum(e['studyId']==s['id'] for e in entries)

backlog=[
 dict(group='Наполнители',missing=['Растительные и минеральные наполнители','Комкующиеся варианты и разные размеры упаковок'],existing='Heybo Pet исследован как техника, реальной линейки наполнителей ещё нет'),
 dict(group='Обычные лотки и уборка',missing=['Открытые и закрытые лотки','Большие лотки и высокие борта','Лопаточки и базовые принадлежности для уборки'],existing='У Heybo Pet есть 6 автоматических моделей и один обычный закрытый лоток'),
 dict(group='Дом и активность',missing=['Когтеточки и игровые комплексы','Решения без сверления для съёмной квартиры','Лежанки и повседневные домики'],existing='Есть оконные лежанки и подарочный домик с когтеточкой'),
 dict(group='Переноски и поездки',missing=['Мягкие и жёсткие переноски','Разные размеры и комплектации'],existing='Отдельной подробной базы реальных SKU пока нет'),
 dict(group='Инструменты и средства ухода',missing=['Щётки и расчёски','Когтерезы','Базовые средства очищения'],existing='Мальт-пасты, масла, пищевые добавки и часть ухода за зубами уже исследованы'),
 dict(group='Аксессуары',missing=['Безопасные ошейники','Шлейки и поводки'],existing='Есть отдельные реальные аксессуары, основная линейка ещё не исследована'),
 dict(group='Дополнение игрушек и мисок',missing=['Повседневные дразнилки, мячики и тоннели','Дополнительные обычные стальные и керамические миски'],existing='Уже есть KONG, Dashi, подарочные игрушки, TarHong и Catit'),
 dict(group='Готовые подарочные наборы',missing=['Точный состав каждого набора','Комплектация упаковки','Расчёт себестоимости после получения закупочных цен'],existing='Реальные подарочные товары и кандидаты для упаковки найдены'),
]
for b in backlog:b['status']='deferred_by_user';b['priority']=None;b['scheduledFor']=None
notes=[
 'Реестр описывает сохранённые исследования, не ассортимент сайта и не наличие на складе',
 'Найденные товары не означают, что каждый из них выбран для запуска',
 'Рецептуры, исполнения, модели и варианты учитываются разными единицами, общее число SKU не выводится',
 'Исходные документы и цены сохранены, реестр добавляет навигацию и группировку',
 'Закупочные цены не заполняются из розничных наблюдений, аналоги Heybo Pet не становятся ценами Heybo Pet',
 'Разные комплектации и старые / новые версии требуют проверки перед объединением в итоговый закупочный каталог',
 'Новые категории отложены по решению пользователя, даты исследования и приоритеты для них не назначены',
]
manifest=dict(updatedOn='2026-10-13',currentFocus='Упорядочить уже исследованный ассортимент',studies=studies,groups=dict(Counter(e['group'] for e in entries)),notes=notes,entries=entries,additionalReferences=dict(orijenWet=wet.get('internationalReferences',[]),packagingDocument='../PACKAGING-SOURCING.md',heybopetAnalogueReport='heybopet/analogue-report.html'))
(ROOT/'assortment-register.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(ROOT/'backlog.json').write_text(json.dumps(dict(status='deferred_by_user',scope='Только отсутствующие или недоработанные направления',items=backlog),ensure_ascii=False,indent=2))

style='''<style>:root{font-family:system-ui,sans-serif;color:#222a22;background:#f5f6f2}body{margin:0}main{max-width:1320px;margin:auto;padding:40px 24px}header{background:#dafa77;border-radius:24px;padding:36px}h1{font-size:clamp(30px,5vw,54px);letter-spacing:-.04em;margin:12px 0}p,li{line-height:1.6}nav{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}a{color:#426626}nav a{padding:12px 16px;background:white;border:1px solid #dce2d3;border-radius:12px;text-decoration:none}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px;margin:24px 0}.card,details{background:white;padding:24px;border:1px solid #e0e4dc;border-radius:18px}.card h2{font-size:22px;margin:8px 0}.metric{font-size:32px;font-weight:700}small{color:#657060}.filters{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}input,select{font:inherit;padding:12px;border:1px solid #ccd2c8;border-radius:10px;background:white}input{min-width:220px;flex:1}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;background:white;font-size:14px}th,td{padding:14px;text-align:left;vertical-align:top;border-bottom:1px solid #e4e7de}th{background:#ecf0e5}td:first-child{min-width:260px}td:nth-child(4){min-width:160px}summary{cursor:pointer;font-weight:650}[hidden]{display:none}@media(max-width:600px){main{padding:20px 12px}header,.card,details{padding:20px}}</style>'''
cards=''.join(f'<section class="card"><small>Уже исследовано</small><h2>{esc(s["name"])}</h2><div class="metric">{s["recordCount"]}</div><p>{s["unit"]}</p><p>{esc(s["priceNote"])}</p><a href="{esc(s["report"])}">Открыть исследование</a></section>' for s in studies)
study_by_id={s['id']:s for s in studies}
rows=[]
for e in entries:
    s=study_by_id[e['studyId']]
    rows.append(f'<tr data-group="{esc(e["group"])}" data-brand="{esc(e["brand"] or "")}" data-search="{esc((e["name"]+" "+e["subgroup"]).lower())}"><td>{esc(e["name"])}</td><td>{esc(e["brand"] or "Не указан")}</td><td>{esc(e["group"])}<br><small>{esc(e["subgroup"])}</small></td><td>{"<br>".join(esc(p) for p in e["packaging"]) or "См исходную карточку"}</td><td>{esc(s["scope"])}</td><td><a href="{esc(s["report"])}">Документ и цены</a><br><small>Выбор для запуска ещё не сделан</small></td></tr>')
main=f'''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CatManDog - реестр исследований</title>{style}<main><header><div>CatManDog · Рабочая база проекта</div><h1>Что у нас уже есть</h1><p>Сохранённые исследования ассортимента, собранные в одном месте</p><p>Текущий фокус - упорядочить найденное и подготовить его к дальнейшему выбору</p></header><nav><a href="backlog.html">Чего не хватает - отложенный список</a><a href="heybopet/analogue-report.html">Цены аналогов Heybo Pet</a><a href="../PACKAGING-SOURCING.md">Исследование упаковки</a><a href="assortment-register.json">Реестр JSON</a></nav><div class="grid">{cards}</div><details><summary>Как устроен реестр</summary><ul>{''.join('<li>'+esc(n)+'</li>' for n in notes)}</ul><p>Влажный Orijen и другие неподтверждённые позиции находятся в приложениях исходных исследований</p></details><h2>Уже исследованные наименования</h2><div class="filters"><input id="q" aria-label="Поиск товара" placeholder="Название или назначение"><select id="group" aria-label="Товарная группа"><option value="">Все группы</option>{''.join('<option>'+esc(g)+'</option>' for g in manifest['groups'])}</select><select id="brand" aria-label="Бренд"><option value="">Все бренды</option>{''.join('<option>'+esc(b)+'</option>' for b in sorted({e['brand'] for e in entries if e['brand']}))}</select></div><p id="count"></p><div class="table-wrap"><table><thead><tr><th>Наименование</th><th>Бренд</th><th>Группа</th><th>Фасовки / вариант</th><th>Тип записи</th><th>Исследование</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div></main><script>const q=document.querySelector('#q'),group=document.querySelector('#group'),brand=document.querySelector('#brand'),rows=[...document.querySelectorAll('tbody tr')];const norm=s=>s.normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();function update(){{const t=norm(q.value.trim());let n=0;for(const r of rows){{r.hidden=Boolean((group.value&&r.dataset.group!==group.value)||(brand.value&&r.dataset.brand!==brand.value)||(t&&!norm(r.dataset.search).includes(t)));if(!r.hidden)n++}}document.querySelector('#count').textContent='Показано записей: '+n+' - единицы учёта указаны в таблице'}}[q,group,brand].forEach(el=>el.addEventListener('input',update));update();</script></html>'''
(ROOT/'index.html').write_text(main)
items=''.join('<section class="card"><small>Отложено</small><h2>'+esc(b['group'])+'</h2><p>'+esc(b['existing'])+'</p><ul>'+''.join('<li>'+esc(m)+'</li>' for m in b['missing'])+'</ul></section>' for b in backlog)
deferred=f'''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CatManDog - отложенные направления</title>{style}<main><header><div>CatManDog · Отложенный список</div><h1>Чего ещё не хватает</h1><p>Сохранили отдельно, чтобы вернуться позже</p><p>Новое исследование этих направлений сейчас не запускается, сроки и приоритеты не назначены</p></header><nav><a href="index.html">Вернуться к тому, что уже исследовано</a><a href="backlog.json">Отложенный список JSON</a></nav><div class="grid">{items}</div></main></html>'''
(ROOT/'backlog.html').write_text(deferred)
assert len({e['id'] for e in entries})==len(entries)
for s in studies:assert (ROOT/s['report']).is_file()
assert all(b['status']=='deferred_by_user' and b['scheduledFor'] is None for b in backlog)
print(json.dumps(dict(studies=[(s['name'],s['recordCount']) for s in studies],deferredGroups=len(backlog),registryRecords=len(entries)),ensure_ascii=False))
