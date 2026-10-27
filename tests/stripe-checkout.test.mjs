import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createStripeCheckout, stripeReady, verifyStripeEvent } from '../server/stripe.js';
import { handleApi } from '../server/api.js';

function withStripeEnv(fn) {
  const names = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PUBLIC_BASE_URL'];
  const prior = Object.fromEntries(names.map(name => [name, process.env[name]]));
  process.env.STRIPE_SECRET_KEY = 'sk_test_example';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_example';
  process.env.PUBLIC_BASE_URL = 'https://catmandog.es/';
  return Promise.resolve().then(fn).finally(() => {
    for (const name of names) {
      if (prior[name] === undefined) delete process.env[name];
      else process.env[name] = prior[name];
    }
  });
}

test('Stripe session uses only server order total and an idempotency key', () => withStripeEnv(async () => {
  assert.equal(stripeReady(), true);
  let request;
  const order = { id: '9d8eb25b-c75b-4ed6-bf6a-a34b94385141', number: 'CMD-10001',
    email: 'buyer@example.com', subtotal_cents: 5318, discount_cents: 400,
    delivery_cents: 399, total_cents: 5317,
    items: [{ name: 'Корм', variantLabel: '2 кг', qty: 2, lineCents: 5318 }] };
  const session = await createStripeCheckout(order, 'es', async (url, options) => {
    request = { url, options, params: new URLSearchParams(options.body) };
    return { ok: true, async json() { return { id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123', amount_total: 5317,
      currency: 'eur', expires_at: 1780000000 }; } };
  });
  assert.equal(session.id, 'cs_test_123');
  assert.equal(request.url, 'https://api.stripe.com/v1/checkout/sessions');
  assert.equal(request.options.headers['Idempotency-Key'], `catmandog-order-${order.id}`);
  assert.equal(request.params.get('line_items[0][price_data][unit_amount]'), '4918');
  assert.equal(request.params.get('line_items[1][price_data][unit_amount]'), '399');
  assert.equal(request.params.get('client_reference_id'), order.id);
  assert.equal(request.params.get('payment_method_types[0]'), 'card');
  assert.match(request.params.get('success_url'), /checkout\/confirmation\?session_id=\{CHECKOUT_SESSION_ID\}/);
}));

test('Stripe rejects an unexpected payment amount', () => withStripeEnv(async () => {
  await assert.rejects(createStripeCheckout({ id: 'order', number: 'CMD-10001',
    email: 'buyer@example.com', subtotal_cents: 5317, discount_cents: 0,
    delivery_cents: 0, total_cents: 5317,
    items: [{ name: 'Корм', variantLabel: '2 кг', qty: 1, lineCents: 5317 }] }, 'es', async () => ({ ok: true,
    async json() { return { id: 'cs_test_123', url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      amount_total: 1, currency: 'eur' }; } })), /корректную страницу/);
}));

test('Stripe webhook accepts only signed fresh unmodified raw body', () => withStripeEnv(() => {
  const body = Buffer.from(JSON.stringify({ id: 'evt_123', type: 'checkout.session.completed' }));
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.`).update(body).digest('hex');
  assert.equal(verifyStripeEvent(body, `t=${timestamp},v1=${digest}`).id, 'evt_123');
  assert.throws(() => verifyStripeEvent(Buffer.from('{}'), `t=${timestamp},v1=${digest}`), /подпись/);
  assert.throws(() => verifyStripeEvent(body, `t=${timestamp - 1000},v1=${digest}`), /подпись/);
}));

test('a paid order is recorded only after a matching signed Stripe event', () => withStripeEnv(async () => {
  const orderId = '9d8eb25b-c75b-4ed6-bf6a-a34b94385141';
  const sessionId = 'cs_test_123';
  const payload = Buffer.from(JSON.stringify({ id: 'evt_paid_1', livemode: false,
    type: 'checkout.session.completed', data: { object: { id: sessionId,
      client_reference_id: orderId, metadata: { order_id: orderId }, currency: 'eur',
      amount_total: 5317, payment_status: 'paid', payment_intent: 'pi_test_123' } } }));
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.`).update(payload).digest('hex');
  const sql = [];
  const client = { async query(statement) {
    sql.push(statement);
    if (statement.includes('FROM orders WHERE id=')) return { rows: [{ id: orderId,
      total_cents: 5317, payment_status: 'pending', stock_state: 'reserved',
      promo_code: null, stripe_checkout_session_id: sessionId }] };
    if (statement.includes('INSERT INTO stripe_events')) return { rows: [{ id: 'evt_paid_1' }] };
    return { rows: [] };
  }, release() {} };
  const db = { async connect() { return client; } };
  const req = { method: 'POST', headers: { 'stripe-signature': `t=${timestamp},v1=${digest}` },
    async *[Symbol.asyncIterator]() { yield payload; } };
  let status, result;
  const res = { writeHead(code) { status = code; }, end(body) { result = JSON.parse(body); } };
  await handleApi(db, req, res, '/api/stripe/webhook');
  assert.equal(status, 200);
  assert.equal(result.received, true);
  assert.equal(sql.filter(statement => statement.includes("payment_status='paid'")).length, 1);
  assert.equal(sql.at(-1), 'COMMIT');
}));
