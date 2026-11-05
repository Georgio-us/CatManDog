import assert from 'node:assert/strict';
import test from 'node:test';
import { handleApi } from '../server/api.js';
import { churuRepackOptions } from '../churu-retail-formats.js';

function warehouse(productId, initial, reserved = {}) {
  const stock = new Map(Object.entries(initial));
  const batches = new Map();
  const movements = [];
  const client = {
    async query(sql, params = []) {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] };
      if (sql.includes('INSERT INTO churu_repack_batches')) {
        if (batches.has(params[0])) return { rows: [] };
        batches.set(params[0], { product_id: params[1], operation: params[2], quantity: params[3] });
        return { rows: [{ idempotency_key: params[0] }] };
      }
      if (sql.includes('FROM churu_repack_batches')) return { rows: [batches.get(params[0])] };
      if (sql.includes('FROM catalog_variants') && sql.includes('FOR UPDATE'))
        return { rows: params[0].filter(id => stock.has(id)).map(id => ({ id })) };
      if (sql.includes('stock_quantity=stock_quantity-$1')) {
        const [qty, id] = params;
        if (stock.get(id) - (reserved[id] || 0) < qty) return { rows: [] };
        stock.set(id, stock.get(id) - qty);
        return { rows: [{ stock_quantity: stock.get(id), reserved_quantity: reserved[id] || 0 }] };
      }
      if (sql.includes('stock_quantity=coalesce(stock_quantity,0)+$1')) {
        const [qty, id] = params;
        stock.set(id, (stock.get(id) || 0) + qty);
        return { rows: [{ stock_quantity: stock.get(id), reserved_quantity: reserved[id] || 0 }] };
      }
      if (sql.includes('INSERT INTO inventory_movements')) {
        movements.push({ variantId: params[1], reason: params[7], delta: params[8] });
        return { rows: [] };
      }
      if (sql.includes('INSERT INTO admin_audit_events')) return { rows: [] };
      throw new Error(`Unexpected SQL: ${sql}`);
    },
    release() {}
  };
  const db = {
    async query(sql) {
      if (sql.includes('FROM staff_sessions'))
        return { rows: [{ id: 'owner-1', email: 'owner@example.test', role: 'owner' }] };
      throw new Error(`Unexpected DB SQL: ${sql}`);
    },
    async connect() { return client; }
  };
  async function repack(operation, quantity, key = 'churu_repack_test_key_0001') {
    const result = { status: null, body: null };
    const res = { writeHead(status) { result.status = status; },
      end(body) { result.body = JSON.parse(body); } };
    const req = { method: 'POST', headers: { cookie: `cmd_staff_session=${'c'.repeat(64)}` },
      socket: { remoteAddress: 'churu-repack-test' },
      async *[Symbol.asyncIterator]() {
        yield JSON.stringify({ productId, operation, quantity, idempotencyKey: key });
      } };
    await handleApi(db, req, res, '/api/admin/churu/repack');
    return result;
  }
  return { stock, movements, repack };
}

test('opening one Churu pack transfers its stock into four tubes exactly once', async () => {
  const productId = 'tc-4e50c58957';
  const option = churuRepackOptions(productId)[0];
  const pack = option.from.id;
  const stick = option.to[0].id;
  const warehouseState = warehouse(productId, { [pack]: 3, [stick]: 0,
    [`${productId}-carton48`]: 0 }, { [pack]: 1 });
  assert.equal((await warehouseState.repack('open-pack', 1)).status, 201);
  assert.equal(warehouseState.stock.get(pack), 2);
  assert.equal(warehouseState.stock.get(stick), 4);
  assert.deepEqual(warehouseState.movements.map(item => item.delta), [-1,4]);
  assert.equal((await warehouseState.repack('open-pack', 1)).body.alreadyRecorded, true);
  assert.equal(warehouseState.stock.get(stick), 4);
  assert.equal((await warehouseState.repack('open-pack', 2, 'churu_repack_test_key_0002')).status, 409);
  assert.equal(warehouseState.stock.get(pack), 2);
});

test('opening a mixed box yields ten tubes of each flavor', async () => {
  const productId = 'cmd-source-694e05cdc1b2582c';
  const option = churuRepackOptions(productId)[0];
  const initial = Object.fromEntries([option.from, ...option.to].map(item => [item.id, 0]));
  initial[option.from.id] = 1;
  const warehouseState = warehouse(productId, initial);
  assert.equal((await warehouseState.repack('open-mixed-box', 1)).status, 201);
  assert.deepEqual(option.to.map(item => warehouseState.stock.get(item.id)), [10,10]);
  assert.equal(warehouseState.stock.get(option.from.id), 0);
  assert.deepEqual(warehouseState.movements.map(item => item.delta), [-1,10,10]);
});

test('a sealed 48 tube carton uses exactly twelve unopened packs', async () => {
  const productId = 'tc-0707caf730';
  const options = churuRepackOptions(productId);
  const pack = options[1].from.id;
  const carton = options[1].to[0].id;
  const state = warehouse(productId, { [pack]: 12, [carton]: 0,
    [`${productId}-stick`]: 0 });
  assert.equal((await state.repack('assemble-carton', 1)).status, 201);
  assert.equal(state.stock.get(pack), 0);
  assert.equal(state.stock.get(carton), 1);
  assert.equal((await state.repack('open-carton', 1, 'churu_repack_test_key_0003')).status, 201);
  assert.equal(state.stock.get(pack), 12);
  assert.equal(state.stock.get(carton), 0);
});
