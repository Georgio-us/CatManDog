import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { products } from '../data.js';
import { catalogRows } from '../server/catalog.js';
import { churuPurchaseUnit, churuRetailFormats } from '../churu-retail-formats.js';
import { normalizeCart, sameCartSku, storefrontPrice } from '../variants.js';

test('Churu purchase cartons map to distinct retail formats and approved prices', () => {
  const selected = products.filter(product => product.brand === 'Churu' &&
    product.variants?.some(variant => variant.retailFormat));
  assert.equal(selected.length, 5);
  const cases = selected.filter(product => product.id.startsWith('tc-'));
  assert.equal(cases.length, 4);
  for (const product of cases) {
    assert.deepEqual(product.variants.map(variant => [variant.retailFormat.units,
      Math.round(variant.price * 100)]), [[4,329],[1,89],[48,3699]]);
    assert.equal(product.variants[0].ean?.length, 13);
    assert.equal(product.variants[1].ean, null);
    assert.equal(product.variants[2].ean, null);
    assert.equal(churuPurchaseUnit[product.variants[0].retailFormat.sourceItemId.split(':').at(-1)].sticks, 48);
    assert.deepEqual(product.variants.map(variant => variant.retailFormat.sourceUnitsPerPurchaseUnit),
      [48,48,48]);
    assert.equal(product.variants[1].availabilityStatus, 'unavailable');
    for (const variant of product.variants.slice(1)) {
      assert.ok(variant.image.src.startsWith('/media/churu-formats-2026-11-05/'));
      assert.ok(existsSync(new URL(`..${variant.image.src}`, import.meta.url)));
    }
  }
  const mixed = selected.find(product => product.id === 'cmd-source-694e05cdc1b2582c');
  assert.deepEqual(mixed.variants.map(variant => [variant.retailFormat.units,
    Math.round(variant.price * 100)]), [[20,1449],[1,89],[1,89]]);
  assert.equal(mixed.variants[1].retailFormat.sourceUnitsPerPurchaseUnit, 10);
  assert.equal(mixed.variants[2].retailFormat.sourceUnitsPerPurchaseUnit, 10);
  assert.equal(mixed.variants[0].retailFormat.sourceUnitsPerPurchaseUnit, 20);
  assert.ok(mixed.variants.slice(1).every(variant => variant.availabilityStatus === 'unavailable'));
  assert.ok(mixed.variants.slice(1).every(variant =>
    existsSync(new URL(`..${variant.image.src}`, import.meta.url))));
  assert.equal(churuPurchaseUnit['949577'].wholesaleCents, 834);
  assert.equal(churuRetailFormats.stick.priceCents * 4, 356);
  assert.ok(churuRetailFormats.pack4.priceCents < 356);
  assert.ok(churuRetailFormats.carton48.priceCents < 12 * churuRetailFormats.pack4.priceCents);
});

test('Churu retail formats import as separate customer SKUs without changing supplier costs', () => {
  const rows = catalogRows().filter(row => row.variant.source.retailFormat);
  assert.equal(rows.length, 15);
  assert.equal(new Set(rows.map(row => row.variant.id)).size, 15);
  assert.equal(rows.find(row => row.variant.id === 'cmd-source-sku-9c96bc24c8863222')
    .variant.sourcePriceCents, 1449);
  assert.equal(churuPurchaseUnit['940001'].wholesaleCents, 2112);
});

test('basket keeps loose sticks, sealed packs and whole cartons distinct', () => {
  const product = products.find(item => item.id === 'tc-4e50c58957');
  const lines = normalizeCart(product.variants.map(variant => ({
    productId: product.id, variantId: variant.id, size: variant.label, qty: 1
  })), products);
  assert.equal(lines.length, 3);
  assert.equal(lines.some((line, index) => lines.slice(index + 1)
    .some(other => sameCartSku(line, other))), false);
  assert.deepEqual(lines.map(line => storefrontPrice(product.variants.find(
    variant => variant.id === line.variantId))), [3.29,0.89,36.99]);
});
