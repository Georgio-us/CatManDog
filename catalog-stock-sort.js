import { snapshots } from './variants.js';

export function canSourceProduct(product) {
  return snapshots(product).some(variant =>
    variant.storefrontRetired !== true &&
    variant.saleStatus !== 'unavailable' &&
    variant.serverAvailableForCart !== false &&
    (['available', 'preorder'].includes(variant.saleStatus) ||
      (variant.serverSourceOrderable === true &&
        variant.serverSourcingAvailability === 'source_on_demand') ||
      (variant.serverSourceOrderable === true &&
        variant.serverSourcingAvailability === 'on_hand') ||
      (variant.serverSourcingAvailability == null &&
        variant.availabilityStatus === 'source_on_demand')));
}

// Preserve the incoming order of purchasable products, including future manual ordering.
// Availability only moves unavailable cards after the last purchasable card.
export function keepUnavailableLast(products) {
  const available = products.filter(canSourceProduct);
  const unavailable = products.filter(product => !canSourceProduct(product));
  products.splice(0, products.length, ...available, ...unavailable);
  return products;
}
