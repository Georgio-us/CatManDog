"""Check exact Leonardo single packs at Barakaldo Vet Shop."""
import concurrent.futures
import html
import json
import re
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
CATALOG_URL = 'https://www.barakaldotiendaveterinaria.es/leonardo/'
TARGETS = {
    'leonardo-wet-rabbit-85g': ('Finest Selection Conejo y Cranberries', '85 gr'),
    'leonardo-wet-herring-200g': ('Arenque Extra Filete', '200 gr'),
    'leonardo-wet-herring-400g': ('Arenque Extra Filete', '400 gr'),
    'leonardo-wet-venison-400g': ('Venado Extra Filete', '400 gr'),
    'leonardo-wet-poultry-egg-85g': ('Finest Selection Pollo y Huevo', '85 gr'),
    'leonardo-wet-buffalo-85g': ('Finest Selection Búfalo y Arándanos Azules', '85 gr'),
    'leonardo-wet-lamb-cranberry-85g': ('Finest Selection Cordero y Cranberries', '85 gr'),
    'leonardo-wet-pheasant-85g': ('Finest Selection Faisán y Cranberries', '85 gr'),
    'leonardo-wet-duck-cheese-85g': ('Finest Selection Pato y Queso', '85 gr'),
    'leonardo-wet-fish-shrimp-85g': ('Finest Selection Pescado y Gambas', '85 gr'),
    'leonardo-wet-pure-beef-85g': ('Finest Selection Puro en Ternera', '85 gr'),
    'leonardo-wet-senior-chicken-85g': ('Finest Selection Senior Puro en Pollo', '85 gr'),
    'leonardo-wet-senior-beef-85g': ('Finest Selection Senior Puro en Ternera', '85 gr'),
    'leonardo-wet-beef-vegetables-85g': ('Finest Selection Ternera y Verdura', '85 gr'),
    'leonardo-wet-trout-catnip-85g': ('Finest Selection Trucha y Menta Gatuna', '85 gr'),
    'leonardo-wet-venison-blueberries-85g': ('Finest Selection Venado y Arándanos Azules', '85 gr'),
    'leonardo-wet-pulled-beef-70g': ('Pulled Beef Ternera', '70 gr'),
    'leonardo-wet-pulled-duck-70g': ('Pulled Beef Pato', '70 gr'),
    'leonardo-wet-pulled-lamb-70g': ('Pulled Beef Cordero', '70 gr'),
    'leonardo-wet-pulled-turkey-70g': ('Pulled Beef Pavo', '70 gr'),
    'leonardo-wet-superior-horse-200g': ('Superior Selection Caballo con Calabacín', '200 gr'),
    'leonardo-wet-superior-turkey-200g': ('Superior Selection Pavo con Trucha y Cranberries', '200 gr'),
    'leonardo-wet-superior-turkey-400g': ('Superior Selection Pavo con Trucha y Cranberries', '400 gr'),
    'leonardo-wet-quality-kitten-200g': ('Kitten Rico en Ave Lata', '200 gr'),
    'leonardo-wet-quality-kitten-400g': ('Kitten Rico en Ave Lata', '400 gr'),
    'leonardo-wet-quality-poultry-200g': ('Puro en Ave Lata', '200 gr'),
    'leonardo-wet-quality-poultry-400g': ('Puro en Ave Lata', '400 gr'),
    'leonardo-wet-quality-rabbit-200g': ('Rico en Conejo Lata', '200 gr'),
    'leonardo-wet-quality-rabbit-400g': ('Rico en Conejo Lata', '400 gr'),
    'leonardo-wet-quality-ocean-fish-200g': ('Rico en Pescado Marino Lata', '200 gr'),
    'leonardo-wet-quality-ocean-fish-400g': ('Rico en Pescado Marino Lata', '400 gr'),
    'leonardo-wet-quality-ocean-fish-800g': ('Rico en Pescado Marino Lata', '800 gr'),
    'leonardo-wet-quality-liver-200g': ('Rico en Hígado Lata', '200 gr'),
    'leonardo-wet-quality-liver-400g': ('Rico en Hígado Lata', '400 gr'),
    'leonardo-wet-quality-duck-200g': ('Rico en Pato Lata', '200 gr'),
    'leonardo-wet-quality-duck-800g': ('Rico en Pato Lata', '800 gr'),
}

category = requests.get(CATALOG_URL, timeout=30).text
items = []
for script in re.finditer(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', category, re.S):
    data = json.loads(html.unescape(script.group(1)))
    for entry in data if isinstance(data, list) else [data]:
        if entry.get('@type') == 'ItemList':
            items = entry['itemListElement']
if not items:
    raise ValueError('No Leonardo source catalog')


def check(item):
    variant_id, (phrase, format_label) = item
    matches = [row for row in items if phrase in row['name']]
    if len(matches) != 1:
        raise ValueError(f'Ambiguous Leonardo retailer product: {variant_id}, {len(matches)}')
    product_name, url = matches[0]['name'], matches[0]['url']
    source = requests.get(url, timeout=30).text
    option = re.search(r'<option value="(\d+)" title="' + re.escape(format_label) + r'"', source)
    if not option:
        return {'variantId': variant_id, 'productName': product_name, 'format': format_label,
                'url': url, 'status': 'format_missing'}
    option_id = option.group(1)
    group_id = re.search(r'<select[^>]+id="group_(\d+)"', source).group(1)
    stock_match = re.search(r'data-groups="' + group_id + '-' + option_id + r'"[^>]*data-id="(\d+)"[^>]*data-quantity="(-?\d+)"', source)
    if not stock_match:
        raise ValueError(f'No exact variant inventory: {variant_id}')
    product_id = re.search(r'<input type="hidden" name="id_product" value="(\d+)"', source).group(1)
    response = requests.post(url, data={'ajax': '1', 'action': 'refresh', 'id_product': product_id,
                                        f'group[{group_id}]': option_id, 'qty': '1'}, timeout=30)
    response.raise_for_status()
    selected = response.json()
    amount = re.search(r'<div class="current-price">\s*<span class="price"\s*>\s*([\d,]+)',
                       selected['product_prices'])
    if not amount or str(selected['id_product_attribute']) != stock_match.group(1):
        raise ValueError(f'Wrong selected price: {variant_id}')
    return {'variantId': variant_id, 'productName': product_name, 'format': format_label,
            'url': selected['product_url'], 'status': 'checked', 'quantity': int(stock_match.group(2)),
            'retailerSku': stock_match.group(1), 'visiblePriceEUR': float(amount.group(1).replace(',', '.')),
            'taxLabel': '(impuestos inc.)' in selected['product_prices']}


with concurrent.futures.ThreadPoolExecutor(max_workers=7) as pool:
    rows = list(pool.map(check, TARGETS.items()))
(ROOT / 'barakaldo-leonardo-check-2026-10-17.json').write_text(
    json.dumps({'checkedAt': '2026-10-17', 'results': rows}, ensure_ascii=False, indent=2) + '\n')
for row in rows:
    print(row['variantId'], row['format'], row['status'], row.get('quantity'), row.get('visiblePriceEUR'))
