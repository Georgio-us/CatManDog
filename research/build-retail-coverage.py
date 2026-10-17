"""Create an auditable per-variant retail coverage ledger from the live catalog."""
import json
import subprocess
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATE = '2026-10-17'

script = '''
import { catalogProducts } from './data.js';
import { retailResearch } from './retail-research.js';
const rows = catalogProducts.filter(p => p.isReal).flatMap(p =>
  (p.variants?.length ? p.variants : [p]).map(v => ({
    productId: p.id, variantId: v.id, brand: p.brand, name: p.name,
    category: p.category, label: v.label || v.weight || '', priceStatus: v.priceStatus,
    price: v.price, purchasePrice: v.purchasePrice,
    productSourceUrl: v.productSource?.url || p.productSource?.url || null,
    research: retailResearch(v), pricingBasis: v.pricingBasis || null,
  })));
console.log(JSON.stringify(rows));
'''
catalog = json.loads(subprocess.run(
    ['node', '--experimental-default-type=module', '-e', script],
    cwd=ROOT, check=True, capture_output=True, text=True,
).stdout)

def load(name):
    return json.loads((ROOT / 'research' / name).read_text())

known = defaultdict(list)
for row in load(f'pending-known-retail-check-{DATE}.json')['results']:
    known[row['variantId']].append(row)
searched = {row['id']: row for row in load(f'pending-kiwoko-search-{DATE}.json')['results']}
families = {row['productId']: row for row in load(f'pending-kiwoko-family-check-{DATE}.json')['results']}
conflicts = load(f'verified-retail-{DATE}.json')['reviewRequired']
manual_pending = {
    'hills-kitten-7000g': ('Испанский EAN 0052742053639 подтверждён прайс-листом Hill’s, но доступную в Испании фасовку 7 кг не нашли',
                           'https://www.prodivet.es/www/book/adjuntos/7/Science_Plan_2025.pdf'),
    'orijen-fit-trim-340g': ('Точная фасовка 340 г найдена у NutriPetPlan, но выбранный вариант сейчас недоступен',
                            'https://nutripetplan.com/es-es/products/orijen-fit-trim-racao-para-gato-para-controlo-do-peso'),
    'hills-wet-3e2a1a71-85g': ('У Kiwoko и Zooplus продаётся набор 12 × 85 г; одиночный пакет Goldpet подписан i/d и требует сверки рецептуры',
                                'https://www.kiwoko.com/gatos/comida-para-gatos/dietas-veterinarias/alimentacion-humeda/hill_s-prescription-diet-feline-gi-biome-digestive-care-pollo-y-verduras-sobre-en-salsa/HIL607212_M.html'),
    'royalcanin-475d5e2b-85g': ('Производитель подтверждает пакет 85 г, но у проверенных испанских продавцов найден только набор 12 × 85 г',
                                 'https://www.royalcanin.com/es/cats/products/vet-products/neutered-balance-4088'),
    'yagu-7500815-catalog-pack': ('Каталог Yagu указывает 100 г, а текущая карточка продавца с тем же артикулом указывает 70 г',
                                   'https://www.mismascotas.es/products/duvo-hierba-natural-para-gatos-70-gr'),
    'yagu-9235044-catalog-pack': ('Точная миска 210 мл найдена у TodoMascota без наличия; актуальная испанская цена не подтверждена',
                                   'https://todomascota.es/13-accesorios-para-gatos'),
    'yagu-7502810-catalog-pack': ('Точная коричневая башня с EAN 5414365059613 найдена в рознице Бельгии, предложение с доставкой в Испанию не подтверждено',
                                   'https://www.bol.com/be/nl/p/duvo-krabton-tower-krabpaal-36-x-35-x-70-cm-bruin/9200000032888265/'),
    'heybopet-fresh-food-cooker-model': ('Точная модель HBZH-FFC-01 предлагается производителем по B2B-запросу; у испанского магазина найден функциональный аналог TopTrees за 198,98 € с IVA, его наличие не подтверждено',
                                         'https://www.powerplanetonline.com/es/toptrees-pet-treats-maker-procesador-de-alimentos-para-mascotas'),
}

