import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../server/api.js';
import { staffCookie, clearStaffCookie, bootstrapOwner } from '../server/staff.js';
import { priceQuote } from '../server/pricing.js';

function response() {
  const state = { status: null, body: null, headers: null };
  return { state, res: { writeHead(status, headers) { state.status = status; state.headers = headers; },
    end(body) { state.body = JSON.parse(body); } } };
}

test('staff cookie is scoped to admin API, HttpOnly and short lived', () => {
  const cookie = staffCookie('a'.repeat(64), true);
  assert.match(cookie, /HttpOnly; SameSite=Strict; Path=\/api\/admin; Max-Age=28800; Secure/);
  assert.match(clearStaffCookie(true), /Max-Age=0; Secure/);
});

test('store management link is disclosed only for the matching active owner email', async () => {
  let matchingOwner = true;
  const db = { async query(sql, params) {
    if (sql.includes('FROM customer_sessions')) return { rows: [{
      id: 'customer-1', email: 'owner@example.test', googleLinked: true, emailVerified: true }] };
    if (sql.includes('FROM customers c JOIN staff_accounts s')) {
      assert.deepEqual(params, ['customer-1']);
      assert.match(sql, /s\.email=c\.email/);
      assert.match(sql, /c\.email_verified_at IS NOT NULL/);
      assert.match(sql, /s\.role='owner' AND s\.active=true/);
      return { rows: [{ canManageStore: matchingOwner }] };
    }
    throw new Error(`Unexpected query: ${sql}`);
  } };
  const req = { method: 'GET', headers: { cookie: `cmd_session=${'a'.repeat(64)}` },
    socket: { remoteAddress: 'test-owner-link' } };
  const owner = response();
  await handleApi(db, req, owner.res, '/api/auth/me');
  assert.equal(owner.state.body.customer.canManageStore, true);
  matchingOwner = false;
  const visitor = response();
  await handleApi(db, req, visitor.res, '/api/auth/me');
  assert.equal(visitor.state.body.customer.canManageStore, false);
});

test('public catalog exposes sourced references without inventing a sale price', async () => {
  const db = { async query(sql) {
    if (sql.includes('FROM catalog_variants v JOIN catalog_products p')) return { rows: [
      { variant_id: 'reference', product_id: 'food', source_price_cents: 2219,
        price_override_cents: 9999, price_confirmed: false, source_orderable: true,
        availability: 'source_on_demand', stock_quantity: null, reserved_quantity: 0 },
      { variant_id: 'confirmed', product_id: 'food', source_price_cents: 2219,
        price_override_cents: 2499, price_confirmed: true, source_orderable: true,
        availability: 'source_on_demand', stock_quantity: null, reserved_quantity: 0 }
    ] };
    if (sql.includes('reserved_quantity>0')) return { rows: [] };
    throw new Error(`Unexpected query: ${sql}`);
  } };
  const output = response();
  await handleApi(db, { method: 'GET', headers: {}, socket: { remoteAddress: 'test-catalog-price' } },
    output.res, '/api/catalog');
  assert.equal(output.state.status, 200);
  assert.equal(output.state.body.variants[0].priceCents, null);
  assert.equal(output.state.body.variants[0].referencePriceCents, 2219);
  assert.equal(output.state.body.variants[0].orderable, false);
  assert.equal(output.state.body.variants[0].availableForCart, true);
  assert.equal(Object.hasOwn(output.state.body.variants[0], 'sale_price_cents'), false);
  assert.equal(output.state.body.variants[1].priceCents, 2499);
  assert.equal(output.state.body.variants[1].referencePriceCents, null);
});

