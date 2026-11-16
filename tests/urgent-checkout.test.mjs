import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../server/api.js';

test('urgent checkout records an unpaid request with server priced items', async () => {
  const keys = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PUBLIC_BASE_URL',
    'ORDERS_ENABLED', 'PAYMENTS_ENABLED', 'RESEND_API_KEY', 'RESEND_FROM'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const saved = [];
  const sent = [];
  try {
    Object.assign(process.env, { STRIPE_SECRET_KEY: 'sk_live_test', STRIPE_WEBHOOK_SECRET: 'whsec_test',
      PUBLIC_BASE_URL: 'https://catmandog.es', ORDERS_ENABLED: 'true', PAYMENTS_ENABLED: 'true',
      RESEND_API_KEY: 'test', RESEND_FROM: 'CatManDog <test@catmandog.es>' });
    globalThis.fetch = async (url, options) => {
      if (String(url).includes('cartociudad.es')) return { ok: true, json: async () => [{
        type: 'portal', address: 'CALLE PRUEBA 42, València', portalNumber: 42,
        postalCode: '46001', muni: 'València', poblacion: 'València', provinceCode: '46',
        lat: 39.46, lng: -0.37 }] };
      sent.push(JSON.parse(options.body));
      return { ok: true };
    };
    const db = { async query(sql, params) {
      if (sql.includes('FROM supplier_catalog_matches m')) return { rows: [] };
      if (sql.includes('FROM catalog_variants v JOIN catalog_products p')) return { rows: [{
        variant_id: 'urgent-sku', product_id: 'urgent-product', name: 'Игрушка', label: '1 шт',
        source_price_cents: 1000, price_override_cents: 1200, price_confirmed: true,
        source_orderable: true, availability: 'source_on_demand', sale_status: 'preorder',
        stock_quantity: 0, reserved_quantity: 0 }] };
      if (sql.includes('reserved_quantity>0')) return { rows: [] };
      if (sql.startsWith('INSERT INTO service_requests')) { saved.push(params); return { rowCount: 1 }; }
      throw new Error(`Unexpected SQL: ${sql}`);
    } };
    const body = { name: 'Анна', email: 'anna@example.test', phone: '+34600111222',
      deadline: 'Сегодня до 20:00', locale: 'ru',
      address: { city: 'València', postcode: '46001', street: 'Prueba', building: '42' },
      items: [{ productId: 'urgent-product', variantId: 'urgent-sku', qty: 1 }] };
    const req = { method: 'POST', headers: {}, socket: { remoteAddress: 'test-urgent-request' },
      async *[Symbol.asyncIterator]() { yield JSON.stringify(body); } };
    let status, result;
    const res = { writeHead(code) { status = code; }, end(value) { result = JSON.parse(value); } };
    await handleApi(db, req, res, '/api/urgent-requests');
    assert.equal(status, 202);
    assert.equal(result.accepted, true);
    assert.equal(saved.length, 1);
    assert.equal(saved[0][6].subtotalCents, 1200);
    assert.deepEqual(saved[0][6].items, body.items);
    assert.equal(sent.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('owner creates a personal payment link only after agreeing delivery price and time', async () => {
  const keys = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PUBLIC_BASE_URL',
    'ORDERS_ENABLED', 'PAYMENTS_ENABLED', 'RESEND_API_KEY', 'RESEND_FROM'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const orderWrites = [];
  const linked = [];
  const requestId = '11111111-1111-4111-8111-111111111111';
  const variant = { variant_id: 'urgent-sku', product_id: 'urgent-product', name: 'Игрушка',
    label: '1 шт', source_price_cents: 1000, price_override_cents: 1200,
    price_confirmed: true, source_orderable: true, availability: 'source_on_demand',
    sale_status: 'preorder', stock_quantity: 0, reserved_quantity: 0, tax_rate_bps: 2100 };
  try {
    Object.assign(process.env, { STRIPE_SECRET_KEY: 'sk_live_test', STRIPE_WEBHOOK_SECRET: 'whsec_test',
      PUBLIC_BASE_URL: 'https://catmandog.es', ORDERS_ENABLED: 'true', PAYMENTS_ENABLED: 'true',
      RESEND_API_KEY: 'test', RESEND_FROM: 'CatManDog <test@catmandog.es>' });
    globalThis.fetch = async (url, options) => {
      if (String(url).includes('cartociudad.es')) return { ok: true, json: async () => [{
        type: 'portal', address: 'CALLE PRUEBA 43, València', portalNumber: 43,
        postalCode: '46001', muni: 'València', poblacion: 'València', provinceCode: '46',
        lat: 39.46, lng: -0.37 }] };
      if (String(url).includes('api.stripe.com')) {
        const params = new URLSearchParams(options.body);
        const total = Number(params.get('line_items[0][price_data][unit_amount]')) +
          Number(params.get('line_items[1][price_data][unit_amount]'));
        return { ok: true, json: async () => ({ id: 'cs_live_urgenttest',
          url: 'https://checkout.stripe.com/c/pay/urgenttest', amount_total: total,
          currency: 'eur', expires_at: Math.floor(Date.now() / 1000) + 3600 }) };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    };
    const query = async (sql, params) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('FROM staff_sessions')) return { rows: [{ id: 'owner-id', email: 'owner@example.test', role: 'owner' }] };
      if (sql.includes('FROM service_requests WHERE id=$1')) return { rows: [{ id: requestId,
        kind: 'urgent', email: 'buyer@example.test', contact_name: 'Анна',
        contact_phone: '+34600111222', locale: 'ru', order_id: null, status: 'new',
        payload: { items: [{ productId: 'urgent-product', variantId: 'urgent-sku', qty: 1 }],
          address: { city: 'València', postcode: '46001', street: 'Prueba', building: '43' },
          subtotalCents: 1200, productsCents: 1200 } }] };
      if (sql.includes('FROM orders WHERE idempotency_key=$1')) return { rows: [] };
      if (sql.includes('FROM catalog_variants v JOIN catalog_products p') && sql.includes('FOR UPDATE'))
        return { rows: [variant] };
      if (sql.includes("nextval('order_number_seq')")) return { rows: [{ number: 'CMD-URGENT' }] };
      if (sql.includes('FROM billing_profile')) return { rows: [{ delivery_tax_rate_bps: 2100 }] };
      if (sql.startsWith('INSERT INTO orders')) { orderWrites.push(params); return { rows: [{ id: params[0], number: params[1] }] }; }
      if (sql.startsWith('INSERT INTO order_items') || sql.startsWith('INSERT INTO order_events') ||
          sql.startsWith('UPDATE orders SET stripe_checkout_session_id')) return { rows: [], rowCount: 1 };
      if (sql.startsWith('UPDATE service_requests SET order_id=')) { linked.push(params); return { rowCount: 1 }; }
      throw new Error(`Unexpected SQL: ${sql}`);
    };
    const db = { query, async connect() { return { query, release() {} }; } };
    const date = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const req = { method: 'POST', headers: { cookie: `cmd_staff_session=${'a'.repeat(64)}` },
      socket: { remoteAddress: 'test-urgent-offer' },
      async *[Symbol.asyncIterator]() { yield JSON.stringify({ date, time: '15:00', deliveryCents: 300 }); } };
    let status, result;
    const res = { writeHead(code) { status = code; }, end(value) { result = JSON.parse(value); } };
    await handleApi(db, req, res, `/api/admin/service-requests/${requestId}/payment-link`);
    assert.equal(status, 201);
    assert.match(result.url, /^https:\/\/checkout\.stripe\.com\//);
    assert.equal(orderWrites.length, 1);
    assert.equal(orderWrites[0][12], 300);
    assert.equal(orderWrites[0][14], 1500);
    assert.equal(orderWrites[0][9].reserved, true);
    assert.equal(linked.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
