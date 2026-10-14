import json,concurrent.futures,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
selection=json.load(open(ROOT/'research/compact-treats-care-heybopet-selection.json'))
products=[dict(p,selectionGroup=g['key']) for g in selection['groups'] if g['key']!='heybopet' for p in g['products']]
offers=json.load(open(ROOT/'research/cat-treats-care/retail-prices.json'))['offers']
def fetch(p):
 candidates=[o for o in offers if o['productId']==p['id'] and o.get('imageUrl')]
 candidates.sort(key=lambda o:(o.get('quantity',1),o.get('totalAmount',9999),o['retailer'] not in ['Kiwoko','Tiendanimal']))
 errors=[]
 for o in candidates:
  try:
   image_url=o['imageUrl'][0] if isinstance(o['imageUrl'],list) else o['imageUrl']
   data=subprocess.check_output(['curl','-g','-fLsS','--max-time','40',image_url]);dest='assets/treats-care/references/'+p['id']+'.jpg';(ROOT/dest).write_bytes(data)
   return {**p,'referencePath':dest,'referenceUrl':image_url,'referenceSource':o['sourceUrl'],'referencePack':o.get('pack',{'quantity':o['quantity'],'amount':o['amount'],'unit':o['unit'],'packLabel':o.get('packLabel')}),'referenceRetailer':o['retailer'],'referenceGtin':o.get('gtin')}
  except Exception as e:errors.append(str(e))
 raise ValueError(p['id']+str(errors))
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:rows=list(pool.map(fetch,products))
(ROOT/'research/compact-treats-care-references.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print('Collected',len(rows),'exact references')
