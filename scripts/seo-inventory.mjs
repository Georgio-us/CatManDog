import { catalogEditorialContent } from '../catalog-editorial-content.js';
import { catsAtelierProducts } from '../cats-atelier-products.js';
import { products } from '../data.js';
import { seoProducts } from '../seo-products.js';
import { stockSeoCopy } from '../stock-seo-copy.js';
import { seoWave2Copy } from '../seo-wave2-copy.js';
import { readFile } from 'node:fs/promises';

const editorial = new Set(Object.keys(catalogEditorialContent));
const stock = new Set(Object.keys(stockSeoCopy));
const wave2 = new Set(Object.keys(seoWave2Copy));
const atelier = new Set(catsAtelierProducts.map(product => product.id));
// Editorial record covers the 20-tube box, but this family also sells loose tubes.
const knownCopyMismatches = new Map([
  ['cmd-source-694e05cdc1b2582c', 'seo-copy-describes-box-but-family-also-sells-loose-tubes']
]);
const catalogNames = new Map(products.map(product => [product.id, product.name]));
const families = seoProducts.map(product => ({
  id: product.id,
  name: product.name || catalogNames.get(product.id) || product.id,
  path: product.path,
  indexable: product.indexable,
  copyEvidence: editorial.has(product.id) ? 'three-language-editorial'
    : stock.has(product.id) ? 'specific-spanish-seo'
      : wave2.has(product.id) ? 'three-language-wave2'
        : atelier.has(product.id) ? 'three-language-structured-atelier'
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
    threeLanguageStructuredAtelier: families.filter(item => item.copyEvidence === 'three-language-structured-atelier').length,
    needsCopyAudit: families.filter(item => item.copyEvidence === 'needs-copy-audit').length,
    indexableNeedsCopyAudit: families.filter(item => item.indexable && item.copyEvidence === 'needs-copy-audit').length,
    noindexNeedsCopyAudit: families.filter(item => !item.indexable && item.copyEvidence === 'needs-copy-audit').length
  }
};

const catalogFileIndex = process.argv.indexOf('--catalog-file');
if (process.argv.includes('--live') || catalogFileIndex !== -1) {
  const catalog = catalogFileIndex !== -1
    ? JSON.parse(await readFile(process.argv[catalogFileIndex + 1], 'utf8'))
    : await (async () => {
      const response = await fetch('https://catmandog.es/api/catalog');
      if (!response.ok) throw new Error(`Public catalog returned ${response.status}`);
      return response.json();
    })();
  const rows = catalog.variants;
  const liveIds = new Set(rows.map(row => row.product_id));
  const knownIds = new Set(families.map(item => item.id));
  const variantsByFamily = new Map();
  for (const row of rows) {
    if (!variantsByFamily.has(row.product_id)) variantsByFamily.set(row.product_id, []);
    variantsByFamily.get(row.product_id).push(row);
  }
  const assessed = families.map(item => {
    const variants = variantsByFamily.get(item.id) || [];
    const blockers = variants.flatMap(variant => {
      const reasons = [];
      if (!variant.availableForCart) reasons.push('not-orderable');
      if (!variant.price_accepted || !(variant.priceCents > 0)) reasons.push('retail-price-not-accepted');
      if (!variant.source_orderable && !variant.pickupAvailable) reasons.push('no-orderable-source-or-physical-stock');
      if (!variant.image_path) reasons.push('no-main-image');
      return reasons.map(reason => ({ variantId: variant.variant_id, reason }));
    });
    const copyIssue = knownCopyMismatches.get(item.id) || null;
    const textNeedsReview = copyIssue || !['three-language-editorial', 'three-language-wave2'].includes(item.copyEvidence);
    const gate = !variants.length ? 'missing-live-variants'
      : blockers.length ? 'commercial-review'
        : textNeedsReview ? 'three-language-copy-review'
          : 'passes-recorded-gates';
    return { ...item, name: item.name === item.id ? variants[0]?.name || item.name : item.name, gate, blockers, copyIssue };
  });
  const summarize = indexable => Object.fromEntries(
    ['missing-live-variants', 'commercial-review', 'three-language-copy-review', 'passes-recorded-gates']
      .map(gate => [gate, assessed.filter(item => item.indexable === indexable && item.gate === gate).length]));
  result.live = {
    variants: rows.length,
    families: liveIds.size,
    familiesWithoutPermanentUrl: [...liveIds].filter(id => !knownIds.has(id)),
    orderableNoindex: [...liveIds].filter(id => rows.some(row => row.product_id === id && row.availableForCart)
      && !families.find(item => item.id === id)?.indexable).length,
    pickupNoindex: [...liveIds].filter(id => rows.some(row => row.product_id === id && row.pickupAvailable)
      && !families.find(item => item.id === id)?.indexable).length,
    wave2Problems: [...wave2].filter(id => !rows.some(row => row.product_id === id && row.availableForCart
      && (row.source_orderable || row.pickupAvailable) && row.price_accepted && row.priceCents > 0 && row.image_path)),
    noindexReasons: summarize(false),
    indexableAudit: summarize(true),
    noindexReadyIds: assessed.filter(item => !item.indexable && item.gate === 'passes-recorded-gates').map(item => item.id)
  };
  if (process.argv.includes('--details')) result.families = assessed;
}

if (process.argv.includes('--details') && !result.families) result.families = families;
console.log(JSON.stringify(result, null, 2));
