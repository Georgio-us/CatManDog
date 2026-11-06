import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { activatePaperCoupon, couponStatus, normalizeBuyerPhone, promoProblem,
  resolvePromo, savedPaperCoupon } from '../server/promo.js';
import { PAPER_COUPON_CODE, PAPER_COUPON_URL, PAPER_COUPON_MAX_USES,
  PAPER_COUPON_DURATION_DAYS } from '../server/paper-campaign.js';

const campaign = { code: 'CMD-PAPER', kind: 'paper_shared', percent_off: 10,
  free_delivery: false, active: true, max_uses: 100, used_count: 0,
  expires_at: '2099-01-01T00:00:00.000Z' };
const customer = { id: '86e579dd-20c2-4b5e-a4b8-65f9510f8c27', email: 'buyer@example.com' };

test('the print URL carries the exact configured shared code', () => {
  const url = new URL(PAPER_COUPON_URL);
  assert.equal(url.origin, 'https://catmandog.es');
  assert.equal(url.pathname, '/');
  assert.equal(url.searchParams.get('promo'), PAPER_COUPON_CODE);
  assert.equal(PAPER_COUPON_MAX_USES, 100);
  assert.equal(PAPER_COUPON_DURATION_DAYS, 90);
  const handoff = readFileSync(new URL('../SECOND-ORDER-COUPONS.md', import.meta.url), 'utf8');
  assert.ok(handoff.includes(PAPER_COUPON_URL));
  assert.ok(handoff.includes(PAPER_COUPON_CODE));
});

function database({ promo = campaign, use = null } = {}) {
  const queries = [];
  return { queries, async query(sql, values) {
    queries.push({ sql, values });
    if (sql.includes('FROM promo_codes WHERE code=')) return { rows: promo ? [promo] : [] };
    if (sql.includes('FROM customer_promos cp')) return { rows: promo ? [promo] : [] };
    if (sql.includes('SELECT payment_status FROM orders'))
      return { rows: use ? [{ payment_status: use }] : [] };
    return { rows: [], rowCount: 1 };
  } };
}

test('one printed code activates without an account or email link', async () => {
  const db = database();
  assert.equal((await activatePaperCoupon(db, campaign.code)).status, 'ready');
  assert.equal((await resolvePromo(db, campaign.code)).percent_off, 10);
  assert.equal(db.queries.some(item => item.sql.includes('INSERT INTO customer_promos')), false);
});

test('an account can save the same campaign code for later', async () => {
  const db = database();
  assert.equal((await activatePaperCoupon(db, campaign.code, customer)).status, 'ready');
  assert.ok(db.queries.some(item => item.sql.includes('INSERT INTO customer_promos') &&
    item.values[0] === customer.id));
  assert.equal((await savedPaperCoupon(db, customer)).code, campaign.code);
});

test('the campaign stops at 100 reserved or paid redemptions and honors expiry', async () => {
  assert.equal(promoProblem({ ...campaign, used_count: 99 }), null);
  assert.match(promoProblem({ ...campaign, used_count: 100 }), /Лимит купонов исчерпан/);
  assert.equal((await couponStatus(database(), { ...campaign, used_count: 100 })).status,
    'limit_reached');
  await assert.rejects(resolvePromo(database({ promo: { ...campaign, used_count: 100 } }),
    campaign.code), /Лимит купонов исчерпан/);
  const expired = { ...campaign, expires_at: '2020-01-01T00:00:00.000Z' };
  assert.equal((await couponStatus(database(), expired)).status, 'expired');
  await assert.rejects(resolvePromo(database({ promo: expired }), campaign.code), /истёк/);
});

test('an account, email or phone can redeem a campaign only once', async () => {
  const identity = { email: 'buyer@example.com', phone: '+34 600 000 000' };
  assert.equal(normalizeBuyerPhone(identity.phone), '600000000');
  assert.equal(normalizeBuyerPhone('600 000 000'), '600000000');
  const db = database({ use: 'paid' });
  await assert.rejects(resolvePromo(db, campaign.code, customer, identity),
    /Вы уже использовали/);
  const lookup = db.queries.find(item => item.sql.includes('SELECT payment_status FROM orders'));
  assert.deepEqual(lookup.values.slice(1, 4), [customer.id, identity.email, '600000000']);
  assert.equal((await couponStatus(database({ use: 'paid' }), campaign, customer)).status, 'used');
  await assert.rejects(resolvePromo(database({ use: 'pending' }), campaign.code,
    null, identity), /Дождитесь завершения/);
});

test('invalid and old order-bound codes cannot be activated as paper coupons', async () => {
  await assert.rejects(activatePaperCoupon(database({ promo: null }), 'BAD-CODE'), /недействителен/);
  await assert.rejects(activatePaperCoupon(database({ promo: { ...campaign,
    kind: 'second_order' } }), campaign.code), /недействителен/);
  await assert.rejects(resolvePromo(database({ promo: { ...campaign,
    kind: 'second_order' } }), campaign.code), /недействителен/);
});
