import test from 'node:test';
import assert from 'node:assert/strict';
import { catsAtelierProducts } from '../cats-atelier-products.js';
import { catsAtelierEs, catsAtelierUk } from '../locales/cats-atelier.js';
import { catalogRows } from '../server/catalog.js';
import { salePriceDecision } from '../server/sale-price-policy.js';

test('all 39 Cat’s Atelier SKUs have distinct orderable cards in the requested category', () => {
  const cards = catsAtelierProducts;
  const rows = catalogRows(cards);
  assert.equal(cards.length, 39);
  assert.equal(rows.length, 39);
  assert.equal(new Set(cards.map(card => card.manufacturerSku)).size, 39);
  assert.ok(cards.every(card => card.category === 'Окна и балконы' && card.pet === 'cat'));
  assert.equal(cards.filter(card => card.productType === 'window').length, 5);
  assert.equal(cards.filter(card => card.productType === 'wall').length, 20);
  assert.equal(cards.filter(card => card.productType === 'accessory').length, 14);
  assert.equal(new Set(cards.map(card => card.image.src)).size, 25);
  assert.equal(new Set(cards.map(card => card.gallery[0].src)).size, 27);
  assert.ok(cards.every(card => card.image.src.startsWith('https://img.catmandog.es/assets/cats-atelier/')));
  assert.ok(rows.every(({ variant }) => variant.sourceOrderable));
  assert.ok(rows.every(({ variant }) => salePriceDecision({
    variant_id: variant.id, source_price_cents: variant.sourcePriceCents,
    price_override_cents: null, price_confirmed: false, price_source: variant.source
  }).accepted));
  assert.ok(cards.every(card => card.purchasePrice === null && card.madeToOrder));
});

test('each surfaced product phrase has Spanish and Ukrainian copy', () => {
  for (const card of catsAtelierProducts) {
    for (const phrase of [card.name, card.tag, card.description, ...card.details]) {
      assert.ok(catsAtelierEs[phrase], `missing Spanish: ${phrase}`);
      assert.ok(catsAtelierUk[phrase], `missing Ukrainian: ${phrase}`);
    }
  }
});
