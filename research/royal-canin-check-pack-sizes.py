"""Verify current pack sizes in public product structured data"""
import concurrent.futures
import html
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
recipes = [r for r in json.loads((ROOT / 'research/dry-cat-food/assortment.json').read_text())['recipes'] if r['brand'] == 'Royal Canin']

def nodes(value):
    if isinstance(value, dict):
        yield value
        for v in value.values():
            yield from nodes(v)
    elif isinstance(value, list):
        for v in value:
            yield from nodes(v)

def check(r):
    raw = subprocess.check_output(['curl', '-fLsS', '--max-time', '30', r['sourceUrl']]).decode()
    weights = set()
    for text in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', raw, re.S):
        try:
            data = json.loads(html.unescape(text))
        except ValueError:
            continue
        for node in nodes(data):
            if node.get('@type') != 'Product':
                continue
            size = str(node.get('size', ''))
            match = re.search(r'([\d]+(?:[.,]\d+)?)\s*(kg|g)\b', size)
            if not match:
                match = re.search(r'/([\d]+(?:[.-]\d+)?)-(kg|g)-', node.get('url', ''))
            if match:
                g = round(float(match[1].replace(',', '.').replace('-', '.')) * (1000 if match[2] == 'kg' else 1))
                weights.add(g)
    return {'recipeId': r['id'], 'name': r['name'], 'sourceUrl': r['sourceUrl'], 'weightsGrams': sorted(weights), 'checkedOn': '2026-10-13', 'originalResearchWeightsGrams': r['weightsGrams']}

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    records = list(pool.map(check, recipes))
(ROOT / 'research/royal-canin-current-pack-sizes.json').write_text(json.dumps(records, ensure_ascii=False, indent=2))
for r in records:
    print(r['name'], r['weightsGrams'], 'changed' if r['weightsGrams'] != r['originalResearchWeightsGrams'] else '')
