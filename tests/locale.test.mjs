import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => 'es' };

const { translate } = await import('../locale.js');
const { catalogProducts, products } = await import('../data.js');
const { articlesEs } = await import('../journal-content-es.js');

test('Spanish catalogue copy covers product names, descriptions and variants', () => {
  for (const product of [...catalogProducts, ...products]) {
    const fields = [product.name, product.description, product.tag, product.weight,
      ...(product.variants || []).flatMap(variant => [variant.name, variant.description, variant.label])];
    for (const value of fields.filter(Boolean)) {
      assert.doesNotMatch(translate(value), /[А-Яа-яЁё]/u, `${product.id}: ${value}`);
    }
  }
});

test('Spanish articles are complete editorial texts', () => {
  assert.equal(articlesEs.length, 3);
  for (const article of articlesEs) {
    assert.ok(article.wordCount >= 500, `${article.id}: ${article.wordCount} words`);
    assert.doesNotMatch(JSON.stringify(article), /[А-Яа-яЁё]/u);
  }
});

test('dynamic shopping labels translate the product name', () => {
  assert.equal(translate('Открыть товар: Набор «В гости с подарком»'),
    'Ver producto: Caja «Una visita con regalo»');
  assert.equal(translate('Мышка Cotton · 5,50 €'), 'Ratón Cotton · 5,50 €');
});
