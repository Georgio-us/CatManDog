import test from 'node:test';
import assert from 'node:assert/strict';
import { cartParcel, nationalShippingQuote, pricedShippingOptions, skuWeightKg } from '../server/national-shipping.js';
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
    { code: 'a', functionalities: { last_mile:'home_delivery' },
      quotes: [{ price: { total: { value: '7.25', currency: 'EUR' } } }] },
    { code: 'b', functionalities: { last_mile:'home_delivery' },
      quotes: [{ price: { total: { value: '5.40', currency: 'EUR' } } }] },
    { code: 'c', functionalities: { last_mile:'home_delivery' }, quote: null },
    { code: 'd', functionalities: { last_mile:'home_delivery' },
      quote: { total_price: { value: '1', currency: 'USD' } } },
    { code: 'pickup', functionalities: { last_mile:'service_point' },
      quotes: [{ price: { total: { value: '2', currency: 'EUR' } } }] }
  ]).map(option => [option.code, option.priceCents]), [['b', 540], ['a', 725]]);
  assert.deepEqual(pricedShippingOptions([{ code: 'volumetric',
    functionalities: { last_mile:'home_delivery' },
    parcel_billed_weights: [{ value:'4.001', volumetric:true }],
    quotes: [{ weight: { min: { value:'4.001' }, max: { value:'5.001' } },
      price: { total: { value:'6.31', currency:'EUR' } } }] }
  ])[0].priceCents, 631);
});

test('national quote exposes the assumed parcel size and keeps it unverified', async () => {
  const before = { public:process.env.SENDCLOUD_PUBLIC_KEY, secret:process.env.SENDCLOUD_SECRET_KEY };
  process.env.SENDCLOUD_PUBLIC_KEY = 'test-public';
  process.env.SENDCLOUD_SECRET_KEY = 'test-secret';
  try {
    const quote = await nationalShippingQuote({ postalCode:'28001',
      lines:[{ productId:'rc', variantId:'rc-2kg', qty:1 }],
      variants:[{ product_id:'rc', variant_id:'rc-2kg', category:'Корм', label:'2 кг' }],
      quoteOptions:async input => {
        assert.deepEqual(input.parcels, [{ weightKg:2.5, lengthCm:40, widthCm:30, heightCm:20 }]);
        return [{ code:'carrier', carrier_name:'Carrier',
          functionalities:{ last_mile:'home_delivery' },
          quotes:[{ price:{ total:{ value:'7.25', currency:'EUR' } } }] }];
      } });
    assert.equal(quote.available, true);
    assert.equal(quote.deliveryCents, 725);
    assert.equal(quote.packagingVerified, false);
    assert.deepEqual(quote.parcel, { weightKg:2.5, lengthCm:40, widthCm:30, heightCm:20 });
  } finally {
    if (before.public === undefined) delete process.env.SENDCLOUD_PUBLIC_KEY;
    else process.env.SENDCLOUD_PUBLIC_KEY = before.public;
    if (before.secret === undefined) delete process.env.SENDCLOUD_SECRET_KEY;
    else process.env.SENDCLOUD_SECRET_KEY = before.secret;
  }
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
