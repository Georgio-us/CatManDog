import { seoProductSlugs } from './seo-product-slugs.js';

// Each released family passed the 2026-11-11 catalog, price, source, copy and image audit.
// Keep this list explicit: a newly imported product must not become indexable by accident.
const releasedByCategory = {
  '/catalogo/gatos/pienso-seco': [
    'rc-sterilised', 'leonardo-poultry', 'acana-grasslands', 'orijen-original',
    'rc-kitten', 'leonardo-salmon', 'rc-digestive', 'leonardo-fresh-beef',
    'leonardo-fresh-duck', 'leonardo-fresh-salmon', 'ownat-classic-kitten',
    'ownat-classic-daily-care', 'ownat-classic-fish', 'ownat-classic-light',
    'ownat-classic-hairball', 'ownat-classic-sterilized', 'ownat-just-adult-chicken',
    'ownat-just-sterilized', 'ownat-just-sterilized-fish',
    'ownat-author-fresh-oily-fish-poultry', 'ownat-author-sterilized-fresh-chicken'
  ],
  '/catalogo/gatos/comida-humeda': ['rc-wet', 'leonardo-chicken', 'leonardo-turkey'],
  '/catalogo/perros/pienso-seco': [
    'dog-rc-mini-adult', 'dog-rc-medium-adult', 'dog-rc-mini-digestive',
    'dog-ownat-ultra-medium', 'dog-ownat-just-gf-chicken', 'dog-ownat-gf-prime',
    'dog-ownat-author-duck', 'dog-orijen-fit-trim'
  ]
};
const releasedCategoryById = new Map(Object.entries(releasedByCategory)
  .flatMap(([categoryPath, ids]) => ids.map(id => [id, categoryPath])));

const editorialOverrides = {
  'rc-sterilised': {
    title: 'Royal Canin Sterilised 37 - pienso seco para gatos',
    description: 'Pienso completo para gatos esterilizados adultos de 1 a 7 años. Compara los formatos de Royal Canin Sterilised 37 en CatManDog.'
  }
};

// Every public product has a stable URL. Search indexing is released separately.
export const seoProducts = Object.entries(seoProductSlugs).map(([id, slug]) => ({
  id,
  path: `/producto/${slug}`,
  categoryPath: releasedCategoryById.get(id) || '/catalogo',
  indexable: releasedCategoryById.has(id),
  ...(editorialOverrides[id] || {})
}));

const byPath = new Map(seoProducts.map(product => [product.path, product]));
const byId = new Map(seoProducts.map(product => [product.id, product]));

export const seoProductForPath = pathname => byPath.get(pathname) || null;
export const seoProductForId = id => byId.get(id) || null;
export const productHref = id => seoProductForId(id)?.path || `#/product/${encodeURIComponent(id)}`;
