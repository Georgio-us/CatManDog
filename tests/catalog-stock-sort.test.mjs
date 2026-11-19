import test from 'node:test';
import assert from 'node:assert/strict';
import { hasFreeStock, sortStockFirst } from '../catalog-stock-sort.js';

test('default catalog order leads with free physical stock and preserves order within groups', () => {
  const supplier = { id: 'supplier', variants: [{ pickupAvailable: false }] };
  const stock = { id: 'stock', variants: [{ pickupAvailable: true, saleStatus: 'available' }] };
  const committed = { id: 'committed', variants: [{ pickupAvailable: false, saleStatus: 'available' }] };
  const mixed = { id: 'mixed', variants: [
    { pickupAvailable: false }, { pickupAvailable: true, saleStatus: 'available' }
  ] };
  assert.deepEqual(sortStockFirst([supplier, stock, committed, mixed]).map(item => item.id),
    ['stock', 'mixed', 'supplier', 'committed']);
});

test('unavailable or retired variants do not receive physical-stock priority', () => {
  assert.equal(hasFreeStock({ variants: [{ pickupAvailable: true, saleStatus: 'unavailable' }] }), false);
  assert.equal(hasFreeStock({ variants: [{ pickupAvailable: true, storefrontRetired: true }] }), false);
});
