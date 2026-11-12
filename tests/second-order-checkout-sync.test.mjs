import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckoutUI } from '../checkout-ui.js';

test('checkout refreshes a coupon activated on another device before payment', async () => {
  const previous = { fetch: globalThis.fetch, FormData: globalThis.FormData,
    location: globalThis.location };
  let promo = null;
  let starts = 0;
  let rendered = 0;
  globalThis.location = { hash: '' };
  globalThis.FormData = class {
    constructor(form) { this.values = form.values; }
    entries() { return Object.entries(this.values)[Symbol.iterator](); }
    has(name) { return Object.hasOwn(this.values, name); }
  };
  globalThis.fetch = async path => {
    if (path === '/api/config') return Response.json({ paymentsEnabled: true, ordersEnabled: true });
    if (path === '/api/checkout/address-check')
      return Response.json({ city: 'València', postcode: '46001', local: true });
    if (path === '/api/checkout/quote') return Response.json({ totalCents: 4899, orderable: true,
      promoCode: 'CMD2-OTHER-DEVICE' });
    if (path === '/api/checkout/start') { starts += 1; throw new Error('Payment should wait for review'); }
    throw new Error(`Unexpected route ${path}`);
  };
  try {
    const ui = createCheckoutUI({ escape: String, icon: () => '', money: value => `${value.toFixed(2)} €`,
      imageBlock: () => '', getItems: () => [{ productId: 'food', variantId: 'food-1',
        name: 'Корм', variant: '1 кг', qty: 1, price: 50 }], isReady: () => true,
      getPromo: () => promo, applyPromo: () => {}, refreshPromo: async () => {
        promo = { code: 'CMD2-OTHER-DEVICE', percent: 10 };
      }, render: () => { rendered += 1; } });
    await ui.initialize();
    ui.submit({ matches: value => value === '[data-checkout-form]',
      querySelector: () => ({ textContent: '' }), values: {
      name: 'Антон', email: 'anton@example.com', phone: '+34 600 000 000', city: 'València',
      postcode: '46001', street: 'Carrer de la Pau', building: '12', deliveryMode: 'scheduled',
      deliveryDate: '2099-10-19', deliveryTime: '18:00' } });
    await new Promise(resolve => setImmediate(resolve));
    ui.click({ hasAttribute: name => name === 'data-checkout-pay', disabled: false });
    for (let i = 0; i < 10 && rendered < 2; i += 1) await new Promise(resolve => setImmediate(resolve));
    assert.equal(starts, 0);
    assert.match(ui.previewPage(), /Скидка обновлена/);
    assert.match(ui.previewPage(), /48\.99 €/);
  } finally {
    Object.assign(globalThis, previous);
  }
});
