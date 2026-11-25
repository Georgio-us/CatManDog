import { readFile } from 'node:fs/promises';
import { articlesEs } from '../journal-content-es.js';
import { products, catalogProducts } from '../data.js';
import { homeShortcutProducts } from '../home-shortcuts.js';
import { esProductText } from '../locales/product-es.js';
import { esDetails } from '../locales/details-es.js';
import { editorialEs } from '../locales/editorial-translations.js';
import { catsAtelierEs } from '../locales/cats-atelier.js';
import { atelierDescription } from '../atelier-description.js';
import { churuDogEs } from '../locales/churu-dog.js';
import { yaguExpansionEs } from '../locales/yagu-expansion.js';
import { yaguToyExpansionEs } from '../locales/yagu-toy-expansion.js';
import { yaguBasketEs } from '../locales/yagu-basket.js';
import { yaguChewTestEs } from '../locales/yagu-chew-test.js';
import { customerFacts, orderedVariants } from '../product-content.js';
import { seoCategories, seoCategoryForPath } from '../seo-categories.js';
import { seoProducts, seoProductForPath } from '../seo-products.js';
import { seoPickForPath } from '../seo-picks.js';
import { shellTranslations } from '../shell-translations.js';
import { catalogSnapshot } from './catalog.js';

const origin = 'https://catmandog.es';
const shell = new URL('../index.html', import.meta.url);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
const escapeXml = escapeHtml;
const safeJson = value => JSON.stringify(value).replace(/</gu, '\\u003c');
const merchantVariant = row => row?.pickup_available && row?.orderable && row?.price_accepted &&
  Number.isInteger(row.sale_price_cents) && row.sale_price_cents > 0;
const productImage = (product, row) => row?.variant_image_path || row?.image_path ||
  product?.image?.src || (typeof product?.image === 'string' ? product.image : '');
