import test from 'node:test';
import assert from 'node:assert/strict';
import { recordManualOperation, manualOperationChoices } from '../server/manual-operations.js';

const key = '11111111-1111-4111-8111-111111111111';
function database() {
  const state = { stock: 2, sale: null, personal: null, movements: 0, packaging: [], expenses: [] };
  const variant = { id: 'food-1', variant_id: 'food-1', name: 'Корм', label: '1 кг',
    stock_quantity: 2, reserved_quantity: 0, source_price_cents: 999,
    price_override_cents: null, price_confirmed: true, price_source: {},
    verified_quantity: 2, verified_cost_cents: 800 };
  const query = async (sql, params = []) => {
    if (sql.includes('FROM external_sales WHERE reference'))
      return { rows: state.sale ? [{ id: state.sale, reference: `admin-${key}` }] : [] };
    if (sql.includes('FROM owner_expenses WHERE reference'))
      return { rows: state.personal ? [{ id: state.personal }] : [] };
    if (sql.includes('FROM catalog_variants v JOIN catalog_products p'))
      return { rows: sql.includes('FOR UPDATE') ? [{ ...variant, stock_quantity: state.stock }] :
        [{ ...variant, image_path: '' }] };
    if (sql.includes('UPDATE catalog_variants SET')) {
      if (state.stock < params[0]) return { rows: [] };
      state.stock -= params[0];
      return { rows: [{ stock_quantity: state.stock, reserved_quantity: 0 }] };
    }
    if (sql.includes('INSERT INTO external_sales')) state.sale = params[0];
    if (sql.includes('INSERT INTO owner_expenses')) state.personal = params[0];
    if (sql.includes('INSERT INTO inventory_movements')) state.movements++;
    if (sql.includes('INSERT INTO sale_packaging_items')) state.packaging.push(params);
    if (sql.includes('INSERT INTO sale_cash_expenses')) state.expenses.push(params);
    return { rows: [], rowCount: 1 };
  };
  return { state, db: { query, async connect() { return { query, release() {} }; } } };
}

test('manual sale records stock, packaging and actual transport once', async () => {
  const { db, state } = database();
  const body = { kind: 'sale', idempotencyKey: key, customer: 'Сосед',
    paymentChannel: 'cash', receivedCents: 999,
    items: [{ variantId: 'food-1', quantity: 1 }],
    packaging: { green_bag: 1, sticker: 2 },
    expenses: [{ kind: 'delivery', description: 'Такси', amountCents: 450 }] };
  const first = await recordManualOperation(db, 'owner-1', body);
  assert.equal(first.alreadyRecorded, false);
  assert.equal(state.stock, 1);
  assert.equal(state.movements, 1);
  assert.equal(state.packaging.length, 2);
  assert.equal(state.expenses.length, 1);
  const second = await recordManualOperation(db, 'owner-1', body);
  assert.equal(second.alreadyRecorded, true);
  assert.equal(state.stock, 1);
  assert.equal(state.movements, 1);
});

test('personal use is kept out of sales and still decrements physical stock', async () => {
  const { db, state } = database();
  await recordManualOperation(db, 'owner-1', { kind: 'personal', idempotencyKey: key,
    items: [{ variantId: 'food-1', quantity: 1 }] });
  assert.equal(state.sale, null);
  assert.ok(state.personal);
  assert.equal(state.stock, 1);
});

test('manual choices show only stock available after reservations with separate retail and cost', async () => {
  const { db } = database();
  const choices = await manualOperationChoices(db);
  assert.equal(choices.variants[0].priceCents, 999);
  assert.equal(choices.variants[0].costCents, 400);
  assert.equal(choices.packaging.length, 5);
});

test('sale with unknown real purchase cost cannot invent a margin', async () => {
  const { db, state } = database();
  const original = db.connect;
  db.connect = async () => {
    const client = await original();
    const query = client.query;
    client.query = async (sql, params) => sql.includes('FOR UPDATE OF v')
      ? { rows: [{ id: 'food-1', name: 'Корм', stock_quantity: 2,
          reserved_quantity: 0, source_price_cents: 999, price_confirmed: true,
          verified_quantity: null, verified_cost_cents: null }] }
      : query(sql, params);
    return client;
  };
  await assert.rejects(recordManualOperation(db, 'owner-1', { kind: 'sale', idempotencyKey: key,
    customer: 'Сосед', paymentChannel: 'cash', receivedCents: 999,
    items: [{ variantId: 'food-1', quantity: 1 }] }), /фактическую закупку/);
  assert.equal(state.stock, 2);
});
