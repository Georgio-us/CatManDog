import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
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
  ['cat-litter-yommy-tofu-lavanda-6l-pack', 999],
  ['cat-litter-yommy-tofu-verde-6l-pack', 999],
  ['cat-litter-uniko-tofu-6l-pack', 999],
  ['cat-litter-uniko-tofu-18l-pack', 1999],
  ['cat-litter-sanicat-clumping-unscented-8l-pack', 799]
]);

test('five photographed litter formats have distinct SKU prices and translated copy', async () => {
  const families = products.filter(item => item.id.startsWith('cat-litter-'));
  assert.equal(families.length, 3);
  assert.equal(families.flatMap(item => item.variants).length, 5);
  for (const product of families) {
    assert.equal(product.pet, 'cat');
    assert.equal(product.category, 'Наполнитель');
    assert.ok(esProductText[product.name]);
    assert.ok(esProductText[product.description]);
    assert.ok(ukProductNames[product.name]);
    assert.ok(ukProductCopy(product.description));
    assert.equal(seoProducts.find(item => item.id === product.id)?.indexable, false);
    for (const row of catalogRows([product])) {
      const variant = row.variant.source;
      assert.equal(row.variant.sourcePriceCents, expected.get(variant.id));
      assert.equal(row.variant.sourceOrderable, true);
      assert.equal(variant.purchasePrice, undefined);
      assert.equal(variant.saleStatus, 'available');
      assert.ok(esProductText[variant.description]);
      assert.ok(ukProductCopy(variant.description));
      for (const detail of variant.details) {
        assert.ok(esDetails[detail], detail);
        assert.ok(ukDetails[detail], detail);
      }
      assert.ok(variant.image.src.includes('/media/litter-2026-11-21/'));
      assert.ok((await stat(new URL(`../${variant.image.src.slice(1)}`, import.meta.url))).size > 100_000);
    }
  }
  assert.ok(products.some(item => item.id === 'yagu-2170004'));
  assert.ok(!products.some(item => item.id === 'cat-litter-yommy-tofu-pl-6l'));
});

test('all five litter SKUs can be quoted without using supplier costs', () => {
  const variants = products.filter(item => item.id.startsWith('cat-litter-'))
    .flatMap(product => product.variants.map(variant => ({
      product_id: product.id, variant_id: variant.id, name: product.name,
      label: variant.label, source_price_cents: expected.get(variant.id),
      price_override_cents: null, price_confirmed: true,
      sale_status: 'available', availability: 'source_on_demand',
      stock_quantity: 0, reserved_quantity: 0, committed_quantity: 0
    })));
  for (const row of variants) assert.equal(salePriceDecision(row).accepted, true);
  const lines = variants.map(row => ({ productId: row.product_id, variantId: row.variant_id, qty: 1 }));
  const quote = priceQuote(lines, variants);
  assert.equal(quote.subtotalCents, 5795);
  assert.equal(quote.orderable, true);
  assert.ok(quote.items.every(item => item.sourceMode === 'open_order'));
});