const absoluteImage = image => {
  if (!image) return '';
  try {
    const url = new URL(image, origin);
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
};
const price = cents => (cents / 100).toFixed(2);
const variantUrl = (path, id) => `${origin}${path}?variant=${encodeURIComponent(id)}`;
export const spanishVariantLabel = label => String(label || '')
  .replace(/Зелёный чай/giu, 'Té verde')
  .replace(/Для небольших животных/giu, 'Para animales pequeños')
  .replace(/Размер\s+([A-Z0-9]+)/giu, 'Talla $1')
  .replace(/Антрацит/giu, 'Antracita')
  .replace(/Бежевый/giu, 'Beige')
  .replace(/Голубой/giu, 'Azul')
  .replace(/Коричневый/giu, 'Marrón')
  .replace(/Серый/giu, 'Gris')
  .replace(/Белый/giu, 'Blanco')
  .replace(/Лаванда/giu, 'Lavanda')
  .replace(/около/giu, 'aprox.')
  .replace(/(\d+)\s*фильтра/giu, '$1 filtros')
  .replace(/(\d+)\s*тюбик(?:а|ов)?/giu, '$1 tubos')
  .replace(/(\d+(?:[,.]\d+)?)\s*кг/gu, '$1 kg')
  .replace(/(\d+(?:[,.]\d+)?)\s*г/gu, '$1 g')
  .replace(/(\d+(?:[,.]\d+)?)\s*см/gu, '$1 cm')
  .replace(/(\d+(?:[,.]\d+)?)\s*мл/gu, '$1 ml')
  .replace(/(\d+(?:[,.]\d+)?)\s*л(?=$|[\s·,])/gu, '$1 L')
  .replace(/(\d+)\s*штук/gu, '$1 uds.')
  .replace(/(\d+)\s*шт\.?/gu, '$1 uds.');

const articleLinks = articlesEs.map(article =>
  `<a class="article-card" href="/revista/${article.id}"><div class="article-meta"><span>${escapeHtml(article.section)}</span><span>${escapeHtml(article.time)}</span></div><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.summary)}</p></a>`).join('');
const articleImages = {
  home: 'https://img.catmandog.es/assets/journal-home-v2.webp',
  play: 'https://img.catmandog.es/assets/journal-play-v2.webp',
  travel: 'https://img.catmandog.es/assets/journal-travel-v2.webp'
};
function spanishShell(template) {
  return Object.entries(shellTranslations).sort((a, b) => b[0].length - a[0].length)
    .reduce((html, [from, to]) => html.replaceAll(from, to), template)
    .replaceAll('href="/legal.html"', 'href="/legal-es.html"')
    .replaceAll('href="/purchase-terms.html"', 'href="/purchase-terms-es.html"')
    .replaceAll('href="/privacy.html"', 'href="/privacy-es.html"');
}
const categoryLinks = seoCategories.filter(category => category.indexable).map(category =>
  `<a class="article-card" href="${category.path}"><h2>${escapeHtml(category.title)}</h2><p>${escapeHtml(category.intro)}</p></a>`).join('');
const productDescription = (product, publishedProduct) => publishedProduct.description ||
  catsAtelierEs[product.description] || editorialEs[product.description] || churuDogEs[product.description] || esProductText[product.description] ||
  yaguToyExpansionEs[product.description] || yaguChewTestEs[product.description] || yaguBasketEs[product.description] || yaguExpansionEs[product.description] || product.name;
const productName = product => catsAtelierEs[product.name] || editorialEs[product.name] || churuDogEs[product.name] || yaguToyExpansionEs[product.name] || yaguChewTestEs[product.name] || yaguBasketEs[product.name] || yaguExpansionEs[product.name] || esProductText[product.name] || product.name;
const productLinks = categoryPath => seoProducts
  .filter(item => item.indexable && item.categoryPath === categoryPath)
  .map(item => {
    const product = products.find(entry => entry.id === item.id);
    const name = item.name || (product && productName(product));
    const description = item.description || (product && productDescription(product, item));
    return name && description ? `<a class="article-card" href="${item.path}"><h2>${escapeHtml(name)}</h2><p>${escapeHtml(description)}</p></a>` : '';
  }).join('');

const defaultVariantId = (product, rows) => {
  const preferred = product?.defaultVariantId || product?.variants?.[0]?.defaultVariantId ||
    product?.variants?.[0]?.id;
  if (rows.some(row => row.variant_id === preferred && merchantVariant(row))) return preferred;
  return rows.find(merchantVariant)?.variant_id || preferred;
};

async function pageData(pathname, rows = [], selectedVariantId = null) {
  const publishedProduct = seoProductForPath(pathname);
  if (publishedProduct) {
    const staticProduct = products.find(item => item.id === publishedProduct.id);
    const stockRows = rows;
    const first = stockRows[0];
    const product = staticProduct || (first && { id: first.product_id, name: first.name,
      brand: first.brand, category: first.category, description: first.description,
      details: first.details, image: { src: first.image_path },
      variants: stockRows.map(row => ({ id: row.variant_id, label: row.label })) });
    if (!product) return null;
    const formats = (product.variants?.length ? orderedVariants(product).map(variant => variant.label) : product.sizes || [])
      .map(label => escapeHtml(label.replace(/ кг$/u, ' kg').replace(/ г$/u, ' g')));
    const description = productDescription(product, publishedProduct);
    const atelierCopy = atelierDescription(product, 'es');
    const selected = stockRows.find(row => row.variant_id ===
      (selectedVariantId || defaultVariantId(product, stockRows)));
    const image = productImage(product, selected);
    const facts = customerFacts(product.details).map(detail => catsAtelierEs[detail] || editorialEs[detail] || esDetails[detail] || yaguToyExpansionEs[detail] || yaguChewTestEs[detail] || yaguBasketEs[detail] || yaguExpansionEs[detail] ||
      (!/[А-Яа-яЁё]/u.test(detail) ? detail : null)).filter(Boolean);
    const name = publishedProduct.name || productName(product);
    const categoryLabel = publishedProduct.indexable
      ? seoCategoryForPath(publishedProduct.categoryPath)?.title || 'Todo el catálogo'
      : 'Todo el catálogo';
    return {
      title: `${publishedProduct.title || name} | CatManDog`, description,
      robots: publishedProduct.indexable ? null : 'noindex,follow',
      content: `<div class="page"><article class="editorial-article"><header class="editorial-header"><p class="editorial-kicker">${escapeHtml(product.brand || product.category || '')}</p><h1>${escapeHtml(name)}</h1><p class="editorial-deck">${escapeHtml(description)}</p></header><div class="editorial-body">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" width="640" height="640">` : ''}${atelierCopy ? `<section aria-label="Detalles del producto">${atelierCopy.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}</section>` : ''}${facts.length ? `<h2>Sobre el producto</h2><ul>${facts.map(fact => `<li>${escapeHtml(fact)}</li>`).join('')}</ul>` : ''}${formats.length ? `<h2>Formatos disponibles</h2><p>${formats.join(', ')}</p>` : ''}<a class="text-link" href="${publishedProduct.categoryPath}">${escapeHtml(categoryLabel)}</a></div></article></div>`
    };
  }
  const pick = seoPickForPath(pathname);
  if (pick) {
    const verified = homeShortcutProducts(catalogProducts, pick.pet)
      .filter(product => seoProducts.some(entry => entry.id === product.id && entry.indexable));
    const links = verified.map(product => {
      const published = seoProducts.find(entry => entry.id === product.id);
      const description = productDescription(product, published);
      const name = published.name || productName(product);
      return `<a class="article-card" href="${published.path}"><h2>${escapeHtml(name)}</h2><p>${escapeHtml(description)}</p></a>`;
    }).join('');
    const other = pick.pet === 'cat' ? '/selecciones/perros' : '/selecciones/gatos';
    const otherLabel = pick.pet === 'cat' ? 'Ver la selección para perros' : 'Ver la selección para gatos';
    return {
      title: `${pick.title} | CatManDog`, description: pick.description,
      content: `<div class="page"><article class="editorial-article"><header class="editorial-header"><p class="editorial-kicker">Selección CatManDog</p><h1>${escapeHtml(pick.title)}</h1><p class="editorial-deck">${escapeHtml(pick.intro)}</p></header><div class="editorial-body"><h2>${pick.pet === 'cat' ? 'Alimentación, agua y juego' : 'Alimentación y juego'}</h2><p>${escapeHtml(pick.description)}</p><div class="journal-grid">${links}</div><p><a class="text-link" href="${other}">${otherLabel}</a></p><p><a class="text-link" href="/catalogo">Ver todo el catálogo</a></p></div></article></div>`
    };
  }
  const category = seoCategoryForPath(pathname);
  if (category) return {
    title: `${category.title} | CatManDog`, description: category.description,
    robots: category.indexable ? null : 'noindex,follow',
    content: `<div class="page"><h1 class="page-title">${escapeHtml(category.title)}</h1><p class="lead">${escapeHtml(category.intro)}</p><p><a class="text-link" href="/catalogo">Todo el catálogo</a></p>${productLinks(pathname)}</div>`
  };
  if (pathname === '/catalogo') return {
    title: 'Catálogo de productos para gatos y perros | CatManDog',
    description: 'Explora comida, arena y accesorios para gatos y perros en CatManDog. Consulta marcas, formatos y precios antes de elegir',
    content: `<div class="page"><div class="journal-top"><h1>Catálogo para gatos y perros</h1>
      <p>Encuentra comida, arena y accesorios para tus compañeros. Compara marcas, formatos y precios en cada ficha de producto</p></div>
      <div class="journal-grid">${categoryLinks}</div><h2>Productos disponibles</h2><div class="journal-grid">${productLinks('/catalogo')}</div></div>`
  };
  if (pathname === '/recogida') return {
    title: 'Disponible para recogida | CatManDog',
    description: 'Consulta los productos de CatManDog con disponibilidad física para recogida en València',
    robots: 'noindex,follow',
    content: '<div class="page"><h1 class="page-title">Disponible para recogida</h1><p class="lead">Consulta los productos con disponibilidad física para recogida en València</p><p>Cargando disponibilidad actual</p></div>'
  };
  if (pathname === '/revista') return {
    title: 'Revista sobre mascotas | CatManDog',
    description: 'Ideas y consejos para vivir con gatos y perros: hogar, juegos y viajes',
    content: `<div class="page"><div class="journal-top"><h1>Revista sobre mascotas</h1><p>Ideas para compartir la vida con gatos y perros</p></div><div class="journal-grid">${articleLinks}</div></div>`
  };
  const match = pathname.match(/^\/revista\/([a-z0-9-]+)$/u);
  const article = match && articlesEs.find(item => item.id === match[1]);
  if (!article) return null;
  const sections = article.sections.map(section =>
    `<section class="editorial-section"><h2>${escapeHtml(section.title)}</h2>${section.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}</section>`).join('');
  const sources = article.sources.map(source =>
    `<li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`).join('');
  const takeaway = `<aside class="editorial-takeaway"><h2>${escapeHtml(article.takeaway.title)}</h2><ul>${article.takeaway.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></aside>`;
  const articleImage = articleImages[article.id];
  return {
    title: `${article.title} | CatManDog`,
    description: article.summary,
    image: articleImage, type: 'article',
    content: `<div class="page"><article class="editorial-article"><header class="editorial-header"><p class="editorial-kicker">${escapeHtml(article.section)} · ${escapeHtml(article.time)}</p><h1>${escapeHtml(article.title)}</h1><p class="editorial-deck">${escapeHtml(article.summary)}</p></header>${articleImage ? `<div class="article-photo"><img src="${escapeHtml(articleImage)}" alt="${escapeHtml(article.title)}" width="1200" height="800"></div>` : ''}<div class="editorial-body"><p class="editorial-intro">${escapeHtml(article.intro)}</p>${sections}${takeaway}<h2>Fuentes</h2><ul>${sources}</ul></div></article><a class="text-link" href="/revista">Toda la revista</a></div>`
  };
}

export async function seoDocument(pathname, db = null, selectedVariantId = null) {
  const published = seoProductForPath(pathname);
  const rows = db && published ? (await catalogSnapshot(db)).filter(row => row.product_id === published.id) : [];
  const data = await pageData(pathname, rows, selectedVariantId);
  if (!data) return null;
  let offerMarkup = '';
  if (db && published?.indexable) {
    const product = products.find(item => item.id === published.id) || (rows[0] && {
      id: published.id, name: rows[0].name, brand: rows[0].brand,
      description: rows[0].description, image: { src: rows[0].image_path } });
    const defaultId = defaultVariantId(product, rows);
    const selected = rows.find(row => row.variant_id === (selectedVariantId || defaultId));
    if (merchantVariant(selected)) {
      const image = absoluteImage(productImage(product, selected));
      const jsonLd = {
        '@context': 'https://schema.org', '@type': 'Product',
        name: published.name || productName(product), description: productDescription(product, published),
        ...(image ? { image: [image] } : {}),
        sku: selected.variant_id,
        ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
        offers: { '@type': 'Offer', url: variantUrl(pathname, selected.variant_id),
          priceCurrency: 'EUR', price: price(selected.sale_price_cents),
          availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition' }
      };
      offerMarkup = `<script type="application/ld+json">${safeJson(jsonLd)}</script>`;
      data.content = data.content.replace('</header>', `</header><p class="product-seo-offer">${escapeHtml(spanishVariantLabel(selected.label))} - ${price(selected.sale_price_cents)} € · Disponible</p>`);
    }
  }
  const template = spanishShell(await readFile(shell, 'utf8'));
  return template
    .replace(/<title>[^<]*<\/title>/u, `<title>${escapeHtml(data.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/u,
      `<meta name="description" content="${escapeHtml(data.description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/u,
      `<link rel="canonical" href="${origin}${pathname}">`)
    .replace('</head>', `${data.robots ? `<meta name="robots" content="${data.robots}">` : ''}<meta property="og:type" content="${data.type || 'website'}"><meta property="og:title" content="${escapeHtml(data.title)}"><meta property="og:description" content="${escapeHtml(data.description)}"><meta property="og:url" content="${origin}${pathname}">${data.image ? `<meta property="og:image" content="${escapeHtml(data.image)}">` : ''}${offerMarkup}</head>`)
    .replace(/<main id="app">[\s\S]*?<\/main>/u, `<main id="app">${data.content}</main>`);
}

export async function serveSeo(req, res, pathname, db = null) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const correctedLeonardoPaths = {
    '/producto/leonardo-pulled-beef-beef': '/producto/leonardo-beef-extra-pulled-beef',
    '/producto/leonardo-pulled-beef-chicken': '/producto/leonardo-chicken-extra-pulled-beef',
    '/producto/leonardo-pulled-beef-duck': '/producto/leonardo-duck-extra-pulled-beef',
    '/producto/leonardo-pulled-beef-lamb': '/producto/leonardo-lamb-extra-pulled-beef',
    '/producto/leonardo-pulled-beef-turkey': '/producto/leonardo-turkey-extra-pulled-beef',
    '/producto/leonardo-finest-selection-senior-pure-chicken': '/producto/leonardo-finest-selection-senior-chicken-pure',
    '/producto/leonardo-quality-selection-poultry': '/producto/leonardo-quality-selection-poultry-pure',
    '/producto/leonardo-finest-selection-senior-pure-beef': '/producto/leonardo-finest-selection-senior-veal-pure',
    '/producto/leonardo-finest-selection-beef-vegetables': '/producto/leonardo-finest-selection-veal-vegetables',
    '/producto/leonardo-finest-selection-venison-blueberries': '/producto/leonardo-finest-selection-venison-bilberries'
  };
  if (correctedLeonardoPaths[pathname]) {
    const query = new URL(req.url || pathname, origin).search;
    res.writeHead(301, { Location: correctedLeonardoPaths[pathname] + query,
      'Cache-Control': 'public, max-age=3600' });
    res.end();
    return true;
  }
  const selectedVariantId = new URL(req.url || pathname, origin).searchParams.get('variant');
  const body = await seoDocument(pathname, db, selectedVariantId);
  if (!body) return false;
  const noindex = seoCategoryForPath(pathname)?.indexable === false ||
    seoProductForPath(pathname)?.indexable === false || pathname === '/recogida';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    ...(noindex ? { 'X-Robots-Tag': 'noindex' } : {}) });
  res.end(req.method === 'HEAD' ? undefined : body);
  return true;
}

export async function serveMerchantFeed(req, res, pathname, db) {
  if (pathname !== '/google-products.xml' || !['GET', 'HEAD'].includes(req.method)) return false;
  if (!db) { res.writeHead(503, { 'Cache-Control': 'no-store' }); res.end(); return true; }
  const rows = (await catalogSnapshot(db)).filter(merchantVariant);
  const items = rows.map(row => {
    const published = seoProducts.find(item => item.id === row.product_id && item.indexable);
    if (!published) return '';
    const product = products.find(item => item.id === row.product_id) || {
      id: row.product_id, name: row.name, brand: row.brand, description: row.description,
      image: { src: row.image_path } };
    const image = absoluteImage(productImage(product, row));
    if (!image) return '';
    const variant = product.variants?.find(item => item.id === row.variant_id);
    const ean = String(variant?.ean || '').replace(/\D/gu, '');
    const size = spanishVariantLabel(row.label || variant?.label);
    const name = published.name || productName(product);
    const variantTitle = size.split(' · ').filter(part => !name.endsWith(part)).join(' · ');
    const title = variantTitle ? `${name} - ${variantTitle}` : name;
    const description = productDescription(product, published);
    return `<item><g:id>${escapeXml(row.variant_id)}</g:id><title>${escapeXml(title)}</title><description>${escapeXml(description)}</description><link>${escapeXml(variantUrl(published.path, row.variant_id))}</link><g:image_link>${escapeXml(image)}</g:image_link><g:availability>in_stock</g:availability><g:price>${price(row.sale_price_cents)} EUR</g:price><g:condition>new</g:condition>${product.brand ? `<g:brand>${escapeXml(product.brand)}</g:brand>` : ''}${product.variants?.length > 1 && size ? `<g:item_group_id>${escapeXml(product.id)}</g:item_group_id><g:size>${escapeXml(size)}</g:size>` : ''}${/^\d{8}$|^\d{12,14}$/u.test(ean) ? `<g:gtin>${ean}</g:gtin>` : ''}</item>`;
  }).filter(Boolean);
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>CatManDog - productos en stock</title><link>${origin}</link><description>Productos disponibles para compra en CatManDog</description>${items.join('')}</channel></rss>`;
  res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', 'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'public, max-age=900', 'X-Content-Type-Options': 'nosniff' });
  res.end(req.method === 'HEAD' ? undefined : body);
  return true;
}
