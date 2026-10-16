// Removed from public merchandising after the assortment review on 2026-10-16
// Retain records for saved orders and internal references; categories and gift concepts stay available
export const retiredProductIds = new Set([
  "fountain",
  "catit-pixi-smart",
  "catit-pixi-wireless",
  "catit-pixi-easy-clean",
  "catit-pixi-filters-3",
  "balcony-net",
  "trixie-balcony-rail",
  "window-hammock",
  "trixie-balcony-chair",
  "kong-scrunchie",
  "kong-cork-feather",
  "kong-caterpillar",
  "kong-noodles",
  "kong-sardine",
  "catit-mini-flower",
  "catit-flower",
  "catit-flower-mat",
  "dashi-pixie",
  "tarhong-meow",
  "tarhong-boho",
  "tarhong-flower-cat",
  "faire-greenpaws-refillable",
  "faire-greenpaws-refill",
  "faire-foggy-dog-sushi",
  "faire-simply-b-happy-cat",
  "faire-pearhead-ornament",
  "faire-egg-cloud-cat",
  "faire-justcool-cat-a6",
  "faire-cat-box-gingerbread",
  "litter",
  "carrier",
  "brush",
  "harness",
  "mineral-litter",
  "tray-basic",
  "tray-high",
  "tray-covered",
  "litter-scoop",
  "collar",
  "bed-cloud",
  "carrier-capsule",
  "nail-clippers",
  "grooming-glove"
]);
export function applyCatalogPolicy(products) {
  return products.map(product => retiredProductIds.has(product.id)
    ? { ...product, catalogHidden: true, storefrontRetired: true,
        ...(product.variants ? { variants: product.variants.map(variant => ({ ...variant, storefrontRetired: true })) } : {}) }
    : product);
}
