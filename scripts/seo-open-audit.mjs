import { seoProducts } from '../seo-products.js';

const origin = process.env.SEO_AUDIT_ORIGIN || 'https://catmandog.es';
const released = seoProducts.filter(product => product.indexable);
const text = (html, pattern) => html.match(pattern)?.[1]?.trim() || '';
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
const fetchWithRetry = async (url, options = {}) => {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
      if (response.status >= 500) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};
const [sitemapResponse, catalogResponse] = await Promise.all([
  fetchWithRetry(`${origin}/sitemap.xml`),
  fetchWithRetry(`${origin}/api/catalog`)
]);
if (!sitemapResponse.ok || !catalogResponse.ok) throw new Error('Sitemap or public catalog unavailable');
const [sitemap, catalog] = await Promise.all([sitemapResponse.text(), catalogResponse.json()]);
const byProduct = new Map();
for (const variant of catalog.variants) {
  if (!byProduct.has(variant.product_id)) byProduct.set(variant.product_id, []);
  byProduct.get(variant.product_id).push(variant);
}
let next = 0;
const rows = [];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < released.length) {
    const product = released[next++];
    const url = `${origin}${product.path}`;
    try {
      const response = await fetchWithRetry(url);
      const html = await response.text();
      const variants = byProduct.get(product.id) || [];
      const image = text(html, /<main id="app">[\s\S]*?<img src="([^"]*)"/u);
      const imageUrl = image ? new URL(image, origin).href : '';
      const imageResponse = imageUrl ? await fetchWithRetry(imageUrl, { method: 'HEAD' }) : null;
      const title = decode(text(html, /<title>([^<]*)<\/title>/u));
      const description = decode(text(html, /<meta name="description" content="([^"]*)"/u));
      const h1 = decode(text(html, /<h1[^>]*>([^<]*)<\/h1>/u));
      const problems = [];
      if (response.status !== 200 || response.url !== url) problems.push('page-response');
      if (/noindex/iu.test(`${response.headers.get('x-robots-tag')} ${text(html, /<meta name="robots" content="([^"]*)"/u)}`)) problems.push('noindex');
      if (text(html, /<link rel="canonical" href="([^"]*)"/u) !== url) problems.push('canonical');
      if (!sitemap.includes(`<loc>${url}</loc>`)) problems.push('sitemap');
      if (!title || !description || !h1 || /[А-Яа-яЁёІіЇїЄєҐґ]/u.test(`${title} ${description} ${h1}`)) problems.push('spanish-metadata');
      if (!/<script type="application\/ld\+json">/u.test(html)) problems.push('structured-data');
      if (!imageResponse?.ok || !imageResponse.headers.get('content-type')?.startsWith('image/')) problems.push('main-image');
      if (!variants.length || variants.some(variant => !variant.availableForCart || !variant.price_accepted || !(variant.priceCents > 0))) problems.push('retail-purchase');
      rows.push({ id: product.id, url, title, description, h1, variants: variants.length, problems,
        sourceWarnings: variants.filter(variant => !variant.source_orderable && !variant.pickupAvailable).map(variant => variant.variant_id) });
    } catch (error) {
      rows.push({ id: product.id, url, problems: [String(error)] });
    }
  }
}));
for (const key of ['title', 'description', 'h1']) {
  const seen = new Map();
  for (const row of rows) {
    const value = row[key]?.toLocaleLowerCase('es');
    if (!value) continue;
    if (seen.has(value)) {
      row.problems.push(`duplicate-${key}`);
      seen.get(value).problems.push(`duplicate-${key}`);
    } else seen.set(value, row);
  }
}
const report = {
  origin, checked: rows.length, variants: rows.reduce((sum, row) => sum + (row.variants || 0), 0),
  failures: rows.filter(row => row.problems.length),
  sourceWarningFamilies: rows.filter(row => row.sourceWarnings?.length).length
};
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exitCode = 1;
