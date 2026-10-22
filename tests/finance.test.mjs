import test from 'node:test';
import assert from 'node:assert/strict';
import { financePreview } from '../server/finance.js';
import { handleApi } from '../server/api.js';

const order = { number:'CMD-10001', payment_status:'paid', subtotal_cents:3000,
  discount_cents:300, delivery_cents:399, delivery_tax_rate_bps:2100, total_cents:3099 };
const items = [
  { variant_id:'food', name:'Корм', variant_label:'1 кг', quantity:2,
    unit_price_cents:1000, tax_rate_bps:1000 },
  { variant_id:'toy', name:'Игрушка', variant_label:'1 шт', quantity:1,
    unit_price_cents:1000, tax_rate_bps:2100 }
];

test('internal financial preview allocates the discount and reconciles gross, net and tax', () => {
  const result = financePreview(order, items, { legal_name:'CatManDog', tax_id:'TEST',
    street_address:'Test 1', postal_code:'46001', city:'València' });
  assert.deepEqual(result.lines.map(line => line.discountCents), [200, 100]);
  assert.equal(result.lines.reduce((sum, line) => sum + line.grossCents, 0), 2700);
  assert.equal(result.netTotalCents + result.taxTotalCents, 3099);
  assert.equal(result.taxComplete, true);
  assert.deepEqual(result.missingSellerFields, []);
  assert.equal(result.documentIssuanceEnabled, false);
});

test('missing rates and seller details never produce a misleading IVA total', () => {
  const result = financePreview({ ...order, delivery_tax_rate_bps:null },
    [{ ...items[0], tax_rate_bps:null }, items[1]], {});
  assert.equal(result.taxComplete, false);
  assert.equal(result.taxTotalCents, null);
  assert.deepEqual(result.missingTaxVariants, ['food']);
  assert.equal(result.missingDeliveryTax, true);
  assert.ok(result.missingSellerFields.includes('tax_id'));
});

test('owner alone can read the financial overview', async () => {
  let role = 'owner';
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions')) return { rows:[{ id:'staff-1', role }] };
    if (sql.includes('FROM billing_profile')) return { rows:[] };
    if (sql.includes('FROM orders') && sql.includes('paid_orders')) return { rows:[{
      paid_orders:0, paid_total_cents:'0', awaiting_orders:0, refunded_orders:0 }] };
    if (sql.includes('FROM orders o LEFT JOIN order_items')) return { rows:[] };
    if (sql.includes('FROM catalog_variants v')) return { rows:[{
      missing_sku_rates:0, active_skus:0 }] };
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
  async function read() {
    const state = {};
    const res = { writeHead(status) { state.status = status; },
      end(body) { state.body = JSON.parse(body); } };
    const req = { method:'GET', url:'/api/admin/finance',
      headers:{ cookie:`cmd_staff_session=${'9'.repeat(64)}` },
      socket:{ remoteAddress:'test-finance' } };
    await handleApi(db, req, res, '/api/admin/finance');
    return state;
  }
  assert.equal((await read()).status, 200);
  role = 'support';
  assert.equal((await read()).status, 403);
});

test('seller details can stay incomplete and IVA rate requires an exact percent', async () => {
  const writes = [];
  const db = { async query(sql, params) {
    if (sql.includes('FROM staff_sessions')) return { rows:[{ id:'staff-1', role:'owner' }] };
    writes.push([sql, params]);
    return { rowCount:1, rows:[] };
  } };
  async function save(deliveryTaxRateBps) {
    const state = {};
    const res = { writeHead(status) { state.status = status; },
      end(body) { state.body = JSON.parse(body); } };
    const req = { method:'PATCH', url:'/api/admin/finance/settings',
      headers:{ cookie:`cmd_staff_session=${'8'.repeat(64)}` },
      socket:{ remoteAddress:'test-finance-settings' },
      async *[Symbol.asyncIterator]() { yield JSON.stringify({ legalName:'', taxId:'',
        city:'València', contactEmail:'', deliveryTaxRateBps }); } };
    await handleApi(db, req, res, '/api/admin/finance/settings');
    return state;
  }
  assert.equal((await save(10001)).status, 400);
  assert.equal(writes.length, 0);
  assert.equal((await save(null)).status, 200);
  assert.ok(writes.some(([sql, params]) => sql.startsWith('INSERT INTO billing_profile') &&
    params[0] === '' && params[4] === 'València' && params[7] === null));
});
