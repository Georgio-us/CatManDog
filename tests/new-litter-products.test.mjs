import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../data.js';
import { catalogRows } from '../server/catalog.js';
import { salePriceDecision } from '../server/sale-price-policy.js';
import { priceQuote } from '../server/pricing.js';
import { esProductText } from '../locales/product-es.js';
import { ukProductNames } from '../locales/uk-product-names.js';
import { ukProductCopy } from '../locales/uk-product-copy.js';
import { esDetails } from '../locales/details-es.js';
import { ukDetails } from '../locales/uk-details.js';
import { seoProducts } from '../seo-products.js';

const expected = new Map([
  ['cat-litter-yommy-tofu-lavanda-6l', 999],
  ['cat-litter-uniko-tofu-18l', 1999],
  ['cat-litter-yommy-tofu-pl-6l', 999],
  ['cat-litter-sanicat-clumping-unscented-8l', 799]
]);

test('four new litter formats have approved retail prices and complete local copy', () => {
  for (const [id, cents] of expected) {
    const product = products.find(item => item.id === id);
    assert.ok(product, id);
    assert.equal(product.pet, 'cat');
    assert.equal(product.category, 'Наполнитель');
    assert.deepEqual(product.image, { placeholder: true });
    assert.ok(esProductText[product.name]);
    assert.ok(esProductText[product.description]);
    assert.ok(ukProductNames[product.name]);
    assert.ok(ukProductCopy(product.description));
    for (const detail of product.details) {
      assert.ok(esDetails[detail], detail);
      assert.ok(ukDetails[detail], detail);
    }
    const row = catalogRows([product])[0];
    assert.equal(row.variant.sourcePriceCents, cents);
    assert.equal(row.variant.sourceOrderable, true);
    assert.equal(row.variant.source.purchasePrice, undefined);
    assert.equal(row.variant.source.saleStatus, 'available');
    assert.equal(seoProducts.find(item => item.id === id)?.indexable, false);
  }
  assert.ok(products.some(item => item.id === 'yagu-2170004'));
});

test('approved litter prices allow a four-item checkout quote', () => {
  const variants = [...expected].map(([id, price]) => {
    const product = products.find(item => item.id === id);
    const variant = product.variants[0];
    const row = {
      product_id: id, variant_id: variant.id, name: product.name,
      label: variant.label, source_price_cents: price, price_override_cents: null,
      price_confirmed: true, sale_status: 'available', availability: 'source_on_demand',
      stock_quantity: 0, reserved_quantity: 0, committed_quantity: 0
    };
    assert.equal(salePriceDecision(row).accepted, true);
    return row;
  });
  const lines = variants.map(row => ({ productId: row.product_id, variantId: row.variant_id, qty: 1 }));
  const quote = priceQuote(lines, variants);
  assert.equal(quote.subtotalCents, 4796);
  assert.equal(quote.orderable, true);
  assert.ok(quote.items.every(item => item.sourceMode === 'open_order'));
});
