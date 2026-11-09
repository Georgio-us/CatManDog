import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogRows } from '../server/catalog.js';
import { salePriceDecision } from '../server/sale-price-policy.js';
import { priceQuote } from '../server/pricing.js';
import { selectedAcanaOrijenFormats } from '../acana-orijen-selected-formats.js';

const variants = new Map(catalogRows().map(row => [row.variant.id, row]));
const rowFor = (id, changes = {}) => {
  const row = variants.get(id);
  assert.ok(row, id);
  return { variant_id: id, product_id: row.product.id, name: row.product.name,
    label: row.variant.label, source_price_cents: row.variant.sourcePriceCents,
    price_override_cents: null, price_confirmed: false, sale_status: 'available',
    availability: 'source_on_demand', stock_quantity: 0, ...changes };
};

test('Royal Canin, Leonardo and Yagu researched prices become fixed checkout prices', () => {
  for (const id of ['rc-sterilised-400g', 'leonardo-poultry-300g',
    'dog-duvo-huggi-rabbit-7516408']) {
    const row = rowFor(id, { purchase_price_cents: null, supplier_matched: false });
    const price = salePriceDecision(row);
    assert.equal(price.accepted, true, id);
    const quote = priceQuote([{ productId: row.product_id, variantId: id, qty: 1 }], [row]);
    assert.equal(quote.orderable, true, id);
    assert.equal(quote.items[0].unitPriceCents, row.source_price_cents);
    assert.equal(quote.items[0].sourceMode, 'open_order');
  }
});

test('a draft override cannot replace the sourced price or reach payment', () => {
  const row = rowFor('rc-sterilised-400g', { price_override_cents: 9900 });
  const decision = salePriceDecision(row);
  assert.equal(decision.priceCents, row.source_price_cents);
  assert.equal(decision.accepted, false);
  assert.equal(priceQuote([{ productId: row.product_id, variantId: row.variant_id, qty: 1 }],
    [row]).orderable, false);
});

test('researched Yagu prices reach checkout without a purchase-price substitution', () => {
  for (const id of ['yagu-7588782-studio', 'yagu-7515987-studio',
    'yagu-7516254-studio', 'yagu-7516245-studio', 'yagu-1126841-studio']) {
    const row = rowFor(id);
    assert.equal(salePriceDecision(row).accepted, true, id);
    assert.equal(priceQuote([{ productId: row.product_id, variantId: id, qty: 1 }],
      [row]).orderable, true, id);
  }
});

test('all revised Adrián formats use their own retail price and remain orderable', () => {
  for (const item of selectedAcanaOrijenFormats) {
    const row = rowFor(item.id, { purchase_price_cents: Math.round(item.tariff * 100) });
    const decision = salePriceDecision(row);
    assert.equal(decision.accepted, true, item.id);
    assert.equal(decision.priceCents, Math.round(item.retail * 100), item.id);
    assert.ok(decision.priceCents > Math.ceil(item.tariff * 111.4), item.id);
    const quote = priceQuote([{ productId: row.product_id, variantId: item.id, qty: 1 }], [row]);
    assert.equal(quote.orderable, true, item.id);
    assert.equal(quote.items[0].sourceMode, 'open_order', item.id);
  }
});

test('confirmed demand can use retail fallback while B2B veterinary price is absent', () => {
  const gastro = rowFor('royal-canin-gastrointestinal-kitten-dry-2kg',
    { purchase_price_cents: null });
  assert.equal(salePriceDecision(gastro).basis, 'retail_source_floor');
  assert.equal(priceQuote([{ productId: gastro.product_id,
    variantId: gastro.variant_id, qty: 1 }], [gastro]).orderable, true);
  const lamb = rowFor('acana-grass-fed-lamb-11-4kg');
  assert.equal(salePriceDecision(lamb).basis, 'supplier_cost_floor');
  assert.equal(priceQuote([{ productId: lamb.product_id,
    variantId: lamb.variant_id, qty: 1 }], [lamb]).orderable, true);
});

test('unverified supplier model and unsourced gift concepts remain blocked', () => {
  for (const id of ['heybopet-hbzh-icb-19', 'birthday-bandana',
    'halloween-bandana', 'elf-hat']) {
    const row = rowFor(id);
    assert.equal(salePriceDecision(row).accepted, false, id);
    if (row.source_price_cents) assert.equal(priceQuote([{
      productId: row.product_id, variantId: id, qty: 1 }], [row]).orderable, false);
  }
});

test('owner price is separate from purchase cost and unavailable status still blocks', () => {
  const row = rowFor('rc-sterilised-400g', { price_override_cents: 500,
    price_confirmed: true, purchase_price_cents: 700 });
  assert.equal(salePriceDecision(row).priceCents, 500);
  assert.equal(priceQuote([{ productId: row.product_id, variantId: row.variant_id, qty: 1 }],
    [row]).orderable, true);
  assert.equal(priceQuote([{ productId: row.product_id, variantId: row.variant_id, qty: 1 }],
    [{ ...row, sale_status: 'unavailable' }]).orderable, false);
});

test('server snapshot keeps price approval when checkout quotes a database-only SKU', () => {
  const row = { variant_id: 'database-only', product_id: 'database-product',
    name: 'Товар', label: '1 шт', source_price_cents: 1200, price_override_cents: null,
    price_confirmed: false, sale_price_cents: 1200, price_accepted: true,
    sale_status: 'preorder', availability: 'source_on_demand', stock_quantity: 0 };
  const quote = priceQuote([{ productId: row.product_id, variantId: row.variant_id, qty: 1 }], [row]);
  assert.equal(quote.orderable, true);
  assert.equal(quote.items[0].unitPriceCents, 1200);
  assert.equal(quote.items[0].sourceMode, 'source_on_demand');
});

test('a stale cart variant is rejected as bad input rather than a server failure', () => {
  assert.throws(() => priceQuote([{ productId: 'old-product', variantId: 'missing', qty: 1 }], []),
    error => error.status === 400 && error.message === 'Вариант товара не найден');
});
