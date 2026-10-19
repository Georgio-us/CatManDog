import test from 'node:test';
import assert from 'node:assert/strict';

import { createCheckoutUI } from '../checkout-ui.js';
import { orderProgress, orderVariantId } from '../order-progress.js';
import { products } from '../data.js';

const helpers = { escape: String, icon: () => '', money: value => `${value.toFixed(2)} €`, imageBlock: () => '',
  getItems: () => [{ productId: 'rc-sterilised', variantId: 'rc-sterilised-4000g', name: 'Royal Canin Sterilised 37', variant: '4 кг', qty: 2, price: 36.31 }],
  isReady: () => true, getPromo: () => null, applyPromo: () => {}, render: () => {} };

test('order progress distinguishes current and completed steps', () => {
  const html = orderProgress('packing', { icon: () => '<svg></svg>', escape: String });
  assert.match(html, /class="completed"/);
  assert.match(html, /class="current" aria-current="step"/);
  assert.match(html, /Собираем заказ/);
});

test('old demo orders resolve their original pack instead of the default pack', () => {
  assert.equal(orderVariantId(products, { productId: 'rc-sterilised', size: '2 кг' }), 'rc-sterilised-2000g');
  assert.equal(orderVariantId(products, { productId: 'rc-sterilised', size: 'неизвестно' }), null);
});

test('confirmation and payment error remain explicitly simulated', () => {
  const OriginalFormData = globalThis.FormData;
  const originalLocation = globalThis.location;
  globalThis.location = { hash: '' };
  globalThis.FormData = class {
    constructor(form) { this.values = form.values; }
    entries() { return Object.entries(this.values)[Symbol.iterator](); }
    has(name) { return Object.hasOwn(this.values, name); }
  };
  try {
    const ui = createCheckoutUI(helpers);
    assert.match(ui.resultPage('accepted'), /Сначала проверьте заказ/);
    const form = { values: { name: 'Антон', email: 'anton@example.com', phone: '+34 600 000 000',
      city: 'València', postcode: '46001', street: 'Carrer de la Pau', building: '12',
      deliveryMode: 'scheduled', deliveryDate: '2099-10-19', deliveryTime: '18:00' },
      matches: selector => selector === '[data-checkout-form]' };
    ui.submit(form);
    assert.equal(location.hash, '/checkout/preview');
    assert.match(ui.previewPage(), /Пример подтверждения/);
    ui.click({ hasAttribute: name => name === 'data-checkout-state', dataset: { checkoutState: 'accepted' } });
    assert.equal(location.hash, '/checkout/confirmation');
    const confirmation = ui.resultPage('accepted');
    assert.match(confirmation, /Заказ не отправлен, оплата не проведена/);
    const demoNumber = confirmation.match(/Демонстрационный заказ (DEMO-\d+)/)?.[1];
    assert.ok(demoNumber);
    const returnForm = ui.servicePage('return', new URLSearchParams({ order: demoNumber }));
    assert.match(returnForm, /href="#\/checkout\/status"/);
    assert.match(returnForm, /Royal Canin Sterilised 37 · 4 кг/);
    assert.match(ui.resultPage('status'), /Статус заказа/);
    ui.click({ hasAttribute: name => name === 'data-checkout-state', dataset: { checkoutState: 'failed' } });
    assert.equal(location.hash, '/checkout/payment-error');
    assert.match(ui.resultPage('failed'), /списания не было/);
    assert.match(ui.resultPage('accepted'), /Сначала проверьте заказ/);
  } finally {
    globalThis.FormData = OriginalFormData;
    globalThis.location = originalLocation;
  }
});

test('support and return forms use the chosen account order and variant', () => {
  const order = { id: 'order-1', number: 'DEMO-123', items: [
    { productId: 'rc-sterilised', variantId: 'rc-sterilised-4000g', qty: 2 },
    { productId: 'toy-mouse', variantId: null, qty: 1 }
  ] };
  const ui = createCheckoutUI({ ...helpers,
    findOrder: number => number === order.number ? order : null,
    productLabel: item => item.variantId ? 'Royal Canin · 4 кг' : 'Игрушка-мышка' });
  const params = new URLSearchParams({ order: order.number, product: 'rc-sterilised|rc-sterilised-4000g' });
  const html = ui.servicePage('return', params);
  assert.match(html, /href="#\/account\/orders\/order-1"/);
  assert.match(html, /value="DEMO-123"/);
  assert.match(html, /Royal Canin · 4 кг/);
  assert.match(html, /selected>Royal Canin · 4 кг/);
  assert.match(html, /name="quantity" min="1" max="2"/);
  assert.match(ui.servicePage('support', params), /Весь заказ/);
});
