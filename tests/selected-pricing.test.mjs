import test from 'node:test';
import assert from 'node:assert/strict';
import { selectedPrice } from '../server/selected-pricing.js';

const base = {
  variant_id: 'sku', retail_units_per_purchase_unit: 1,
  shop_price_cents: 2014, brand: 'Royal Canin', article: '2537200',
  recommended_price_cents: null, retail_price_tax_basis: 'unknown'
};

test('calculates a retail price from the tax-inclusive purchase cost', () => {
  assert.deepEqual(selectedPrice(base), {
    priceCents: 2693, grossUnitCostCents: 2244,
    basis: 'cost_plus_20', belowReference: false
  });
});

test('uses a supplier consumer PVP and the single wet pouch unit', () => {
  assert.deepEqual(selectedPrice({ ...base, brand: 'Leonardo', article: '756315',
    shop_price_cents: 93, retail_units_per_purchase_unit: 16,
    recommended_price_cents: 145, retail_price_tax_basis: 'includes_iva' }), {
    priceCents: 145, grossUnitCostCents: 104,
    basis: 'supplier_pvp', belowReference: false
  });
});

test('uses recorded Albet Churu references for a box and for the 20-pack', () => {
  assert.equal(selectedPrice({ ...base, brand: 'Churu', article: '940001',
    shop_price_cents: 2112, retail_units_per_purchase_unit: 12 }).priceCents, 329);
  assert.equal(selectedPrice({ ...base, brand: 'Churu', article: '949577',
    shop_price_cents: 834, retail_units_per_purchase_unit: null }).priceCents, 1529);
});

test('does not price an unmatched SKU or a SKU without purchase cost', () => {
  assert.equal(selectedPrice({ ...base, variant_id: null }), null);
  assert.equal(selectedPrice({ ...base, shop_price_cents: null }), null);
});