test('public catalog marks reserved stock and supplier-disabled SKUs unavailable to the cart', async () => {
  const db = { async query(sql) {
    if (sql.includes('FROM catalog_variants v JOIN catalog_products p')) return { rows: [
      { variant_id: 'reserved', product_id: 'food', source_price_cents: 2000,
        price_override_cents: 2500, price_confirmed: true, source_orderable: true,
        availability: 'on_hand', stock_quantity: 2, reserved_quantity: 0 },
      { variant_id: 'disabled', product_id: 'food', source_price_cents: 2000,
        price_override_cents: 2500, price_confirmed: true, source_orderable: false,
        availability: 'source_on_demand', stock_quantity: null, reserved_quantity: 0 }
    ] };
    if (sql.includes('reserved_quantity>0')) return { rows: [{ id: 'reserved', reserved_quantity: 2 }] };
    throw new Error(`Unexpected query: ${sql}`);
  } };
  const output = response();
  await handleApi(db, { method: 'GET', headers: {}, socket: { remoteAddress: 'test-stock-cart' } },
    output.res, '/api/catalog');
  assert.equal(output.state.status, 200);
  assert.deepEqual(output.state.body.variants.map(row => row.availableForCart), [false, false]);
});

test('old bearer key alone cannot read or modify the admin API', async () => {
  const previous = process.env.ADMIN_TOKEN;
  process.env.ADMIN_TOKEN = 'a'.repeat(40);
  try {
    const db = { query() { throw new Error('The database should not be reached'); } };
    for (const [method, path] of [['GET','/api/admin/sku-audit'], ['PATCH','/api/admin/variants/sku']]) {
      const { state, res } = response();
      const req = { method, headers: { authorization: `Bearer ${process.env.ADMIN_TOKEN}` },
        socket: { remoteAddress: 'test-old-admin-key' } };
      await handleApi(db, req, res, path);
      assert.equal(state.status, 403);
    }
  } finally {
    if (previous === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = previous;
  }
});

test('owner staff session can audit SKU, support staff cannot', async () => {
  let role = 'owner';
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions')) return { rows: [{ id:'staff-1', email:'owner@example.test', role }] };
    if (sql.includes('FROM catalog_variants v JOIN catalog_products p')) return { rows: [{ variant_id:'sku-1' }] };
    throw new Error(`Unexpected query: ${sql}`);
  } };
  const req = { method:'GET', headers:{ cookie:`cmd_staff_session=${'b'.repeat(64)}` },
    socket:{ remoteAddress:'test-staff' } };
  const owner = response();
  await handleApi(db, req, owner.res, '/api/admin/sku-audit');
  assert.equal(owner.state.status, 200);
  assert.equal(owner.state.body.variants[0].variant_id, 'sku-1');
  role = 'support';
  const support = response();
  await handleApi(db, req, support.res, '/api/admin/sku-audit');
  assert.equal(support.state.status, 403);
  for (const path of ['/api/admin/replenishment','/api/admin/purchase-orders']) {
    const denied = response();
    await handleApi(db, req, denied.res, path);
    assert.equal(denied.state.status, 403);
  }
});

test('stock plans require a target above the reorder point and are saved with an audit entry', async () => {
  const writes = [];
  const client = { async query(sql, params) {
    writes.push([sql, params]);
    if (sql.includes('FROM catalog_variants WHERE id=$1 FOR UPDATE')) return { rows:[{
      source_price_cents:500, price_override_cents:null, purchase_price_cents:null,
      price_confirmed:true, availability:'on_hand', stock_quantity:5,
      reserved_quantity:0, reorder_point:2, target_stock:6 }] };
    return { rowCount:1, rows:[] };
  }, release() {} };
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions')) return { rows:[{
      id:'staff-1', email:'owner@example.test', role:'owner' }] };
    throw new Error(`Unexpected SQL: ${sql}`);
  }, async connect() { return client; } };
  async function save(reorderPoint, targetStock) {
    const req = { method:'PATCH', headers:{ cookie:`cmd_staff_session=${'c'.repeat(64)}` },
      socket:{ remoteAddress:'test-stock-plan' },
      async *[Symbol.asyncIterator]() { yield JSON.stringify({ priceCents:null,
        purchasePriceCents:null, priceConfirmed:true, availability:'on_hand',
        stockQuantity:5, reorderPoint, targetStock, taxRateBps:null }); } };
    const { state, res } = response();
    await handleApi(db, req, res, '/api/admin/variants/sku-1');
    return state;
  }
  assert.equal((await save(8, 8)).status, 400);
  assert.equal(writes.some(([sql]) => sql.startsWith('UPDATE catalog_variants')), false);
  assert.equal((await save(3, 12)).status, 200);
  assert.ok(writes.some(([sql, params]) => sql.startsWith('UPDATE catalog_variants SET price_override_cents') &&
    params[5] === 3 && params[6] === 12 && params[7] === null && params[8] === 'sku-1'));
  assert.ok(writes.some(([sql, params]) => sql.includes("'variant_terms_updated'") &&
    params[3].after.reorder_point === 3 && params[3].after.target_stock === 12));
});

