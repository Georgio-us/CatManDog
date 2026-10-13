"""Read public retail HTML without browser automation or account access"""
import concurrent.futures
import datetime
import html
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent

def meta(document, key, attr='itemprop'):
    for tag in re.findall(r'<meta\b[^>]*>', document, re.I):
        attrs = dict(re.findall(r'([\w:-]+)=[\"\']([^\"\']*)[\"\']', tag))
        if attrs.get(attr) == key:
            return html.unescape(attrs.get('content', ''))
    return None

def weight_from_url(url):
    path = unquote(urlparse(url).path)
    match = re.search(r'/(?:([0-9]+)-x-)?([0-9]+(?:[.-][0-9]+)?)-(kg|g)(?:-|/)', path)
    if not match:
        return None, None
    count = int(match[1] or 1)
    grams = round(float(match[2].replace('-', '.')) * (1000 if match[3] == 'kg' else 1))
    return grams, count

def fetch(job):
    result = subprocess.run(['curl', '-L', '--max-time', '25', '-sS', '-w', '\n%{http_code}', job['url']], capture_output=True, text=True)
    document, _, status = result.stdout.rpartition('\n')
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')
    record = {'recipeId': job['recipeId'], 'sourceUrl': job['url'], 'checkedAt': now, 'httpStatus': status, 'offers': []}
    if status != '200':
        record['error'] = result.stderr[:150] or 'Public page unavailable'
        return record
    if 'leonardo-catfood.com' in job['url']:
        weight = meta(document, 'weight')
        price = meta(document, 'product:price', 'property')
        title = meta(document, 'og:title', 'property')
        heading = re.search(r'<h1\b[^>]*>(.*?)</h1>', document, re.S | re.I)
        if heading:
            title = ' '.join(html.unescape(re.sub(r'<[^>]+>', ' ', heading[1])).split())
        gtin = meta(document, 'gtin13')
        m = re.search(r'([0-9]+(?:[.,][0-9]+)?)\s*(kg|g)', weight or '', re.I)
        grams = round(float(m[1].replace(',', '.')) * (1000 if m[2].lower() == 'kg' else 1)) if m else None
        if price and grams == job.get('expectedGrams') and gtin:
            p = re.search(r'[0-9]+[.,][0-9]{2}', price)
            if p:
                record['offers'].append({'title': title, 'grams': grams, 'quantity': 1, 'priceEUR': float(p[0].replace(',', '.')), 'currency': 'EUR', 'sourceUrl': job['url'], 'gtin': gtin, 'availability': 'not_verified', 'evidenceType': 'live_public_product_metadata', 'conditions': 'Обычная цена в официальном испанском магазине бренда, наличие и доставка отдельно не подтверждены'})
        else:
            record['error'] = 'Exact pack metadata not confirmed'
        return record
    for raw in re.findall(r'<script[^>]*type=[\"\']application/ld\+json[\"\'][^>]*>(.*?)</script>', document, re.S | re.I):
        try:
            data = json.loads(raw)
        except ValueError:
            continue
        nodes = data if isinstance(data, list) else [data]
        for node in nodes:
            if not isinstance(node, dict):
                continue
            if node.get('@type') == 'Product' and job.get('expectedGrams'):
                explicit = node.get('offers', {})
                if isinstance(explicit, list):
                    explicit = explicit[0] if explicit else {}
                if explicit.get('@type') == 'Offer' and explicit.get('priceCurrency') == 'EUR' and explicit.get('price'):
                    record['offers'].append({'title': node.get('name'), 'grams': job['expectedGrams'], 'quantity': 1, 'priceEUR': float(explicit['price']), 'currency': 'EUR', 'sourceUrl': job['url'], 'gtin': node.get('gtin13') or node.get('gtin'), 'availability': explicit.get('availability', '').rsplit('/', 1)[-1] or 'not_verified', 'evidenceType': 'live_public_structured_offer', 'conditions': 'Одна упаковка, вес подтверждён в названии публичной карточки, доставка отдельно не проверена'})
            for product in node.get('hasVariant', []):
                offer = product.get('offers', {})
                if isinstance(offer, list):
                    offer = offer[0] if offer else {}
                grams, count = weight_from_url(product.get('url', ''))
                if not grams or offer.get('priceCurrency') != 'EUR':
                    continue
                try:
                    price = float(offer['price'])
                except (KeyError, ValueError, TypeError):
                    continue
                record['offers'].append({'title': product.get('name'), 'grams': grams, 'quantity': count, 'priceEUR': price, 'currency': 'EUR', 'sourceUrl': product.get('url') or job['url'], 'gtin': product.get('gtin13') or product.get('gtin'), 'retailerSku': product.get('sku'), 'availability': offer.get('availability', '').rsplit('/', 1)[-1] or 'not_verified', 'evidenceType': 'live_public_structured_offer', 'conditions': 'Цена из публичной карточки, дополнительные купоны и подписка не применены, доставка в Валенсию отдельно не проверена'})
    if not record['offers']:
        record['error'] = 'No explicit price and pack pair in public structured data'
    return record

if __name__ == '__main__':
    jobs = json.loads((ROOT / 'retail-jobs.json').read_text())
    append_from = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    jobs = jobs[append_from:]
    results = json.loads((ROOT / 'retail-live.json').read_text()) if append_from else []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for i, record in enumerate(pool.map(fetch, jobs), 1):
            results.append(record)
            if i % 12 == 0:
                print(json.dumps({'processed': i, 'total': len(jobs), 'offers': sum(len(r['offers']) for r in results)}), flush=True)
                (ROOT / 'retail-live.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    (ROOT / 'retail-live.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(json.dumps({'processed': len(results), 'offers': sum(len(r['offers']) for r in results), 'failedPages': sum(not r['offers'] for r in results)}), flush=True)
