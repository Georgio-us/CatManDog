import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { catalogEditorialContent } from '../catalog-editorial-content.js';
import { catsAtelierProducts } from '../cats-atelier-products.js';
import { atelierDescription } from '../atelier-description.js';
import { editorialEs, editorialUk } from '../locales/editorial-translations.js';
import { seoProducts } from '../seo-products.js';
import { stockSeoCopy } from '../stock-seo-copy.js';
import { seoWave2Copy } from '../seo-wave2-copy.js';
import { editorialFingerprint, seoVerdict, seoWorkScope } from './seo-verdict.mjs';
import { directSupplierSources } from '../server/direct-supplier-sources.js';
import { sourceLinkProblems } from './verify-source-links.mjs';

const args = process.argv.slice(2);
const valueAfter = option => args.includes(option) ? args[args.indexOf(option) + 1] : undefined;
const catalogPath = valueAfter('--catalog-file');
const outputPath = valueAfter('--out');
const targetId = valueAfter('--id');
const origin = process.env.SEO_AUDIT_ORIGIN || 'https://catmandog.es';
if (!args.includes('--live') && !catalogPath) {
  throw new Error('Укажи --live для текущего сайта или --catalog-file <снимок> для офлайн-проверки');
}
const reviews = JSON.parse(await readFile(new URL('../seo-review-records.json', import.meta.url), 'utf8'));
const atelierEvidence = JSON.parse(await readFile(new URL('../atelier-seo-evidence.json', import.meta.url), 'utf8'));
const atelierProducts = new Map(catsAtelierProducts.map(product => [product.id, product]));
const fetchWithRetry = async (url, options = {}) => {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await fetch(url, { ...options, signal: AbortSignal.timeout(20000) }); }
    catch (error) { lastError = error; }
  }
  throw lastError;
};
const fetchChecked = async url => {
  const response = await fetchWithRetry(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response;
};
let catalogUnavailable;
const catalog = catalogPath
  ? JSON.parse(await readFile(catalogPath, 'utf8'))
  : await (async () => {
    try { return await (await fetchChecked(`${origin}/api/catalog`)).json(); }
    catch (error) {
      catalogUnavailable = `Не удалось проверить текущий каталог: ${error.message}`;
      return { variants: [] };
    }
  })();
if (!Array.isArray(catalog.variants)) throw new Error('Каталог не содержит variants');
const variantsByProduct = new Map();
for (const variant of catalog.variants) {
  if (!variantsByProduct.has(variant.product_id)) variantsByProduct.set(variant.product_id, []);
  variantsByProduct.get(variant.product_id).push(variant);
}
let sitemapUnavailable;
const sitemap = args.includes('--live')
  ? await (async () => {
    try { return await (await fetchChecked(`${origin}/sitemap.xml`)).text(); }
    catch (error) {
      sitemapUnavailable = `Не удалось проверить sitemap: ${error.message}`;
      return null;
    }
  })()
  : await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'");
const match = (html, pattern) => decode(html.match(pattern)?.[1]?.trim() || '');
const checks = new Map();
if (args.includes('--live')) {
  let cursor = 0;
  // Audit all released pages even when displaying one ID, so duplicate SEO
  // metadata cannot hide behind the --id filter.
  const released = catalogUnavailable ? [] : seoProducts.filter(product => product.indexable);
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (cursor < released.length) {
      const product = released[cursor++];
      const url = `${origin}${product.path}`;
      const problems = [];
      try {
        const response = await fetchWithRetry(url);
        const html = await response.text();
        if (response.status !== 200 || response.url !== url) problems.push('ответ страницы или редирект');
        if (/noindex/iu.test(`${response.headers.get('x-robots-tag')} ${match(html, /<meta name="robots" content="([^"]*)"/u)}`)) {
          problems.push('страница содержит noindex');
        }
        if (match(html, /<link rel="canonical" href="([^"]*)"/u) !== url) problems.push('неверный canonical');
        if (sitemap && !sitemap.includes(`<loc>${url}</loc>`)) problems.push('URL отсутствует в sitemap');
        const title = match(html, /<title>([^<]*)<\/title>/u);
        const description = match(html, /<meta name="description" content="([^"]*)"/u);
        const h1 = match(html, /<h1[^>]*>([^<]*)<\/h1>/u);
        if (!title || !description || !h1 || /[А-Яа-яЁёІіЇїЄєҐґ]/u.test(`${title} ${description} ${h1}`)) {
          problems.push('неполные или не испанские title, description, H1');
        }
        const image = match(html, /<main id="app">[\s\S]*?<img src="([^"]*)"/u);
        if (!image) problems.push('нет основного изображения в HTML');
        else {
          const imageResponse = await fetchWithRetry(new URL(image, origin), { method: 'HEAD' });
          if (!imageResponse.ok || !imageResponse.headers.get('content-type')?.startsWith('image/')) {
            problems.push('основное изображение не загружается');
          }
        }
        checks.set(product.id, { problems, title, description, h1 });
      } catch (error) {
        checks.set(product.id, { unavailable: `Не удалось подтвердить живую страницу: ${error.message}` });
      }
    }
  }));
  for (const field of ['title', 'description', 'h1']) {
    const seen = new Map();
    for (const [id, check] of checks) {
      const text = check[field]?.toLocaleLowerCase('es');
      if (!text) continue;
      if (seen.has(text)) {
        check.problems.push(`дублируется ${field} с ${seen.get(text)}`);
        checks.get(seen.get(text)).problems.push(`дублируется ${field} с ${id}`);
      } else seen.set(text, id);
    }
  }
}
const products = targetId ? seoProducts.filter(product => product.id === targetId) : seoProducts;
if (targetId && !products.length) throw new Error(`Неизвестный ID товара: ${targetId}`);
const rows = products.map(product => {
  const atelierProduct = atelierProducts.get(product.id);
  const atelierRecord = atelierEvidence.records[product.id];
  const atelierText = atelierProduct && Object.fromEntries(['ru', 'es', 'uk']
    .map(language => [language, atelierDescription(atelierProduct, language)]));
  const atelierCopy = atelierText && {
    source: 'https://catsatelier.com/en/', description: atelierText.ru.summary,
    details: [atelierText.ru.summary, ...atelierText.ru.paragraphs],
    esDescription: atelierText.es.summary,
    esDetails: [atelierText.es.summary, ...atelierText.es.paragraphs],
    ukDescription: atelierText.uk.summary,
    ukDetails: [atelierText.uk.summary, ...atelierText.uk.paragraphs]
  };
  const copy = atelierCopy || catalogEditorialContent[product.id];
  const check = checks.get(product.id);
  const technical = [...(check?.problems || [])];
  // A verified direct B2B SKU is part of the same publication verdict. Do not
  // report a fully checked page when its live purchasing route has drifted.
  for (const variant of variantsByProduct.get(product.id) || []) {
    if (directSupplierSources[variant.variant_id]) {
      technical.push(...sourceLinkProblems(variant, directSupplierSources[variant.variant_id])
        .map(problem => `${variant.variant_id}: ${problem}`));
    }
  }
  const atelierCopyHash = atelierText && createHash('sha256')
    .update(JSON.stringify(atelierText)).digest('hex');
  const atelierIssue = atelierProduct && (!atelierRecord
    ? 'Нет предметной записи Cat’s Atelier'
    : atelierRecord.sku !== atelierProduct.manufacturerSku || atelierRecord.ean !== atelierProduct.ean
      ? 'Артикул или EAN отличаются от проверенного источника'
      : atelierRecord.publishedImageUrl !== atelierProduct.image?.src
        ? 'Основное фото изменилось после проверки поставщика' : null);
  const atelierReview = atelierRecord && atelierCopy && {
    productId: product.id, reviewedAt: atelierRecord.reviewedAt,
    sourceUrl: atelierCopy.source, saleUnit: atelierRecord.saleUnit,
    variantIds: [product.id],
    editorialSha256: atelierCopyHash === atelierRecord.copySha256
      ? editorialFingerprint(atelierCopy) : atelierRecord.copySha256,
    imageIdentityVerified: true, imageEvidenceUrl: atelierRecord.sourceImageUrl,
    imagePaths: { [product.id]: atelierRecord.publishedImageUrl },
    note: `Источник текста - официальная выгрузка Cat’s Atelier от 18.11.2026, SHA-256 ${atelierEvidence.sourceCsvSha256}`
  };
  const url = `${origin}${product.path}`;
  if (!product.indexable && sitemap?.includes(`<loc>${url}</loc>`)) technical.push('закрытый URL попал в sitemap');
  const verdict = seoVerdict({ product, variants: variantsByProduct.get(product.id) || [], copy,
    translations: atelierCopy ? { es: atelierCopy.esDescription, uk: atelierCopy.ukDescription,
      details: atelierCopy.details.map((_, index) => ({ es: atelierCopy.esDetails[index], uk: atelierCopy.ukDetails[index] })) }
      : copy ? { es: editorialEs[copy.description], uk: editorialUk[copy.description],
        details: copy.details?.map(detail => ({ es: editorialEs[detail], uk: editorialUk[detail] })) } : null,
    review: atelierReview || reviews[product.id], technical,
    liveChecked: Boolean(check && !check.unavailable && !sitemapUnavailable && !catalogUnavailable),
    liveUnavailable: check?.unavailable || sitemapUnavailable || catalogUnavailable,
    catalogUnavailable, sitemapUnavailable, knownIssue: atelierIssue, catalogIsLive: !catalogPath,
    priorCopy: stockSeoCopy[product.id] ? 'Предметный испанский SEO-текст: stock-seo-copy.js, проверка 22 ноября 2026'
      : seoWave2Copy[product.id] ? 'Предметный испанский SEO-текст: seo-wave2-copy.js, предыдущая проверка'
        : null });
  return { ...verdict, ...seoWorkScope(verdict) };
});
const count = status => rows.filter(row => row.status === status).length;
const report = { checkedAt: new Date().toISOString(), mode: args.includes('--live') ? 'live' : 'catalog-file',
  origin, totals: { families: rows.length, passed: count('прошло'), errors: count('ошибка'),
    review: count('проверить'), workNow: rows.filter(row => row.workScope === 'проверяем сейчас').length,
    deferred: rows.filter(row => row.workScope === 'отложено').length,
    needsDecision: rows.filter(row => row.workScope === 'нужно решение').length }, rows };
