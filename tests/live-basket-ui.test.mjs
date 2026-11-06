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
  assert.match(separate, /Сначала оформите товары с обычной доставкой/);
  assert.match(separate, /Заказ 1 - обычная доставка/);
  assert.match(separate, /Заказ 2 - под заказ/);
});

test('unconfirmed availability cannot appear as stock or enter checkout', () => {
  const pendingCart = [{ id: 'food', productId: 'food', variantId: 'food-pending', qty: 1 }];
  const html = renderLiveBasket({ ...helpers, cart: pendingCart, grouping: 'together' });
  assert.match(html, /Недоступно/);
  assert.match(html, /id="checkout"[^>]*disabled/);
  assert.doesNotMatch(html, /Товары в наличии/);
  assert.match(html, /74\.99 €/);
});

test('an accepted QR code remains visible when the basket total is still unknown', () => {
  const pendingCart = [{ id: 'food', productId: 'food', variantId: 'food-pending', qty: 1 }];
  const html = renderLiveBasket({ ...helpers, cart: pendingCart, grouping: 'together',
    promo: { code: 'CMD10-D8E2EYWE', percent: 10 } });
  assert.match(html, /CMD10-D8E2EYWE/);
  assert.match(html, /Промокод принят - скидка 10% будет учтена/);
  assert.match(html, /Итог уточняется/);
});

test('supplier-linked SKU keeps its retail price in the basket but cannot check out yet', () => {
  const pendingSale = { ...product.variants[0], priceStatus: 'temporary',
    serverPriceConfirmed: false, serverSourcingAvailability: 'on_hand' };
  const linkedProduct = { ...product, variants: [pendingSale] };
  const html = renderLiveBasket({ ...helpers, products: [linkedProduct],
    cart: [{ id: 'food', productId: 'food', variantId: 'food-small', qty: 1 }], grouping: 'together' });
  assert.match(html, /Доступно к заказу/);
  assert.match(html, /5\.09 €/);
  assert.match(html, /id="checkout"[^>]*disabled/);
  assert.doesNotMatch(html, /Демонстрационная цена/);
});
