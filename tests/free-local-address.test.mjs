import test from 'node:test';
import assert from 'node:assert/strict';
import { isFreeLocalDeliveryAddress } from '../shipping-policy.js';
import { checkoutTotals } from '../checkout-model.js';
import { createCheckoutUI } from '../checkout-ui.js';
import { priceQuote } from '../server/pricing.js';
import { verifyDeliveryAddress } from '../server/address-validation.js';

const base = { city: 'València', postcode: '46024', street: 'Carrer de Suïssa', building: '14' };
const lines = [{ productId: 'test', variantId: 'test-1', qty: 1 }];
const variant = { product_id: 'test', variant_id: 'test-1', name: 'Test', label: '1',
  sale_price_cents: 1000, price_accepted: true, sale_status: 'available',
  availability: 'on_hand', stock_quantity: 1, reserved_quantity: 0 };

test('Suïssa 14 and common spellings have free local delivery on both quotes', () => {
  for (const street of ['Suïssa', 'Suissa', 'Suisa', 'Suiza', 'Calle Suiza',
    'C. Suiza', 'Carrer de Suïssa', 'Suiisa', 'Suisas']) {
    const address = { ...base, street };
    assert.equal(isFreeLocalDeliveryAddress(address), true, street);
    assert.equal(checkoutTotals([{ price: 10, qty: 1 }], null, null, address).delivery, 0);
    assert.equal(priceQuote(lines, [variant], null, null, address).deliveryCents, 0);
  }
});

test('other homes, postcodes, cities and streets keep their normal delivery price', () => {
  for (const change of [
    { building: '16' }, { building: '14A' }, { postcode: '46023' },
    { city: 'Madrid' }, { street: 'Calle Suiza Norte' }, { street: 'Calle Suecia' }
  ]) {
    const address = { ...base, ...change };
    assert.equal(isFreeLocalDeliveryAddress(address), false, JSON.stringify(change));
    assert.equal(checkoutTotals([{ price: 10, qty: 1 }], null, null, address).delivery, 3.99);
    assert.equal(priceQuote(lines, [variant], null, null, address).deliveryCents, 399);
  }
  assert.equal(priceQuote(lines, [variant], null, 999, base).deliveryCents, 999);
});

test('owner-confirmed building remains available when CartoCiudad has no portal', async () => {
  const portal = { type: 'portal', address: 'CALLE SUIZA 14, València',
    portalNumber: 14, extension: null, postalCode: '46024', muni: 'València',
    poblacion: 'València', provinceCode: '46', lat: 39.454, lng: -0.352 };
  const verified = await verifyDeliveryAddress({ ...base, street: 'Suisa' }, 'local',
    async () => { throw new Error('CartoCiudad must not be called for this building'); });
  assert.equal(verified.local, true);
  await assert.rejects(verifyDeliveryAddress({ ...base, street: 'Suiza', building: '16' },
    'local', async () => ({ ok: true, json: async () => [portal] })), /не совпали/);
});

test('checkout summary shows the address-specific free delivery before payment', () => {
  const ui = createCheckoutUI({ escape: String, icon: () => '', imageBlock: () => '',
    money: amount => `${amount.toFixed(2)} €`, isReady: () => true,
    getItems: () => [{ productId: 'test', variantId: 'test-1', name: 'Test', qty: 1, price: 10 }],
    getPromo: () => null, applyPromo: () => {}, render: () => {},
    getCheckoutProfile: () => ({ accountId: 'test', deliveryRegion: 'local', ...base }) });
  const html = ui.page();
  assert.match(html, /Доставка по Валенсии и рядом<\/span><strong>Бесплатно/);
  assert.match(html, /10\.00 €/);
});
