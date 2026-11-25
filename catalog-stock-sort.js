import { snapshots } from './variants.js';

const heyboWithoutOwnStock = product => product.id?.startsWith('heybopet-') &&
  !snapshots(product).some(variant => variant.pickupAvailable === true);

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

// Preserve the incoming order within each group, including future manual ordering.
// Orderable HeyboPet models without our own stock remain buyable but follow the
// other orderable products. Unavailable products stay last.
export function keepUnavailableLast(products) {
  const available = products.filter(product => canSourceProduct(product) &&
    !heyboWithoutOwnStock(product));
  const heyboOnDemand = products.filter(product => canSourceProduct(product) &&
    heyboWithoutOwnStock(product));
  const unavailable = products.filter(product => !canSourceProduct(product));
  products.splice(0, products.length, ...available, ...heyboOnDemand, ...unavailable);
  return products;
}
