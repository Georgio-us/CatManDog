import { seoProductSlugs } from './seo-product-slugs.js';

const released = {
  'rc-sterilised': {
    categoryPath: '/catalogo/gatos/pienso-seco',
    title: 'Royal Canin Sterilised 37 - pienso seco para gatos',
    description: 'Pienso completo para gatos esterilizados adultos de 1 a 7 años. Compara los formatos de Royal Canin Sterilised 37 en CatManDog.'
  }
};

// Every public product has a stable URL. Search indexing is released separately.
export const seoProducts = Object.entries(seoProductSlugs).map(([id, slug]) => ({
  id,
  path: `/producto/${slug}`,
  categoryPath: released[id]?.categoryPath || '/catalogo',
  indexable: Boolean(released[id]),
  ...(released[id] || {})
}));

const byPath = new Map(seoProducts.map(product => [product.path, product]));
const byId = new Map(seoProducts.map(product => [product.id, product]));

export const seoProductForPath = pathname => byPath.get(pathname) || null;
export const seoProductForId = id => byId.get(id) || null;
export const productHref = id => seoProductForId(id)?.path || `#/product/${encodeURIComponent(id)}`;
