import test from 'node:test';
import assert from 'node:assert/strict';

import { catalogProducts } from '../data.js';
import { applyServerCatalog } from '../server-prices.js';
import { catalogPrice, storefrontPrice } from '../variants.js';

test('supplier and stock status cannot replace a researched Duvo retail price', () => {
  const original = catalogProducts.find(product => product.id === 'yagu-7515812');
  const product = structuredClone(original);
  const products = [product];
  const catalog = [...products];
  const sku = product.variants[0];
  const originalPrice = sku.price;
  assert.equal(originalPrice, 23.76);

  applyServerCatalog(products, catalog, [{
    product_id: product.id, variant_id: sku.id, name: product.name,
    brand: product.brand, category: product.category, pet: product.pet,
    label: sku.label, availability: 'unavailable',
    sourcingAvailability: 'unavailable', source_orderable: false,
    availableForCart: false, price_confirmed: false,
    referencePriceCents: null
  }]);

  assert.equal(sku.serverSourcingAvailability, 'unavailable');
  assert.equal(storefrontPrice(sku), originalPrice);
  assert.equal(catalogPrice(product).amount, originalPrice);
});