test('replenishment uses each SKU threshold and includes a suggested quantity', async () => {
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions')) return { rows:[{
      id:'staff-1', email:'owner@example.test', role:'owner' }] };
    if (sql.includes('FROM catalog_variants v JOIN catalog_products p') &&
      sql.includes('suggested_quantity')) {
      assert.match(sql, /available_quantity/);
      assert.match(sql, /<=v\.reorder_point/);
      assert.match(sql, /so\.minimum_quantity/);
      assert.match(sql, /po\.status IN \('ordered','partially_received'\)/);
      return { rows:[{ variant_id:'sku-1', available_quantity:3,
        reorder_point:3, target_stock:12, incoming_quantity:4, suggested_quantity:5 }] };
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
  const req = { method:'GET', headers:{ cookie:`cmd_staff_session=${'d'.repeat(64)}` },
    socket:{ remoteAddress:'test-replenishment' } };
  const { state, res } = response();
  await handleApi(db, req, res, '/api/admin/replenishment');
  assert.equal(state.status, 200);
  assert.equal(state.body.variants[0].suggested_quantity, 5);
});

test('only the owner can publish a product and changes are audited', async () => {
  let role = 'owner';
  const queries = [];
  const db = { async query(sql, params) {
    queries.push([sql, params]);
    if (sql.includes('FROM staff_sessions')) return { rows: [{ id:'staff-1', email:'owner@example.test', role }] };
    if (sql.startsWith('UPDATE catalog_products SET')) return { rowCount: 1, rows: [] };
    if (sql.startsWith('INSERT INTO admin_audit_events')) return { rowCount: 1, rows: [] };
    throw new Error(`Unexpected query: ${sql}`);
  } };
  const body = { name:'Новая миска', brand:'CatManDog', category:'Миски и поилки',
    pet:'cat', imagePath:'https://img.catmandog.es/assets/bowl.webp',
    description:'Для воды', details:['Керамика'], active:true };
  const request = () => ({ method:'PATCH', headers:{ cookie:`cmd_staff_session=${'c'.repeat(64)}` },
    socket:{ remoteAddress:'test-product-editor' }, async *[Symbol.asyncIterator]() { yield JSON.stringify(body); } });
  const owner = response();
  await handleApi(db, request(), owner.res, '/api/admin/products/product-1');
  assert.equal(owner.state.status, 200);
  assert.ok(queries.some(([sql, params]) => sql.startsWith('UPDATE catalog_products SET') &&
    params.at(-2) === true && params.at(-1) === 'product-1'));
  assert.ok(queries.some(([sql]) => sql.includes("'product_updated'")));
  role = 'support';
  const support = response();
  await handleApi(db, request(), support.res, '/api/admin/products/product-1');
  assert.equal(support.state.status, 403);
});

