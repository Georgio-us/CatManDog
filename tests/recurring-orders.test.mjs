import test from 'node:test';
import assert from 'node:assert/strict';
import { recurringChoice, selectedRecurringItems, activateRecurringIntent,
  createRecurringFromPurchase, updateRecurringForCustomer } from '../server/recurring-orders.js';
import { normalizeRecurringDraft, recurringChoiceFromCart } from '../recurring-cart.js';

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
});

test('cart keeps only current items in a regular order draft', () => {
  const cart = [{ productId: 'food', variantId: 'food-1', qty: 2 }];
  const draft = normalizeRecurringDraft({ enabled: true, cadenceWeeks: 4,
    items: ['food|food-1', 'removed|old'] }, cart);
  assert.deepEqual(draft.items, ['food|food-1']);
  assert.deepEqual(recurringChoiceFromCart(draft, cart), { cadenceWeeks: 4,
    items: [{ productId: 'food', variantId: 'food-1', qty: 2 }] });
});

test('paid account intent creates one plan and no future payment', async () => {
  const calls = [];
  const db = { async query(sql, params) {
    calls.push([sql, params]);
    if (sql.includes('FROM orders')) return { rows: [{ customer_id: 'customer', recurring_intent: {
      cadenceWeeks: 2, items: [{ productId: 'food', variantId: 'food-1', qty: 1 }] } }] };
    if (sql.includes('FROM order_items')) return { rows: purchased };
    return { rows: [{ id: 'plan' }] };
  } };
  assert.equal(await activateRecurringIntent(db, 'order'), 'plan');
  assert.match(calls.at(-1)[0], /ON CONFLICT\(source_order_id\) DO NOTHING/);
  assert.equal(calls.at(-1)[1][4], 2);
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
