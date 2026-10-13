"""Collect packaging references for the researched dry Royal Canin range"""
import concurrent.futures
import html
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'assets/food/references/royal-canin'
DEST.mkdir(parents=True, exist_ok=True)
recipes = json.loads((ROOT / 'research/dry-cat-food/assortment.json').read_text())['recipes']
recipes = [r for r in recipes if r['brand'] == 'Royal Canin']

def fetch(r):
    result = dict(r)
    raw = subprocess.check_output(['curl', '-fLsS', '--max-time', '30', r['sourceUrl']]).decode()
    urls = []
    for tag in re.findall(r'<img\b[^>]+>', raw):
        attrs = dict(re.findall(r'([\w:-]+)="([^"]*)"', tag))
        if html.unescape(attrs.get('alt', '')).casefold() == r['name'].casefold() and attrs.get('src'):
            urls.append(html.unescape(attrs['src']))
    if not urls:
        if r['id'] == 'royalcanin-11':
            urls = [html.unescape(u) for u in re.findall(r'src="([^"]*Royal-Canin-Adult-Light-Weight-Care[^\"]*_1\.jpg[^\"]*)"', raw)]
    if not urls:
        for tag in re.findall(r'<meta\b[^>]+>', raw):
            attrs = dict(re.findall(r'([\w:-]+)="([^"]*)"', tag))
            if attrs.get('property') == 'og:image':
                urls.append(html.unescape(attrs['content']))
    if not urls:
        raise ValueError('No packaging reference for ' + r['name'])
    result['referenceUrl'] = urls[0]
    result['referencePath'] = 'assets/food/references/royal-canin/' + r['id'] + '.jpg'
    subprocess.check_call(['curl', '-fLsS', '--max-time', '30', urls[0], '-o', str(ROOT / result['referencePath'])])
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    records = list(pool.map(fetch, recipes))
(ROOT / 'research/royal-canin-image-references.json').write_text(json.dumps(records, ensure_ascii=False, indent=2))
print(json.dumps([{'name': r['name'], 'path': r['referencePath']} for r in records], ensure_ascii=False))