test('daily product editor changes only content and publication', async () => {
  const writes = [];
  const db = { async query(sql, params) {
    if (sql.includes('FROM staff_sessions')) return { rows: [{ id:'owner-1', email:'owner@example.test', role:'owner' }] };
    writes.push([sql, params]);
    if (sql.startsWith('UPDATE catalog_products SET')) return { rows: [{ id:'product-1' }] };
    if (sql.startsWith('INSERT INTO admin_audit_events')) return { rowCount:1 };
    throw new Error(`Unexpected query: ${sql}`);
  } };
  const req = { method:'PATCH', headers:{ cookie:`cmd_staff_session=${'c'.repeat(64)}` },
    socket:{ remoteAddress:'test-product-content' },
    async *[Symbol.asyncIterator]() { yield JSON.stringify({ name:'Новая витрина',
      description:'Короткое описание', active:true, brand:'Подменённый бренд' }); } };
  const { state, res } = response();
  await handleApi(db, req, res, '/api/admin/products/product-1/content');
  assert.equal(state.status, 200);
  const [sql, params] = writes[0];
  assert.match(sql, /SET name=\$1,description=\$2,active=\$3/);
  assert.doesNotMatch(sql, /brand=|category=|image_path=/);
  assert.deepEqual(params, ['Новая витрина','Короткое описание',true,'product-1']);
});

test('sale price update leaves purchase and supplier reference prices unchanged', async () => {
  const writes = [];
  const db = { async query(sql, params) {
    if (sql.includes('FROM staff_sessions')) return { rows: [{ id:'owner-1', email:'owner@example.test', role:'owner' }] };
    writes.push([sql, params]);
    if (sql.startsWith('UPDATE catalog_variants')) return { rows: [{ source_price_cents:2500,
      purchase_price_cents:1500 }] };
    if (sql.startsWith('INSERT INTO admin_audit_events')) return { rowCount:1 };
    throw new Error(`Unexpected query: ${sql}`);
  } };
  const req = { method:'PATCH', headers:{ cookie:`cmd_staff_session=${'c'.repeat(64)}` },
    socket:{ remoteAddress:'test-sale-price' },
    async *[Symbol.asyncIterator]() { yield JSON.stringify({ priceCents:2250,
      priceConfirmed:true, purchasePriceCents:1 }); } };
  const { state, res } = response();
  await handleApi(db, req, res, '/api/admin/variants/sku-1/sale-price');
  assert.equal(state.status, 200);
  const [sql, params] = writes[0];
  assert.match(sql, /SET price_override_cents=\$1,price_confirmed=\$2/);
  assert.doesNotMatch(sql, /SET [^]*purchase_price_cents=|SET [^]*source_price_cents=/);
  assert.deepEqual(params, [2250,true,'sku-1']);
});

test('new admin product starts hidden with one stable SKU', async () => {
  const writes = [];
  const client = { async query(sql, params) {
    writes.push([sql, params]);
    return { rowCount: 1, rows: [] };
  }, release() {} };
  const db = { connect: async () => client, async query(sql) {
    if (sql.includes('FROM staff_sessions')) return { rows: [{ id:'owner-1',email:'owner@example.test',role:'owner' }] };
    throw new Error(`Unexpected query: ${sql}`);
  } };
  const payload = { name:'Новая поилка', brand:'CatManDog', category:'Миски и поилки', pet:'cat',
    imagePath:'https://img.catmandog.es/assets/drinker.webp', variantLabel:'1 шт' };
  const req = { method:'POST', headers:{ cookie:`cmd_staff_session=${'d'.repeat(64)}` },
    socket:{ remoteAddress:'test-new-product' }, async *[Symbol.asyncIterator]() { yield JSON.stringify(payload); } };
  const { state, res } = response();
  await handleApi(db, req, res, '/api/admin/products');
  assert.equal(state.status, 201);
  assert.match(state.body.id, /^cmd-/);
  assert.match(state.body.variantId, /^cmd-sku-/);
  const productInsert = writes.find(([sql]) => sql.startsWith('INSERT INTO catalog_products'));
  assert.match(productInsert[0], /false\)/);
  assert.equal(productInsert[1][0], state.body.id);
  assert.ok(writes.some(([sql, params]) => sql.startsWith('INSERT INTO catalog_variants') &&
    params[0] === state.body.variantId && params[1] === state.body.id));
  assert.equal(writes.at(-1)[0], 'COMMIT');
});

