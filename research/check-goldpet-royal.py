"""Check exact single-pouch Royal Canin veterinary variants at Goldpet."""
import concurrent.futures
import html
import json
import re
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
TARGETS = {
    'royalcanin-1a4d5753-85g': '19290-34585-royal-canin-vet-renal-alimento-en-salsa-para-gato-con-enfermedad-renal-buey',
    'royalcanin-5c2e58b7-85g': '19285-34594-royal-canin-vet-urinary-s-o-alimento-en-pate-para-gato-con-problemas-urinarios',
    'royalcanin-c1fbc2a8-85g': '31385-36160-royal-canin-vet-mature-consult-balance-alimento-en-pate-para-gato-senior-con-sobrepeso',
    'royalcanin-e29af258-85g': '19292-34584-royal-canin-vet-renal-alimento-en-salsa-para-gato-con-enfermedad-renal-pescado',
    'royalcanin-b96b1ee0-85g': '19291-43981-royal-canin-vet-renal-alimento-en-salsa-para-gato-con-enfermedad-renal-pollo',
    'royalcanin-ce70b2a8-85g': '25064-34591-royal-canin-vet-skin-coat-alimento-en-salsa-para-gato-con-dermatitis-y-caida-del-pelo-9003579011522',
    'royalcanin-b298cb91-85g': '25824-43985-royal-canin-vet-urinary-s-o-alimento-en-salsa-para-gato-con-problemas-urinarios',
    'royalcanin-8ffe447c-85g': '19289-34587-royal-canin-vet-diabetic-alimento-en-salsa-para-gato-adulto-con-diabetes',
    'royalcanin-db40d730-85g': '24370-34583-royal-canin-vet-gastrointestinal-moderate-calorie-alimento-en-salsa-para-gato-adulto-con-problemas-digestivos',
    'royalcanin-f055ffce-85g': '5705-43984-royal-canin-vet-gastrointestinal-alimento-en-salsa-para-gato-adulto-con-problemas-digestivos',
    'royalcanin-86568be1-85g': '25748-43982-royal-canin-vet-renal-alimento-en-pate-para-gato-con-enfermedad-renal',
    'royalcanin-8ae2a1d3-85g': '24758-34582-royal-canin-vet-satiety-alimento-en-salsa-para-gatos-con-sobrepeso',
    'royalcanin-955edaaa-85g': '24761-34590-royal-canin-vet-sensitivity-control-alimento-en-salsa-para-gato-adulto-con-sensibilidad-alimentaria-pollo',
    'royalcanin-97849099-85g': '19286-34592-royal-canin-vet-urinary-so-moderate-calorie-alimento-en-salsa-para-gato-con-problemas-urinarios',
}


def check(item):
    variant_id, slug = item
    url = f'https://goldpet.es/linea-veterinaria/{slug}.html#/212-cantidad-85_g'
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    source = response.text
    product = None
    for match in re.finditer(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', source, re.S):
        data = json.loads(html.unescape(match.group(1)))
        for entry in data if isinstance(data, list) else [data]:
            if entry.get('@type') == 'Product' and entry.get('hasVariant'):
                product = entry
                break
    if not product:
        raise ValueError(f'No structured product: {variant_id}')
    variants = [variant for variant in product['hasVariant'] if variant.get('atttribute_name') == '85 g']
    if len(variants) != 1:
        raise ValueError(f'No unique 85 g variant: {variant_id}')
    variant = variants[0]
    visible = re.search(r'<div class="current-price">\s*<span itemprop="price" content="([\d.]+)"', source)
    return {
        'variantId': variant_id, 'url': url, 'productName': product['name'],
        'variantName': variant['name'], 'quantity': variant.get('quantity'),
        'availability': variant['offers'].get('availability'),
        'structuredPrice': variant['offers'].get('price'),
        'visiblePriceEUR': float(visible.group(1)) if visible else None,
        'taxLabel': 'Impuestos incluidos' in source,
    }


with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    rows = list(pool.map(check, TARGETS.items()))
output = {'checkedAt': '2026-10-17', 'results': rows}
(ROOT / 'goldpet-royal-check-2026-10-17.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
for row in rows:
    print(row['variantId'], row['variantName'], row['quantity'], row['availability'],
          row['structuredPrice'], row['visiblePriceEUR'])
