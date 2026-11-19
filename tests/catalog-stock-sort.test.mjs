import test from 'node:test';
import assert from 'node:assert/strict';
import { canSourceProduct, keepUnavailableLast } from '../catalog-stock-sort.js';

const card = (id, variants) => ({ id, variants });

test('default catalog preserves incoming order among purchasable cards', () => {
  const cards = [
    card('supplier-churu', [{ saleStatus: 'available', pickupAvailable: false }]),
    card('unavailable-advance', [{ saleStatus: 'unavailable' }]),
    card('stocked-wet', [{ saleStatus: 'available', pickupAvailable: true }]),
    card('supplier-leonardo', [{ saleStatus: 'preorder', pickupAvailable: false }]),
    card('stocked-litter', [{ saleStatus: 'available', pickupAvailable: true }])
  ];
  assert.deepEqual(keepUnavailableLast(cards).map(item => item.id), [
    'supplier-churu', 'stocked-wet', 'supplier-leonardo', 'stocked-litter',
    'unavailable-advance'
  ]);
});

test('unavailable products keep their existing order at the end', () => {
  const cards = [
    card('advance', [{ saleStatus: 'unavailable' }]),
    card('hill', [{ saleStatus: 'unavailable' }]),
    card('rc', [{ saleStatus: 'available', serverAvailableForCart: true }]),
    card('acana', [{ saleStatus: 'unavailable' }])
  ];
  assert.deepEqual(keepUnavailableLast(cards).map(item => item.id),
    ['rc', 'advance', 'hill', 'acana']);
});

test('any purchasable variant keeps a card available', () => {
  const mixed = card('mixed', [
    { saleStatus: 'unavailable' },
    { saleStatus: 'available', serverAvailableForCart: true }
  ]);
  assert.equal(canSourceProduct(mixed), true);
  assert.deepEqual(keepUnavailableLast([card('unavailable', [{ saleStatus: 'unavailable' }]), mixed])
    .map(item => item.id), ['mixed', 'unavailable']);
});

test('retired or blocked variants do not hold a card above unavailable items', () => {
  const blocked = card('blocked', [{ saleStatus: 'available', serverAvailableForCart: false }]);
  const retired = card('retired', [{ saleStatus: 'available', storefrontRetired: true }]);
  const offered = card('offered', [{ saleStatus: 'available', serverAvailableForCart: true }]);
  assert.deepEqual(keepUnavailableLast([blocked, retired, offered]).map(item => item.id),
    ['offered', 'blocked', 'retired']);
});

test('after customer price sorting only availability boundary changes', () => {
  const cards = [
    card('cheap-unavailable', [{ saleStatus: 'unavailable' }]),
    card('mid-available', [{ saleStatus: 'available' }]),
    card('expensive-available', [{ saleStatus: 'available' }])
  ];
  assert.deepEqual(keepUnavailableLast(cards).map(item => item.id),
    ['mid-available', 'expensive-available', 'cheap-unavailable']);
});
