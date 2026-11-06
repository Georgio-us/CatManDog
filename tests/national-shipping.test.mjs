import test from 'node:test';
import assert from 'node:assert/strict';
import { cartParcel, pricedShippingOptions, skuWeightKg } from '../server/national-shipping.js';
import { validateCheckout } from '../checkout-model.js';
import { validateAddress, validateDelivery, priceQuote } from '../server/pricing.js';

test('national parcel sums exact SKU pack weights and quotes the next half-kilogram tier', () => {
  const lines = [
    { productId: 'rc', variantId: 'rc-2kg', qty: 1 },
    { productId: 'churu', variantId: 'churu-4', qty: 3 }
  ];
  const variants = [
    { product_id: 'rc', variant_id: 'rc-2kg', category: 'Корм', label: '2 кг' },
    { product_id: 'churu', variant_id: 'churu-4', category: 'Лакомства',
      label: '4 тюбика × 14 г', package_weight_kg: '0.056' }
  ];
  const quote = cartParcel(lines, variants);
  assert.equal(quote.weightKg, 2.168);
  assert.equal(quote.quoteWeightKg, 2.5);
  assert.equal(quote.parcel.lengthCm, 40);
  assert.equal(skuWeightKg('400 г'), 0.4);
});

test('national delivery does not guess accessory weight from a variant name', () => {
  const quote = cartParcel([{ productId: 'bed', variantId: 'bed-large', qty: 1 }],
    [{ product_id: 'bed', variant_id: 'bed-large', category: 'Игрушки и аксессуары',
      label: 'Большой 2 кг' }]);
  assert.equal(quote.available, false);
  assert.deepEqual(quote.missingVariantIds, ['bed-large']);
});

test('only priced carrier options are accepted', () => {
  assert.deepEqual(pricedShippingOptions([
    { code: 'a', quote: { total_price: { value: '7.25', currency: 'EUR' } } },
    { code: 'b', quote: { total_price: { value: '5.40', currency: 'EUR' } } },
    { code: 'c', quote: null },
    { code: 'd', quote: { total_price: { value: '1', currency: 'USD' } } }
  ]).map(option => [option.code, option.priceCents]), [['b', 540], ['a', 725]]);
});

test('national address and price require the carrier fee while Valencia rules remain intact', () => {
  assert.equal(validateAddress({ city: 'Madrid', postcode: '28001', street: 'Mayor', building: '1' }, 'national'), null);
  assert.ok(validateAddress({ city: 'Madrid', postcode: '28001', street: 'Mayor', building: '1' }, 'slot'));
  assert.equal(validateDelivery({ mode: 'national' }), null);
  assert.equal(validateCheckout({ name:'A', email:'a@b.es', phone:'123456789', deliveryRegion:'national',
    city:'Madrid', postcode:'28001', street:'Mayor', building:'1' }), null);
  const lines = [{ productId:'rc', variantId:'rc-2kg', qty:1 }];
  const variants = [{ product_id:'rc', variant_id:'rc-2kg', label:'2 кг',
    source_price_cents:2909, price_confirmed:true, sale_status:'available', name:'Royal Canin' }];
  assert.equal(priceQuote(lines, variants, null, 725).totalCents, 3634);
  assert.equal(priceQuote(lines, variants).deliveryCents, 399);
});
