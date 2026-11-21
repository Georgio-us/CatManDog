import test from 'node:test';
import assert from 'node:assert/strict';
import { recurringChoice, selectedRecurringItems, activateRecurringIntent,
  createRecurringFromPurchase, updateRecurringForCustomer } from '../server/recurring-orders.js';
import { normalizeRecurringDraft, recurringChoiceFromCart } from '../recurring-cart.js';
import { recurringProductCard } from '../recurring-product-ui.js';

const purchased = [
  { productId: 'food', variantId: 'food-1', name: 'Корм', label: '1 кг', qty: 2 },
  { productId: 'toy', variantId: 'toy-1', name: 'Игрушка', label: '1 шт', qty: 1 }
];

test('regular order selects only paid SKUs and quantities', () => {
  assert.deepEqual(recurringChoice({ cadenceWeeks: 4,
    items: [{ productId: 'food', variantId: 'food-1', qty: 1 }] }, purchased),
  { cadenceWeeks: 4, items: [{ productId: 'food', variantId: 'food-1', name: 'Корм', label: '1 кг', qty: 1 }] });
  for (const items of [[{ productId: 'other', variantId: 'x', qty: 1 }],
    [{ productId: 'food', variantId: 'food-1', qty: 3 }],
    [{ productId: 'toy', variantId: 'toy-1', qty: 1 }, { productId: 'toy', variantId: 'toy-1', qty: 1 }]])
    assert.throws(() => selectedRecurringItems(items, purchased), /не совпадают/);
  assert.throws(() => recurringChoice({ cadenceWeeks: 1, items: [purchased[0]] }, purchased), /период/);
  assert.throws(() => recurringChoice({ cadenceWeeks: 4, nextDate:'2020-01-01', items:[purchased[0]] }, purchased), /будущую дату/);
  const tomorrow = new Date(Date.now()+2*86400000).toISOString().slice(0,10);
  assert.equal(recurringChoice({ cadenceWeeks: 4, nextDate:tomorrow, items:[purchased[0]] }, purchased).nextDate,tomorrow);
});

test('cart keeps only current items in a regular order draft', () => {
  const cart = [{ productId: 'food', variantId: 'food-1', qty: 2 }];
  const draft = normalizeRecurringDraft({ enabled: true, cadenceWeeks: 4,
    items: ['food|food-1', 'removed|old'] }, cart);
  assert.deepEqual(draft.items, ['food|food-1']);
  assert.deepEqual(recurringChoiceFromCart(draft, cart), { cadenceWeeks: 4, nextDate:draft.nextDate,
    items: [{ productId: 'food', variantId: 'food-1', qty: 2 }] });
});

test('regular order product card shows the exact retail SKU, image and retail price', () => {
  const html = recurringProductCard({ item: { productId: 'toy', variantId: 'yagu-7517019-catalog-pack',
    qty: 1, displayPrice: 1.99 }, product: { name: 'Игрушечные мышки', image: { src: '/toy.webp' } },
  sku: { id: 'yagu-7517019-catalog-pack', label: '2 шт', image: { src: '/toy.webp' } },
  escape: String, money: value => `${value} €`, imageBlock: image => `<img src="${image.src}" alt="">`,
  input: '<input type="checkbox" checked>', selected: true });
  assert.match(html, /Игрушечные мышки/);
  assert.match(html, /Артикул 7517019/);
  assert.match(html, /src="\/toy.webp"/);
  assert.match(html, /Цена на витрине/);
  assert.match(html, /1.99 €/);
  const unknown = recurringProductCard({ item: { name: 'Товар', qty: 1, displayPrice: null },
    escape: String, money: () => 'wrong', imageBlock: () => '', language: 'ru' });
  assert.match(unknown, /Цена уточняется/);
  assert.doesNotMatch(unknown, /wrong/);
});

test('paid account intent creates one plan and no future payment', async () => {
  const nextDate=new Date(Date.now()+14*86400000).toISOString().slice(0,10);
  const calls = [];
  const db = { async query(sql, params) {
    calls.push([sql, params]);
    if (sql.includes('FROM orders')) return { rows: [{ customer_id: 'customer', recurring_intent: {
      cadenceWeeks: 2, nextDate, items: [{ productId: 'food', variantId: 'food-1', qty: 1 }] } }] };
    if (sql.includes('FROM order_items')) return { rows: purchased };
    return { rows: [{ id: 'plan' }] };
  } };
  assert.equal(await activateRecurringIntent(db, 'order'), 'plan');
  assert.match(calls.at(-1)[0], /ON CONFLICT\(source_order_id\) DO NOTHING/);
  assert.equal(calls.at(-1)[1][4], 2);
  assert.equal(calls.at(-1)[1][5], nextDate);
  assert.ok(calls.every(([sql]) => !/stripe|payment_intent|INSERT INTO orders/i.test(sql)));
});

test('post-purchase plan requires a matching paid order and can be paused', async () => {
  const customer = { id: 'owner', email: 'buyer@example.com', emailVerified: true };
  const denied = { async query() { return { rows: [] }; } };
  await assert.rejects(createRecurringFromPurchase(denied, customer, 'other', {
    cadenceWeeks: 4, items: [purchased[0]] }), /не найден/);
  const calls = [];
  const db = { async query(sql, params) {
    calls.push([sql, params]);
    if (sql.includes('FROM recurring_orders')) return { rows: [{ source_order_id: 'order',
      items: purchased, cadence_weeks: 4, status: 'active' }] };
    return { rows: [], rowCount: 1 };
  } };
  await updateRecurringForCustomer(db, 'owner', 'plan', { status: 'paused' });
  assert.match(calls.at(-1)[0], /UPDATE recurring_orders/);
  assert.equal(calls.at(-1)[1][4], 'paused');
  await assert.rejects(updateRecurringForCustomer(db, 'owner', 'plan', { cadenceWeeks: 1 }), /период/);
});