test('customer CRM is owner only and never returns password hashes', async () => {
  let role = 'owner';
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions')) return { rows: [{ id:'staff-1',email:'owner@example.test',role }] };
    if (sql.includes('FROM customers c')) return { rows: [{ id:'customer-1',email:'buyer@example.test',
      name:'Анна',phone:'',has_password:true,google_linked:false,pet_count:1,order_count:2,
      paid_total_cents:1500 }] };
    if (sql.includes('FROM customers WHERE id=')) return { rows: [{ id:'customer-1',email:'buyer@example.test',
      name:'Анна',has_password:true,google_linked:false }] };
    if (sql.includes('FROM pets WHERE customer_id=')) return { rows: [{ id:'pet-1',name:'Мур',species:'cat' }] };
    if (sql.includes('FROM orders WHERE customer_id=')) return { rows: [{ number:'CMD-10001',total_cents:1500 }] };
    throw new Error(`Unexpected query: ${sql}`);
  } };
  const req = path => ({ method:'GET', url:path,
    headers:{ cookie:`cmd_staff_session=${'e'.repeat(64)}` }, socket:{ remoteAddress:'test-crm' } });
  const list = response();
  await handleApi(db, req('/api/admin/customers?q=anna'), list.res, '/api/admin/customers');
  assert.equal(list.state.status, 200);
  assert.equal(list.state.body.customers[0].email, 'buyer@example.test');
  assert.ok(!JSON.stringify(list.state.body).includes('password_hash'));
  const detail = response();
  const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  await handleApi(db, req(`/api/admin/customers/${id}`), detail.res, `/api/admin/customers/${id}`);
  assert.equal(detail.state.status, 200);
  assert.equal(detail.state.body.pets[0].name, 'Мур');
  assert.ok(!JSON.stringify(detail.state.body).includes('password_hash'));
  role = 'support';
  const denied = response();
  await handleApi(db, req('/api/admin/customers'), denied.res, '/api/admin/customers');
  assert.equal(denied.state.status, 403);
});

test('owner bootstrap refuses to replace an existing owner', async () => {
  let rolledBack = false;
  const client = { async query(sql) {
    if (sql.includes("FROM staff_accounts WHERE role='owner'")) return { rows: [{ id:'existing' }] };
    if (sql === 'ROLLBACK') rolledBack = true;
    return { rows: [] };
  }, release() {} };
  await assert.rejects(bootstrapOwner({ connect: async () => client },
    { sub:'other-google-account', email:'other@example.test', name:'Other' }), /уже назначен/);
  assert.equal(rolledBack, true);
});

test('reservations reduce sellable stock without reducing physical stock', () => {
  const variant = { variant_id:'sku-1', product_id:'product-1', name:'Корм', label:'1 кг',
    source_price_cents:1200, price_override_cents:null, price_confirmed:true,
    source_orderable:true, availability:'on_hand', stock_quantity:5, reserved_quantity:3 };
  assert.equal(priceQuote([{ productId:'product-1', variantId:'sku-1', qty:2 }], [variant]).orderable, true);
  assert.equal(priceQuote([{ productId:'product-1', variantId:'sku-1', qty:3 }], [variant]).orderable, false);
  assert.equal(variant.stock_quantity, 5);
});

