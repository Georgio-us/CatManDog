import test from 'node:test';
import assert from 'node:assert/strict';
import { catsAtelierProducts } from '../cats-atelier-products.js';
import { seoDocument } from '../server/seo.js';

test('all Cat’s Atelier server pages render Spanish search text before indexation', async () => {
  assert.equal(catsAtelierProducts.length, 39);
  for (const product of catsAtelierProducts) {
    const path = `/producto/cats-atelier-${product.manufacturerSku.toLowerCase()}`;
    const html = await seoDocument(path);
    assert.ok(html, `${product.id}: missing product page`);
    const title = html.match(/<title>(.*?)<\/title>/u)?.[1];
    const description = html.match(/<meta name="description" content="([^"]*)">/u)?.[1];
    const heading = html.match(/<h1>(.*?)<\/h1>/u)?.[1];
    assert.ok(title && description && heading, `${product.id}: missing search text`);
    assert.doesNotMatch(`${title} ${description} ${heading}`, /[А-Яа-яЁёІіЇїЄєҐґ]/u,
      `${product.id}: non-Spanish text in server metadata`);
    assert.match(html, /<section aria-label="Detalles del producto">/u,
      `${product.id}: missing full product copy in server response`);
  }
});
