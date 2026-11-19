import { snapshots } from './variants.js';
import { homeGroupForProduct } from './home-catalog.js';

// Editorial opening for the full catalog. An item is used only while it has free stock.
const openingIds = [
  'heybopet-hb-pwfs-s30s',
  'leonardo-light',
  'rc-wet',
  'acana-first-feast',
  'dog-orijen-original',
  'tc-4e50c58957',
  'yagu-7515817'
];

export function hasFreeStock(product) {
  return snapshots(product).some(variant =>
    variant.pickupAvailable === true &&
    variant.saleStatus !== 'unavailable' &&
    variant.storefrontRetired !== true);
}

export function sortStockFirst(products) {
  const stocked = products.filter(hasFreeStock);
  const remaining = products.filter(product => !hasFreeStock(product));
  const byId = new Map(stocked.map(product => [product.id, product]));
  const opening = openingIds.flatMap(id => byId.has(id) ? [byId.get(id)] : []);
  const featured = new Set(opening.map(product => product.id));
  const pool = stocked.filter(product => !featured.has(product.id));
  const arranged = [...opening];

  while (pool.length) {
    const recent = arranged.slice(-4);
    const score = product => {
      const group = homeGroupForProduct(product);
      return recent.reduce((penalty, previous, index) => {
        const weight = index + 1;
        return penalty + (homeGroupForProduct(previous) === group ? 4 * weight : 0) +
          (previous.brand === product.brand ? 2 * weight : 0);
      }, 0);
    };
    let best = 0;
    for (let index = 1; index < pool.length; index++) {
      if (score(pool[index]) < score(pool[best])) best = index;
    }
    arranged.push(pool.splice(best, 1)[0]);
  }
  products.splice(0, products.length, ...arranged, ...remaining);
  return products;
}