for row in catalog:
    research = row.pop('research')
    basis = row.get('pricingBasis')
    if research:
        row['retailRange'] = {'minEUR': research['min'], 'maxEUR': research['max'],
                              'offers': research['offers']}
        row['researchStatus'] = 'exact_retail_offer'
        row['remainingReason'] = None
        continue
    if basis:
        row['retailRange'] = None
        row['researchStatus'] = basis['kind']
        row['remainingReason'] = None
        continue
    row['retailRange'] = None
    variant_id = row['variantId']
    product_id = row['productId']
    evidence = []
    if row['productSourceUrl']:
        evidence.append({'kind': 'product_source', 'url': row['productSourceUrl']})
    for checked in known.get(variant_id, []):
        evidence.append({'kind': 'previous_exact_retail_sku', 'retailer': checked['retailer'],
                         'url': checked['url'], 'availability': checked.get('availability'),
                         'priceEUR': checked.get('priceEUR')})
    if product_id in searched:
        evidence.append({'kind': 'Kiwoko_search', 'query': searched[product_id]['query'],
                         'candidateCount': len(searched[product_id].get('candidates', []))})
    if product_id in families:
        evidence.append({'kind': 'Kiwoko_family', 'url': families[product_id]['familyUrl'],
                         'checkedVariantCount': len(families[product_id].get('variants', []))})
    if row['brand'] == 'Leonardo':
        evidence.append({'kind': 'Miscota_category',
                         'url': 'https://www.miscota.es/gatos/c_comida_leonardo_disponibilidad-validada'})
    if row['brand'] == 'Heybo Pet':
        evidence.append({'kind': 'analogue_research',
                         'file': 'research/heybopet/analogue-prices.json'})
    if variant_id in manual_pending:
        reason, url = manual_pending[variant_id]
        evidence.append({'kind': 'manual_followup', 'checkedAt': DATE, 'url': url, 'finding': reason})
    row['evidence'] = evidence
    if variant_id in conflicts:
        row['researchStatus'] = 'source_conflict'
        row['remainingReason'] = conflicts[variant_id]
    elif row['brand'] == 'Heybo Pet':
        row['researchStatus'] = 'analogue_only'
        row['remainingReason'] = 'Точный розничный оффер модели Heybo Pet не подтверждён; есть только аналоги'
    elif any(item.get('availability') == 'OutOfStock' for item in known.get(variant_id, [])):
        row['researchStatus'] = 'exact_sku_out_of_stock'
        row['remainingReason'] = 'Сохранённый точный SKU у проверенного продавца сейчас отсутствует в продаже'
    else:
        row['researchStatus'] = 'exact_offer_not_confirmed'
        row['remainingReason'] = 'Цена доступной одиночной упаковки с точной рецептурой пока не подтверждена'
    if variant_id in manual_pending:
        row['remainingReason'] = manual_pending[variant_id][0]

ledger = ROOT / f'research/retail-coverage-{DATE}.json'
ledger.write_text(json.dumps({'date': DATE, 'unit': 'catalog variant', 'items': catalog},
                             ensure_ascii=False, indent=2) + '\n')

products = defaultdict(set)
stats = defaultdict(Counter)
for row in catalog:
    group = row['brand']
    products[group].add(row['productId'])
    stats[group]['variants'] += 1
    if row['researchStatus'] == 'exact_retail_offer':
        stats[group]['range' if row['retailRange']['minEUR'] != row['retailRange']['maxEUR'] else 'single'] += 1
    elif row['pricingBasis']:
        stats[group]['estimate'] += 1
    else:
        stats[group]['demo'] += 1

totals = Counter()
all_offers = [offer for row in catalog for offer in (row['retailRange'] or {}).get('offers', [])]
tax_confirmed = sum(all(offer.get('taxIncluded') is True for offer in row['retailRange']['offers'])
                    for row in catalog if row['retailRange'])
