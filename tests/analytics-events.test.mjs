import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsItem, announceCommerce } from '../analytics-events.js';

test('commerce item reports exact SKU without presenting a pending price as revenue', () => {
  const product = { id: 'cat-food', name: 'Корм', brand: 'Leonardo', pet: 'cat', category: 'Корм', foodType: 'dry',
    variants: [{ id: 'cat-food-2kg', name: 'Корм 2 кг', price: 19.99, priceStatus: 'pending' }] };
  assert.deepEqual(analyticsItem(product, product.variants[0], 2), {
    item_id: 'cat-food-2kg', item_name: 'Корм 2 кг', item_brand: 'Leonardo',
    item_category: 'cat', item_category2: 'dry-food', quantity: 2
  });
  product.variants[0] = { ...product.variants[0], price: 24.9, priceStatus: 'confirmed' };
  assert.equal(analyticsItem(product, product.variants[0]).price, 24.9);
});

test('commerce announcements stay in memory and contain no customer fields', () => {
  const previousWindow = globalThis.window;
  const received = [];
  globalThis.window = { dispatchEvent: event => received.push(event.detail) };
  try {
    announceCommerce('add_to_cart', [{ item_id: 'sku-1', quantity: 1 }]);
    assert.deepEqual(received, [{ event: 'add_to_cart', ecommerce: {
      currency: 'EUR', items: [{ item_id: 'sku-1', quantity: 1 }]
    } }]);
    assert.equal(JSON.stringify(received).includes('email'), false);
  } finally { globalThis.window = previousWindow; }
});
