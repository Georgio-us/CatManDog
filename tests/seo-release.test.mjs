import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { articlesEs } from '../journal-content-es.js';
import { catalogProducts } from '../data.js';
import { seoDocument, serveSeo } from '../server/seo.js';
import { seoCategories, seoCategoryPath } from '../seo-categories.js';
import { seoProducts, seoProductForPath, productHref } from '../seo-products.js';
import { seoPicks } from '../seo-picks.js';
import { catalogEditorialCats } from '../catalog-editorial-cats.js';
import { catalogEditorialDogs } from '../catalog-editorial-dogs.js';
import { catalogEditorialRoyalCanin } from '../catalog-editorial-royal-canin.js';
import { catalogEditorialLeonardo } from '../catalog-editorial-leonardo.js';
import { catalogEditorialHeld } from '../catalog-editorial-held.js';
import { catalogEditorialChuruDog } from '../catalog-editorial-churu-dog.js';
import { catalogEditorialAcanaWet } from '../catalog-editorial-acana-wet.js';
import { catalogEditorialChuruCat } from '../catalog-editorial-churu-cat.js';
import { accessoryDetail } from '../accessory-ui.js';

test('the sitemap contains only released public pages with Spanish editorial content', async () => {
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(match => match[1]);
  assert.deepEqual(urls, ['https://catmandog.es/', 'https://catmandog.es/catalogo',
    ...seoPicks.map(pick => `https://catmandog.es${pick.path}`),
    ...seoCategories.filter(category => category.indexable).map(category => `https://catmandog.es${category.path}`),
    ...seoProducts.filter(product => product.indexable).map(product => `https://catmandog.es${product.path}`),
    'https://catmandog.es/revista',
    ...articlesEs.map(article => `https://catmandog.es/revista/${article.id}`),
    'https://catmandog.es/legal-es.html', 'https://catmandog.es/purchase-terms-es.html',
    'https://catmandog.es/privacy-es.html']);
  assert.equal(urls.some(url => /\/admin|#/u.test(url)), false);
  for (const article of articlesEs) {
    const html = await seoDocument(`/revista/${article.id}`);
    assert.match(html, new RegExp(`<h1>${article.title}</h1>`, 'u'));
    assert.match(html, new RegExp(`<link rel="canonical" href="https://catmandog.es/revista/${article.id}">`, 'u'));
    assert.match(html, /<p class="editorial-intro">[^<]+<\/p>/u);
    assert.match(html, /<meta property="og:type" content="article">/u);
    assert.match(html, /<meta property="og:image" content="https:\/\/img\.catmandog\.es\/assets\/journal-/u);
    assert.match(html, /<h2>Fuentes<\/h2><ul><li><a href="https:\/\//u);
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
  }
});

test('cat and dog selections have crawlable Spanish pages and distinct canonicals', async () => {
  for (const pick of seoPicks) {
    const html = await seoDocument(pick.path);
    const main = html.match(/<main id="app">([\s\S]*?)<\/main>/u)?.[1];
    assert.ok(main, pick.path);
    assert.match(main, new RegExp(`<h1>${pick.title}</h1>`, 'u'));
    assert.match(main, /href="\/producto\/[a-z0-9-]+"/u);
    assert.doesNotMatch(main, /[А-Яа-яЁё]/u);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://catmandog.es${pick.path}">`, 'u'));
    assert.match(html, new RegExp(`<meta name="description" content="${pick.description}">`, 'u'));
    assert.match(html, /<nav aria-label="Navegación principal">/u);
    assert.match(html, /href="\/privacy-es.html">Privacidad<\/a>/u);
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
  }
});

test('the first published product remains indexable', async () => {
  const path = '/producto/royal-canin-sterilised-37';
  const html = await seoDocument(path);
  assert.equal(productHref('rc-sterilised'), path);
  assert.equal(productHref('leonardo-poultry'), '/producto/leonardo-adult-gf-poultry');
  assert.equal(seoProductForPath(path)?.id, 'rc-sterilised');
  assert.match(html, /<h1>Royal Canin Sterilised 37<\/h1>/u);
  assert.match(html, /<link rel="canonical" href="https:\/\/catmandog\.es\/producto\/royal-canin-sterilised-37">/u);
  assert.match(html, /<meta name="description" content="Pienso completo para gatos esterilizados/u);
  assert.match(html, /<img src="https:\/\/img\.catmandog\.es\/assets\/food\/editorial\/rc-sterilised-v1\.webp"/u);
  assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
  assert.equal(await seoDocument('/producto/unknown'), null);
});

test('every public product has a distinct permanent URL while unreleased pages stay out of the index', async () => {
  assert.equal(seoProducts.length, catalogProducts.length);
  assert.equal(new Set(seoProducts.map(product => product.path)).size, catalogProducts.length);
  for (const product of catalogProducts) {
    const path = productHref(product.id);
    assert.match(path, /^\/producto\/[a-z0-9-]+$/u);
    assert.equal(seoProductForPath(path)?.id, product.id);
  }
  const path = productHref('hills-ster');
  const html = await seoDocument(path);
  assert.match(html, /<h1>Hill’s Science Plan Sterilised Cat Adult Chicken<\/h1>/u);
  assert.match(html, /<link rel="canonical" href="https:\/\/catmandog\.es\/producto\/hill-s-science-plan-sterilised-cat-adult-chicken">/u);
  assert.match(html, /<meta name="robots" content="noindex,follow">/u);
  let headers;
  const response = { writeHead(_status, value) { headers = value; }, end() {} };
  assert.equal(await serveSeo({ method: 'HEAD' }, response, path), true);
  assert.equal(headers['X-Robots-Tag'], 'noindex');
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.equal(sitemap.includes(path), false);
});

test('the verified product release has unique Spanish source content and crawlable category links', async () => {
  const released = seoProducts.filter(product => product.indexable);
  assert.equal(released.length, 84);
  const descriptions = new Set();
  for (const product of released) {
    const html = await seoDocument(product.path);
    const title = html.match(/<h1>([^<]+)<\/h1>/u)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)">/u)?.[1];
    assert.ok(title && description, product.path);
    assert.doesNotMatch(title + description, /[А-Яа-яЁё]/u, product.path);
    assert.match(html, /<img src="[^"]+" alt="[^"]+" width="640" height="640">/u, product.path);
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/u, product.path);
    assert.equal(descriptions.has(description), false, product.path);
    descriptions.add(description);
    const category = await seoDocument(product.categoryPath);
    assert.match(category, new RegExp(`<a class="article-card" href="${product.path}">`, 'u'));
  }
});

test('released editorial products serve the same verified Spanish copy as the storefront', async () => {
  const editorial = { ...catalogEditorialCats, ...catalogEditorialDogs,
    ...catalogEditorialRoyalCanin, ...catalogEditorialLeonardo, ...catalogEditorialHeld,
    ...catalogEditorialChuruDog, ...catalogEditorialAcanaWet, ...catalogEditorialChuruCat };
  const releasedEditorial = Object.entries(editorial)
    .filter(([id]) => seoProducts.some(product => product.id === id && product.indexable));
  assert.equal(releasedEditorial.length, 63);
  for (const [id, copy] of releasedEditorial) {
    const path = productHref(id);
    const html = await seoDocument(path);
    assert.ok(copy.source && copy.esDescription.length > 100, id);
    assert.ok(html.includes(copy.esDescription.replace(/&/gu, '&amp;')), id);
    for (const fact of copy.esDetails) assert.ok(html.includes(fact), `${id}: ${fact}`);
  }
});

test('Churu cat sale units retain their price formats and show the verified recipe', () => {
  for (const [id, copy] of Object.entries(catalogEditorialChuruCat)) {
    const product = catalogProducts.find(entry => entry.id === id);
    assert.equal(product?.description, copy.description, id);
    assert.equal(product.variants.length, 3, id);
    for (const variant of product.variants) {
      const html = accessoryDetail(product, {
        crumbs: () => '', imageBlock: () => '', escape: String,
        icon: () => '<svg></svg>', favorites: [], goodTogether: () => '',
        money: value => `${value} €`, variantId: variant.id
      });
      assert.ok(html.includes(copy.description), `${id}: ${variant.id}`);
    }
    assert.match(product.variants[2].description, /12 закрытых пачек|Короб из 12 закрытых пачек/u);
  }
});

test('former thin pages and new Churu formats use verified recipe copy', async () => {
  const verified = ['leonardo-fresh-beef', 'leonardo-fresh-duck', 'leonardo-fresh-salmon',
    'dog-rc-mini-adult', 'dog-rc-medium-adult', 'dog-rc-mini-digestive',
    'dog-ownat-ultra-medium', 'dog-ownat-just-gf-chicken', 'dog-ownat-gf-prime',
    'dog-ownat-author-duck'];
  for (const id of verified) {
    const product = seoProducts.find(entry => entry.id === id);
    assert.equal(product?.indexable, true, id);
    const html = await seoDocument(product.path);
    assert.ok(html.includes(catalogEditorialHeld[id].esDescription.replace(/&/gu, '&amp;')), id);
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
  }
  for (const id of ['churu-dog-tuna-pack4', 'churu-dog-salmon-pack8', 'churu-dog-chicken-bites']) {
    const product = seoProducts.find(entry => entry.id === id);
    assert.equal(product?.indexable, true, id);
    const html = await seoDocument(product.path);
    assert.ok(html.includes(catalogEditorialChuruDog[id].esDescription), id);
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
  }
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
