import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { products } from '../data.js';
import { catalogRows } from '../server/catalog.js';
import { yaguToyExpansionEs, yaguToyExpansionUk } from '../locales/yagu-toy-expansion.js';
import { productHref } from '../seo-products.js';
import { salePriceDecision } from '../server/sale-price-policy.js';

const skus = ['7521059', '7521060', '7517033', '7517023', '7512843',
  '7571304', '7571301', '7571305', '7571300', '7571319'];

test('new Yagu toys have one exact sale unit, supplier cost, price and studio asset', () => {
  const rows = catalogRows(products);
  for (const sku of skus) {
    const matches = rows.filter(row => row.variant.source.supplier?.sku === sku);
    assert.equal(matches.length, 1, `SKU ${sku} appears once`);
    const [{ product, variant }] = matches;
    assert.equal(variant.source.purchaseUnit.retailPacks, 1);
    assert.equal(variant.source.purchaseUnit.piecesPerPack, sku === '7517023' ? 2 : 1);
    assert.ok(variant.source.purchasePrice > 0);
    assert.notEqual(variant.source.purchasePrice, variant.source.price);
    assert.equal(variant.source.retailPrice.taxIncluded, true);
    assert.equal(variant.source.saleStatus, 'available');
    assert.equal(variant.source.availabilityStatus, 'source_on_demand');
    assert.ok(existsSync(new URL(`../media/yagu/${sku}-studio-v1.webp`, import.meta.url)));
    assert.match(productHref(product.id), /^\/producto\//u);
    assert.ok(yaguToyExpansionEs[product.name]);
    assert.ok(yaguToyExpansionUk[product.name]);
    assert.ok(yaguToyExpansionEs[product.description]);
    assert.ok(yaguToyExpansionUk[product.description]);
    for (const detail of product.details) {
      if (detail === 'Игра под присмотром') continue;
      assert.ok(yaguToyExpansionEs[detail], `${sku}: Spanish detail ${detail}`);
      assert.ok(yaguToyExpansionUk[detail], `${sku}: Ukrainian detail ${detail}`);
    }
    // Conservative cash basis: 21% IVA plus a possible 5.2% recargo.
    assert.ok((variant.source.price - variant.source.purchasePrice * 1.262) /
      variant.source.price >= 0.30, `${sku}: below 30% product margin`);
    const decision = salePriceDecision({ variant_id: variant.id,
      source_price_cents: variant.sourcePriceCents, price_override_cents: null,
      price_confirmed: false });
    assert.equal(decision.accepted, true, `${sku}: unapproved checkout price`);
    assert.equal(decision.basis, 'market_comparison');
  }
});
