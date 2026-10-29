import { readFile } from 'node:fs/promises';
import { articlesEs } from '../journal-content-es.js';
import { seoCategoryForPath } from '../seo-categories.js';

const origin = 'https://catmandog.es';
const shell = new URL('../index.html', import.meta.url);
const escapeHtml = value => String(value).replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);

const articleLinks = articlesEs.map(article =>
  `<a class="article-card" href="/revista/${article.id}"><div class="article-meta"><span>${escapeHtml(article.section)}</span><span>${escapeHtml(article.time)}</span></div><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.summary)}</p></a>`).join('');

function pageData(pathname) {
  const category = seoCategoryForPath(pathname);
  if (category) return {
    title: `${category.title} | CatManDog`, description: category.description,
    robots: 'noindex,follow',
    content: `<div class="page"><h1 class="page-title">${escapeHtml(category.title)}</h1><p class="lead">${escapeHtml(category.intro)}</p><p><a class="text-link" href="/catalogo">Todo el catálogo</a></p></div>`
  };
  if (pathname === '/catalogo') return {
    title: 'Catálogo de productos para gatos y perros | CatManDog',
    description: 'Explora el catálogo de CatManDog para gatos y perros',
    robots: 'noindex,follow',
    content: '<div class="page"><h1>Catálogo para gatos y perros</h1><p>Explora las categorías y los productos de CatManDog</p></div>'
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
  return {
    title: `${article.title} | CatManDog`,
    description: article.summary,
    content: `<div class="page"><article class="editorial-article"><header class="editorial-header"><p class="editorial-kicker">${escapeHtml(article.section)} · ${escapeHtml(article.time)}</p><h1>${escapeHtml(article.title)}</h1><p class="editorial-deck">${escapeHtml(article.summary)}</p></header><div class="editorial-body"><p class="editorial-intro">${escapeHtml(article.intro)}</p>${sections}</div></article><a class="text-link" href="/revista">Toda la revista</a></div>`
  };
}

export async function seoDocument(pathname) {
  const data = pageData(pathname);
  if (!data) return null;
  const template = await readFile(shell, 'utf8');
  return template
    .replace(/<title>[^<]*<\/title>/u, `<title>${escapeHtml(data.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/u,
      `<meta name="description" content="${escapeHtml(data.description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/u,
      `<link rel="canonical" href="${origin}${pathname}">`)
    .replace('</head>', `${data.robots ? `<meta name="robots" content="${data.robots}">` : ''}</head>`)
    .replace(/<main id="app">[\s\S]*?<\/main>/u, `<main id="app">${data.content}</main>`);
}

export async function serveSeo(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const body = await seoDocument(pathname);
  if (!body) return false;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    ...(pathname.startsWith('/catalogo') ? { 'X-Robots-Tag': 'noindex' } : {}) });
  res.end(req.method === 'HEAD' ? undefined : body);
  return true;
}
