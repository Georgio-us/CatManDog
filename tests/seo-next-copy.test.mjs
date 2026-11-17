import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { products } from '../data.js';
import { catalogEditorialNext } from '../catalog-editorial-next.js';
import { editorialEs, editorialUk } from '../locales/editorial-translations.js';
import { seoProductForId } from '../seo-products.js';
import { seoDocument } from '../server/seo.js';
import { accessoryDetail } from '../accessory-ui.js';

const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

test('the 30 next-batch recipes have distinct copy in three languages while remaining noindex', async () => {
  const entries = Object.entries(catalogEditorialNext);
  assert.equal(entries.length, 30);
  const descriptions = [new Set(), new Set(), new Set()];
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  let variantCount = 0;

  for (const [id, copy] of entries) {
    const product = products.find(item => item.id === id);
    const seo = seoProductForId(id);
    assert.ok(product && seo, id);
    assert.equal(product.description, copy.description, id);
    assert.deepEqual(product.details, copy.details, id);
    assert.equal(seo.indexable, false, id);
    assert.equal(sitemap.includes(`https://catmandog.es${seo.path}</loc>`), false, id);
    assert.match(copy.source, /^https:\/\//u, id);
    assert.equal(copy.details.length, 3, id);

    const translations = [copy.description, copy.esDescription, copy.ukDescription];
    for (const [index, description] of translations.entries()) {
      assert.ok(description.length > 100, `${id}: language ${index}`);
      assert.equal(descriptions[index].has(description), false, `${id}: duplicate in language ${index}`);
      descriptions[index].add(description);
    }
    assert.equal(editorialEs[copy.description], copy.esDescription, id);
    assert.equal(editorialUk[copy.description], copy.ukDescription, id);
    assert.doesNotMatch(copy.esDescription, /[А-Яа-яЁё]/u, id);
    for (let i = 0; i < copy.details.length; i += 1) {
      assert.equal(editorialEs[copy.details[i]], copy.esDetails[i], `${id}: Spanish detail ${i}`);
      assert.equal(editorialUk[copy.details[i]], copy.ukDetails[i], `${id}: Ukrainian detail ${i}`);
    }
    assert.doesNotMatch([copy.description, copy.esDescription, copy.ukDescription,
      ...copy.details, ...copy.esDetails, ...copy.ukDetails].join(' '),
    /свежая вода|agua fresca|свіжа вода|норму кормления|ración diaria|фасовку выберите/iu, id);

    for (const variant of product.variants || []) {
      assert.equal(variant.description, copy.description, `${id}: ${variant.id}`);
      assert.deepEqual(variant.details, copy.details, `${id}: ${variant.id}`);
      variantCount += 1;
    }
    const html = await seoDocument(seo.path);
    assert.match(html, /<meta name="robots" content="noindex,follow">/u, id);
    assert.ok(html.includes(escapeHtml(copy.esDescription)), `${id}: Spanish HTML`);
    for (const detail of copy.esDetails) assert.ok(html.includes(escapeHtml(detail)), `${id}: HTML detail`);
    assert.doesNotMatch(html.match(/<main id="app">([\s\S]*?)<\/main>/u)?.[1] || '',
      /[А-Яа-яЁё]/u, `${id}: Russian in Spanish HTML`);
  }
  assert.equal(variantCount, 54);
});

test('Spanish product detail uses kg instead of a Cyrillic unit', () => {
  const product = products.find(item => item.id === 'rc-urinary');
  const html = accessoryDetail(product, {
    crumbs: () => '', imageBlock: () => '', escape: value => value,
    icon: () => '', favorites: [], goodTogether: () => '',
    money: value => `${value.toFixed(2)} €`, translate: value => value,
    variantId: product.variants[0].id, quantity: 1, language: 'es'
  });
  assert.match(html, /\s\/ kg</u);
  assert.doesNotMatch(html, /\s\/ кг</u);
});
