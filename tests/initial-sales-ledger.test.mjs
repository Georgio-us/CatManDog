import test from 'node:test';
import assert from 'node:assert/strict';
import { seedInitialSalesLedger } from '../server/initial-sales-ledger.js';

test('existing Uniko stock movement is linked without another decrement', async () => {
  const references = new Map([['neighbor-pouches-2026-11-21', 'neighbor']]);
  const variants = ['royalcanin-93e8aeca-85g',
    'tc-4e50c58957-reference-pack', 'tc-0707caf730-reference-pack',
    'yagu-7515988-catalog-pack'];
  const stockUpdates = [];
  const linkedMovements = [];
  const client = { async query(sql, params = []) {
    if (sql.includes('SELECT id FROM external_sales')) {
      const reference = params[0] || 'neighbor-pouches-2026-11-21';
      return { rows: references.has(reference) ? [{ id: references.get(reference) }] : [] };
    }
    if (sql.includes("SELECT id FROM orders WHERE number='CMD-10004'"))
      return { rows: [{ id: 'anton' }] };
    if (sql.includes('SELECT id FROM inventory_movements'))
      return { rows: [{ id: 'existing-uniko-movement' }] };
    if (sql.includes('SELECT id,stock_quantity,reserved_quantity FROM catalog_variants'))
      return { rows: variants.map(id => ({ id, stock_quantity: 3, reserved_quantity: 0 })) };
    if (sql.includes('UPDATE catalog_variants SET')) {
      stockUpdates.push(params[0]);
      return { rows: [{ stock_quantity: 2, reserved_quantity: 0 }] };
    }
    if (sql.includes('INSERT INTO external_sales')) {
      references.set(params[1], params[0]);
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes('INSERT INTO external_sale_items'))
      linkedMovements.push(params.at(-1));
    return { rows: [], rowCount: 1 };
  } };
  await seedInitialSalesLedger(client);
  assert.deepEqual(stockUpdates.sort(), [...variants].sort());
  assert.ok(linkedMovements.includes('existing-uniko-movement'));
  assert.equal(references.size, 3);
  await seedInitialSalesLedger(client);
  assert.equal(stockUpdates.length, 4);
});

test('owner confirmed Anton handoff consumes the existing reservation once', async () => {
  let delivered = false;
  const movements = [];
  const client = { async query(sql, params = []) {
    if (sql.includes('SELECT id FROM external_sales')) return { rows: [] };
    if (sql.includes("SELECT id FROM orders WHERE number='CMD-10004'"))
      return { rows: [{ id: 'anton' }] };
    if (sql.includes('SELECT id,status,stock_state,total_cents FROM orders'))
      return { rows: [{ id: 'anton', total_cents: 3735,
        status: delivered ? 'delivered' : 'received', stock_state: delivered ? 'consumed' : 'reserved' }] };
    if (sql.includes('FROM order_items')) return { rows: [
      { variant_id: 'dentalife', quantity: 1, source_mode: 'on_hand' },
      { variant_id: 'duvo', quantity: 1, source_mode: 'on_hand' },
      { variant_id: 'royal', quantity: 1, source_mode: 'on_hand' }
    ] };
    if (sql.includes('UPDATE catalog_variants SET'))
      return { rows: [{ stock_quantity: 0, reserved_quantity: 0 }] };
    if (sql.includes('INSERT INTO inventory_movements')) movements.push(params);
    if (sql.includes("UPDATE orders SET status='delivered'")) delivered = true;
    if (sql.includes('SELECT id FROM inventory_movements')) return { rows: [] };
    if (sql.includes('SELECT id,stock_quantity,reserved_quantity FROM catalog_variants'))
      return { rows: [] };
    return { rows: [] };
  } };
  await seedInitialSalesLedger(client);
  assert.equal(delivered, true);
  assert.equal(movements.length, 3);
  assert.ok(movements.every(row => row[4] === -1 && row[5] === -1));
  await seedInitialSalesLedger(client);
  assert.equal(movements.length, 3);
});
