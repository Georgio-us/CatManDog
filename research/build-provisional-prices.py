"""Build the last catalog prices from exact offers, supplier quotes and analogues."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATE = '2026-10-17'

def read(path):
    return json.loads((ROOT / path).read_text())

previous_path = ROOT / f'research/provisional-prices-{DATE}.json'
previous_ids = set(json.loads(previous_path.read_text())) if previous_path.exists() else set()
pending = [row for row in read(f'research/retail-coverage-{DATE}.json')['items']
           if row['researchStatus'] != 'exact_retail_offer' or row['variantId'] in previous_ids]
analogues = read('research/heybopet/analogue-prices.json')
models = {row['model'].lower(): row for row in analogues['models']}
groups = {row['id']: row for row in analogues['groups']}
offers = {row['id']: row for row in analogues['offers']}
quotes = {row['supplierModel']: row for row in read('research/supplier-cats/heybopet-current-quotation.json')['products']}
known = read(f'research/pending-known-retail-check-{DATE}.json')['results']
entries = {}

for row in pending:
    variant_id = row['variantId']
    if row['brand'] != 'Heybo Pet':
        continue
    model = variant_id.removeprefix('heybopet-')
    if variant_id == 'heybopet-hair-removal-litter-box-model': model = 'HBZH-HRC-01'
    if variant_id == 'heybopet-protective-liner-model': model = 'heybopet-MAT-001'
    if variant_id == 'heybopet-drying-cabinet-model': model = 'HBZH-PDB-HG100'
    if variant_id == 'heybopet-fresh-food-cooker-model': model = 'HBZH-FFC-01'
    if variant_id.startswith('heybopet-hb'): model = model.upper()
    group = groups[models[model.lower()]['groupId']]
    if model in ('HBZH-ICB-19', 'HBZH-ICB-24'):
        quote = quotes[model.removeprefix('HBZH-')]
        entries[variant_id] = {
            'kind': 'supplier_quote_candidate', 'amount': round(quote['unitPrice'] * 2, 2),
            'quoteUnitEUR': quote['unitPrice'], 'multiplier': 2, 'minimumOrderUnits': quote['minimumOrderUnits'],
            'supplierModel': quote['supplierModel'], 'catalogModel': model,
            'sourceFile': quote['source']['file'], 'checkedAt': DATE,
            'note': 'Коды моделей и фото похожи; точное соответствие поставщик ещё не подтвердил',
        }
    elif group['medianEUR'] is not None:
        representative = offers[group['representativeOfferId']]
        entries[variant_id] = {
            'kind': 'analogue_median', 'amount': group['medianEUR'],
            'group': group['name'], 'sampleSize': group['sampleSize'],
            'analogueMinEUR': group['minimumEUR'], 'analogueMaxEUR': group['maximumEUR'],
            'exampleRetailer': representative['retailer'], 'examplePriceEUR': representative['observedPriceEUR'],
            'exampleUrl': representative['sourceUrl'], 'checkedAt': analogues['checkedOn'],
            'note': group['limitation'],
        }
    else:
        entries[variant_id] = {
            'kind': 'analogue_single', 'amount': 198.98, 'group': group['name'],
            'sampleSize': 1, 'exampleRetailer': 'Powerplanetonline', 'examplePriceEUR': 198.98,
            'exampleUrl': 'https://www.powerplanetonline.com/es/toptrees-pet-treats-maker-procesador-de-alimentos-para-mascotas',
            'checkedAt': DATE, 'note': 'Функциональный аналог TopTrees, не модель Heybo Pet',
        }

hill = [x for x in known if x['variantId'] == 'hills-kitten-7000g' and x['retailer'] in ('Kiwoko', 'Tiendanimal')]
assert len(hill) == 2 and all(x['priceEUR'] == 78.49 and x['availability'] == 'OutOfStock' for x in hill)
entries['hills-kitten-7000g'] = {
    'kind': 'exact_retail', 'amount': 78.49,
    'offers': [{'retailer': x['retailer'], 'amount': x['priceEUR'], 'url': x['url'],
                'checkedAt': DATE, 'taxIncluded': True, 'shippingIncluded': False,
                'availability': 'out_of_stock'} for x in hill],
}
entries['orijen-fit-trim-340g'] = {
    'kind': 'exact_retail', 'amount': 5.95,
    'offers': [{'retailer': 'Mascota Planet', 'amount': 5.95,
                'url': 'https://www.mascotaplanet.com/comprar-orijen-gatos-fit-trim.html',
                'checkedAt': DATE, 'taxIncluded': True, 'shippingIncluded': False,
                'availability': 'out_of_stock'}],
}
entries['yagu-9235044-catalog-pack'] = {
    'kind': 'exact_retail', 'amount': 4.45,
    'offers': [{'retailer': 'Pets World Market', 'amount': 4.45,
                'url': 'https://www.petsworldmarket.com/moderna-comedero-trendy-dinner-luxurious-210-ml-13565.html',
                'checkedAt': DATE, 'taxIncluded': True, 'shippingIncluded': False,
                'availability': 'in_stock'}],
}
entries['yagu-7500815-catalog-pack'] = {
    'kind': 'scaled_pack', 'amount': round(6.62 * 1.3, 2),
    'sourceAmountEUR': 6.62, 'sourcePackGrams': 70, 'catalogPackGrams': 100,
    'multiplier': 1.3, 'sourceRetailer': 'Mis Mascotas',
    'sourceUrl': 'https://www.mismascotas.es/products/duvo-hierba-natural-para-gatos-70-gr?variant=57558391259518',
    'checkedAt': DATE, 'taxIncluded': True,
    'note': 'У продавца указан тот же артикул, но фасовка 70 г; для 100 г применён предложенный коэффициент 1,3',
}

assert len(pending) == len(entries) == 24, (len(pending), len(entries))
payload = json.dumps(entries, ensure_ascii=False, indent=2)
(ROOT / 'provisional-prices.js').write_text(
    '// Generated by research/build-provisional-prices.py from checked sources\n'
    f'export const provisionalPrices = {payload};\n\n'
    'export function applyProvisionalPrices(products) {\n'
    '  const apply = variant => {\n'
    '    const basis = provisionalPrices[variant.id];\n'
    '    if (!basis || variant.priceStatus !== "pending") return variant;\n'
    '    const exact = basis.kind === "exact_retail";\n'
    '    return { ...variant, price: basis.amount, priceStatus: "temporary",\n'
    '      pricingBasis: basis,\n'
    '      ...(exact ? { retailOffers: basis.offers, retailPrice: {\n'
    '        amount: basis.amount, currency: "EUR", status: "temporary", type: "retail",\n'
    '        sourceName: basis.offers[0].retailer, sourceUrl: basis.offers[0].url,\n'
    '        checkedAt: basis.offers[0].checkedAt, taxIncluded: true, shippingIncluded: false,\n'
    '      } } : {}),\n'
    '    };\n'
    '  };\n'
    '  return products.map(product => product.variants?.length\n'
    '    ? { ...product, variants: product.variants.map(apply) } : apply(product));\n'
    '}\n', encoding='utf-8')
(ROOT / f'research/provisional-prices-{DATE}.json').write_text(payload + '\n', encoding='utf-8')
print(f'Wrote {len(entries)} prices')