test('cancelling an order releases its reservation once and cannot reopen it', async () => {
  const order = { id:'order-1', status:'received', stock_state:'reserved', payment_status:'awaiting_payment' };
  let physical = 5;
  let reserved = 2;
  const movements = [];
  const client = { async query(sql, params) {
    if (sql.startsWith('SELECT id,status,stock_state,payment_status')) return { rows:[{ ...order }] };
    if (sql.startsWith('SELECT variant_id,quantity FROM order_items'))
      return { rows:[{ variant_id:'sku-1', quantity:2 }] };
    if (sql.includes('SET reserved_quantity=reserved_quantity-$1')) {
      reserved -= params[0]; return { rows:[{ stock_quantity:physical, reserved_quantity:reserved }] };
    }
    if (sql.startsWith('INSERT INTO inventory_movements')) { movements.push(params); return { rowCount:1 }; }
    if (sql.startsWith('UPDATE orders SET status=')) {
      [order.status,order.stock_state] = params; return { rowCount:1 };
    }
    return { rowCount:1, rows:[] };
  }, release() {} };
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions'))
      return { rows:[{ id:'staff-1', email:'owner@example.test', role:'owner' }] };
    throw new Error(`Unexpected SQL: ${sql}`);
  }, async connect() { return client; } };
  async function changeStatus(status) {
    const req = { method:'PATCH', headers:{ cookie:`cmd_staff_session=${'c'.repeat(64)}` },
      socket:{ remoteAddress:'test-order-status' },
      async *[Symbol.asyncIterator]() { yield JSON.stringify({ status }); } };
    const { state, res } = response();
    await handleApi(db, req, res, '/api/admin/orders/order-1/status');
    return state;
  }
  assert.equal((await changeStatus('cancelled')).status, 200);
  assert.equal(physical, 5);
  assert.equal(reserved, 0);
  assert.equal(movements.length, 1);
  assert.equal(movements[0][7], 'order_released');
  assert.equal((await changeStatus('cancelled')).status, 200);
  assert.equal(movements.length, 1);
  assert.equal((await changeStatus('packing')).status, 409);
});

test('unpaid order cannot be marked as delivered', async () => {
  const client = { async query(sql) {
    if (sql.startsWith('SELECT id,status,stock_state,payment_status'))
      return { rows:[{ id:'order-2', status:'packing', stock_state:'reserved',
        payment_status:'awaiting_payment' }] };
    return { rowCount:1 };
  }, release() {} };
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions'))
      return { rows:[{ id:'staff-1', email:'owner@example.test', role:'owner' }] };
    throw new Error(`Unexpected SQL: ${sql}`);
  }, async connect() { return client; } };
  const req = { method:'PATCH', headers:{ cookie:`cmd_staff_session=${'d'.repeat(64)}` },
    socket:{ remoteAddress:'test-unpaid-status' },
    async *[Symbol.asyncIterator]() { yield JSON.stringify({ status:'delivered' }); } };
  const { state, res } = response();
  await handleApi(db, req, res, '/api/admin/orders/order-2/status');
  assert.equal(state.status, 409);
});

test('delivering a paid order consumes physical stock and reservation once', async () => {
  const order = { id:'order-3', status:'delivering', stock_state:'reserved', payment_status:'paid' };
  let physical = 5;
  let reserved = 2;
  let movements = 0;
  const client = { async query(sql, params) {
    if (sql.startsWith('SELECT id,status,stock_state,payment_status')) return { rows:[{ ...order }] };
    if (sql.startsWith('SELECT variant_id,quantity FROM order_items'))
      return { rows:[{ variant_id:'sku-1', quantity:2 }] };
    if (sql.includes('SET stock_quantity=stock_quantity-$1')) {
      physical -= params[0]; reserved -= params[0];
      return { rows:[{ stock_quantity:physical, reserved_quantity:reserved }] };
    }
    if (sql.startsWith('INSERT INTO inventory_movements')) { movements++; return { rowCount:1 }; }
    if (sql.startsWith('UPDATE orders SET status=')) {
      [order.status,order.stock_state] = params; return { rowCount:1 };
    }
    return { rowCount:1, rows:[] };
  }, release() {} };
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions'))
      return { rows:[{ id:'staff-1', email:'owner@example.test', role:'owner' }] };
    throw new Error(`Unexpected SQL: ${sql}`);
  }, async connect() { return client; } };
  const req = { method:'PATCH', headers:{ cookie:`cmd_staff_session=${'f'.repeat(64)}` },
    socket:{ remoteAddress:'test-delivery' },
    async *[Symbol.asyncIterator]() { yield JSON.stringify({ status:'delivered' }); } };
  for (let attempt = 0; attempt < 2; attempt++) {
    const { state, res } = response();
    await handleApi(db, req, res, '/api/admin/orders/order-3/status');
    assert.equal(state.status, 200);
  }
  assert.equal(physical, 3);
  assert.equal(reserved, 0);
  assert.equal(movements, 1);
});

