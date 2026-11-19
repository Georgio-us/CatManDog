import { snapshots } from './variants.js';

export function hasFreeStock(product) {
  return snapshots(product).some(variant =>
    variant.pickupAvailable === true &&
    variant.saleStatus !== 'unavailable' &&
    variant.storefrontRetired !== true);
}

export function sortStockFirst(products) {
  return products.sort((a, b) => Number(hasFreeStock(b)) - Number(hasFreeStock(a)));
}
