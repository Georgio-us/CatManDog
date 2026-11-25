import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { couponStatus, promoProblem, resolvePromo } from '../server/promo.js';
import { priceQuote } from '../server/pricing.js';

const code = 'VALENCIA10';
const promo = { code, kind:'paper_shared', percent_off:10, free_delivery:false,
  active:true, max_uses:50, used_count:0, expires_at:null };

test('VALENCIA10 is registered once with a global cap of 50', () => {
  const schema = readFileSync(new URL('../server/schema.sql', import.meta.url), 'utf8');
  assert.match(schema, /VALUES\('VALENCIA10','paper_shared',10,false,true,50,0,NULL\)/u);
  assert.match(schema, /VALUES\('VALENCIA10'[^\n]+\nON CONFLICT\(code\) DO NOTHING/u);
});

test('VALENCIA10 discounts the basket without waiving delivery', async () => {
  const db = { async query(sql) {
    if (sql.includes('FROM promo_codes WHERE code=')) return { rows:[promo] };
    if (sql.includes('SELECT payment_status FROM orders')) return { rows:[] };
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
  const applied = await resolvePromo(db, 'valencia10', null,
    { email:'buyer@example.test', phone:'+34 600 000 001' });
  const variant = { variant_id:'sample-1', product_id:'sample', name:'Sample', label:'1 ud',
    sale_price_cents:2000, price_accepted:true, sale_status:'available',
    availability:'source_on_demand', stock_quantity:0 };
  const quote = priceQuote([{ productId:'sample', variantId:'sample-1', qty:1 }],
    [variant], applied);
  assert.equal(quote.discountCents, 200);
  assert.equal(quote.deliveryCents, 399);
  assert.equal(quote.totalCents, 2199);
  assert.equal(quote.promoCode, code);
  assert.equal((await couponStatus(db, applied)).freeShipping, false);
});

test('the fiftieth reservation stops further use and a buyer cannot reuse the code', async () => {
  assert.equal(promoProblem({ ...promo, used_count:49 }), null);
  assert.match(promoProblem({ ...promo, used_count:50 }), /Лимит купонов исчерпан/u);
  const db = { async query(sql) {
    if (sql.includes('FROM promo_codes WHERE code=')) return { rows:[promo] };
    if (sql.includes('SELECT payment_status FROM orders')) return { rows:[{ payment_status:'paid' }] };
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
  await assert.rejects(resolvePromo(db, code, null,
    { email:'repeat@example.test', phone:'+34 600 000 002' }),
  /Вы уже использовали этот промокод/u);
});