test('receiving stock records one movement and duplicate submission does not add it twice', async () => {
  const key = 'receipt_test_key_1234567890';
  let stock = 1;
  let recorded;
  const client = { async query(sql, params) {
    if (sql.startsWith('SELECT id FROM catalog_variants')) return { rows:[{ id:'sku-1' }] };
    if (sql.startsWith('SELECT id,variant_id,delta_on_hand')) return { rows:recorded ? [recorded] : [] };
    if (sql.startsWith('UPDATE catalog_variants')) {
      stock += params[0]; return { rows:[{ stock_quantity:stock, reserved_quantity:0 }] };
    }
    if (sql.startsWith('INSERT INTO inventory_movements')) {
      recorded = { id:params[0], variant_id:params[1], supplier_id:params[4],
        unit_cost_cents:params[5], delta_on_hand:params[8], note:params[12] };
      return { rowCount:1 };
    }
    return { rowCount:1, rows:[] };
  }, release() {} };
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions'))
      return { rows:[{ id:'staff-1', email:'owner@example.test', role:'owner' }] };
    throw new Error(`Unexpected SQL: ${sql}`);
  }, async connect() { return client; } };
  async function receipt(quantity) {
    const req = { method:'POST', headers:{ cookie:`cmd_staff_session=${'e'.repeat(64)}` },
      socket:{ remoteAddress:'test-receipt' },
      async *[Symbol.asyncIterator]() { yield JSON.stringify({ variantId:'sku-1', quantity,
        unitCostCents:500, note:'Поставка 21', idempotencyKey:key }); } };
    const { state, res } = response();
    await handleApi(db, req, res, '/api/admin/inventory-receipts');
    return state;
  }
  assert.equal((await receipt(4)).status, 201);
  assert.equal(stock, 5);
  assert.equal((await receipt(4)).body.alreadyRecorded, true);
  assert.equal(stock, 5);
  assert.equal((await receipt(3)).status, 409);
  assert.equal(stock, 5);
});

