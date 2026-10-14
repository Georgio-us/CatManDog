import json
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parent.parent
manifest=json.load(open(ROOT/'research/compact-treats-care-studio-manifest.json'));selection=json.load(open(ROOT/'research/compact-treats-care-heybopet-selection.json'))
assets={p['id']:p for p in manifest['assets']};assert len(assets)==34
sections=[]
for g in selection['groups']:
 if g['key']=='heybopet':continue
 cards=[]
 for p in g['products']:
  a=assets[p['id']];pack=a['referencePack'];label=pack.get('packLabel') or str(pack['quantity'])+' x '+str(pack['amount']).removesuffix('.0')+' '+pack['unit']
  if p['id']=='tc-bfbb53d6d1':label='Фасовка требует сверки с поставщиком'
  cards.append('<article><a href="../'+escape(a['generatedPath'])+'"><img src="../'+escape(a['displayPath'])+'" alt="'+escape(p['displayName'])+'" width="1024" height="1024"></a><h3>'+escape(p['displayName'])+'</h3><p>'+escape(label)+'</p><details><summary>Исходная фотография</summary><img src="../'+escape(a['referencePath'])+'" alt="Исходная упаковка" loading="lazy"><a href="'+escape(a['referenceSource'])+'" target="_blank" rel="noopener">Источник</a></details></article>')
 sections.append('<section id="'+g['key']+'"><h2>'+escape(g['name'])+' <span>'+str(len(cards))+'</span></h2><div class="grid">'+''.join(cards)+'</div></section>')
html='''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CatManDog - 34 изображения лакомств и ухода</title><style>body{margin:0;background:#fafaf7;color:#262924;font:16px/1.5 system-ui}main{max-width:1240px;padding:36px 24px;margin:auto}header{max-width:820px;margin-bottom:48px}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}header p,article p{color:#74796e}h2{font-size:26px;margin:36px 0 20px}h2 span{font-size:16px;background:#dcf576;border-radius:20px;padding:4px 12px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:30px 24px}article{min-width:0}img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:contain;border-radius:16px}h3{font-size:17px;line-height:1.5;min-height:3em;margin:14px 0 4px}article p{font-size:14px;margin:0 0 12px}summary{cursor:pointer;font-size:14px;color:#626a58}details img{margin-top:12px;background:#fff}a{color:inherit}@media(max-width:850px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:600px){main{padding:24px 16px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:28px 18px}h3{font-size:15px}}</style></head><body><main><header><p>CatManDog / Студийные изображения</p><h1>34 лакомства и товара ухода</h1><p>Готовые изображения для выбранного ассортимента<br>Нажмите на изображение, чтобы открыть оригинал в полном разрешении</p></header>'''+''.join(sections)+'</main></body></html>'
(ROOT/'research/compact-treats-care-gallery.html').write_text(html)
print('Gallery saved for all 34 products')
