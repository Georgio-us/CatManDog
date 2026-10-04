// Variant snapshots contain their own price, image, sources and specifications
export const hasVariants = product => Array.isArray(product?.variants) && product.variants.length > 0;
export const snapshots = product => hasVariants(product) ? product.variants : [product];
export function resolveVariant(product, variantId) {
  if (!hasVariants(product)) return product;
  return product.variants.find(v => v.id === (variantId || product.defaultVariantId)) || (!variantId ? product.variants[0] : null);
}
export function confirmedPrice(sku) {
  return sku && sku.priceStatus !== 'pending' && Number.isFinite(sku.price) && sku.price > 0 ? sku.price : null;
}
export const DEMO_PRICE = 7.77;
export const isDemoPrice = sku => !!sku && confirmedPrice(sku) === null;
// Keep sourcing prices untouched; the storefront uses an explicit demo price
export const storefrontPrice = sku => sku ? confirmedPrice(sku) ?? DEMO_PRICE : null;
export function canBuy(sku) {
  return storefrontPrice(sku) !== null && !['unavailable','out-of-stock','outOfStock','discontinued'].includes(sku.availabilityStatus);
}
export function catalogPrice(product) {
  const variants = snapshots(product);
  const prices = variants.map(storefrontPrice);
  return { amount: Math.min(...prices), from: variants.length > 1, demo: variants.some(isDemoPrice) };
}
export function normalizeCart(items, products) {
  if (!Array.isArray(items)) return [];
  return items.flatMap(item => {
    if (!item || !Number.isInteger(item.qty) || item.qty < 1) return [];
    let product = products.find(p => p.id === (item.productId || item.id));
    // Preserve an old SKU link if it has since become a family's variant
    if (!product) product = products.find(p => hasVariants(p) && p.variants.some(v => v.id === item.id));
    if (!product) return [];
    let variantId = item.variantId;
    if (hasVariants(product) && !variantId) {
      const legacy = product.variants.find(v => v.id === item.id || v.label === item.size || v.sizes?.includes(item.size));
      variantId = legacy?.id || product.defaultVariantId || product.variants[0].id;
    }
    const sku = resolveVariant(product, variantId);
    if (!sku) return []; // Never substitute a removed SKU with a different one
    if (!hasVariants(product) && typeof item.size !== 'string') return [];
    return [{ ...item, id: product.id, productId: product.id, qty: Math.min(99,item.qty),
      ...(hasVariants(product) ? { variantId: sku.id, variantLabel: sku.label, size: sku.label } : { variantId: null }) }];
  });
}
export function cartSku(item, products) {
  const product = products.find(p => p.id === (item.productId || item.id));
  return product ? resolveVariant(product,item.variantId) : null;
}
export function sameCartSku(a,b) {
  return (a.productId || a.id) === (b.productId || b.id) && (a.variantId || null) === (b.variantId || null) && a.size === b.size;
}
