import { seoProductSlugs } from './seo-product-slugs.js?v=yagu-basket-20261113';

// Each released family passed the current catalog, price, source, copy and image audit.
// Keep this list explicit: a newly imported product must not become indexable by accident.
const releasedByCategory = {
  '/catalogo/gatos/pienso-seco': [
    'rc-sterilised', 'leonardo-poultry', 'acana-grasslands', 'orijen-original',
    'rc-kitten', 'leonardo-salmon', 'rc-digestive', 'ownat-classic-kitten',
    'ownat-classic-daily-care', 'ownat-classic-fish', 'ownat-classic-light',
    'ownat-classic-hairball', 'ownat-classic-sterilized', 'ownat-just-adult-chicken',
    'ownat-just-sterilized', 'ownat-just-sterilized-fish',
    'ownat-author-fresh-oily-fish-poultry', 'ownat-author-sterilized-fresh-chicken',
    'acana-first-feast', 'acana-indoor', 'acana-bountiful', 'acana-homestead',
    'acana-wild-prairie', 'acana-pacifica', 'acana-hp-indoor',
    'orijen-six-fish', 'orijen-kitten', 'orijen-guardian8',
    'rc-fit', 'rc-indoor', 'rc-kitten-regular', 'rc-mother-babycat',
    'rc-hairball', 'rc-sensible', 'leonardo-light', 'leonardo-kitten',
    'leonardo-adult-duck', 'leonardo-maxi', 'leonardo-kitten-gf',
    'leonardo-fresh-beef', 'leonardo-fresh-duck', 'leonardo-fresh-salmon'
  ],
  '/catalogo/gatos/comida-humeda': [
    'rc-wet', 'leonardo-chicken', 'leonardo-turkey',
    'acana-wet-beef', 'acana-wet-chicken', 'acana-wet-kitten',
    'acana-wet-lamb', 'acana-wet-salmon', 'acana-wet-tuna'
  ],
  '/catalogo/gatos/premios': [
    'tc-4e50c58957', 'tc-0707caf730', 'tc-768abf17c2',
    'tc-dc3d6d94c2', 'tc-713f42fb9a'
  ],
  '/catalogo/perros/pienso-seco': [
    'dog-orijen-fit-trim',
    'dog-orijen-original', 'dog-orijen-puppy', 'dog-orijen-six-fish',
    'dog-orijen-small-breed', 'cmd-source-classics-red-meat',
    'cmd-source-classics-wild-coast', 'cmd-source-puppy-small-breed',
    'cmd-source-acana-senior', 'dog-rc-mini-adult',
    'dog-rc-medium-adult', 'dog-rc-mini-digestive',
    'dog-ownat-ultra-medium', 'dog-ownat-just-gf-chicken',
    'dog-ownat-gf-prime', 'dog-ownat-author-duck'
  ],
  '/catalogo/perros/premios': [
    'churu-dog-chicken', 'churu-dog-tuna-pack4', 'churu-dog-tuna-pack8',
    'churu-dog-tuna-bites', 'churu-dog-salmon-pack4', 'churu-dog-salmon-pack8',
    'churu-dog-salmon-bites', 'churu-dog-cheese-pack4', 'churu-dog-cheese-pack8',
    'churu-dog-cheese-bites', 'churu-dog-chicken-pack8', 'churu-dog-chicken-bites'
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
