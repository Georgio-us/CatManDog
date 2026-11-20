import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { couponStatus, promoProblem, resolvePromo } from '../server/promo.js';
import { priceQuote } from '../server/pricing.js';
import { checkoutTotals } from '../checkout-model.js';
import { createAccountStore } from '../account-store.js';

const code = 'SUISSAVECINOS10';
const promo = { code, kind:'paper_shared', percent_off:10, free_delivery:true,
  active:true, max_uses:40, used_count:0, expires_at:null };

test('the neighbors code is seeded as an active 10% one-use coupon', async () => {
  const schema = readFileSync(new URL('../server/schema.sql', import.meta.url), 'utf8');
  assert.match(schema, /VALUES\('SUISSAVECINOS10','paper_shared',10,true,true,40,0,NULL\)/);
  assert.match(schema, /ON CONFLICT\(code\) DO UPDATE SET kind='paper_shared',percent_off=10,free_delivery=true/);
  const queries = [];
  const db = { async query(sql, values) {
    queries.push({ sql, values });
    if (sql.includes('FROM promo_codes WHERE code=')) return { rows:[promo] };
    if (sql.includes('SELECT payment_status FROM orders')) return { rows:[] };
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
  assert.equal((await resolvePromo(db, code.toLowerCase(), null,
    { email:'neighbor@example.com', phone:'+34 600 000 000' })).percent_off, 10);
  assert.equal((await couponStatus(db, promo)).freeShipping, true);
  assert.deepEqual(queries[0].values, [code]);
  assert.deepEqual(queries[1].values.slice(2, 4), ['neighbor@example.com', '600000000']);
});

test('the neighbors code discounts the full basket and makes delivery free', () => {
  const variant = { variant_id:'sample-sku', product_id:'sample', name:'Sample', label:'1 ud',
    sale_price_cents:2000, price_accepted:true, sale_status:'available',
    availability:'source_on_demand', stock_quantity:0 };
  const quote = priceQuote([{ productId:'sample', variantId:'sample-sku', qty:1 }],
    [variant], promo);
  assert.equal(quote.subtotalCents, 2000);
  assert.equal(quote.discountCents, 200);
  assert.equal(quote.deliveryCents, 0);
  assert.equal(quote.totalCents, 1800);
  assert.equal(quote.promoCode, code);
  assert.equal(quote.orderable, true);
  const storage = { getItem:()=>null, setItem:()=>{} };
  const store = createAccountStore(storage);
  store.connectRemote({ version:1, pets:[], orders:[], reminders:[] }, 0,
    async () => ({ revision:1 }));
  store.setRemoteCoupon({ code, percent:10, freeShipping:true, status:'ready' });
  assert.deepEqual(store.promo(), { code, percent:10, freeShipping:true });
  assert.equal(checkoutTotals([{ price:20, qty:1 }], store.promo()).total, 18);
});

test('the fortieth use ends the campaign with a contact message', async () => {
  assert.equal(promoProblem({ ...promo, used_count:39 }), null);
  assert.match(promoProblem({ ...promo, used_count:40 }),
    /свяжитесь с нами, мы дадим вам новый промокод/);
  assert.equal((await couponStatus({ query:async () => ({ rows:[] }) },
    { ...promo, used_count:40 })).status, 'limit_reached');
});