lines = [
    '# Диапазоны розничных цен в текущем каталоге', '',
    f'Срез {DATE}. Единица учёта - вариант товара с конкретной фасовкой. '
    f'Всего {len(products)} брендов, {len({row["productId"] for row in catalog})} реальных карточек '
    f'и {len(catalog)} вариантов.', '',
    'Точная розница собирается из публичных предложений с той же рецептурой и фасовкой. '
    'Включены предложения Kiwoko, Tiendanimal, Miscota, Amazon.es, Zooplus, Bitiba, '
    'MisMascotas, Goldpet, TodoMascota.es, Mundo Fauna и других продавцов, а также '
    'ранее сохранённые предложения с источниками. '
    'Для оставшихся вариантов используется отдельная расчётная цена по котировке или сопоставимым товарам. '
    'Розничные цены не подменяют закупочную цену и цену поставщика. Доставка не включена.', '',
    '| Бренд | Карточек | Вариантов | Диапазон розницы | Одна цена розницы | Расчётная цена | 7,77 € |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
]
for group, values in sorted(stats.items(), key=lambda item: (-item[1]['variants'], item[0])):
    totals.update(values)
    lines.append(f'| {group} | {len(products[group])} | {values["variants"]} | '
                 f'{values["range"]} | {values["single"]} | {values["estimate"]} | {values["demo"]} |')
lines += [f'| **Итого** | **{len({row["productId"] for row in catalog})}** | '
          f'**{len(catalog)}** | **{totals["range"]}** | **{totals["single"]}** | '
          f'**{totals["estimate"]}** | **{totals["demo"]}** |', '',
          '## Расчётные цены без точной розницы', '',
          'Точные розничные предложения для этих вариантов пока не найдены. '
          'Метод, источник и ограничение записаны для каждого варианта в '
          f'`retail-coverage-{DATE}.json` и `provisional-prices-{DATE}.json`.', '',
          '| Бренд и товар | Фасовка | Метод | Цена с IVA |', '| --- | --- | --- | ---: |']
for row in catalog:
    basis = row['pricingBasis']
    if not basis or basis['kind'] == 'exact_retail':
        continue
    name = row['name'].replace('|', '/')
    label = row['label'].replace('|', '/')
    method = {
        'scaled_pack': 'Пересчёт цены другой фасовки',
        'analogue_median': 'Медиана цен аналогов',
        'analogue_single': 'Цена одного аналога',
        'supplier_quote_candidate': 'Котировка поставщика × 2, код требует сверки',
    }[basis['kind']]
    amount = f'{basis["amount"]:.2f}'.replace('.', ',')
    lines.append(f'| {name} (`{row["variantId"]}`) | {label} | {method} | {amount} € |')
lines += ['', '## Проверки и ограничения', '',
          f'- Всего {len(all_offers)} наблюдений; для {tax_confirmed} из '
          f'{totals["range"] + totals["single"]} оценённых вариантов НДС подтверждён для всех включённых предложений '
          'меткой магазина или его условиями продажи.',
          '- Для Hill’s 7 кг и Orijen 340 г включены цены точной фасовки с пометкой об отсутствии в продаже на момент проверки.',
          '- Цену набора 6 × 200 г, 12 × 85 г или 16 × 85 г не делили на количество и не выдавали за цену одной упаковки.',
          '- Для Churu Broth Chicken Scallop две страницы продавцов исключены из-за противоречия между EAN, URL и изображением; исключение зафиксировано в реестре.',
          '- Для 18 вариантов Heybo Pet без точной котировки использованы розничные аналоги, не цены самой модели.',
          '- Для ICB-19 и ICB-24 цена рассчитана как двойная котировка за одну штуку; соответствие сокращённых кодов каталогу требует подтверждения. Закупочная цена в карточку не внесена.',
          '- Для Duvo+ 100 г цена рассчитана по предложению продавца для 70 г с коэффициентом 1,3.',
          '- Для Heybo FC30L Mundo Fauna показывает 34,95 € с IVA и наличие, но внутренний налоговый тариф магазина 2%; сумму нужно перепроверить на этапе оформления заказа.',
          '']
(ROOT / f'research/retail-range-coverage-{DATE}.md').write_text('\n'.join(lines))
print(f'Wrote {ledger.name} and retail-range-coverage-{DATE}.md: '
      f'{totals["range"]} ranges, {totals["single"]} singles, {totals["demo"]} demo')
