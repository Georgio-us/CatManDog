import test from 'node:test';
import assert from 'node:assert/strict';

import { catalogProducts } from '../data.js';
import { accessoryDetail } from '../accessory-ui.js';
import { matchesHomePrice } from '../home-catalog.js';
import { catalogPrice, cartSku, normalizeCart, sameCartSku, storefrontPrice } from '../variants.js';

const family = catalogProducts.find(product => product.id === 'rc-sterilised');
const euro = amount => `${amount.toFixed(2)} €`;

test('catalogue range and selected variant use storefront prices', () => {
  assert.deepEqual([catalogPrice(family).min, catalogPrice(family).max], [5.09, 74.99]);
  const selected = family.variants.find(variant => variant.id === 'rc-sterilised-4000g');
  assert.equal(storefrontPrice(selected), 36.31);
  assert.equal(matchesHomePrice(family, 28), true); // 400 g is available below this limit
  const twoKgOnly = { variants: [family.variants.find(variant => variant.id === 'rc-sterilised-2000g')] };
  assert.equal(matchesHomePrice(twoKgOnly, 28), false); // A lower competitor offer must not pass the storefront filter
});

test('product detail shows the chosen price and keeps researched offers separate', () => {
  globalThis.location = { hostname: 'localhost' };
  const html = accessoryDetail(family, {
    crumbs: () => '', imageBlock: () => '', escape: String, icon: () => '',
    favorites: [], goodTogether: () => '', money: euro, variantId: 'rc-sterilised-4000g'
  });
  assert.match(html, /Фасовка: 4 кг|Вес: 4 кг|Вариант: 4 кг/);
  assert.match(html, /<div class="detail-price">36\.31 €<\/div>/);
  assert.match(html, /Precios observados en otras tiendas/);
  assert.doesNotMatch(html, /<div class="detail-price">36\.31 € - 36\.49 €<\/div>/);
});

test('Sterilised 37 shows live variant availability without publishing unconfirmed stock or prices', () => {
  globalThis.location = { hostname: 'localhost' };
  const product = structuredClone(family);
  const states = ['on_hand', 'on_hand', 'source_on_demand', 'unavailable'];
  for (const [index, variant] of product.variants.entries()) {
    variant.serverAvailabilityStatus = states[index];
    variant.availabilityStatus = states[index];
    variant.serverPriceConfirmed = index !== 2;
    variant.serverSourceOrderable = true;
  }
  const helpers = {
    crumbs: () => '', imageBlock: () => '', escape: String, icon: () => '',
    favorites: [], goodTogether: () => '', money: euro, language: 'ru'
  };
  const stock = accessoryDetail(product, { ...helpers, variantId: product.variants[0].id });
  assert.match(stock, /400 г<\/strong><small>В наличии<\/small>/);
  assert.match(stock, /4 кг<\/strong><small>Наличие уточняется<\/small>/);
  assert.match(stock, /10 кг<\/strong><small>Нет в наличии<\/small>/);
  assert.match(stock, /data-buy="rc-sterilised"[^>]*>Добавить в корзину/);

  const unconfirmed = accessoryDetail(product, { ...helpers, variantId: product.variants[2].id });
  assert.match(unconfirmed, /<div class="detail-price">7\.77 €<\/div>/);
  assert.match(unconfirmed, /Демонстрационная цена/);
  assert.match(unconfirmed, /<button class="button" disabled>Наличие уточняется/);
  assert.doesNotMatch(unconfirmed, /data-buy="rc-sterilised"/);
});

test('cart keeps distinct variants and an exact unit price', () => {
  const items = normalizeCart([
    { productId: family.id, variantId: 'rc-sterilised-4000g', size: '4 кг', qty: 2 },
    { productId: family.id, variantId: 'rc-sterilised-2000g', size: '2 кг', qty: 1 }
  ], catalogProducts);
  assert.equal(items[0].variantLabel, '4 кг');
  assert.equal(items[0].variantId, 'rc-sterilised-4000g');
  assert.equal(storefrontPrice(cartSku(items[0], catalogProducts)) * items[0].qty, 72.62);
  assert.equal(sameCartSku(items[0], items[1]), false);
});

test('legacy cart without a known pack never silently chooses a default', () => {
  const [unresolved] = normalizeCart([{ productId: family.id, size: '', qty: 1 }], catalogProducts);
  assert.equal(unresolved.needsVariantSelection, true);
  assert.equal(cartSku(unresolved, catalogProducts), null);
  const [known] = normalizeCart([{ productId: family.id, size: '4 кг', qty: 1 }], catalogProducts);
  assert.equal(known.variantId, 'rc-sterilised-4000g');
});
