import test from 'node:test';
import assert from 'node:assert/strict';

import { catalogProducts, products } from '../data.js';
import { productRetailResearch, productDisplayedPriceSummary, retailResearch, retailRangeText } from '../retail-research.js';
import { isDemoPrice, storefrontPrice } from '../variants.js';

const product = id => catalogProducts.find(item => item.id === id);
const variant = id => catalogProducts.flatMap(item => item.variants?.length ? item.variants : [item]).find(item => item.id === id);
const euro = value => `${value.toFixed(2)} €`;

test('family preview covers researched pack sizes while each detail keeps its own offers', () => {
  const family = product('rc-sterilised');
  const summary = productRetailResearch(family);
  assert.equal(summary.variantCount, 4);
  assert.equal(summary.pricedVariants, 4);
  assert.equal(retailRangeText(summary, euro), '5.09 € - 74.99 €');
  assert.notDeepEqual(
    [summary.min, summary.max],
    [retailResearch(family.variants[0]).min, retailResearch(family.variants[0]).max],
  );
});

test('out-of-stock exact pack price appears in the family retail range', () => {
  const family = product('hills-kitten');
  const summary = productRetailResearch(family);
  assert.equal(summary.variantCount, 3);
  assert.equal(summary.pricedVariants, 3);
  const sevenKg = family.variants.find(variant => variant.id === 'hills-kitten-7000g');
  assert.equal(retailResearch(sevenKg).min, 78.49);
  assert.equal(retailResearch(sevenKg).offers[0].availability, 'out_of_stock');
});

test('exact single product offers remain visible with VAT', () => {
  const family = product('yagu-7502810');
  const summary = productRetailResearch(family);
  assert.equal(summary.min, 123.99);
  assert.equal(summary.max, 123.99);
  assert.equal(retailResearch(family.variants[0]).offers[0].taxIncluded, true);
});

test('every real catalog variant has a visible non-demo price', () => {
  const variants = catalogProducts.filter(item => item.isReal).flatMap(item => item.variants?.length ? item.variants : [item]);
  assert.equal(variants.length, 571);
  assert.deepEqual(variants.filter(isDemoPrice).map(item => item.id), []);
});

test('first dog assortment has 22 families and 43 priced variants with separate purchase fields', () => {
  const dogs = catalogProducts.filter(item => item.pet === 'dog');
  const variants = dogs.flatMap(item => item.variants);
  assert.equal(dogs.length, 22);
  assert.equal(variants.length, 43);
  assert.equal(new Set(variants.map(item => item.id)).size, 43);
  assert.deepEqual(variants.filter(isDemoPrice).map(item => item.id), []);
  assert.ok(variants.every(item => item.purchasePrice === null && item.purchasePriceStatus === 'pending'));
  assert.equal(variants.filter(item => item.pricingBasis?.kind === 'analogue_single').length, 8);
});

test('retired variants cannot surface the demo amount in an old cart', () => {
  const retired = products.find(item => item.id === 'kong-scrunchie');
  assert.equal(retired.storefrontRetired, true);
  assert.equal(storefrontPrice(retired), null);
});

test('supplier calculation stays separate from purchase and competitor retail prices', () => {
  const sku = variant('heybopet-hbzh-icb-19');
  assert.equal(sku.price, 385);
  assert.equal(sku.pricingBasis.quoteUnitEUR, 192.5);
  assert.equal(sku.pricingBasis.minimumOrderUnits, 1);
  assert.equal(sku.purchasePrice, null);
  assert.equal(retailResearch(sku), null);
  assert.equal(productDisplayedPriceSummary(sku).min, 385);
});

test('analogue and scaled pack prices remain labelled estimates', () => {
  const analog = variant('heybopet-hbzh-icb-20');
  assert.equal(analog.price, 274.99);
  assert.equal(analog.pricingBasis.kind, 'analogue_median');
  assert.equal(retailResearch(analog), null);
  const grass = variant('yagu-7500815-catalog-pack');
  assert.equal(grass.price, 8.61);
  assert.equal(grass.pricingBasis.kind, 'scaled_pack');
  assert.equal(retailResearch(grass), null);
});
