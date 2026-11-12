import { readFile } from 'node:fs/promises';
import { articlesEs } from '../journal-content-es.js';
import { products, catalogProducts } from '../data.js';
import { homeShortcutProducts } from '../home-shortcuts.js';
import { esProductText } from '../locales/product-es.js';
import { esDetails } from '../locales/details-es.js';
import { editorialEs } from '../locales/editorial-translations.js';
import { churuDogEs } from '../locales/churu-dog.js';
import { yaguExpansionEs } from '../locales/yagu-expansion.js';
import { customerFacts, orderedVariants } from '../product-content.js';
import { seoCategories, seoCategoryForPath } from '../seo-categories.js';
import { seoProducts, seoProductForPath } from '../seo-products.js';
import { seoPickForPath } from '../seo-picks.js';

const origin = 'https://catmandog.es';
const shell = new URL('../index.html', import.meta.url);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);

const articleLinks = articlesEs.map(article =>
  `<a class="article-card" href="/revista/${article.id}"><div class="article-meta"><span>${escapeHtml(article.section)}</span><span>${escapeHtml(article.time)}</span></div><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.summary)}</p></a>`).join('');
const articleImages = {
  home: 'https://img.catmandog.es/assets/journal-home-v2.webp',
  play: 'https://img.catmandog.es/assets/journal-play-v2.webp',
  travel: 'https://img.catmandog.es/assets/journal-travel-v2.webp'
};
const shellTranslations = {
  'Маленькие радости Большая любовь': 'Pequeñas alegrías Gran amor',
  'CatManDog - главная': 'CatManDog - inicio',
  'Главная навигация': 'Navegación principal',
  'Язык сайта': 'Idioma del sitio',
  'Подборка для кошек': 'Selección para gatos',
  'Подборка для собак': 'Selección para perros',
  'Подборки': 'Selecciones',
  'Для кошек': 'Para gatos',
  'Для собак': 'Para perros',
  'Каталог': 'Catálogo',
  'Полезное': 'Recursos',
  'Журнал': 'Revista',
  'О нас': 'Sobre nosotros',
  'Поиск товаров': 'Buscar productos',
  'Избранное': 'Favoritos',
  'Кабинет питомца': 'Perfil de tu mascota',
  'Управление магазином': 'Administración de la tienda',
  'Корзина': 'Cesta',
  'Открыть меню': 'Abrir menú',
  'Что ищем для вашего питомца?': '¿Qué buscas para tu mascota?',
  'Корм, миска, любимая игрушка…': 'Pienso, comedero, juguete favorito…',
  'Закрыть поиск': 'Cerrar búsqueda',
  'Найти': 'Buscar',
  'Для них Для вас': 'Para ellos Para ti',
  'Для хорошей жизни вместе': 'Para disfrutar de la vida juntos',
  'За покупками': 'De compras',
  'Все товары': 'Todos los productos',
  'Рядом с вами': 'Cerca de ti',
  'Полезные инструменты': 'Recursos útiles',
  'О CatManDog': 'Sobre CatManDog',
  'Полезный журнал': 'Revista',
  'Доставка и возврат': 'Envíos y devoluciones',
  'Оформить возврат': 'Solicitar una devolución',
  'Есть вопрос?': '¿Tienes alguna pregunta?',
  'С радостью поможем выбрать': 'Te ayudamos a elegir',
  'то, что подойдёт вашему питомцу': 'lo que necesita tu mascota',
  'Помощь с заказом': 'Ayuda con tu pedido',
  'С заботой о каждом хвосте': 'Con cariño para cada mascota',
  'Юридическая информация': 'Información legal',
  'Условия покупки и возврата': 'Condiciones de compra y devolución',
  'Конфиденциальность': 'Privacidad'
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
  editorialEs[product.description] || churuDogEs[product.description] || esProductText[product.description] ||
  yaguExpansionEs[product.description] || product.name;
const productName = product => editorialEs[product.name] || churuDogEs[product.name] || esProductText[product.name] || product.name;
const productLinks = categoryPath => seoProducts
  .filter(item => item.indexable && item.categoryPath === categoryPath)
  .map(item => {
    const product = products.find(entry => entry.id === item.id);
    return `<a class="article-card" href="${item.path}"><h2>${escapeHtml(productName(product))}</h2><p>${escapeHtml(productDescription(product, item))}</p></a>`;
  }).join('');

function pageData(pathname) {
  const publishedProduct = seoProductForPath(pathname);
  if (publishedProduct) {
    const product = products.find(item => item.id === publishedProduct.id);
    if (!product) return null;
    const formats = (product.variants?.length ? orderedVariants(product).map(variant => variant.label) : product.sizes || [])
      .map(label => escapeHtml(label.replace(/ кг$/u, ' kg').replace(/ г$/u, ' g')));
    const description = productDescription(product, publishedProduct);
    const image = product.image?.src || (typeof product.image === 'string' ? product.image : '');
    const facts = customerFacts(product.details).map(detail => editorialEs[detail] || esDetails[detail] || yaguExpansionEs[detail] ||
      (!/[А-Яа-яЁё]/u.test(detail) ? detail : null)).filter(Boolean);
    const name = productName(product);
    const categoryLabel = publishedProduct.indexable
      ? seoCategoryForPath(publishedProduct.categoryPath)?.title || 'Todo el catálogo'
      : 'Todo el catálogo';
    return {
      title: `${publishedProduct.title || name} | CatManDog`, description,
      robots: publishedProduct.indexable ? null : 'noindex,follow',
      content: `<div class="page"><article class="editorial-article"><header class="editorial-header"><p class="editorial-kicker">${escapeHtml(product.brand || product.category || '')}</p><h1>${escapeHtml(name)}</h1><p class="editorial-deck">${escapeHtml(description)}</p></header><div class="editorial-body">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" width="640" height="640">` : ''}${facts.length ? `<h2>Sobre el producto</h2><ul>${facts.map(fact => `<li>${escapeHtml(fact)}</li>`).join('')}</ul>` : ''}${formats.length ? `<h2>Formatos disponibles</h2><p>${formats.join(', ')}</p>` : ''}<a class="text-link" href="${publishedProduct.categoryPath}">${escapeHtml(categoryLabel)}</a></div></article></div>`
    };
  }
  const pick = seoPickForPath(pathname);
  if (pick) {
    const verified = homeShortcutProducts(catalogProducts, pick.pet)
      .filter(product => seoProducts.some(entry => entry.id === product.id && entry.indexable));
    const links = verified.map(product => {
      const published = seoProducts.find(entry => entry.id === product.id);
      const description = productDescription(product, published);
      const name = productName(product);
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
      <div class="journal-grid">${categoryLinks}</div></div>`
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

export async function seoDocument(pathname) {
  const data = pageData(pathname);
  if (!data) return null;
  const template = spanishShell(await readFile(shell, 'utf8'));
  return template
    .replace(/<title>[^<]*<\/title>/u, `<title>${escapeHtml(data.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/u,
      `<meta name="description" content="${escapeHtml(data.description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/u,
      `<link rel="canonical" href="${origin}${pathname}">`)
    .replace('</head>', `${data.robots ? `<meta name="robots" content="${data.robots}">` : ''}<meta property="og:type" content="${data.type || 'website'}"><meta property="og:title" content="${escapeHtml(data.title)}"><meta property="og:description" content="${escapeHtml(data.description)}"><meta property="og:url" content="${origin}${pathname}">${data.image ? `<meta property="og:image" content="${escapeHtml(data.image)}">` : ''}</head>`)
    .replace(/<main id="app">[\s\S]*?<\/main>/u, `<main id="app">${data.content}</main>`);
}

export async function serveSeo(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const body = await seoDocument(pathname);
  if (!body) return false;
  const noindex = seoCategoryForPath(pathname)?.indexable === false ||
    seoProductForPath(pathname)?.indexable === false;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    ...(noindex ? { 'X-Robots-Tag': 'noindex' } : {}) });
  res.end(req.method === 'HEAD' ? undefined : body);
  return true;
}
