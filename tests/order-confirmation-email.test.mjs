import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { handleApi } from '../server/api.js';

test('a paid Stripe event keeps payment confirmed and retries a failed email once', async () => {
  const names = ['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','PUBLIC_BASE_URL',
    'RESEND_API_KEY','RESEND_FROM'];
  const old = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const oldFetch = globalThis.fetch;
  const oldError = console.error;
  Object.assign(process.env, { STRIPE_SECRET_KEY:'sk_test_example',
    STRIPE_WEBHOOK_SECRET:'whsec_example', PUBLIC_BASE_URL:'https://catmandog.es',
    RESEND_API_KEY:'re_test_example', RESEND_FROM:'CatManDog <orders@catmandog.es>' });
  const sent = [];
  let failNext = true;
  console.error = () => {};
  globalThis.fetch = async (url, options) => {
    sent.push({ url, ...JSON.parse(options.body) });
    if (failNext) { failNext = false; return { ok:false, status:422 }; }
    return { ok:true };
  };
  try {
    const orderId = '9d8eb25b-c75b-4ed6-bf6a-a34b94385141';
    const sessionId = 'cs_test_123';
    const order = { id:orderId, number:'CMD-10001', email:'buyer@example.test', locale:'es',
      total_cents:5317, subtotal_cents:5318, discount_cents:400, delivery_cents:399,
      delivery_address:{ street:'Calle Prueba', building:'1', postcode:'46001', city:'València' },
      delivery_preference:{ mode:'slot', date:'2026-11-10', window:'10:00-14:00' },
      payment_status:'pending', stock_state:'reserved', promo_code:null,
      stripe_checkout_session_id:sessionId, confirmation_sent_at:null };
    const events = new Set();
    const client = { async query(sql) {
      if (sql.includes('SELECT id,total_cents,payment_status')) return { rows:[order] };
      if (sql.includes('INSERT INTO stripe_events')) {
        if (events.has('evt_paid_email')) return { rows:[] };
        events.add('evt_paid_email'); return { rows:[{ id:'evt_paid_email' }] };
      }
      if (sql.includes("UPDATE orders SET payment_status='paid'")) order.payment_status='paid';
      if (sql.includes('SELECT id,number,email,locale,delivery_address')) return { rows:[order] };
      if (sql.includes('FROM order_items WHERE order_id')) return { rows:[
        { name:'Royal Canin Sterilised 37', variant_label:'2 кг', quantity:2, unit_price_cents:2659 }
      ] };
      if (sql.includes('SET confirmation_error=$2')) order.confirmation_error='Почтовый сервис не принял письмо (422)';
      if (sql.includes('SET confirmation_sent_at=now()')) {
        order.confirmation_sent_at=new Date(); order.confirmation_error=null;
      }
      return { rows:[] };
    }, release() {} };
    const db = { async connect() { return client } };
    const payload = Buffer.from(JSON.stringify({ id:'evt_paid_email', livemode:false,
      type:'checkout.session.completed', data:{ object:{ id:sessionId,
        client_reference_id:orderId, metadata:{ order_id:orderId }, currency:'eur',
        amount_total:5317, payment_status:'paid', payment_intent:'pi_test_123' } } }));
    const timestamp = Math.floor(Date.now()/1000);
    const digest = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
      .update(`${timestamp}.`).update(payload).digest('hex');
    const request = () => ({ method:'POST', headers:{ 'stripe-signature':`t=${timestamp},v1=${digest}` },
      async *[Symbol.asyncIterator]() { yield payload } });
    const respond = () => ({ writeHead(code) { assert.equal(code,200) },
      end(body) { assert.deepEqual(JSON.parse(body),{ received:true }) } });
    await handleApi(db,request(),respond(),'/api/stripe/webhook');
    assert.equal(order.payment_status,'paid');
    assert.equal(order.confirmation_sent_at,null);
    assert.match(order.confirmation_error,/422/);
    await handleApi(db,request(),respond(),'/api/stripe/webhook');
    await handleApi(db,request(),respond(),'/api/stripe/webhook');
    assert.equal(sent.length,2);
    assert.ok(order.confirmation_sent_at);
    assert.equal(order.confirmation_error,null);
    assert.equal(sent[1].to[0],'buyer@example.test');
    assert.match(sent[1].text,/CMD-10001/);
    assert.match(sent[1].text,/53,17 €/);
    assert.match(sent[1].text,/Calle Prueba, 1/);
    assert.match(sent[1].text,/purchase-terms-es\.html/);
    assert.match(sent[1].html,/CatManDog-full-black-transparent\.png/);
    assert.match(sent[1].html,/Royal Canin Sterilised 37/);
    assert.match(sent[1].html,/2 кг · 2 × 26,59 €/);
    assert.match(sent[1].html,/53,17 €/);
    assert.match(sent[1].html,/Calle Prueba, 1, 46001, València/);
    assert.match(sent[1].html,/https:\/\/catmandog\.es\/#\/account\/orders/);
  } finally {
    globalThis.fetch=oldFetch;
    console.error=oldError;
    for (const name of names) {
      if (old[name] === undefined) delete process.env[name];
      else process.env[name]=old[name];
    }
  }
});