test('purchase request snapshots the offer and partial receipts increase stock exactly once', async () => {
  const supplierId = '11111111-1111-4111-8111-111111111111';
  let purchase;
  let item;
  let physical = 2;
  const movements = new Map();
  const client = { async query(sql, params = []) {
    if (sql.startsWith('SELECT id,number,request_hash FROM purchase_orders'))
      return { rows: purchase ? [{ id:purchase.id, number:purchase.number,
        request_hash:purchase.requestHash }] : [] };
    if (sql.startsWith('SELECT id FROM suppliers')) return { rows:[{ id:supplierId }] };
    if (sql.startsWith('SELECT so.variant_id,so.cost_cents')) return { rows:[{
      variant_id:'sku-1', cost_cents:350, vat_included:true, minimum_quantity:2,
      name:'Корм', label:'1 кг' }] };
    if (sql.includes('purchase_order_number_seq')) return { rows:[{ number:'PUR-1000' }] };
    if (sql.startsWith('INSERT INTO purchase_orders')) {
      purchase = { id:params[0], number:params[1], supplierId:params[2],
        status:'draft', requestHash:params[5] };
      return { rows:[{ id:purchase.id }] };
    }
    if (sql.startsWith('INSERT INTO purchase_order_items')) {
      item = { id:params[0], variantId:params[2], ordered:params[5], received:0,
        cost:params[6] };
      return { rowCount:1 };
    }
    if (sql.startsWith('SELECT id,status FROM purchase_orders'))
      return { rows:[{ id:purchase.id, status:purchase.status }] };
    if (sql.startsWith('SELECT id,status,supplier_id FROM purchase_orders'))
      return { rows:[{ id:purchase.id, status:purchase.status, supplier_id:supplierId }] };
    if (sql.startsWith('SELECT id,purchase_order_item_id,delta_on_hand,note'))
      return { rows:movements.has(params[0]) ? [movements.get(params[0])] : [] };
    if (sql.startsWith('SELECT id,variant_id,ordered_quantity,received_quantity'))
      return { rows:[{ id:item.id, variant_id:item.variantId, ordered_quantity:item.ordered,
        received_quantity:item.received, unit_cost_cents:item.cost }] };
    if (sql.startsWith('UPDATE catalog_variants')) {
      physical += params[0]; return { rows:[{ stock_quantity:physical, reserved_quantity:0 }] };
    }
    if (sql.startsWith('UPDATE purchase_order_items SET received_quantity')) {
      item.received += params[0]; return { rowCount:1 };
    }
    if (sql.startsWith('INSERT INTO inventory_movements')) {
      movements.set(params[6], { purchase_order_item_id:params[13],
        delta_on_hand:params[8], note:params[12] });
      return { rowCount:1 };
    }
    if (sql.startsWith('SELECT bool_and(received_quantity'))
      return { rows:[{ complete:item.received === item.ordered }] };
    if (sql.startsWith('UPDATE purchase_orders SET status=')) {
      purchase.status = params[0]; return { rowCount:1 };
    }
    return { rowCount:1, rows:[] };
  }, release() {} };
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions'))
      return { rows:[{ id:'staff-1', email:'owner@example.test', role:'owner' }] };
    throw new Error(`Unexpected SQL: ${sql}`);
  }, async connect() { return client; } };
  async function call(method, path, body) {
    const req = { method, headers:{ cookie:`cmd_staff_session=${'1'.repeat(64)}` },
      socket:{ remoteAddress:'test-purchase-order' },
      async *[Symbol.asyncIterator]() { yield JSON.stringify(body); } };
    const { state, res } = response();
    await handleApi(db, req, res, path);
    return state;
  }
  const created = await call('POST', '/api/admin/purchase-orders', {
    supplierId, idempotencyKey:'purchase_order_key_1234567890',
    items:[{ variantId:'sku-1', quantity:5 }] });
  assert.equal(created.status, 201);
  assert.equal(item.cost, 350);
  assert.equal(physical, 2);
  assert.equal((await call('POST', '/api/admin/purchase-orders', {
    supplierId, idempotencyKey:'purchase_order_key_1234567890',
    items:[{ variantId:'sku-1', quantity:6 }] })).status, 409);
  const path = `/api/admin/purchase-orders/${purchase.id}/receipts`;
  const first = { itemId:item.id, quantity:2, note:'Первая коробка',
    idempotencyKey:'purchase_receipt_key_1234567890' };
  assert.equal((await call('POST', path, first)).status, 409);
  assert.equal(physical, 2);
  assert.equal((await call('PATCH', `/api/admin/purchase-orders/${purchase.id}/status`,
    { status:'ordered' })).status, 200);
  assert.equal((await call('POST', path, first)).body.status, 'partially_received');
  assert.equal(physical, 4);
  assert.equal((await call('POST', path, first)).body.alreadyRecorded, true);
  assert.equal(physical, 4);
  assert.equal((await call('POST', path, { ...first, quantity:3 })).status, 409);
  assert.equal(physical, 4);
  assert.equal((await call('POST', path, { itemId:item.id, quantity:4,
    idempotencyKey:'purchase_receipt_key_3333333333' })).status, 409);
  assert.equal(physical, 4);
  const second = { itemId:item.id, quantity:3, note:'Остаток партии',
    idempotencyKey:'purchase_receipt_key_2222222222' };
  assert.equal((await call('POST', path, second)).body.status, 'received');
  assert.equal(physical, 7);
  assert.equal(item.received, 5);
});
