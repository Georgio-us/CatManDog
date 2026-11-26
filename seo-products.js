import { seoProductSlugs } from './seo-product-slugs.js?v=labrador-products-20261126';
import { stockSeoCopy } from './stock-seo-copy.js?v=open-seo-audit-20261125';
import { seoWave2Copy } from './seo-wave2-copy.js';

// Explicit SEO release list. The live catalog and page checks are audited separately.
// Keep this list explicit: a newly imported product must not become indexable by accident.
const releasedByCategory = {
  '/catalogo': [
    'rc-labrador-adult-wet-140g',
    'yagu-7510074-studio', 'yagu-7510082-studio', 'yagu-7514697-studio',
    'yagu-7514626', 'yagu-7514629', 'yagu-7570678-studio',
    'yagu-7570675-studio', 'yagu-7515817', 'yagu-7514696-studio',
    'yagu-7515988', 'yagu-7515987-studio', 'yagu-7517019',
    'yagu-duvo-cotton-bone-xs', 'heybopet-hb-pwfs-s30s',
    'heybopet-pwf-filters-3', 'yagu-M0295-studio',
    'cat-litter-sanicat-clumping-unscented-8l', 'cat-litter-uniko-tofu-18l',
    'yagu-navy-louise-bag', 'yagu-donut-neutral', 'yagu-donut-pana',
    'yagu-gulliver-pana-green', 'yagu-sorolla-backpack',
    'cat-litter-yommy-tofu-lavanda-6l',
    'yagu-7571307-studio', 'yagu-7571313-studio',
    'yagu-7514503-activity', 'yagu-7521059-toy',
    'yagu-7521060-toy', 'yagu-7517033-toy',
    'yagu-7517023-toy', 'yagu-7512843-toy',
    'yagu-7571304-toy', 'yagu-7571301-toy',
    'yagu-7571305-toy', 'yagu-7571300-toy',
    'yagu-7571319-toy', 'yagu-9235142',
    'yagu-9235121', 'yagu-9235036',
    'yagu-9235123', 'yagu-9235071',
    'yagu-9235038', 'yagu-9235044',
    'yagu-7552371', 'yagu-2170001', 'yagu-2170004',
    'tc-5477267745', 'tc-b5a74b28d5',
    'cats-atelier-sh-m-da100', 'cats-atelier-sh-w-a60',
    'cats-atelier-st-mb-f', 'cats-atelier-sh-m-w95-sl',
    'cats-atelier-sh-m-w75-sl', 'cats-atelier-sh-m-w75-ur',
    'cats-atelier-sh-m-w95-ur', 'cats-atelier-sh-f-60',
    'cats-atelier-sh-w-f75', 'cats-atelier-sh-w-f75-g',
    'cats-atelier-sh-w-f60-g', 'cats-atelier-sh-m-a60',
    'cats-atelier-sh-m-a75', 'cats-atelier-sh-m-a75-g',
    'cats-atelier-sh-m-w75-sr', 'cats-atelier-sh-m-w95-ul',
    'cats-atelier-sh-m-w75-ul', 'cats-atelier-sh-w-w95-ul',
    'cats-atelier-sh-w-w95-ur', 'cats-atelier-sh-w-a60-g',
    'cats-atelier-sh-m-a60-g', 'cats-atelier-sh-m-w95-sp',
    'cats-atelier-st-wb-f', 'cats-atelier-rd-st',
    'cats-atelier-sh-m-a95',
    'cats-atelier-co-m-60', 'cats-atelier-co-w-a60',
    'cats-atelier-co-w-95', 'cats-atelier-co-m-75',
    'cats-atelier-co-m-95', 'cats-atelier-co-m-100',
    'cats-atelier-ma-w-60', 'cats-atelier-ma-w-95',
    'cats-atelier-ma-m-60', 'cats-atelier-ma-m-75',
    'cats-atelier-ma-m-95', 'cats-atelier-ma-m-100',
    'cats-atelier-co-w-f60', 'cats-atelier-co-w-f75'
  ],
  '/catalogo/gatos/pienso-seco': [
    'rc-sterilised-senior', 'rc-maine-coon', 'rc-british',
    'rc-sterilised', 'leonardo-poultry', 'acana-grasslands', 'orijen-original',
    'rc-kitten', 'leonardo-salmon', 'rc-digestive', 'ownat-classic-kitten',
    'ownat-classic-daily-care', 'ownat-classic-fish', 'ownat-classic-light',
    'ownat-classic-hairball', 'ownat-classic-sterilized', 'ownat-just-adult-chicken',
    'ownat-just-sterilized', 'ownat-just-sterilized-fish',
    'ownat-author-fresh-oily-fish-poultry', 'ownat-author-sterilized-fresh-chicken',
    'acana-first-feast', 'acana-indoor', 'acana-bountiful', 'acana-homestead',
    'acana-wild-prairie', 'acana-pacifica', 'acana-hp-indoor',
    'orijen-six-fish', 'orijen-kitten', 'orijen-guardian8',
    'orijen-fit-trim', 'orijen-regional-red',
    'rc-fit', 'rc-indoor', 'rc-kitten-regular', 'rc-mother-babycat',
    'rc-hairball', 'rc-sensible', 'leonardo-light', 'leonardo-kitten',
    'leonardo-adult-duck', 'leonardo-maxi', 'leonardo-kitten-gf',
    'leonardo-fresh-beef', 'leonardo-fresh-duck', 'leonardo-fresh-salmon',
    'rc-urinary', 'rc-light', 'leonardo-senior', 'leonardo-senior-gf',
    'leonardo-complete', 'rc-persian', 'rc-persian-kitten', 'rc-sphynx-adult', 'leonardo-fish', 'leonardo-lamb'
  ],
  '/catalogo/gatos/comida-humeda': [
    'leonardo-wet-salmon', 'leonardo-wet-herring', 'leonardo-wet-lamb',
    'leonardo-wet-venison', 'leonardo-wet-poultry-egg', 'leonardo-wet-pure-beef',
    'royalcanin-1fdaaee6', 'royalcanin-78dac31b', 'royalcanin-11fd4a79',
    'royalcanin-b348c5c6', 'royalcanin-04439e9c', 'royalcanin-92ee61fb',
    'royalcanin-5536b29b', 'royalcanin-a78036ba', 'royalcanin-c23304f8',
    'royalcanin-aad6d1bc',
    'royalcanin-676d439a', 'royalcanin-96e21d56', 'royalcanin-99cd69dd',
    'royalcanin-5dbd7826', 'royalcanin-0a55a9ec',
    'royalcanin-a85257e1', 'royalcanin-77b93f1a',
    'rc-wet', 'leonardo-chicken', 'leonardo-turkey',
    'leonardo-wet-pure-chicken', 'royalcanin-93e8aeca',
    'acana-wet-beef', 'acana-wet-chicken', 'acana-wet-kitten',
    'acana-wet-lamb', 'acana-wet-salmon', 'acana-wet-tuna',
    'leonardo-wet-kitten', 'leonardo-wet-rabbit', 'leonardo-wet-buffalo',
    'leonardo-wet-pheasant', 'leonardo-wet-lamb-cranberry',
    'leonardo-wet-duck-cheese', 'leonardo-wet-fish-shrimp',
    'leonardo-wet-trout-catnip', 'leonardo-wet-meat-menu',
    'leonardo-wet-senior-beef', 'leonardo-wet-beef-vegetables',
    'leonardo-wet-venison-blueberries',
    'leonardo-wet-senior-chicken', 'leonardo-wet-quality-kitten',
    'leonardo-wet-quality-poultry', 'leonardo-wet-quality-beef',
    'leonardo-wet-quality-rabbit', 'leonardo-wet-quality-ocean-fish',
    'leonardo-wet-quality-liver', 'leonardo-wet-quality-duck',
    'leonardo-wet-superior-horse', 'leonardo-wet-superior-lamb',
    'leonardo-wet-superior-duck', 'leonardo-wet-superior-turkey',
    'leonardo-wet-superior-chicken', 'leonardo-wet-superior-beef',
    'leonardo-wet-pulled-beef', 'leonardo-wet-pulled-chicken',
    'leonardo-wet-pulled-duck', 'leonardo-wet-pulled-lamb',
    'leonardo-wet-pulled-turkey',
    'leonardo-wet-pure-turkey', 'royalcanin-8d039848',
    'royalcanin-659556dc', 'royalcanin-a510d4e9',
    'royalcanin-f2600773', 'royalcanin-d861a238',
    'royalcanin-6168e429', 'royalcanin-e34b38d7',
    'royalcanin-9f8011d7', 'royalcanin-7f8c2e4e', 'rc-kitten-jelly'
  ],
  '/catalogo/gatos/premios': [
    'tc-0ed7b07305', 'tc-4b391892b7', 'tc-57f941fe4f',
    'tc-185b159101', 'tc-5da4b0e874', 'tc-0206d66a70',
    'tc-4e50c58957', 'tc-0707caf730', 'tc-768abf17c2',
    'tc-dc3d6d94c2', 'tc-713f42fb9a',
    'cmd-source-694e05cdc1b2582c',
    'tc-82b5e1f561', 'tc-c4fc3a3e21', 'tc-719843e78f',
    'tc-06a4db0143', 'tc-1877f4a340', 'tc-b121011ccc'
  ],
  '/catalogo/perros/pienso-seco': [
    'rc-labrador-puppy-3kg', 'rc-labrador-puppy-12kg',
    'rc-labrador-adult-3kg', 'rc-labrador-adult-12kg',
    'rc-labrador-sterilised-12kg', 'rc-labrador-adult5-12kg',
    'cmd-source-f025a9dbc9d479c7', 'cmd-source-39c2d5db76be47f7',
    'cmd-source-5d1bd37fc7a7c699', 'cmd-source-c26796839ace4c6e',
    'cmd-source-3b6cbf7e0c31efab', 'cmd-source-0f4a3ef9889b8ff3',
    'cmd-source-95203d59566cbe4d', 'cmd-source-90d2d4b6858c08cd',
    'cmd-source-67755e1e1068c6f6', 'cmd-source-11acbc9ed4d69f1c',
    'cmd-source-5902317db04f9f0e', 'cmd-source-3e01ebf957337e76',
    'cmd-source-6d56f8fb416a81c4', 'royal-canin-chihuahua-adult',
    'dog-orijen-fit-trim',
    'dog-orijen-original', 'dog-orijen-puppy', 'dog-orijen-six-fish',
    'dog-orijen-small-breed', 'cmd-source-classics-red-meat',
    'cmd-source-classics-wild-coast', 'cmd-source-puppy-small-breed',
    'cmd-source-acana-senior', 'dog-rc-mini-adult',
    'dog-rc-medium-adult', 'dog-rc-mini-digestive',
    'dog-ownat-ultra-medium', 'dog-ownat-just-gf-chicken',
    'dog-ownat-gf-prime', 'dog-ownat-author-duck',
    'dog-rc-mini-puppy', 'dog-rc-maxi-adult', 'dog-ownat-classic-complet'
  ],
  '/catalogo/perros/premios': [
    'churu-dog-chicken', 'churu-dog-tuna-pack4', 'churu-dog-tuna-pack8',
    'churu-dog-tuna-bites', 'churu-dog-salmon-pack4', 'churu-dog-salmon-pack8',
    'churu-dog-salmon-bites', 'churu-dog-cheese-pack4', 'churu-dog-cheese-pack8',
    'churu-dog-cheese-bites', 'churu-dog-chicken-pack8', 'churu-dog-chicken-bites',
    'yagu-7570677-studio', 'yagu-7570651-studio', 'yagu-7516214-studio'
  ]
};
const releasedCategoryById = new Map(Object.entries(releasedByCategory)
  .flatMap(([categoryPath, ids]) => ids.map(id => [id, categoryPath])));

const editorialOverrides = {
  'rc-sterilised': {
    title: 'Royal Canin Sterilised 37 - pienso seco para gatos',
    description: 'Pienso seco Royal Canin Sterilised 37 para gatos esterilizados de 1 a 7 años. Su contenido moderado de grasa y su equilibrio de minerales se adaptan a esta etapa; disponible en varias bolsas.'
  }
};

// Every public product has a stable URL. Search indexing is released separately.
export const seoProducts = Object.entries(seoProductSlugs).map(([id, slug]) => ({
  id,
  path: `/producto/${slug}`,
  categoryPath: releasedCategoryById.get(id) || '/catalogo',
  indexable: releasedCategoryById.has(id),
  ...(editorialOverrides[id] || {}),
  ...(stockSeoCopy[id] || {}),
  ...(seoWave2Copy[id] || {})
}));

const byPath = new Map(seoProducts.map(product => [product.path, product]));
const byId = new Map(seoProducts.map(product => [product.id, product]));

export const seoProductForPath = pathname => byPath.get(pathname) || null;
export const seoProductForId = id => byId.get(id) || null;
export const productHref = id => seoProductForId(id)?.path || `#/product/${encodeURIComponent(id)}`;
