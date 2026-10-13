// Export only researched real products, without importing the website/demo catalogue
import { writeFileSync } from 'node:fs';
import { accessoryProducts } from '../accessory-products.js';
import { waterBalconyProducts } from '../water-balcony-products.js';
import { faireProducts } from '../faire-products.js';

const unique = new Map();
const waterIds = new Set(waterBalconyProducts.map(p => p.id));
for (const p of [...waterBalconyProducts, ...accessoryProducts]) {
  const key = p.ean ? `ean:${p.ean.replace(/^0+/, '')}` : `id:${p.id}`;
  if (!unique.has(key)) unique.set(key, p);
}
const snapshot = (p, document) => ({
  id: p.id,
  name: p.name,
  brand: p.brand || p.line?.split(' · ')[0] || null,
  category: p.category,
  packaging: p.weight || p.variantLabel || p.label || p.sizes?.join(' / ') || null,
  ean: p.ean || null,
  sourceUrls: [...new Set([p.supplier?.url, p.imageSource?.pageUrl, p.retailPriceSource?.sourceUrl].filter(Boolean))],
  supplier: p.supplier || null,
  retailPrice: p.retailPrice ?? p.price ?? null,
  priceKind: p.priceKind || p.priceStatus || 'unconfirmed',
  purchasePrice: p.purchasePrice ?? null,
  document,
});
const result = {
  sources: ['ACCESSORY-SOURCING.md', 'WATER-BALCONY-SOURCING.md', 'FAIRE-SOURCING.md'],
  everyday: [...unique.values()].map(p => snapshot(p, waterIds.has(p.id) ? 'WATER-BALCONY-SOURCING.md' : 'ACCESSORY-SOURCING.md')),
  gifts: faireProducts.flatMap(p => (p.variants?.length ? p.variants : [p]).map(v => snapshot({ ...p, ...v }, 'FAIRE-SOURCING.md'))),
};
writeFileSync(new URL('./existing-research.json', import.meta.url), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ everyday: result.everyday.length, giftVariants: result.gifts.length }));
