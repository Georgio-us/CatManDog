"""Recheck saved exact-pack Kiwoko and Tiendanimal URLs for pending SKUs."""
import html
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

import requests

ROOT = Path(__file__).resolve().parent.parent
TODAY = date.today().isoformat()
CATALOG = json.loads(subprocess.run(
    ['node', '--experimental-default-type=module', '-e',
     "import('./data.js').then(({catalogProducts})=>console.log(JSON.stringify(catalogProducts.filter(p=>p.isReal).flatMap(p=>(p.variants?.length?p.variants:[p]).map(v=>({id:v.id,productId:p.id,recipeId:p.researchRecipeId,weightKg:v.packageWeightKg,label:v.label,priceStatus:v.priceStatus}))))))"],
    cwd=ROOT, check=True, capture_output=True, text=True,
).stdout)

def load(name):
    return json.loads((ROOT / 'research' / name / 'retail-prices.json').read_text())['skus']

FOOD = load('dry-cat-food') + load('wet-cat-food')
TREATS = load('cat-treats-care')

def targets_for(variant):
    label = variant.get('label') or ''
    match = re.match(r'^\s*(\d+)\s*[x×]\s*', label)
    quantity = int(match.group(1)) if match else 1
    total_g = round((variant.get('weightKg') or 0) * 1000)
    skus = [sku for sku in FOOD if sku['recipeId'] == variant.get('recipeId') and sku['grams'] * quantity == total_g]
    if variant['productId'].startswith('tc-'):
        skus += [sku for sku in TREATS if sku['productId'] == variant['productId'] and
                 sku.get('totalAmount') == total_g]
    for sku in skus:
        for offer in sku.get('offers', []):
            if offer.get('retailer') not in ('Kiwoko', 'Tiendanimal') or not offer.get('retailerSku'):
                continue
            if offer.get('quantity', offer.get('pack', {}).get('quantity', 1)) != quantity:
                continue
            if offer.get('priceEUR') is None:
                continue
            yield {'variantId': variant['id'], 'retailer': offer['retailer'], 'retailerSku': offer['retailerSku'],
                   'url': offer['sourceUrl'], 'previousPriceEUR': offer['priceEUR']}

targets = {}
for variant in CATALOG:
    if variant.get('priceStatus') != 'pending':
        continue
    for target in targets_for(variant):
        targets[(target['variantId'], target['retailer'], target['retailerSku'])] = target

def products(value):
    if isinstance(value, list):
        for child in value:
            yield from products(child)
    elif isinstance(value, dict):
        if value.get('@type') == 'Product' and value.get('sku'):
            yield value
        for key in ('@graph', 'hasVariant', 'itemListElement'):
            if key in value:
                yield from products(value[key])

def check(target):
    result = dict(target)
    try:
        response = requests.get(target['url'], timeout=25, headers={'User-Agent': 'Mozilla/5.0 (compatible; CatManDogRetailResearch/1.0)'})
        result['httpStatus'] = response.status_code
        result['finalUrl'] = response.url
        if response.status_code != 200:
            return result
        scripts = re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', response.text, re.I | re.S)
        matches = []
        for script in scripts:
            try:
                data = json.loads(html.unescape(script))
            except json.JSONDecodeError:
                continue
            matches += [product for product in products(data) if str(product.get('sku')) == target['retailerSku']]
        if not matches:
            result['reason'] = 'exact retailer SKU absent from public structured data'
            return result
        item = matches[0]
        offer = item.get('offers') or {}
        if isinstance(offer, list):
            offer = offer[0] if len(offer) == 1 else {}
        price = offer.get('price')
        availability = str(offer.get('availability') or '').rsplit('/', 1)[-1]
        result.update({'productName': item.get('name'), 'productUrl': item.get('url'),
                       'gtin': item.get('gtin13') or item.get('gtin'), 'priceEUR': float(price) if price else None,
                       'availability': availability, 'checkedAt': TODAY})
    except (requests.RequestException, ValueError) as error:
        result['reason'] = type(error).__name__
    return result

results = []
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(check, target) for target in targets.values()]
    for future in as_completed(futures):
        results.append(future.result())
results.sort(key=lambda row: (row['variantId'], row['retailer'], row['retailerSku']))
out = ROOT / 'research' / f'pending-known-retail-check-{TODAY}.json'
out.write_text(json.dumps({'checkedAt': TODAY, 'scope': 'Saved exact-pack Kiwoko and Tiendanimal offers for currently pending catalog variants',
                           'results': results}, ensure_ascii=False, indent=2) + '\n')
confirmed = [row for row in results if row.get('availability') == 'InStock' and row.get('priceEUR')]
print(f'Checked {len(results)} saved retailer SKUs, confirmed {len(confirmed)} current in-stock offers for {len({row["variantId"] for row in confirmed})} variants')
print('HTTP status counts:', {code: sum(row.get('httpStatus') == code for row in results) for code in sorted({row.get('httpStatus') for row in results}, key=str)})
