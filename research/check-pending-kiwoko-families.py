"""Inspect manually selected exact product families from Kiwoko search."""
import html
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
search = {row['id']: row for row in json.loads((ROOT / 'research/pending-kiwoko-search-2026-10-17.json').read_text())['results']}
selected = {
    'acana-grasslands': 0, 'acana-indoor': 0, 'acana-pacifica': 1, 'acana-wild-prairie': 0,
    'advance-sterilised': 0, 'advance-hairball': 0, 'advance-junior': 0,
    'hills-ster-salmon': 1, 'hills-kitten': 0,
    'orijen-regional-red': 2, 'orijen-six-fish': 1,
    'rc-british': 0, 'rc-kitten-regular': 1, 'rc-maine-coon': 0,
    'royalcanin-1fdaaee6': 0, 'royalcanin-c1fbc2a8': 0, 'royalcanin-db40d730': 1,
    'royalcanin-86568be1': 0, 'royalcanin-ce70b2a8': 2,
    'yagu-2170001': 0, 'yagu-2170014': 0,
    'hills-wet-ff59af26': 0, 'hills-wet-3e2a1a71': 6,
    'hills-light': 6, 'rc-fit': 0, 'royalcanin-8ffe447c': 3,
    'royalcanin-955edaaa': 2, 'royalcanin-5c2e58b7': 0,
    'tc-0c0460f2f4': 1, 'tc-f617e6e32b': 0,
}

def inspect(product_id, index):
    record = search[product_id]
    candidate = record['candidates'][index]
    result = {'productId': product_id, 'catalogName': record['name'], 'pending': record['pending'],
              'familyName': candidate['name'], 'familyUrl': candidate['url']}
    try:
        response = requests.get(candidate['url'], timeout=25, headers={'User-Agent': 'Mozilla/5.0'})
        result['httpStatus'] = response.status_code
        if response.status_code != 200:
            return result
        variants = []
        for script in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', response.text, re.I | re.S):
            try:
                data = json.loads(html.unescape(script))
            except json.JSONDecodeError:
                continue
            if data.get('@type') != 'ProductGroup':
                continue
            for item in data.get('hasVariant', []):
                offer = item.get('offers') or {}
                if isinstance(offer, list):
                    continue
                variants.append({'name': item.get('name'), 'sku': item.get('sku'),
                                 'gtin': item.get('gtin13') or item.get('gtin'), 'url': item.get('url'),
                                 'priceEUR': float(offer['price']) if offer.get('price') else None,
                                 'availability': str(offer.get('availability') or '').rsplit('/', 1)[-1]})
        result['variants'] = variants
    except requests.RequestException as error:
        result['error'] = type(error).__name__
    return result

results = []
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(inspect, product_id, index) for product_id, index in selected.items()]
    for future in as_completed(futures):
        results.append(future.result())
results.sort(key=lambda row: row['productId'])
(ROOT / 'research/pending-kiwoko-family-check-2026-10-17.json').write_text(json.dumps({
    'checkedAt': '2026-10-17', 'scope': 'Manually selected family pages; exact pack and recipe still require review',
    'results': results}, ensure_ascii=False, indent=2) + '\n')
print(f'Checked {len(results)} selected family pages, extracted {sum(len(row.get("variants", [])) for row in results)} retailer variants')
