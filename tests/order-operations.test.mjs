import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeOrder, loadStockCommitments, loadOpenOrderDemand } from '../server/order-operations.js';

const order = {
  number:'CMD-10004', payment_status:'paid', status:'received',
  subtotal_cents:3336, discount_cents:0, delivery_cents:399,
  delivery_tax_rate_bps:null, total_cents:3735
};
const line = overrides => ({ variant_id:'rc-sterilised-2000g', name:'Royal Canin Sterilised 37',
  variant_label:'2 кг', quantity:1, unit_price_cents:2449, source_mode:'open_order',
  tax_rate_bps:1000, stock_quantity:null, reserved_quantity:0,
  purchase_price_cents:2014, catalog_cost_cents:2014,
  catalog_tax_basis:'excludes_iva', catalog_supplier:'Royal Canin',
  offer_cost_cents:null, ...overrides });

test('paid source order shows negative stock position without changing physical stock', () => {
  const result = summarizeOrder(order, [line(),
    line({ variant_id:'yagu-mat', name:'Duvo+', unit_price_cents:678,
      tax_rate_bps:null, purchase_price_cents:null, catalog_cost_cents:null }),
    line({ variant_id:'dentalife', name:'Dentalife', unit_price_cents:209,
      tax_rate_bps:null, purchase_price_cents:null, catalog_cost_cents:null })],
  new Map([['rc-sterilised-2000g',3],['yagu-mat',1],['dentalife',1]]));
  assert.equal(result.items[0].physicalStock, 0);
  assert.equal(result.items[0].orderStockDelta, -1);
  assert.equal(result.items[0].stockPosition, -3);
  assert.equal(result.items[0].taxCents, 223);
  assert.equal(result.items[0].purchaseCostCents, 2014);
  assert.equal(result.items[0].purchaseCostGrossCents, 2215);
  assert.equal(result.purchaseTotalCents, null);
  assert.equal(result.merchandiseSpreadCents, null);
  assert.equal(result.taxComplete, false);
});

test('gross merchandise spread is shown only with complete comparable costs', () => {
  const complete = summarizeOrder({ ...order, subtotal_cents:2449, total_cents:2449,
    delivery_cents:0 }, [line({ purchase_price_cents:null,
    catalog_cost_cents:2000, catalog_tax_basis:'includes_iva' })],
  new Map([['rc-sterilised-2000g',1]]));
  assert.equal(complete.purchaseTotalCents, 2000);
  assert.equal(complete.merchandiseSpreadCents, 449);
  assert.equal(complete.taxTotalCents, 223);
  assert.equal(complete.taxComplete, true);
});

test('explicit test orders stay in history but do not add customer stock demand', async () => {
  const testOrder = summarizeOrder({ ...order, subtotal_cents:2449, total_cents:2449,
    delivery_cents:0, is_test:true }, [line()], new Map());
  assert.equal(testOrder.items[0].orderStockDelta, 0);
  const db = { async query(sql) {
    assert.match(sql, /o\.is_test=false/);
    return { rows:[] };
  } };
  assert.equal((await loadStockCommitments(db)).size, 0);
  assert.deepEqual(await loadOpenOrderDemand(db), []);
});
