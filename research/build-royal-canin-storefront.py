"""Build storefront families from researched recipes and completed image assets"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
dry = json.loads((ROOT / 'research/dry-cat-food/assortment.json').read_text())['recipes']
dry_prices = json.loads((ROOT / 'research/dry-cat-food/retail-prices.json').read_text())['skus']
references = json.loads((ROOT / 'research/royal-canin-image-references.json').read_text())
pack_sizes = json.loads((ROOT / 'research/royal-canin-current-pack-sizes.json').read_text())
jobs = json.loads((ROOT / 'research/royal-canin-image-jobs.json').read_text())['completed']
existing = {'royalcanin-01': 'rc-sterilised', 'royalcanin-05': 'rc-kitten', 'royalcanin-08': 'rc-digestive'}
tags = ['Для стерилизованных', 'Для взрослых', 'Домашним кошкам', 'Для котят', 'Для котят', 'Маме и котятам', 'Контроль шерсти', 'Пищеварение', 'Чувствительное пищеварение', 'Urinary Care', 'Контроль веса', 'Для кошек 7+', 'Для мейн-кунов', 'Для персидских', 'Для британских']
configs = []

def weight(g):
    return (str(g / 1000).rstrip('0').rstrip('.').replace('.', ',') + ' кг') if g >= 1000 else str(g) + ' г'

for r in dry:
    if r['brand'] != 'Royal Canin':
        continue
    base_id = existing.get(r['id'])
    job = next((j for j in jobs if j['id'] == r['id']), None)
    if not base_id and not job:
        continue
    ref = next(x for x in references if x['id'] == r['id'])
    product_id = base_id or job['slug']
    checked_packs = next((p for p in pack_sizes if p['recipeId'] == r['id']), None)
    if not checked_packs or not checked_packs['weightsGrams']:
        raise ValueError('Current pack sizes not confirmed: ' + r['name'])
    grams = checked_packs['weightsGrams']
    default = 2000 if 2000 in grams else (1500 if 1500 in grams else grams[0])
    variants = []
    for g in grams:
        sku = next((s for s in dry_prices if s['recipeId'] == r['id'] and s['grams'] == g), None)
        offers = [o for o in (sku or {}).get('offers', []) if o.get('quantity', 1) == 1 and o.get('priceEUR') and not o.get('supersededByLiveOffer')]
        offers.sort(key=lambda o: o['priceEUR'])
        offer = offers[0] if offers else None
        variants.append({'id': product_id + '-' + str(g) + 'g', 'label': weight(g), 'weight': weight(g), 'packageWeightKg': g / 1000, 'sizes': [weight(g)], 'price': offer['priceEUR'] if offer else None, 'priceStatus': 'temporary' if offer else 'pending', 'ean': offer.get('gtin') if offer else None, 'supplier': None, 'purchasePrice': None, 'purchasePriceStatus': 'pending', 'availabilityStatus': 'pending', 'retailPrice': {'amount': offer['priceEUR'], 'currency': 'EUR', 'status': 'temporary', 'sourceName': offer.get('retailer'), 'sourceUrl': offer['sourceUrl'], 'checkedAt': offer.get('checkedAt'), 'shippingIncluded': False} if offer else None})
    tag = tags[int(r['id'].split('-')[-1]) - 1]
    configs.append({'id': product_id, 'existingId': base_id, 'researchRecipeId': r['id'], 'name': 'Royal Canin ' + r['name'], 'brand': 'Royal Canin', 'category': 'Корм', 'pet': 'cat', 'foodType': 'dry', 'isReal': True, 'isNew': not bool(base_id), 'tag': tag, 'segment': 'everyday', 'optionLabel': 'Фасовка', 'description': 'Полнорационный сухой корм Royal Canin ' + r['name'], 'details': ['Сухой корм для кошек', tag, 'Фасовку выберите перед добавлением в корзину', 'Норму кормления смотрите на упаковке', 'Свежая вода всегда должна быть в свободном доступе'], 'image': {'src': job['generatedPath'], 'originalSrc': ref['referencePath'], 'presentation': 'editorial', 'generated': True, 'alt': 'Royal Canin ' + r['name']} if job else None, 'imageSource': {'name': 'Royal Canin' if 'royalcanin.com' in ref['sourceUrl'] else 'Tiendanimal', 'pageUrl': ref['sourceUrl'], 'url': ref['referenceUrl']}, 'productSource': {'name': 'Royal Canin' if 'royalcanin.com' in r['sourceUrl'] else 'Tiendanimal', 'url': r['sourceUrl']}, 'defaultVariantId': product_id + '-' + str(default) + 'g', 'variants': variants})

wet_data = json.loads((ROOT / 'research/wet-cat-food/retail-prices.json').read_text())
wet_refs = json.loads((ROOT / 'research/royal-canin-wet-image-references.json').read_text())
for r in wet_data['recipes']:
    if r['brand'] != 'Royal Canin':
        continue
    base_id = 'rc-wet' if r['id'] == 'royalcanin-21678889' else None
    asset = 'assets/food/editorial/' + r['id'] + '-v1.png'
    if not base_id and not (ROOT / asset).exists():
        continue
    ref = next(x for x in wet_refs if x['id'] == r['id'])
    product_id = base_id or r['id']
    variants = []
    for g in r['weightsGrams']:
        sku = next((s for s in wet_data['skus'] if s['recipeId'] == r['id'] and s['grams'] == g), None)
        offers = [o for o in (sku or {}).get('offers', []) if o.get('quantity') == 1 and o.get('priceEUR')]
        offers.sort(key=lambda o: o['priceEUR'])
        offer = offers[0] if offers else None
        variants.append({'id': product_id + '-' + str(g) + 'g', 'label': weight(g), 'weight': weight(g), 'packageWeightKg': g / 1000, 'sizes': [weight(g)], 'price': offer['priceEUR'] if offer else None, 'priceStatus': 'temporary' if offer else 'pending', 'ean': offer.get('gtin') if offer else None, 'supplier': None, 'purchasePrice': None, 'purchasePriceStatus': 'pending', 'availabilityStatus': 'pending', 'retailPrice': {'amount': offer['priceEUR'], 'currency': 'EUR', 'status': 'temporary', 'sourceName': offer.get('retailer'), 'sourceUrl': offer['sourceUrl'], 'checkedAt': offer.get('checkedOn'), 'shippingIncluded': False} if offer else None})
    g = r['weightsGrams'][0]
    veterinary = r['segment'] == 'Ветеринарный' or any(term in r['name'].lower() for term in ['veterinary', 'renal', 'consult', 'diabetic', 'recovery', 'gastrointestinal', 'sensitivity control'])
    texture = 'Желе' if 'gelatina' in r['name'].lower() else 'Мусс' if 'mousse' in r['name'].lower() else 'Паштет' if 'paté' in r['name'].lower() else 'В соусе'
    tag = 'Ветеринарная диета' if veterinary else texture
    configs.append({'id': product_id, 'existingId': base_id, 'researchRecipeId': r['id'], 'name': r['name'], 'brand': 'Royal Canin', 'category': 'Корм', 'pet': 'cat', 'foodType': 'wet', 'isReal': True, 'isNew': not bool(base_id), 'tag': tag, 'segment': 'veterinary' if veterinary else 'everyday', 'optionLabel': 'Фасовка', 'description': 'Влажный корм ' + r['name'].removeprefix('Royal Canin ') + ' от Royal Canin', 'details': ['Влажный корм для кошек', 'Текстура: ' + texture, 'Вес одной упаковки: ' + weight(g), 'Норму кормления смотрите на упаковке'] + (['Ветеринарная диета - применение по рекомендации ветеринарного врача'] if veterinary else []), 'image': None if base_id else {'src': asset, 'originalSrc': ref['referencePath'], 'presentation': 'editorial', 'generated': True, 'alt': r['name'] + ' - ' + weight(g)}, 'imageSource': {'name': 'Royal Canin' if 'royalcanin.com' in ref['referenceSource'] else 'Kiwoko / Tiendanimal', 'pageUrl': ref['referenceSource'], 'url': ref['referenceUrl']}, 'productSource': {'name': 'Royal Canin' if 'royalcanin.com' in r['sourceUrls'][0] else 'Каталог испанской розницы', 'url': r['sourceUrls'][0]}, 'defaultVariantId': product_id + '-' + str(g) + 'g', 'variants': variants})

display_names = json.loads((ROOT / 'research/royal-canin-display-names.json').read_text())
for c in configs:
    c['productSource']['kind'] = 'manufacturer' if 'royalcanin.com' in c['productSource']['url'] else 'retailer'
    c['purchasePrice'] = None
    c['purchasePriceStatus'] = 'pending'
    c['availabilityStatus'] = 'pending'
    if c['foodType'] == 'wet' and not c['existingId']:
        c['researchName'] = c['name']
        c['name'] = 'Royal Canin ' + display_names[c['researchRecipeId']]
        c['description'] = 'Влажный корм ' + c['name']
        short_name = display_names[c['researchRecipeId']]
        texture = 'Желе' if 'желе' in short_name else 'Паштет' if 'паштет' in short_name else 'Мусс' if 'Mousse' in short_name else 'В соусе'
        c['details'][1] = 'Текстура: ' + texture
        if c['segment'] != 'veterinary':
            c['tag'] = texture
    if c['image']:
        webp = Path(c['image']['src']).with_suffix('.webp')
        if (ROOT / webp).exists():
            c['image']['src'] = str(webp)

image_files = {str(p.relative_to(ROOT).with_suffix('.png')): str(p.relative_to(ROOT)) for p in (ROOT / 'assets/food/editorial').glob('*.webp')}
script = '''// Generated from saved research and completed studio images
const displayImages = IMAGE_FILES;
const recipes = RECIPE_DATA;

export function expandRoyalCaninFood(existingProducts) {
  const expanded = recipes.map(({ existingId, variants, image, ...recipe }) => {
    const previous = existingProducts.find(p => p.id === existingId);
    const artwork = image || previous?.image;
    const displayImage = { ...artwork, src: displayImages[artwork.src] || artwork.src };
    const base = previous ? { ...previous, image: displayImage, foodType: recipe.foodType, researchRecipeId: recipe.researchRecipeId, optionLabel: recipe.optionLabel, defaultVariantId: recipe.defaultVariantId } : { ...recipe, image: displayImage };
    const packs = variants.map(v => {
      const keepsOriginal = previous && previous.packageWeightKg === v.packageWeightKg;
      return { ...base, ...v, image: base.image, name: base.name, line: base.brand + ' · ' + v.weight,
        ...(keepsOriginal ? { price: previous.price, priceStatus: previous.priceStatus, ean: previous.ean, supplier: previous.supplier, retailPrice: previous.retailPrice } : {}) };
    });
    const selected = packs.find(v => v.id === recipe.defaultVariantId);
    const weight = packs.length > 1 ? packs[0].weight + ' - ' + packs.at(-1).weight : selected.weight;
    return { ...base, price: selected.price, priceStatus: selected.priceStatus, weight, packageWeightKg: selected.packageWeightKg, ean: selected.ean, retailPrice: selected.retailPrice, sizes: packs.map(v => v.label), variants: packs };
  });
  return [...existingProducts.map(p => expanded.find(r => r.id === p.id) || p), ...expanded.filter(p => !existingProducts.some(e => e.id === p.id))];
}
'''.replace('RECIPE_DATA', json.dumps(configs, ensure_ascii=False, indent=2)).replace('IMAGE_FILES', json.dumps(image_files, indent=2))
(ROOT / 'royal-canin-products.js').write_text(script)
print('Built', len(configs), 'Royal Canin recipes with', sum(len(c['variants']) for c in configs), 'package variants')
