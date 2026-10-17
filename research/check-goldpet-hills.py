"""Check exact Hill's catalog formats using Goldpet's public variant selector."""
import concurrent.futures
import html
import json
import re
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
TARGETS = {
    'hills-ster-salmon-300g': ('300 g', 'https://goldpet.es/pienso/33857-50355-hill-s-sterilised-young-adult-pienso-para-gato-joven-esterilizado-salmon.html'),
    'hills-ster-duck-3000g': ('3 kg', 'https://goldpet.es/pienso/25777-21867-hill-s-joven-adulto-esterilizado-pienso-para-gatos-jovenes-esterilizados-pato.html'),
    'hills-adult-lamb-1500g': ('1,5 kg', 'https://goldpet.es/pienso/2796-13571-hill-s-adult-pienso-para-gatos-cordero.html'),
    'hills-hypoallergenic-1500g': ('1,5 kg', 'https://goldpet.es/pienso/33604-43858-hill-s-hypoallergenic-adult-pienso-para-gatos-con-alergias-huevo-e-insecto.html'),
    'hills-hypoallergenic-7000g': ('7 kg', 'https://goldpet.es/pienso/33604-43858-hill-s-hypoallergenic-adult-pienso-para-gatos-con-alergias-huevo-e-insecto.html'),
    'hills-wet-3e2a1a71-85g': ('85 g', 'https://goldpet.es/linea-veterinaria/34543-50671-hill-s-pd-gastrointestinal-biome-id-alimento-digestivo-para-gatos-en-salsa-pollo.html'),
    'hills-wet-ff59af26-85g': ('85 g', 'https://goldpet.es/linea-veterinaria/35053-52693-hill-s-pd-digestive-care-i-d-kitten-alimento-en-salsa-para-gatitos-con-problemas-digestivos-pollo.html'),
    'hills-wet-59c92e72-85g': ('85 g', 'https://goldpet.es/linea-veterinaria/35687-56634-hill-s-pd-metabolic-mobility-alimento-en-salsa-para-gato-para-control-de-peso-pollo.html'),
}


def check(item):
    variant_id, (format_label, url) = item
    source = requests.get(url, timeout=30).text
    match = re.search(r'<input class="input-radio" type="radio" data-product-attribute="(\d+)" '
                      rf'name="group\[\d+\]" value="(\d+)" title="{re.escape(format_label)}"', source)
    if not match:
        raise ValueError(f'Missing exact pack selector: {variant_id}')
    group_id, option_id = match.groups()
    product = None
    for script in re.finditer(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', source, re.S):
        data = json.loads(html.unescape(script.group(1)))
        for entry in data if isinstance(data, list) else [data]:
            if entry.get('@type') == 'Product' and entry.get('hasVariant'):
                product = entry
                break
    if not product:
        raise ValueError(f'Missing product: {variant_id}')
    variants = [variant for variant in product['hasVariant'] if variant.get('atttribute_name') == format_label]
    if len(variants) != 1:
        raise ValueError(f'Ambiguous pack: {variant_id}')
    variant = variants[0]
    product_id = re.search(r'<input type="hidden" name="id_product" value="(\d+)"', source).group(1)
    response = requests.post(url, data={'ajax': '1', 'action': 'refresh', 'id_product': product_id,
                                        f'group[{group_id}]': option_id, 'qty': '1'}, timeout=30)
    response.raise_for_status()
    selected = response.json()
    price = re.search(r'<div class="current-price">\s*<span itemprop="price" content="([\d.]+)"',
                      selected['product_prices'])
    if not price:
        raise ValueError(f'Missing selected visible price: {variant_id}')
    if not selected['product_url'].split('#/', 1)[-1].startswith(f'{option_id}-'):
        raise ValueError(f'Wrong selected format: {variant_id}')
    return {'variantId': variant_id, 'format': format_label, 'productName': product['name'],
            'quantity': variant.get('quantity'), 'availability': variant['offers'].get('availability'),
            'visiblePriceEUR': float(price.group(1)), 'url': selected['product_url'],
            'taxLabel': 'Impuestos incluidos' in selected['product_prices'],
            'selectedAttributeId': selected['id_product_attribute']}


with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    rows = list(pool.map(check, TARGETS.items()))
(ROOT / 'goldpet-hills-check-2026-10-17.json').write_text(
    json.dumps({'checkedAt': '2026-10-17', 'results': rows}, ensure_ascii=False, indent=2) + '\n')
for row in rows:
    print(row['variantId'], row['format'], row['quantity'], row['visiblePriceEUR'], row['url'])
