import test from 'node:test';
import assert from 'node:assert/strict';
import { matchedPrice, retailUnits } from '../server/matched-pricing.js';

const base = { variant_id: 'sku', brand: 'Royal Canin', shop_price_tax_basis: 'excludes_iva',
  retail_price_tax_basis: 'includes_iva', recommended_price_cents: null };

test('supplier case price is divided by retail units before markup', () => {
  assert.equal(retailUnits('12 x 85 gr', '85 г'), 12);
  assert.deepEqual(matchedPrice({ ...base, weight: '12 x 85 gr', site_label: '85 г',
    shop_price_cents: 1392 }), { priceCents: 156, basis: 'cost_plus_20', retailUnits: 12 });
  assert.deepEqual(matchedPrice({ ...base, brand: 'ACANA', weight: '2.04 kg',
    site_label: '85 г', shop_price_cents: 2698 }),
  { priceCents: 151, basis: 'cost_plus_20', retailUnits: 24 });
});

test('unit price stays per bag and unknown unit relationship is not priced', () => {
  assert.equal(retailUnits('2 kg', '2 кг'), 1);
  assert.equal(matchedPrice({ ...base, weight: '2 kg', site_label: '2 кг',
    shop_price_cents: 2014 }).priceCents, 2693);
  assert.equal(matchedPrice({ ...base, weight: '', site_label: '2 кг',
    shop_price_cents: 2014 }), null);
  assert.equal(matchedPrice({ ...base, brand: 'ACANA', weight: '',
    source_name: 'ACANA INDOOR CAT 1,8KG', site_label: '1,8 кг',
    shop_price_cents: 2918 }).priceCents, 3901);
});

test('supplier consumer PVP is used without treating an advisory shop price as cost', () => {
  assert.deepEqual(matchedPrice({ ...base, brand: 'Ownat', weight: '3 kg',
    site_label: '3 кг', shop_price_cents: 1385, recommended_price_cents: 2343 }),
  { priceCents: 2343, basis: 'supplier_pvp', retailUnits: 1 });
  assert.equal(matchedPrice({ ...base, brand: 'Ownat', weight: '3 kg',
    site_label: '3 кг', shop_price_cents: 1385,
    retail_price_tax_basis: 'unknown' }), null);
});