if (outputPath) await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Проверено ${rows.length}: прошло ${report.totals.passed}, ошибка ${report.totals.errors}, проверить ${report.totals.review}`);
  console.log(`Из закрытых: проверяем сейчас ${report.totals.workNow}, отложено ${report.totals.deferred}, нужно решение ${report.totals.needsDecision}`);
  const shown = targetId || args.includes('--all') ? rows
    : rows.filter(row => row.indexable && row.status === 'ошибка');
  for (const row of shown) {
    console.log(`${row.status.toUpperCase()} ${row.id} ${row.path}`);
    console.log(`  Очередь: ${row.workScope} - ${row.scopeReason}`);
    for (const reason of row.reasons) console.log(`  - ${reason}`);
    if (targetId) for (const item of row.evidence) console.log(`  Основание: ${item}`);
  }
  const opened = rows.filter(row => row.indexable);
  const closed = rows.filter(row => !row.indexable);
  if (!targetId) {
    console.log(`Открытые: ошибок ${opened.filter(row => row.status === 'ошибка').length}, проверить ${opened.filter(row => row.status === 'проверить').length}`);
    console.log(`Закрытые: блокеров ${closed.filter(row => row.status === 'ошибка').length}, проверить ${closed.filter(row => row.status === 'проверить').length}`);
    console.log('Полная очередь: --all или --json; конкретный товар: --id <ID>');
  }
}
if (rows.some(row => row.status === 'ошибка' && (targetId || row.indexable))) process.exitCode = 1;
