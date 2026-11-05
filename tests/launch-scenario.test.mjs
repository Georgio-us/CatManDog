import assert from 'node:assert/strict';
import test from 'node:test';
import { launchState, launchPrice, launchGroups, launchTodaySlots,
  saveLaunchOrder } from '../server/launch-scenario.js';

test('selected supplier line appears in stock only in isolated scenario', () => {
  assert.equal(launchState(true, true), 'on_hand');
  assert.equal(launchState(false, true), 'source_on_demand');
  assert.equal(launchState(false, false), 'unavailable');
});

test('unconfirmed retail price uses the recorded source price without changing it', () => {
  const row = { price_confirmed: false, source_price_cents: 2280, price_override_cents: null };
  assert.equal(launchPrice(row), 2280);
  assert.equal(row.source_price_cents, 2280);
  assert.equal(launchPrice({ ...row, price_confirmed: true }), 2280);
  assert.equal(launchPrice({ ...row, source_price_cents: null }), null);
});

test('mixed basket creates two delivery totals only when split is selected', () => {
  const stock = { variantId: 'one', productId: 'p1', name: 'Stock', label: '2 кг',
    state: 'on_hand', priceCents: 2200, priceConfirmed: true };
  const supplier = { variantId: 'two', productId: 'p2', name: 'Supplier', label: '4 кг',
    state: 'source_on_demand', priceCents: 2280, priceConfirmed: false };
  const byId = new Map([[stock.variantId, stock], [supplier.variantId, supplier]]);
  const lines = [{ variantId: 'one', quantity: 1 }, { variantId: 'two', quantity: 1 }];
  const together = launchGroups(lines, byId, 'together');
  const separate = launchGroups(lines, byId, 'separate');
  assert.equal(together.length, 1);
  assert.equal(together[0].totalCents, 4879);
  assert.deepEqual(separate.map(group => group.deliveryType), ['stock', 'supplier']);
  assert.equal(separate.reduce((sum, group) => sum + group.totalCents, 0), 5278);
  assert.throws(() => launchGroups([...lines, lines[0]], byId), /Проверьте товар/);
  assert.throws(() => launchGroups([{ variantId: 'missing', quantity: 1 }], byId), /Проверьте товар/);
});

test('test checkout writes only to isolated test order table', async () => {
  const statements = [];
  const db = {
    async query(sql) {
      statements.push(sql);
      return { rows: [{ variant_id: 'sku-1', product_id: 'item-1', label: '2 кг',
        variant_active: true, product_active: true, name: 'Корм', brand: 'Brand',
        category: 'Корм', pet: 'cat', image_path: null, variant_image_path: null,
        price_confirmed: false, price_override_cents: null, source_price_cents: 2280,
        selected_units: 2, source_count: 1 }] };
    },
    async connect() {
      return { query: async (sql) => {
        statements.push(sql);
        if (/INSERT INTO launch_test_orders/.test(sql)) return { rows: [{ number: 'TEST-1000', total_cents: 1176 }] };
        return { rows: [] };
      }, release() {} };
    }
  };
  const result = await saveLaunchOrder(db, 'owner-id', {
    items: [{ variantId: 'sku-1', quantity: 1 }], grouping: 'together',
    contact: { name: 'Тест', email: 'test@example.com', phone: '+34600000000' },
    address: { postcode: '46001', street: 'Test', building: '1' },
    delivery: { day: 'tomorrow', slot: '14:00-18:00' }
  });
  assert.equal(result.orders[0].number, 'TEST-1000');
  assert.ok(statements.some(sql => /INSERT INTO launch_test_orders/.test(sql)));
  assert.ok(!statements.some(sql => /INSERT INTO orders\b|UPDATE catalog_variants|stripe_events/.test(sql)));
});

test('today delivery closes when no future Valencia interval remains', () => {
  assert.deepEqual(launchTodaySlots(new Date('2026-11-04T08:00:00Z')),
    ['14:00-18:00','18:00-22:00']);
  assert.deepEqual(launchTodaySlots(new Date('2026-11-04T21:00:00Z')), []);
});
