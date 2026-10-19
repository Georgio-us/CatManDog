import { hasVariants } from './variants.js';

export function applyServerPrices(products, entries) {
  if (!Array.isArray(entries)) return 0;
  const byId = new Map(entries.map(entry => [entry.variant_id, entry]));
  let applied = 0;
  for (const product of products) {
    const variants = hasVariants(product) ? product.variants : [product];
    for (const sku of variants) {
      const row = byId.get(sku.id);
      if (!row || row.product_id !== product.id || row.price_confirmed !== true ||
          !Number.isInteger(row.priceCents) || row.priceCents <= 0) continue;
      sku.price = row.priceCents / 100;
      sku.priceStatus = 'confirmed';
      sku.serverPriceConfirmed = true;
      if (!row.source_orderable || row.availability === 'unavailable' ||
          (row.availability === 'on_hand' && row.stock_quantity === 0))
        sku.availabilityStatus = 'unavailable';
      else sku.availabilityStatus = row.availability;
      applied += 1;
    }
  }
  return applied;
}
