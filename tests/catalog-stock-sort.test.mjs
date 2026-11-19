import test from 'node:test';
import assert from 'node:assert/strict';
import { canSourceProduct, hasFreeStock, sortStockFirst } from '../catalog-stock-sort.js';

test('default catalog order leads with free physical stock', () => {
  const supplier = { id: 'supplier', variants: [{ pickupAvailable: false,
    serverSourcingAvailability: 'source_on_demand', serverSourceOrderable: true,
    saleStatus: 'available' }] };
  const stock = { id: 'stock', variants: [{ pickupAvailable: true, saleStatus: 'available' }] };
  const committed = { id: 'committed', variants: [{ pickupAvailable: false,
    serverSourcingAvailability: 'unavailable', saleStatus: 'available' }] };
  const mixed = { id: 'mixed', variants: [
    { pickupAvailable: false }, { pickupAvailable: true, saleStatus: 'available' }
  ] };
  assert.deepEqual(sortStockFirst([supplier, stock, committed, mixed]).map(item => item.id),
    ['stock', 'mixed', 'supplier', 'committed']);
});

test('stocked opening mixes brands and categories, skipping absent featured items', () => {
  const stocked = (id, brand, category, foodType) => ({ id, brand, category, foodType,
    variants: [{ pickupAvailable: true, saleStatus: 'available' }] });
  const products = [
    stocked('dog-orijen-original', 'Orijen', 'Корм', 'dry'),
    stocked('acana-first-feast', 'Acana', 'Корм', 'dry'),
    stocked('rc-wet', 'Royal Canin', 'Корм', 'wet'),
    stocked('leonardo-light', 'Leonardo', 'Корм', 'dry'),
    stocked('heybopet-hb-pwfs-s30s', 'Heybo Pet', 'Миски и поилки'),
    stocked('another-dry', 'Acana', 'Корм', 'dry'),
    stocked('another-wet', 'Leonardo', 'Корм', 'wet')
  ];
  assert.deepEqual(sortStockFirst(products).slice(0, 5).map(item => item.id), [
    'heybopet-hb-pwfs-s30s', 'leonardo-light', 'rc-wet', 'acana-first-feast',
    'dog-orijen-original'
  ]);
  const withoutFountain = products.filter(product => product.id !== 'heybopet-hb-pwfs-s30s');
  assert.equal(sortStockFirst(withoutFountain)[0].id, 'leonardo-light');
});

test('remaining stocked cards rotate category and brand before supplier cards', () => {
  const product = (id, brand, category, foodType, pickupAvailable = true) => ({
    id, brand, category, foodType, variants: [{ pickupAvailable, saleStatus: 'available' }]
  });
  const list = [
    product('dry-1', 'Acana', 'Корм', 'dry'),
    product('dry-2', 'Acana', 'Корм', 'dry'),
    product('wet-1', 'Leonardo', 'Корм', 'wet'),
    product('toy-1', 'Duvo+', 'Игрушки и аксессуары'),
    { ...product('supplier', 'Ownat', 'Корм', 'dry', false), variants: [{
      pickupAvailable: false, saleStatus: 'available',
      serverSourcingAvailability: 'source_on_demand', serverSourceOrderable: true
    }] }
  ];
  assert.deepEqual(sortStockFirst(list).map(item => item.id),
    ['dry-1', 'wet-1', 'toy-1', 'dry-2', 'supplier']);
});

test('unavailable or retired variants do not receive physical-stock priority', () => {
  assert.equal(hasFreeStock({ variants: [{ pickupAvailable: true, saleStatus: 'unavailable' }] }), false);
  assert.equal(hasFreeStock({ variants: [{ pickupAvailable: true, storefrontRetired: true }] }), false);
});

test('unavailable cards go below every supplier-orderable card', () => {
  const variant = (id, options) => ({ id, variants: [options] });
  const unavailable = variant('unavailable', { saleStatus: 'unavailable',
    serverSourcingAvailability: 'source_on_demand' });
  const noSource = variant('no-source', { saleStatus: 'available',
    serverSourcingAvailability: 'unavailable' });
  const supplier = variant('supplier', { saleStatus: 'available',
    serverSourcingAvailability: 'source_on_demand', serverSourceOrderable: true });
  const committedButReorderable = variant('committed', { pickupAvailable: false,
    saleStatus: 'available', serverSourceOrderable: true,
    serverSourcingAvailability: 'on_hand' });
  const mixed = { id: 'mixed', variants: [
    { saleStatus: 'unavailable' },
    { saleStatus: 'available', serverSourcingAvailability: 'source_on_demand',
      serverSourceOrderable: true }
  ] };
  assert.equal(canSourceProduct(unavailable), false);
  assert.equal(canSourceProduct(mixed), true);
  assert.deepEqual(sortStockFirst([unavailable, noSource, supplier, committedButReorderable, mixed])
    .map(product => product.id), ['supplier', 'committed', 'mixed', 'unavailable', 'no-source']);
});
