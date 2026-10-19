import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckoutUI } from '../checkout-ui.js';

test('return request sends the selected item and message while leaving the photo local', async () => {
  const previous = { fetch: globalThis.fetch, FormData: globalThis.FormData,
    location: globalThis.location, document: globalThis.document };
  const sent = [];
  globalThis.location = { hash: '#/returns?order=CMD-10042' };
  globalThis.document = { getElementById: () => ({ scrollIntoView() {} }) };
  globalThis.FormData = class {
    constructor(form) { this.values = form.values; }
    entries() { return Object.entries(this.values)[Symbol.iterator](); }
  };
  globalThis.fetch = async (path, options) => {
    if (path === '/api/config') return Response.json({ supportEnabled: true });
    if (path === '/api/service-requests') {
      sent.push(JSON.parse(options.body));
      return Response.json({ accepted: true, id: 'request-1' }, { status: 202 });
    }
    throw new Error(`Unexpected path: ${path}`);
  };
  try {
    const ui = createCheckoutUI({ escape: String, icon: () => '', money: String,
      imageBlock: () => '', getItems: () => [], isReady: () => true,
      getPromo: () => null, applyPromo: () => {}, render: () => {} });
    await ui.initialize();
    const form = { matches: selector => selector === '[data-service-form]',
      dataset: { serviceForm: 'return' },
      values: { orderNumber: 'CMD-10042', email: 'pet@example.test', product: 'Корм · 4 кг',
        quantity: '1', message: 'Пожалуйста, помогите с возвратом упаковки' },
      elements: { product: { selectedOptions: [{ dataset: { productId: 'food', variantId: 'food-4kg' } }] },
        photo: { files: [{ name: 'photo.jpg' }] } } };
    ui.submit(form);
    assert.match(ui.servicePage('return', new URLSearchParams({ order: 'CMD-10042' })), /data-service-send/);
    assert.equal(sent.length, 0);
    ui.click({ hasAttribute: name => name === 'data-service-send', disabled: false });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(sent.length, 1);
    assert.equal(sent[0].productId, 'food');
    assert.equal(sent[0].variantId, 'food-4kg');
    assert.equal(sent[0].quantity, 1);
    assert.match(sent[0].message, /Корм · 4 кг/);
    assert.equal(JSON.stringify(sent[0]).includes('photo.jpg'), false);
    assert.match(ui.servicePage('return', new URLSearchParams({ order: 'CMD-10042' })), /Обращение отправлено/);
  } finally {
    Object.assign(globalThis, previous);
  }
});
