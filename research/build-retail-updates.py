"""Build catalog retail overlays from verified exact-SKU observations."""
import json
import subprocess
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'research/pending-known-retail-check-2026-10-17.json'
CATALOG = json.loads(subprocess.run(
    ['node', '--experimental-default-type=module', '-e',
     "import('./data.js').then(({catalogProducts})=>console.log(JSON.stringify(catalogProducts.filter(p=>p.isReal).flatMap(p=>(p.variants?.length?p.variants:[p]).map(v=>({id:v.id,ean:v.ean,priceStatus:v.priceStatus}))))))"],
    cwd=ROOT, check=True, capture_output=True, text=True,
).stdout)
by_id = {sku['id']: sku for sku in CATALOG}
review_required = {
}
excluded_source_rows = {
    ('tc-61ec2b29f1-reference-pack', 'Kiwoko'),
    ('tc-61ec2b29f1-reference-pack', 'Tiendanimal'),
}  # These pages mix scallop GTIN/text with salmon URL and imagery.
offers = defaultdict(list)
for row in json.loads(SOURCE.read_text())['results']:
    sku = by_id.get(row['variantId'])
    if not sku or (row['variantId'], row['retailer']) in excluded_source_rows or row['variantId'] in review_required or row.get('availability') != 'InStock' or not row.get('priceEUR'):
        continue
    if sku.get('ean') and row.get('gtin') and sku['ean'].lstrip('0') != row['gtin'].lstrip('0'):
        raise ValueError(f'EAN mismatch: {row["variantId"]}')
    offers[row['variantId']].append({
        'retailer': row['retailer'], 'amount': row['priceEUR'], 'url': row['url'],
        'checkedAt': row['checkedAt'], 'taxIncluded': True, 'shippingIncluded': False,
        'retailerSku': row['retailerSku'], 'gtin': row.get('gtin'),
    })

curated = json.loads((ROOT / 'research/retail-curated-2026-10-17.json').read_text())['items']
for row in curated:
    sku = by_id.get(row['variantId'])
    if not sku or row['variantId'] in review_required:
        raise ValueError(f'Unexpected curated variant: {row["variantId"]}')
    if row['amount'] <= 0 or not row['url'].startswith('https://'):
        raise ValueError(f'Invalid curated offer: {row["variantId"]}')
    if sku.get('ean') and row.get('gtin') and sku['ean'].lstrip('0') != row['gtin'].lstrip('0'):
        raise ValueError(f'Curated EAN mismatch: {row["variantId"]}')
    offers[row['variantId']].append({
        'retailer': row['retailer'], 'amount': row['amount'], 'url': row['url'],
        'checkedAt': row['checkedAt'], 'taxIncluded': True, 'shippingIncluded': False,
        'retailerSku': row.get('retailerSku'), 'gtin': row.get('gtin'),
        'evidence': row['evidence'],
    })

goldpet = json.loads((ROOT / 'research/goldpet-royal-check-2026-10-17.json').read_text())
for row in goldpet['results']:
    if row['variantId'] not in by_id or not row['variantName'].endswith(' - 85 g'):
        raise ValueError(f'Wrong Goldpet product or format: {row["variantId"]}')
    if row['quantity'] <= 0 or row['availability'] != 'https://schema.org/InStock':
        continue
    if not row['taxLabel'] or not row['visiblePriceEUR'] or row['visiblePriceEUR'] <= 0:
        raise ValueError(f'Goldpet price/tax missing: {row["variantId"]}')
    offers[row['variantId']].append({
        'retailer': 'Goldpet', 'amount': row['visiblePriceEUR'], 'url': row['url'],
        'checkedAt': goldpet['checkedAt'], 'taxIncluded': True, 'shippingIncluded': False,
        'retailerSku': None, 'gtin': None,
        'evidence': f'Live visible consumer price including tax, exact 85 g single pouch, Product JSON-LD stock quantity {row["quantity"]}',
    })

goldpet_hills = json.loads((ROOT / 'research/goldpet-hills-check-2026-10-17.json').read_text())
for row in goldpet_hills['results']:
    if row['variantId'] not in by_id or row['quantity'] <= 0 or row['availability'] != 'https://schema.org/InStock':
        raise ValueError(f'Hill\'s pack unavailable: {row["variantId"]}')
    if not row['taxLabel'] or not row['visiblePriceEUR'] or row['visiblePriceEUR'] <= 0:
        raise ValueError(f'Hill\'s price/tax missing: {row["variantId"]}')
    offers[row['variantId']].append({
        'retailer': 'Goldpet', 'amount': row['visiblePriceEUR'], 'url': row['url'],
        'checkedAt': goldpet_hills['checkedAt'], 'taxIncluded': True, 'shippingIncluded': False,
        'retailerSku': str(row['selectedAttributeId']), 'gtin': None,
        'evidence': f'Live selected {row["format"]} price including tax, Product JSON-LD stock quantity {row["quantity"]}' + (
            '; product metadata UPC 607212 / EAN 52742053295 confirms Gastrointestinal Biome despite retailer adding i/d to title; Hill’s code list https://www.prodivet.es/www/book/adjuntos/7/promo_febrero_2025.pdf'
            if row['variantId'] == 'hills-wet-3e2a1a71-85g' else ''),
    })

