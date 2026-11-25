import { catalogEditorialContent } from '../catalog-editorial-content.js';
import { seoProducts } from '../seo-products.js';
import { stockSeoCopy } from '../stock-seo-copy.js';
import { seoWave2Copy } from '../seo-wave2-copy.js';

const editorial = new Set(Object.keys(catalogEditorialContent));
const stock = new Set(Object.keys(stockSeoCopy));
const wave2 = new Set(Object.keys(seoWave2Copy));
const families = seoProducts.map(product => ({
  id: product.id,
  path: product.path,
  indexable: product.indexable,
  copyEvidence: editorial.has(product.id) ? 'three-language-editorial'
    : stock.has(product.id) ? 'specific-spanish-seo'
      : wave2.has(product.id) ? 'three-language-wave2'
        : 'needs-copy-audit'
}));

const result = {
  code: {
    families: families.length,
    indexable: families.filter(item => item.indexable).length,
    noindex: families.filter(item => !item.indexable).length,
    threeLanguageEditorial: families.filter(item => item.copyEvidence === 'three-language-editorial').length,
    specificSpanishSeo: families.filter(item => item.copyEvidence === 'specific-spanish-seo').length,
    threeLanguageWave2: families.filter(item => item.copyEvidence === 'three-language-wave2').length,
    needsCopyAudit: families.filter(item => item.copyEvidence === 'needs-copy-audit').length
  }
};

if (process.argv.includes('--live')) {
  const response = await fetch('https://catmandog.es/api/catalog');
  if (!response.ok) throw new Error(`Public catalog returned ${response.status}`);
  const rows = (await response.json()).variants;
  const liveIds = new Set(rows.map(row => row.product_id));
  const knownIds = new Set(families.map(item => item.id));
  result.live = {
    variants: rows.length,
    families: liveIds.size,
    familiesWithoutPermanentUrl: [...liveIds].filter(id => !knownIds.has(id)),
    orderableNoindex: [...liveIds].filter(id => rows.some(row => row.product_id === id && row.availableForCart)
      && !families.find(item => item.id === id)?.indexable).length,
    pickupNoindex: [...liveIds].filter(id => rows.some(row => row.product_id === id && row.pickupAvailable)
      && !families.find(item => item.id === id)?.indexable).length,
    wave2Problems: [...wave2].filter(id => !rows.some(row => row.product_id === id && row.availableForCart
      && row.source_orderable && row.priceCents > 0 && row.image_path))
  };
}

if (process.argv.includes('--details')) result.families = families;
console.log(JSON.stringify(result, null, 2));
