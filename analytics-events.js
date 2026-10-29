import { confirmedPrice, resolveVariant } from './variants.js';
import { homeGroupForProduct } from './home-catalog.js';

// This only announces an in-memory event. The GA4 adapter subscribes after
// the visitor has given analytics consent; this module sends no data itself.
export function analyticsItem(product, variant, quantity = 1) {
  if (!product) return null;
  const sku = variant || resolveVariant(product);
  if (!sku) return null;
  const price = confirmedPrice(sku);
  return {
    item_id: String(sku.id || product.id),
    item_name: String(sku.name || product.name || ''),
    item_brand: String(product.brand || 'CatManDog'),
    item_category: product.pet === 'dog' ? 'dog' : product.pet === 'cat' ? 'cat' : 'both',
    item_category2: homeGroupForProduct(product),
    quantity: Math.max(1, Math.min(99, Number(quantity) || 1)),
    ...(price === null ? {} : { price })
  };
}

export function announceCommerce(event, products, extra = {}) {
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
  const items = products.filter(Boolean);
  if (!items.length) return;
  window.dispatchEvent(new CustomEvent('catmandog:commerce', {
    detail: { event, ecommerce: { currency: 'EUR', items, ...extra } }
  }));
}
