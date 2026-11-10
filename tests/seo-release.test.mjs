import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { articlesEs } from '../journal-content-es.js';
import { seoDocument } from '../server/seo.js';
import { seoCategories, seoCategoryPath } from '../seo-categories.js';
import { seoProductForPath, productHref } from '../seo-products.js';

test('the sitemap contains only released public pages with Spanish editorial content', async () => {
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(match => match[1]);
  assert.deepEqual(urls, ['https://catmandog.es/', 'https://catmandog.es/catalogo',
    'https://catmandog.es/catalogo/gatos/pienso-seco',
    'https://catmandog.es/producto/royal-canin-sterilised-37', 'https://catmandog.es/revista',
    ...articlesEs.map(article => `https://catmandog.es/revista/${article.id}`),
    'https://catmandog.es/legal-es.html', 'https://catmandog.es/purchase-terms-es.html',
    'https://catmandog.es/privacy-es.html']);
  assert.equal(urls.some(url => /\/admin|#/u.test(url)), false);
  for (const article of articlesEs) {
    const html = await seoDocument(`/revista/${article.id}`);
    assert.match(html, new RegExp(`<h1>${article.title}</h1>`, 'u'));
    assert.match(html, new RegExp(`<link rel="canonical" href="https://catmandog.es/revista/${article.id}">`, 'u'));
    assert.match(html, /<p class="editorial-intro">[^<]+<\/p>/u);
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
  }
});

test('the first published product has a crawlable page and old products keep their route', async () => {
  const path = '/producto/royal-canin-sterilised-37';
  const html = await seoDocument(path);
  assert.equal(productHref('rc-sterilised'), path);
  assert.equal(productHref('leonardo-poultry'), '#/product/leonardo-poultry');
  assert.equal(seoProductForPath(path)?.id, 'rc-sterilised');
  assert.match(html, /<h1>Royal Canin Sterilised 37<\/h1>/u);
  assert.match(html, /<link rel="canonical" href="https:\/\/catmandog\.es\/producto\/royal-canin-sterilised-37">/u);
  assert.match(html, /<meta name="description" content="Pienso completo para gatos esterilizados/u);
  assert.match(html, /<img src="https:\/\/img\.catmandog\.es\/assets\/food\/editorial\/rc-sterilised-v1\.webp"/u);
  assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
  assert.equal(await seoDocument('/producto/unknown'), null);
});

test('catalog landing and the released category are indexable', async () => {
  const catalog = await seoDocument('/catalogo');
  assert.doesNotMatch(catalog, /<meta name="robots" content="noindex/u);
  assert.match(catalog, /<h1>Catálogo para gatos y perros<\/h1>/u);
  assert.match(catalog, /<a class="article-card" href="\/catalogo\/gatos\/pienso-seco">/u);
  assert.equal(await seoDocument('/revista/unknown'), null);
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.equal(seoCategoryPath('cat', 'dry-food'), '/catalogo/gatos/pienso-seco');
  for (const category of seoCategories) {
    const html = await seoDocument(category.path);
    if (category.indexable) assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
    else assert.match(html, /<meta name="robots" content="noindex,follow">/u);
    assert.ok(html.includes(`<h1 class="page-title">${category.title}</h1>`));
    assert.equal(sitemap.includes(category.path), Boolean(category.indexable));
  }
});
