import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeOrder, loadStockCommitments, loadOpenOrderDemand,
  loadCommercialPositionAdjustments } from '../server/order-operations.js';

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
      tax_rate_bps:null, purchase_price_cents:null, catalog_cost_cents:null,
      purchase_quote:{ supplier:'Yagu', priceCents:336, taxBasis:'excludes_iva',
        checkedAt:'2026-11-12', orderable:false } }),
    line({ variant_id:'dentalife', name:'Dentalife', unit_price_cents:209,
      tax_rate_bps:null, purchase_price_cents:null, catalog_cost_cents:null })],
  new Map([['rc-sterilised-2000g',3],['yagu-mat',1],['dentalife',1]]));
  assert.equal(result.items[0].physicalStock, 0);
  assert.equal(result.items[0].orderStockDelta, -1);
  assert.equal(result.items[0].stockPosition, -3);
  assert.equal(result.items[0].taxCents, 223);
  assert.equal(result.items[0].purchaseCostCents, 2014);
  assert.equal(result.items[0].purchaseCostGrossCents, 2215);
  assert.equal(result.items[1].purchaseCostCents, null);
  assert.equal(result.items[1].purchaseQuote.priceCents, 336);
  assert.equal(result.items[1].purchaseQuote.orderable, false);
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

test('verified paid batch cost takes precedence over old supplier tariff', () => {
  const result = summarizeOrder({ ...order, subtotal_cents:5490, total_cents:5490,
    delivery_cents:0 }, [line({ variant_id:'heybopet-hb-pwfs-s30s-white',
    unit_price_cents:5490, purchase_price_cents:2650,
    catalog_cost_cents:2650, verified_quantity:20,
    verified_total_cost_cents:58539, verified_document_ref:'HB261112001' })]);
  assert.equal(result.items[0].purchaseCostBasis, 'verified_landed');
  assert.equal(result.items[0].purchaseCostGrossCents, 2927);
  assert.equal(result.items[0].purchaseCostSource, 'HB261112001');
  assert.equal(result.merchandiseSpreadCents, 2563);
  assert.equal(result.costIsEstimate, false);
});

test('matching supplier quotes give the paid order a tax-aware purchase cost', () => {
  const result = summarizeOrder(order, [line(),
    line({ variant_id:'yagu-7515988-catalog-pack', name:'Duvo+', unit_price_cents:678,
      tax_rate_bps:null, current_tax_rate_bps:2100, purchase_price_cents:336,
      catalog_cost_cents:null, purchase_quote:{ supplier:'Yagu', priceCents:336,
        taxBasis:'excludes_iva', orderable:true } }),
    line({ variant_id:'tc-2b64c192f5-reference-pack', name:'Dentalife', unit_price_cents:209,
      tax_rate_bps:null, current_tax_rate_bps:1000, purchase_price_cents:112,
      catalog_cost_cents:null, purchase_quote:{ supplier:'Albet', priceCents:893,
        unitsPerPurchase:8, taxBasis:'excludes_iva', orderable:true } })]);
  assert.equal(result.items[1].purchaseCostGrossCents, 407);
  assert.equal(result.items[1].purchaseCostSource, 'Yagu');
  assert.equal(result.items[2].purchaseCostGrossCents, 123);
  assert.equal(result.items[2].purchaseCostSource, 'Albet');
  assert.equal(result.purchaseTotalCents, 2745);
  assert.equal(result.merchandiseSpreadCents, 591);
  assert.equal(result.taxComplete, false);
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

test('commercial position counts paid units after delivery and reverses physical fulfillment', async () => {
  const db = { async query(sql) {
    assert.match(sql, /o\.payment_status='paid' AND o\.is_test=false/);
    assert.match(sql, /m\.reason='order_fulfilled'/);
    assert.doesNotMatch(sql, /o\.status IN \('received','packing','delivering'\)/);
    return { rows:[{ variant_id:'ordered', adjustment:-1 },
      { variant_id:'delivered', adjustment:0 }] };
  } };
  const positions = await loadCommercialPositionAdjustments(db);
  assert.equal(0 + positions.get('ordered'), -1);
  assert.equal(0 + positions.get('delivered'), 0);
});

test('purchase list shows only the uncovered part of paid demand', async () => {
  const db = { async query(sql) {
    if (sql.includes('SELECT variant_id,sum(delta)')) return { rows:[
      { variant_id:'short', adjustment:-2 }, { variant_id:'covered', adjustment:-1 }] };
    return { rows:[
      { variant_id:'short', name:'Short', physical_stock:1, quantity:2, order_numbers:'CMD-1' },
      { variant_id:'covered', name:'Covered', physical_stock:1, quantity:1,
        order_numbers:'CMD-2' }] };
  } };
  const rows = await loadOpenOrderDemand(db);
  assert.deepEqual(rows.map(row => [row.variant_id, row.stock_position]), [['short', -1]]);
});
