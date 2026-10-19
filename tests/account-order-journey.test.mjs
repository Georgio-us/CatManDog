import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../data.js';

test('order detail links status, the original pack, support and item return only for its pet', async () => {
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  globalThis.location = { hash: '#/account/orders/demo-order-1032', href: 'https://example.test/#/account/orders/demo-order-1032' };
  const { createAccountUI } = await import('../account.js?account-order-journey-test');
  const ui = createAccountUI({ escape: String, icon: () => '', money: price => `${price.toFixed(2)} €`,
    products, imageBlock: () => '', render: () => {}, notify: () => {}, getCart: () => [], repeatOrder: () => {} });
  ui.store.open('demo');
  const html = ui.page('/account/orders/demo-order-1032', new URLSearchParams());
  assert.match(html, /Заказ CMD-1032/);
  assert.match(html, /rc-sterilised-2000g/);
  assert.match(html, /#\/support\?order=CMD-1032/);
  assert.match(html, /#\/returns\?order=CMD-1032&amp;product=|#\/returns\?order=CMD-1032&product=/);
  assert.match(html, /aria-current="step"/);
  ui.store.switchPet('demo-margo');
  assert.match(ui.page('/account/orders/demo-order-1032', new URLSearchParams()), /Заказ не найден/);
});
