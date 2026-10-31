import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoyalCaninFlow } from '../rc-sterilised-flow.js';
import { availabilityScenarioDetail } from '../availability-scenario.js';

const product = {
  id: 'rc-sterilised', name: 'Royal Canin Sterilised 37', brand: 'Royal Canin',
  image: 0, variants: [
    { id: 'rc-sterilised-400g', label: '400 г', price: 5.09 },
    { id: 'rc-sterilised-2000g', label: '2 кг', price: 25.86 },
    { id: 'rc-sterilised-4000g', label: '4 кг', price: 36.31 },
    { id: 'rc-sterilised-10000g', label: '10 кг', price: 74.99 }
  ]
};

function setup() {
  const saved = new Map();
  globalThis.sessionStorage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  globalThis.location = { hash: '' };
  const flow = createRoyalCaninFlow({ products: [product], escape: value => String(value ?? ''),
    icon: name => `<svg data-icon="${name}"></svg>`, money: value => `${value.toFixed(2)} €`,
    imageBlock: () => '<div class="product-image"></div>', locale: () => 'ru', render: () => {} });
  const button = dataset => ({ dataset, hasAttribute: key => key in dataset });
  return { flow, button, saved };
}

test('Sterilised 37 flow is isolated and covers basket, delivery and payment', () => {
  const { flow, button, saved } = setup();
  flow.click(button({ 'data-rc-flow-add': true, rcFlowAdd: 'rc-sterilised-400g' }), 2);
  assert.equal(location.hash, '/rc-order/basket');
  assert.match(flow.page('/rc-order/basket'), /400 г/);
  assert.match(flow.page('/rc-order/basket'), /10\.18 €/);
  flow.click(button({ 'data-rc-next': true, rcNext: 'delivery' }));
  assert.match(flow.page('/rc-order/delivery'), /10:00-14:00/);
  flow.update({ dataset: { rcField: 'street' }, value: 'Carrer de la Pau', type: 'text', hasAttribute: key => key === 'data-rc-field' });
  flow.click(button({ 'data-rc-next': true, rcNext: 'payment' }));
  assert.match(flow.page('/rc-order/payment'), /Carrer de la Pau/);
  assert.equal(saved.has('catmandog-cart'), false);
  assert.equal(saved.has('catmandog-rc-order-v1'), true);
});

test('4 kg has supplier timing and 10 kg opens sourcing request', () => {
  const { flow, button } = setup();
  flow.click(button({ 'data-rc-flow-add': true, rcFlowAdd: 'rc-sterilised-4000g' }), 1);
  assert.match(flow.page('/rc-order/basket'), /24-48/);
  assert.match(flow.page('/rc-order/delivery'), /поставщика/);
  flow.click(button({ 'data-rc-flow-request': true, rcFlowRequest: 'rc-sterilised-10000g' }));
  assert.equal(location.hash, '/rc-order/request');
  assert.match(flow.page('/rc-order/request'), /10 кг/);
});

test('mixed basket compares one and two deliveries before payment', () => {
  const { flow, button, saved } = setup();
  flow.click(button({ 'data-rc-flow-add': true, rcFlowAdd: 'rc-sterilised-400g' }), 1);
  flow.click(button({ 'data-rc-flow-add': true, rcFlowAdd: 'rc-sterilised-4000g' }), 1);
  const together = flow.page('/rc-order/basket');
  assert.match(together, /Одной доставкой/);
  assert.match(together, /Двумя доставками/);
  assert.match(together, /45\.39 €/);
  assert.match(flow.page('/rc-order/delivery'), /Все товары одной доставкой/);
  flow.update({ dataset: { rcField: 'deliveryGrouping' }, value: 'separate', type: 'radio', checked: true,
    hasAttribute: key => key === 'data-rc-field' });
  assert.equal(saved.get('catmandog-rc-delivery-grouping-v1'), 'separate');
  const separate = flow.page('/rc-order/basket');
  assert.match(separate, /49\.38 €/);
  assert.match(separate, /Доставка товара в наличии/);
  assert.match(separate, /Доставка товара под заказ/);
  assert.match(flow.page('/rc-order/delivery'), /Удобное время для товара в наличии/);
  assert.match(flow.page('/rc-order/delivery'), /Поставщик|поставщика/);
  assert.match(flow.page('/rc-order/payment'), /49\.38 €/);
  flow.click(button({ 'data-rc-pay': true }));
  const complete = flow.page('/rc-order/complete');
  assert.match(complete, /Заказы приняты/);
  assert.doesNotMatch(complete, /Фасовка есть в наличии/);
  assert.doesNotMatch(complete, /Оформить ещё один вариант/);
});

test('only special product URL enables isolated actions', () => {
  const helpers = { crumbs: () => '', imageBlock: () => '', escape: String, icon: () => '',
    favorites: [], money: value => `${value} €`, variantId: 'rc-sterilised-10000g', language: 'ru' };
  assert.match(availabilityScenarioDetail(product, { ...helpers, flowEnabled: true }), /data-rc-flow-request/);
  assert.doesNotMatch(availabilityScenarioDetail(product, helpers), /data-rc-flow-request/);
  assert.match(availabilityScenarioDetail(product, { ...helpers, variantId: 'rc-sterilised-400g', flowEnabled: true }), /data-rc-flow-add/);
});
