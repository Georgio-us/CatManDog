"""Find candidate product families for still-pending real catalog items in Kiwoko search."""
import html
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
products = json.loads(subprocess.run(
    ['node', '--experimental-default-type=module', '-e',
     "import('./data.js').then(({catalogProducts})=>console.log(JSON.stringify(catalogProducts.filter(p=>p.isReal&&p.variants?.some(v=>v.priceStatus==='pending')).map(p=>({id:p.id,name:p.name,brand:p.brand,pending:p.variants.filter(v=>v.priceStatus==='pending').map(v=>({id:v.id,label:v.label,ean:v.ean}))})))))"],
    cwd=ROOT, check=True, capture_output=True, text=True,
).stdout)

def query_for(product):
    name = product['name'].replace('Hill’s', "Hill's").replace('Duvo+ - ', 'Duvoplus ').replace('Moderna ', '')
    name = name.split(' - ')[0] if product['brand'] in ('Churu', 'GimCat', 'Beaphar', 'Kit Cat', 'Pro Plan') else name
    return name

def check(product):
    query = query_for(product)
    result = {**product, 'query': query}
    try:
        response = requests.get('https://www.kiwoko.com/busqueda', params={'q': query}, timeout=22,
                                headers={'User-Agent': 'Mozilla/5.0'})
        result['httpStatus'] = response.status_code
        if response.status_code != 200:
            return result
        cards = re.findall(r'<div\s+class="[^"]*js-product-tile-category[^>]*>', response.text, re.S)
        candidates = []
        for card in cards[:8]:
            title = re.search(r'data-product-name="([^"]*)"', card)
            url = re.search(r'data-url="([^"]*)"', card)
            if title and url:
                candidates.append({'name': html.unescape(title.group(1)), 'url': html.unescape(url.group(1))})
        result['candidates'] = candidates
    except requests.RequestException as error:
        result['error'] = type(error).__name__
    return result

targets = [p for p in products if p['brand'] not in ('Leonardo', 'Heybo Pet')]
results = []
with ThreadPoolExecutor(max_workers=3) as executor:
    futures = [executor.submit(check, product) for product in targets]
    for future in as_completed(futures):
        results.append(future.result())
results.sort(key=lambda row: (row['brand'], row['name']))
path = ROOT / 'research/pending-kiwoko-search-2026-10-17.json'
path.write_text(json.dumps({'checkedAt': '2026-10-17', 'scope': 'Search candidates only, not price verification',
                            'results': results}, ensure_ascii=False, indent=2) + '\n')
print(f'Searched {len(targets)} product families, found candidates for {sum(bool(r.get("candidates")) for r in results)}')
