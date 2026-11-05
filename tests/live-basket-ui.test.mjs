import test from 'node:test';
import assert from 'node:assert/strict';
import { basketGroups, renderLiveBasket } from '../live-basket-ui.js';

const product = {
  id: 'food', name: 'Корм для кошек', variants: [
    { id: 'food-small', label: '400 г', price: 5.09, priceStatus: 'confirmed',
      serverPriceConfirmed: true, serverAvailableForCart: true, serverAvailabilityStatus: 'on_hand' },
    { id: 'food-large', label: '4 кг', price: 36.31, priceStatus: 'confirmed',
      serverPriceConfirmed: true, serverAvailableForCart: true, serverAvailabilityStatus: 'source_on_demand' },
    { id: 'food-pending', label: '10 кг', price: 74.99, priceStatus: 'temporary',
      serverPriceConfirmed: false, serverAvailableForCart: false, serverAvailabilityStatus: 'pending' }
  ]
};
const cart = ['food-small', 'food-large'].map(variantId => ({ id: 'food', productId: 'food', variantId, qty: 1 }));
const helpers = { products: [product], promo: null, escape: String, icon: () => '<svg></svg>',
  money: value => `${value.toFixed(2)} €`, imageBlock: () => '<div></div>' };

test('real basket uses server availability and calculates separate delivery per order', () => {
  assert.equal(basketGroups(cart, [product]).stock.length, 1);
  const one = renderLiveBasket({ ...helpers, cart, grouping: 'together' });
  assert.match(one, /Один заказ - одна доставка/);
  assert.match(one, /45\.39 €/);
  const separate = renderLiveBasket({ ...helpers, cart, grouping: 'separate' });
  assert.match(separate, /data-live-checkout-group="stock"/);
  assert.match(separate, /49\.38 €/);
  assert.match(separate, /Сначала оформите товары в наличии/);
  assert.match(separate, /Заказ 1 - в наличии/);
  assert.match(separate, /Заказ 2 - под заказ/);
});

test('unconfirmed availability cannot appear as stock or enter checkout', () => {
  const pendingCart = [{ id: 'food', productId: 'food', variantId: 'food-pending', qty: 1 }];
  const html = renderLiveBasket({ ...helpers, cart: pendingCart, grouping: 'together' });
  assert.match(html, /Наличие и цена уточняются/);
  assert.match(html, /id="checkout"[^>]*disabled/);
  assert.doesNotMatch(html, /Товары в наличии/);
  assert.doesNotMatch(html, /74\.99 €/);
});

test('supplier-linked SKU with a demonstration price can enter the basket but not checkout', () => {
  const pendingSale = { ...product.variants[0], priceStatus: 'temporary',
    serverPriceConfirmed: false, serverSourcingAvailability: 'on_hand' };
  const linkedProduct = { ...product, variants: [pendingSale] };
  const html = renderLiveBasket({ ...helpers, products: [linkedProduct],
    cart: [{ id: 'food', productId: 'food', variantId: 'food-small', qty: 1 }], grouping: 'together' });
  assert.match(html, /В наличии/);
  assert.match(html, /Цена уточняется/);
  assert.match(html, /id="checkout"[^>]*disabled/);
  assert.doesNotMatch(html, /7\.77 €/);
});
