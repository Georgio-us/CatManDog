"""Save exact wet packaging references already recorded in retail research"""
import concurrent.futures
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'assets/food/references/royal-canin-wet'
DEST.mkdir(parents=True, exist_ok=True)
data = json.loads((ROOT / 'research/wet-cat-food/retail-prices.json').read_text())
records = []
for recipe in data['recipes']:
    if recipe['brand'] != 'Royal Canin':
        continue
    skus = [s for s in data['skus'] if s['recipeId'] == recipe['id']]
    offers = sorted([o for s in skus for o in s['offers'] if o.get('imageUrl')], key=lambda o: o['quantity'])
    if not offers:
        print('Photo not yet recorded:', recipe['id'], recipe['name'])
        continue
    offer = offers[0]
    records.append({**recipe, 'grams': offer['grams'], 'referenceUrl': offer['imageUrl'], 'referenceSource': offer['familyUrl'], 'referencePath': 'assets/food/references/royal-canin-wet/' + recipe['id'] + '.jpg'})

def fetch(r):
    subprocess.check_call(['curl', '-fLsS', '--retry', '2', '--max-time', '30', r['referenceUrl'], '-o', str(ROOT / r['referencePath'])])
    return r

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    records = list(pool.map(fetch, records))
(ROOT / 'research/royal-canin-wet-image-references.json').write_text(json.dumps(records, ensure_ascii=False, indent=2))
print('Saved', len(records), 'exact wet packaging references')