barakaldo_leonardo = json.loads((ROOT / 'research/barakaldo-leonardo-check-2026-10-17.json').read_text())
for row in barakaldo_leonardo['results']:
    if row['variantId'] not in by_id or row['status'] != 'checked' or row['quantity'] <= 0:
        continue
    if not row['taxLabel'] or not row['visiblePriceEUR'] or row['visiblePriceEUR'] <= 0:
        raise ValueError(f'Leonardo price/tax missing: {row["variantId"]}')
    offers[row['variantId']].append({
        'retailer': 'Barakaldo Vet Shop', 'amount': row['visiblePriceEUR'], 'url': row['url'],
        'checkedAt': barakaldo_leonardo['checkedAt'], 'taxIncluded': True, 'shippingIncluded': False,
        'retailerSku': row['retailerSku'], 'gtin': None,
        'evidence': f'Live selected {row["format"]} retail price including tax, source inventory {row["quantity"]}',
    })

mismascotas_accessories = json.loads((ROOT / 'research/mismascotas-accessories-check-2026-10-17.json').read_text())
for row in mismascotas_accessories['results']:
    if row['variantId'] == 'yagu-7500815-catalog-pack':
        continue  # Catalog says 100 g, retailer now lists 70 g for this SKU.
    if row['status'] != 'checked' or not row['available']:
        continue
    if row['variantId'] not in by_id or not row['taxLabel'] or row['amount'] <= 0:
        raise ValueError(f'Unverified MisMascotas accessory: {row["variantId"]}')
    offers[row['variantId']].append({
        'retailer': 'MisMascotas', 'amount': row['amount'], 'url': row['url'],
        'checkedAt': mismascotas_accessories['checkedAt'], 'taxIncluded': True, 'shippingIncluded': False,
        'retailerSku': row['retailerSku'], 'gtin': None,
        'evidence': f'Live exact Yagu SKU {row["supplierSku"]}, selected {row["variantName"]}, Shopify available=true, IVA incluido',
    })

updates = {variant_id: sorted(rows, key=lambda row: (row['amount'], row['retailer']))
           for variant_id, rows in sorted(offers.items())}
review = {'checkedAt': '2026-10-17', 'method': 'Live public structured data or manually reviewed retailer page; exact recipe and single-pack format, matching catalog EAN when available',
          'taxIncluded': True, 'shippingIncluded': False,
          'reviewRequired': review_required,
          'excludedSourceRows': [{'variantId': variant_id, 'retailer': retailer, 'reason': 'Retailer page mixes scallop GTIN and text with salmon URL and images'} for variant_id, retailer in sorted(excluded_source_rows)],
          'items': [{'variantId': key, 'offers': value} for key, value in updates.items()]}
(ROOT / 'research/verified-retail-2026-10-17.json').write_text(json.dumps(review, ensure_ascii=False, indent=2) + '\n')

script = '''// Generated by research/build-retail-updates.py from verified exact-SKU public retail offers
export const newRetailOffers = OFFER_DATA;

export function applyRetailUpdates(products) {
  return products.map(product => {
    if (!product.variants?.length) return product;
    let changed = false;
    const variants = product.variants.map(variant => {
      const offers = newRetailOffers[variant.id];
      if (!offers) return variant;
      changed = true;
      const highest = offers.at(-1);
      return { ...variant, price: highest.amount, priceStatus: 'temporary', retailOffers: offers,
        retailPrice: { amount: highest.amount, currency: 'EUR', status: 'temporary', type: 'retail',
          taxIncluded: true, shippingIncluded: false, sourceName: highest.retailer,
          sourceUrl: highest.url, checkedAt: highest.checkedAt } };
    });
    if (!changed) return product;
    const selected = variants.find(variant => variant.id === product.defaultVariantId) || variants[0];
    return { ...product, variants, price: selected.price, priceStatus: selected.priceStatus,
      retailPrice: selected.retailPrice, retailOffers: selected.retailOffers };
  });
}
'''.replace('OFFER_DATA', json.dumps(updates, ensure_ascii=False, indent=2))
(ROOT / 'retail-updates.js').write_text(script)
print(f'Updated {len(updates)} exact-pack variants with {sum(map(len, updates.values()))} verified retailer offers')
print('Review required:', ', '.join(review_required))
