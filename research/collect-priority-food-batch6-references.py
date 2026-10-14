"""Download exact recipe packaging references from saved verified Spanish offers"""
import concurrent.futures, html, json, re, subprocess
from pathlib import Path
from urllib.parse import urljoin
ROOT=Path(__file__).resolve().parent.parent
selection=json.loads((ROOT/'research/priority-food-batch6-selection.json').read_text())['recipes']
retail=json.loads((ROOT/'research/dry-cat-food/retail-prices.json').read_text())
retail['offers'] += json.loads((ROOT/'research/wet-cat-food/retail-prices.json').read_text())['offers']
def get(url):return subprocess.check_output(['curl','-fLsS','--max-time','40',url])
def walk(o):
 if isinstance(o,dict):
  yield o
  for v in o.values():yield from walk(v)
 elif isinstance(o,list):
  for v in o:yield from walk(v)
def fetch(r):
 row=dict(r)
 if r['id']=='hills-12':
  url='https://pxmshare.colgatepalmolive.com/PNG_2000/e-TJN7EIwgNaGHF7ikjAk.png'
  dest='assets/food/references/priority-batch6/hills-12.png'
  (ROOT/dest).parent.mkdir(parents=True,exist_ok=True);(ROOT/dest).write_bytes(get(url))
  row.update(referencePath=dest,referenceUrl=url,referenceSource=r['sourceUrl'],referenceGrams=1500,referenceType='manufacturer_exact_recipe')
  return row
 if r.get('existingImage'):
  row.update(referencePath=r['existingImage']['src'],referenceUrl=(r.get('existingImageSource') or {}).get('url'),referenceSource=(r.get('existingImageSource') or {}).get('pageUrl'),referenceType='existing_exact_sku')
  return row
 offers=[o for o in retail['offers'] if o['recipeId']==r['id'] and not o.get('supersededByLiveOffer')]
 offers.sort(key=lambda o:(o.get('quantity',1)!=1, o.get('retailer') not in ['Tiendanimal','Kiwoko','LEONARDO - официальный магазин'], abs(o['grams']-(r['weightsGrams'][0] if r.get('foodType')=='wet' else 1800))))
 errors=[]
 for o in offers:
  try:
   raw=get(o['sourceUrl']).decode();products=[]
   for ld in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',raw,re.S):
    try:products.extend(p for p in walk(json.loads(ld)) if 'Product' in str(p.get('@type','')))
    except ValueError:pass
   imgs=[]
   front=[html.unescape(u) for u in re.findall(r'<img[^>]+src="([^"]+-front[^"/]*\.[^"]*)"',raw)]
   for p in products:
    im=p.get('image',[]);im=[im] if isinstance(im,str) else im
    if isinstance(im,dict):im=[im.get('url')]
    imgs.extend(i.get('url') if isinstance(i,dict) else i for i in im)
   if front:imgs=front
   if not imgs:
    for tag in re.findall(r'<meta\b[^>]+>',raw):
     a=dict(re.findall(r'([\w:-]+)="([^"]*)"',tag))
     if a.get('property')=='og:image':imgs.append(html.unescape(a['content']))
   if not imgs:raise ValueError('no product image')
   url=urljoin(o['sourceUrl'],html.unescape(imgs[0])); dest='assets/food/references/priority-batch6/'+r['id']+'.jpg'
   (ROOT/dest).parent.mkdir(parents=True,exist_ok=True);(ROOT/dest).write_bytes(get(url))
   row.update(referencePath=dest,referenceUrl=url,referenceSource=o['sourceUrl'],referenceGrams=o['grams'],referenceTitle=o.get('title'),referenceType='retailer_exact_recipe')
   return row
  except Exception as e:errors.append(str(e))
 raise ValueError(r['id']+' '+str(errors[:3]))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 rows=list(pool.map(fetch,selection))
(ROOT/'research/priority-food-batch6-references.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print('Collected',len(rows),'exact packaging references')
