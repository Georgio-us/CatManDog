"""Read public Miscota Leonardo pages and record single-pack format prices."""
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
base = 'https://www.miscota.es/gatos/c_comida_leonardo_disponibilidad-validada'
page = requests.get('https://r.jina.ai/http://' + base.split('://', 1)[1], timeout=45).text
urls = set(re.findall(r'https://www\.miscota\.es/gatos/leonardo/[a-z0-9-]+', page))
for sku in json.loads((ROOT / 'research/wet-cat-food/retail-prices.json').read_text())['skus']:
    if sku['recipeId'].startswith('leonardo'):
        urls.update(o['sourceUrl'] for o in sku.get('offers', []) if o.get('retailer') == 'Miscota')
urls.update([
    'https://www.miscota.es/gatos/leonardo/latas-cordero-filete',
    'https://www.miscota.es/gatos/leonardo/comida-humeda-extra-salmon-filete-gatos',
    'https://www.miscota.es/gatos/leonardo/comida-humeda-superior-caballo9-calabacin-gatos',
    'https://www.miscota.es/gatos/leonardo/comida-humeda-venado-extra-filete-gatos',
    'https://www.miscota.es/gatos/leonardo/comida-humeda-venado-arandanos',
    'https://www.miscota.es/gatos/leonardo/pr-515898',
    'https://www.miscota.es/gatos/leonardo/pr-515894',
    'https://www.miscota.es/gatos/leonardo/comida-humeda-pollo-huevo',
    'https://www.miscota.es/gatos/leonardo/comida-humeda-pato-y-queso',
    'https://www.miscota.es/gatos/leonardo/comida-humeda-superior-ternera-tenado-boniato-gatos',
    'https://www.miscota.es/gatos/leonardo/comida-humeda-superior-pollo-espinacas-gatos',
    'https://www.miscota.es/gatos/leonardo/pouch-trucha-y-catnip',
])

def check(url):
    result = {'url': url}
    try:
        response = requests.get('https://r.jina.ai/http://' + url.split('://', 1)[1], timeout=50)
        result['httpStatus'] = response.status_code
        lines = response.text.splitlines()
        title = next((line.lstrip('# ') for line in lines if line.startswith('# Leonardo ')), None)
        result['title'] = title
        headings = [i for i, line in enumerate(lines) if line.startswith('# Leonardo ')]
        if headings:
            index = headings[0]
            window = lines[index + 1:index + 35]
            result['formatLines'] = [line.strip() for line in window
                                     if re.match(r'^\*\s+\d+\s*(?:x\s*)?\d*\s*(?:gr|g|kg)\s+\d+,\d+€', line, re.I)]
        result['reference'] = next((line.strip() for line in lines if line.strip().startswith('*   Referencia ')), None)
        result['addToCart'] = 'Añadir al carrito' in '\n'.join(lines[180:330])
    except requests.RequestException as exc:
        result['error'] = type(exc).__name__
    return result

with ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(check, url) for url in sorted(urls)]
    rows = [future.result() for future in as_completed(futures)]
rows.sort(key=lambda row: row['url'])
output = ROOT / f'research/miscota-leonardo-check-{date.today().isoformat()}.json'
output.write_text(json.dumps({'checkedAt': date.today().isoformat(), 'results': rows}, ensure_ascii=False, indent=2) + '\n')
for row in rows:
    if row.get('formatLines'):
        print(row['title'], row['url'])
        print(' ', ' | '.join(row['formatLines']))
print(f'Checked {len(rows)} Miscota Leonardo pages, {sum(bool(row.get("formatLines")) for row in rows)} with pack prices')
