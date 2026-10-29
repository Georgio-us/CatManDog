import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { articlesEs } from '../journal-content-es.js';
import { seoDocument } from '../server/seo.js';
import { seoCategories, seoCategoryPath } from '../seo-categories.js';

test('the first sitemap contains only real public pages with Spanish editorial content', async () => {
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(match => match[1]);
  assert.deepEqual(urls, ['https://catmandog.es/', 'https://catmandog.es/revista',
    ...articlesEs.map(article => `https://catmandog.es/revista/${article.id}`)]);
  assert.equal(urls.some(url => /catalog|product|admin|#/u.test(url)), false);
  for (const article of articlesEs) {
    const html = await seoDocument(`/revista/${article.id}`);
    assert.match(html, new RegExp(`<h1>${article.title}</h1>`, 'u'));
    assert.match(html, new RegExp(`<link rel="canonical" href="https://catmandog.es/revista/${article.id}">`, 'u'));
    assert.match(html, /<p class="editorial-intro">[^<]+<\/p>/u);
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
  }
});

test('catalog landing remains outside search until products are ready', async () => {
  const catalog = await seoDocument('/catalogo');
  assert.match(catalog, /<meta name="robots" content="noindex,follow">/u);
  assert.match(catalog, /<h1>Catálogo para gatos y perros<\/h1>/u);
  assert.equal(await seoDocument('/revista/unknown'), null);
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.equal(seoCategoryPath('cat', 'dry-food'), '/catalogo/gatos/pienso-seco');
  for (const category of seoCategories) {
    const html = await seoDocument(category.path);
    assert.match(html, /<meta name="robots" content="noindex,follow">/u);
    assert.ok(html.includes(`<h1 class="page-title">${category.title}</h1>`));
    assert.equal(sitemap.includes(category.path), false);
  }
});
