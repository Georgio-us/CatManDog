import json
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[2]
m=json.load(open(ROOT/'research/heybopet/studio-manifest.json'))
assert len(m['assets'])==21
cards=[]
for r in m['assets']:
 name=r.get('displayType',r['type'])
 notes=r.get('reviewNote','')
 cards.append(f'''<article><a href="../../{escape(r['generatedPath'])}"><img src="../../{escape(r['displayPath'])}" alt="Heybo Pet {escape(r['model'])}" width="1024" height="1024"></a><h3>{escape(name)}</h3><p>{escape(r['model'])}</p>{'<p class="note">'+escape(notes)+'</p>' if notes else ''}<details><summary>Сравнить с референсом</summary><img src="../../{escape(r['referencePath'])}" alt="Официальный референс" loading="lazy"><a href="{escape(r['referenceSource'])}" target="_blank" rel="noopener">Каталог производителя</a></details></article>''')
style='''body{margin:0;background:#fafaf7;color:#262924;font:16px/1.5 system-ui}main{max-width:1240px;padding:36px 24px;margin:auto}header{max-width:820px;margin-bottom:48px}h1{font-size:clamp(30px,5vw,48px);line-height:1.15}p{color:#74796e}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:36px 24px}article{min-width:0}img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:contain;border-radius:16px}h3{font-size:17px;line-height:1.5;min-height:3em;margin:14px 0 4px}article p{font-size:14px;margin:0 0 12px;overflow-wrap:anywhere}.note{padding:10px;background:#eff0e8;border-radius:8px}summary{cursor:pointer;font-size:14px;color:#626a58}details img{margin-top:12px;background:#fff}a{color:inherit}@media(max-width:850px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:600px){main{padding:24px 16px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:28px 18px}h3{font-size:15px}}'''
html=f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CatManDog - Heybo Pet 21 изображение</title><style>{style}</style></head><body><main><header><p>CatManDog / Студийные изображения</p><h1>Heybo Pet - 21 товар</h1><p>Вся выбранная линейка на едином сером фоне<br>Нажмите на изображение для просмотра PNG в полном разрешении</p><p>Изображения созданы с помощью ImageGen по официальным референсам<br>Для моделей с замечаниями потребуется сверка с поставщиком</p></header><div class="grid">{''.join(cards)}</div></main></body></html>'''
(ROOT/'research/heybopet/studio-gallery.html').write_text(html)
print('21-product gallery saved')
