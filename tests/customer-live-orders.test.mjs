import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../server/api.js';

const request = cookie => ({ method: 'GET', headers: cookie ? { cookie: `cmd_session=${cookie}` } : {} });
const response = () => {
  const result = { status: 0, body: null };
  result.writer = { writeHead(status) { result.status = status; },
    end(body) { result.body = JSON.parse(body); } };
  return result;
};

test('real orders belong to the account, including earlier guest purchases with a verified email', async () => {
  const queries = [];
  let verified = true;
  const order = { id: '7f8d63db-8a18-423d-9cec-0378eb5ca849', number: 'CMD-12345',
    payment_status: 'paid', total_cents: 3749,
    items: [{ name: 'Royal Canin Sterilised 37', label: '2 кг', qty: 1,
      unitPriceCents: 3350 }] };
  const db = { async query(sql, params) {
    queries.push({ sql, params });
    if (sql.includes('FROM customer_sessions s')) return { rows: [{
      id: '15e12e58-ef32-4a33-b8da-356be216a213', email: 'buyer@example.test',
      emailVerified: verified }] };
    if (sql.includes('FROM orders o LEFT JOIN order_items i')) return { rows: [order] };
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
  const token = 'a'.repeat(64);
  const signedIn = response();
  await handleApi(db, request(token), signedIn.writer, '/api/me/orders');
  assert.equal(signedIn.status, 200);
  assert.deepEqual(signedIn.body.orders[0].items, order.items);
  const orderQuery = queries.find(query => query.sql.includes('FROM orders o'));
  assert.match(orderQuery.sql, /o\.customer_id=\$1 OR \(o\.customer_id IS NULL AND \$3=true AND lower\(o\.email\)=lower\(\$2\)\)/);
  assert.deepEqual(orderQuery.params, ['15e12e58-ef32-4a33-b8da-356be216a213', 'buyer@example.test', true]);

  queries.length = 0;
  verified = false;
  const unverified = response();
  await handleApi(db, request(token), unverified.writer, '/api/me/orders');
  assert.equal(unverified.status, 200);
  assert.equal(queries.find(query => query.sql.includes('FROM orders o')).params[2], false);

  const anonymous = response();
  await handleApi(db, request(null), anonymous.writer, '/api/me/orders');
  assert.equal(anonymous.status, 401);
});

test('paid guest order appears in the account even before adding a pet', async () => {
  const old = { localStorage: globalThis.localStorage, location: globalThis.location,
    fetch: globalThis.fetch };
  const entries = new Map();
  globalThis.localStorage = { getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
  globalThis.location = { hash: '#/account/orders', href: 'https://catmandog.es/#/account/orders', pathname: '/' };
  globalThis.fetch = async path => {
    if (path === '/api/config') return Response.json({ accountsEnabled: true, emailEnabled: true });
    if (path === '/api/auth/me') return Response.json({ customer: {
      id: 'buyer', email: 'buyer@example.test', emailVerified: true } });
    if (path === '/api/me/cabinet') return Response.json({ revision: 0, cabinet: {
      version: 1, pets: [], activePetId: null, human: {}, orders: [], reminders: [],
      clinics: {}, trips: [], tripDrafts: {} } });
    if (path === '/api/me/promo') return Response.json({ coupon: null });
    if (path === '/api/me/orders') return Response.json({ orders: [{
      id: '7f8d63db-8a18-423d-9cec-0378eb5ca849', number: 'CMD-12345',
      created_at: '2026-11-12T12:00:00Z', status: 'received', payment_status: 'paid',
      delivery_address: { street: 'Calle Andarella', building: '2', postcode: '46014', city: 'Xirivella' },
      delivery_preference: { mode: 'slot', date: '2026-11-13', window: '14:00-18:00' },
      subtotal_cents: 3350, discount_cents: 0, delivery_cents: 399, total_cents: 3749,
      items: [{ productId: 'rc-sterilised', variantId: 'rc-sterilised-2000g',
        name: 'Royal Canin Sterilised 37', label: '2 кг', qty: 1, unitPriceCents: 3350 }] }] });
    throw new Error(`Unexpected route ${path}`);
  };
  try {
    const { createAccountUI } = await import('../account.js?customer-live-orders-test');
    const ui = createAccountUI({ escape: String, icon: () => '<svg></svg>', money: value => `${value.toFixed(2)} €`,
      products: [], imageBlock: () => '', render: () => {}, notify: () => {} });
    await ui.initialize();
    const list = ui.page('/account/orders', new URLSearchParams());
    assert.match(list, /CMD-12345/);
    assert.match(list, /Royal Canin Sterilised 37/);
    assert.match(list, /Заказ принят/);
    const detail = ui.page('/account/orders/7f8d63db-8a18-423d-9cec-0378eb5ca849', new URLSearchParams());
    assert.match(detail, /Calle Andarella, 2, 46014, Xirivella/);
    assert.match(detail, /37\.49 €/);
    assert.match(detail, /14:00-18:00/);
  } finally { Object.assign(globalThis, old); }
});
