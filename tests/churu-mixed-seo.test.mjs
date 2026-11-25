import test from 'node:test';
import assert from 'node:assert/strict';
import { seoDocument } from '../server/seo.js';
import { seoProductForId } from '../seo-products.js';

test('mixed Churu page presents the box and individual tubes in Spanish', async () => {
  const product = seoProductForId('cmd-source-694e05cdc1b2582c');
  assert.equal(product.indexable, true);
  const html = await seoDocument(product.path);
  const title = html.match(/<title>([^<]*)<\/title>/u)?.[1];
  const heading = html.match(/<h1>([^<]*)<\/h1>/u)?.[1];
  assert.match(title, /Churu - salmón y pollo/u);
  assert.match(heading, /Churu - salmón y pollo/u);
  assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
  assert.match(html, /Caja de 20 tubos × 14 g/u);
  assert.match(html, /1 tubo × 14 g · salmón/u);
  assert.doesNotMatch(`${title} ${heading}`, /[А-Яа-яЁё]/u);
});
