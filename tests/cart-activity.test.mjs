import test from 'node:test';
import assert from 'node:assert/strict';
import { cartInput, cartChanges, saveObservedCart } from '../server/cart-activity.js';
import { createCartActivity } from '../cart-activity.js';

const cartId = '641c5edb-152a-4788-9053-e880270a023e';

test('cart activity accepts distinct variants and records adds, quantity changes and removals', () => {
  const first = cartInput({ cartId, stage: 'cart', items: [
    { productId: 'food', variantId: 'food-400g', qty: 2 },
    { productId: 'food', variantId: 'food-2kg', qty: 1 }
  ] });
  assert.equal(first.items.length, 2);
  assert.deepEqual(cartChanges([], first.items).map(item => item.delta), [2, 1]);
  const next = [{ productId: 'food', variantId: 'food-400g', qty: 1 }];
  assert.deepEqual(cartChanges(first.items, next).map(item => item.delta), [-1, -1]);
  assert.equal(cartInput({ cartId, stage: 'checkout', items: [] }).stage, 'checkout');
  assert.throws(() => cartInput({ cartId, stage: 'cart', items: [
    { productId: 'food', variantId: 'food-400g', qty: 0 }
  ] }), /Некорректный товар/);
});

test('server saves canonical product names and the latest stage without visitor contact data', async () => {
  let row = null;
  const events = [];
  const client = { release() {}, async query(sql, args = []) {
    if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) return { rows: [] };
    if (sql.includes('SELECT v.id,v.product_id,p.name,v.label'))
      return { rows: [{ id: 'food-400g', product_id: 'food', name: 'Trusted food', label: '400 г' }] };
    if (sql.includes('INSERT INTO observed_carts')) {
      row ||= { items: [], current_stage: 'cart', furthest_stage: 'cart' };
      return { rows: [] };
    }
    if (sql.includes('FROM observed_carts WHERE id=$1 FOR UPDATE'))
      return { rows: row ? [{ ...row }] : [] };
    if (sql.includes('UPDATE observed_carts SET items')) {
      row = { items: JSON.parse(args[1]), current_stage: args[2], furthest_stage: args[3] };
      return { rows: [] };
    }
    if (sql.includes('INSERT INTO observed_cart_events')) {
      events.push(JSON.parse(args[2]));
      return { rows: [] };
    }
    throw new Error(`Unexpected SQL: ${sql.slice(0, 50)}`);
  } };
  const db = { connect: async () => client };
  await saveObservedCart(db, { cartId, stage: 'cart', items: [
    { productId: 'food', variantId: 'food-400g', qty: 2,
      name: 'Forged name', email: 'private@example.com', price: 0.01 }
  ] });
  assert.deepEqual(row.items, [{ productId: 'food', variantId: 'food-400g', qty: 2,
    name: 'Trusted food', label: '400 г' }]);
  await saveObservedCart(db, { cartId, stage: 'review', items: [
    { productId: 'food', variantId: 'food-400g', qty: 2 }
  ] });
  assert.equal(row.current_stage, 'review');
  assert.equal(row.furthest_stage, 'review');
  assert.deepEqual(events.map(item => item.map(change => change.delta)), [[2], []]);
  assert.equal(JSON.stringify({ row, events }).includes('private@example.com'), false);
});

test('anonymous cart stays on the device until analytics consent and can be revoked', async () => {
  const previous = { window: globalThis.window, localStorage: globalThis.localStorage,
    fetch: globalThis.fetch };
  const values = new Map();
  const listeners = {};
  const requests = [];
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
  globalThis.window = { addEventListener: (type, listener) => { listeners[type] = listener; } };
  globalThis.fetch = async (path, options) => {
    requests.push({ path, options });
    return { ok: true };
  };
  try {
    const cart = [{ productId: 'food', variantId: 'food-400g', qty: 1 }];
    const activity = createCartActivity(() => cart);
    activity.sync();
    assert.equal(requests.length, 0);
    assert.equal(activity.id(), null);
    values.set('catmandog-analytics-consent-v1', 'accepted');
    activity.sync('cart');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(requests.length, 1);
    assert.deepEqual(JSON.parse(requests[0].options.body).items, cart);
    activity.sync('checkout');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(JSON.parse(requests[1].options.body).stage, 'checkout');
    values.set('catmandog-analytics-consent-v1', 'rejected');
    await activity.revoke();
    assert.equal(requests[2].options.method, 'DELETE');
    assert.equal(values.has('catmandog-observed-cart-v1'), false);
  } finally {
    globalThis.window = previous.window;
    globalThis.localStorage = previous.localStorage;
    globalThis.fetch = previous.fetch;
  }
});
