"""Verify Yagu accessory SKUs against live MisMascotas Shopify variants."""
import concurrent.futures
import json
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
SUPPLIER_SKUS = {
    'yagu-7500815-catalog-pack': '7500815',
    'yagu-9235142-catalog-pack': '9235142',
    'yagu-9235121-catalog-pack': '9235121',
    'yagu-9235036-catalog-pack': '9235036',
    'yagu-9235123-catalog-pack': '9235123',
    'yagu-9235038-catalog-pack': '9235038',
    'yagu-9235044-catalog-pack': '9235044',
    'yagu-7845778-catalog-pack': '7845778',
    'yagu-7815320-catalog-pack': '7815320',
    'yagu-7502810-catalog-pack': '7502810',
    'yagu-7515812-catalog-pack': '7515812',
    'yagu-7515817-catalog-pack': '7515817',
    'yagu-7515988-catalog-pack': '7515988',
    'yagu-7517019-catalog-pack': '7517019',
    'yagu-7552371-catalog-pack': '7552371',
    'yagu-7517046-catalog-pack': '7517046',
    'yagu-7514634-catalog-pack': '7514634',
    'yagu-7514629-catalog-pack': '7514629',
    'yagu-7514626-catalog-pack': '7514626',
}
BASE = 'https://www.mismascotas.es'


def check(item):
    variant_id, supplier_sku = item
    search = requests.get(BASE + '/search/suggest.json', params={
        'q': supplier_sku, 'resources[type]': 'product', 'resources[limit]': '10'}, timeout=25)
    search.raise_for_status()
    candidates = search.json()['resources']['results']['products']
    matches = []
    for candidate in candidates:
        url = BASE + candidate['url'].split('?')[0]
        response = requests.get(url + '.js', timeout=25)
        response.raise_for_status()
        product = response.json()
        for variant in product['variants']:
            if variant['sku'] == 'YA-' + supplier_sku:
                matches.append((url, product, variant))
    if not matches:
        return {'variantId': variant_id, 'supplierSku': supplier_sku, 'status': 'not_found',
                'candidates': [candidate['title'] for candidate in candidates]}
    if len(matches) != 1:
        raise ValueError(f'Duplicate retailer SKU: {supplier_sku}')
    url, product, variant = matches[0]
    page = requests.get(url, timeout=25).text
    return {'variantId': variant_id, 'supplierSku': supplier_sku, 'status': 'checked',
            'productName': product['title'], 'variantName': variant['title'],
            'retailerSku': variant['sku'], 'amount': variant['price'] / 100,
            'available': variant['available'], 'url': url + '?variant=' + str(variant['id']),
            'taxLabel': 'IVA incluido' in page}


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    rows = list(pool.map(check, SUPPLIER_SKUS.items()))
(ROOT / 'mismascotas-accessories-check-2026-10-17.json').write_text(
    json.dumps({'checkedAt': '2026-10-17', 'results': rows}, ensure_ascii=False, indent=2) + '\n')
for row in rows:
    print(row['supplierSku'], row['status'], row.get('productName'), row.get('variantName'),
          row.get('amount'), row.get('available'), row.get('taxLabel'))
