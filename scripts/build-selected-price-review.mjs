#!/usr/bin/env node
// Private review: supplier costs and the generated file stay in ignored research/supplier-files.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { selectedPrice } from '../server/selected-pricing.js';

const root = resolve(process.argv[2] || process.cwd());
const folder = resolve(root, 'research/supplier-files');
const read = name => JSON.parse(readFileSync(resolve(folder, name), 'utf8'));
const selected = read('launch-basket-registry-2026-11-04.json').items;
const sources = read('sourcing-upload-bundle-2026-11-04.json').sources;
const drafts = new Map(read('launch-supplier-drafts-upload-2026-11-04.json')
  .items.map(item => [item.itemId, item.variantId]));
const sourceRows = new Map(sources.flatMap(source => source.items.map(item =>
  [`${source.id}:${item.article}`, { source, item }])));
const market = new Map([
  ['royal-canin-2026-03-01:2537200', [2586, 'Miscota', 'https://www.miscota.es/gatos/royal-canin/sterilised-37']],
  ['distrivet-acana-2026-10-29:AIC01', [2199, 'Kiwoko', 'https://www.kiwoko.com/gatos/comida-para-gatos/pienso-seco-para-gatos/hipoalergenico/acana-indoor-entree-pienso-para-gatos-de-interior/ACAAIC00_M.html']],
  ['distrivet-acana-2026-10-29:AIC04', [4579, 'Kiwoko', 'https://www.kiwoko.com/gatos/comida-para-gatos/pienso-seco-para-gatos/hipoalergenico/acana-indoor-entree-pienso-para-gatos-de-interior/ACAAIC00_M.html']],
  ['distrivet-orijen-2026-10-29:ORD201', [3386, 'Miscota', 'https://www.miscota.es/gatos/orijen/pr-123282']]
]);
const euros = value => value == null ? '-' : `${(value / 100).toFixed(2).replace('.', ',')} €`;
const escape = text => String(text || '').replaceAll('|', '\\|').replaceAll('\n', ' ');
const lines = [
  '# Расчёт цены продажи для 50 выбранных SKU',
  '',
  'Срез на 5 ноября 2026 года. Это внутренний расчёт, цены поставщиков не публикуются на витрине',
  '',
  'Для Leonardo взят рекомендованный PVP Albet с IVA. Для Churu взят PVP из проверенного кабинета Albet от 3 ноября. Для остальных: закупка без IVA + IVA 10% + recargo de equivalencia 1,4%, затем надбавка 20% на денежную себестоимость. Скидка Distrivet 20% не учтена, поскольку proforma не подтверждена. Доставка, упаковка и комиссия оплаты в товарную цену не включены',
  '',
  'Розничные цены Kiwoko и Miscota - точечная проверка отдельных фасовок на 5 ноября, не полный мониторинг всех 50 SKU. Если предложение ниже рыночной цены, автоматический расчёт его не подменяет',
  '',
  '| Бренд и код | Товар, единица продажи | Закупка без IVA за единицу | Минимум поставщика | PVP поставщика | Рынок | Расчёт CatManDog | Основание |',
  '| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |'
];
let missing = 0;
for (const entry of selected) {
  const found = sourceRows.get(entry.sourceItemId);
  if (!found) throw new Error(`Нет источника ${entry.sourceItemId}`);
  const { source, item } = found;
  const variantId = entry.siteVariantId || drafts.get(entry.sourceItemId);
  const proposal = selectedPrice({
    variant_id: variantId, brand: source.brand, article: item.article,
    retail_units_per_purchase_unit: entry.retailUnitsPerPurchaseUnit,
    shop_price_cents: item.shopPriceCents,
    recommended_price_cents: item.recommendedPriceCents,
    retail_price_tax_basis: source.retailPriceTaxBasis
  });
  if (!proposal) { missing++; continue; }
  const units = entry.retailUnitsPerPurchaseUnit || 1;
  const netCost = entry.unitCostCents / units;
  const retailUnit = entry.brand === 'Churu' && entry.supplierCode === '949577'
    ? '20 × 14 г' : units > 1 ? entry.brand === 'Churu' ? '4 × 14 г' : '85 г'
      : entry.purchaseUnit;
  const marketRef = market.get(entry.sourceItemId);
  const marketCell = marketRef ? `[${euros(marketRef[0])} ${marketRef[1]}](${marketRef[2]})` : '-';
  const basis = proposal.basis === 'supplier_pvp' ? 'PVP Albet'
    : proposal.basis === 'albet_pvp' ? 'PVP Albet, кабинет' : 'Закупка + 20%';
  lines.push(`| ${escape(entry.brand)} ${escape(entry.supplierCode)} | ${escape(entry.name)} - ${escape(retailUnit)} | ${euros(netCost)} | ${euros(item.minimumPriceCents)} | ${euros(item.recommendedPriceCents || (entry.brand === 'Churu' ? proposal.priceCents : null))} | ${marketCell} | ${euros(proposal.priceCents)} | ${basis} |`);
}
if (selected.length !== 50 || missing) throw new Error(`Ожидалось 50 цен, отсутствует ${missing}`);
lines.push('', 'Кнопка в закрытой админке «Применить рассчитанные цены к выбранным SKU» сохраняет расчёт только для ещё не утверждённых вариантов. Уже утверждённые вручную цены она не перезаписывает. Физический остаток при этом не меняется', '');
const output = resolve(folder, 'SELECTED-PRICE-REVIEW-2026-11-05.md');
writeFileSync(output, lines.join('\n'));
console.log(output);
