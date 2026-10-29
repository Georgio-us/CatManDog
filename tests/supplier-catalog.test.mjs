import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../server/api.js';
import { importSupplierCatalog, validateSupplierCatalog } from '../server/supplier-catalog.js';

const snapshot = {
  id: 'albet-leonardo-2026-03-01', supplierName: 'Albet', brand: 'Leonardo',
  priceDate: '2026-03-01', sourceFile: 'Leonardo.xlsx',
  shopPriceTaxBasis: 'unknown', retailPriceTaxBasis: 'includes_iva',
  items: [{ article: '123456', name: 'LEONARDO Test SKU',
    line: 'Leonardo test line', weight: '250g', ean: '4000000000000',
    shopPriceCents: 321, recommendedPriceCents: 599, minimumPriceCents: 499,
    rawPrices: { shop: 3.21, recommended: 5.99, minimum: 4.99 }, sourceRow: 3 }]
};

function response() {
  const state = { status: null, body: null };
  return { state, res: { writeHead(status) { state.status = status; },
    end(body) { state.body = JSON.parse(body); } } };
}

test('Leonardo import validates articles and keeps supplier, retail and tax basis separate', () => {
  assert.equal(validateSupplierCatalog(snapshot), snapshot);
  assert.equal(snapshot.shopPriceTaxBasis, 'unknown');
  assert.equal(snapshot.retailPriceTaxBasis, 'includes_iva');
  const duck = snapshot.items[0];
  assert.deepEqual([duck.shopPriceCents, duck.recommendedPriceCents, duck.minimumPriceCents],
    [321, 599, 499]);
  assert.throws(() => validateSupplierCatalog({ ...snapshot,
    items: [duck, { ...duck }] }), /Проверьте строки/);
  assert.throws(() => validateSupplierCatalog({ ...snapshot,
    shopPriceTaxBasis: 'includes_iva' }), /Неверный формат/);
});

test('import records supplier prices without changing public prices or purchase costs', async () => {
  const queries = [];
  const client = { async query(sql, params) {
    queries.push([sql, params]);
    return { rowCount: sql.includes('INSERT INTO supplier_catalog_matches') ? 0 : 1 };
  }, release() {} };
  const result = await importSupplierCatalog({ async connect() { return client; } }, snapshot, 'owner-1');
  assert.deepEqual(result, { imported: 1, alreadyImported: false, autoMatched: 0 });
  const itemInsert = queries.find(([sql]) => sql.includes('INSERT INTO supplier_catalog_items'));
  assert.deepEqual(itemInsert[1].slice(7, 10), [321, 599, 499]);
  assert.equal(queries.some(([sql]) => /(?:UPDATE|INSERT INTO) catalog_variants/.test(sql)), false);
  assert.equal(queries.some(([sql]) => sql.includes('supplier_offers')), false);
});

test('owner-only supplier view and draft creation do not publish or invent a purchase price', async () => {
  let role = 'owner';
  const writes = [];
  const client = { async query(sql, params) {
    writes.push([sql, params]);
    if (sql.includes('FROM supplier_catalog_items i') && sql.includes('FOR UPDATE OF i'))
      return { rows: [{ name: 'LEONARDO Test SKU', weight: '250 g',
        line: 'Leonardo test line', shop_price_cents: 321 }], rowCount: 1 };
    return { rows: [], rowCount: 1 };
  }, release() {} };
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions')) return { rows: [{ id: 'owner-1', role }] };
    if (sql.includes('FROM supplier_catalog_sources')) return { rows: [{ id: snapshot.id }] };
    if (sql.includes('FROM supplier_catalog_items i')) return { rows: [] };
    if (sql.includes('FROM catalog_variants v JOIN catalog_products p')) return { rows: [] };
    throw new Error(`Unexpected query: ${sql}`);
  }, async connect() { return client; } };
  const req = method => ({ method, headers: { cookie: `cmd_staff_session=${'f'.repeat(64)}` },
    socket: { remoteAddress: 'supplier-catalog-test' } });
  const view = response();
  await handleApi(db, req('GET'), view.res, '/api/admin/brands/leonardo');
  assert.equal(view.state.status, 200);
  role = 'support';
  const denied = response();
  await handleApi(db, req('GET'), denied.res, '/api/admin/brands/leonardo');
  assert.equal(denied.state.status, 403);
  role = 'owner';
  const draft = response();
  await handleApi(db, req('POST'), draft.res, '/api/admin/brands/leonardo/items/123456/draft');
  assert.equal(draft.state.status, 201);
  const productInsert = writes.find(([sql]) => sql.includes('INSERT INTO catalog_products'));
  const variantInsert = writes.find(([sql]) => sql.includes('INSERT INTO catalog_variants'));
  assert.match(productInsert[0], /false\)/);
  assert.match(variantInsert[0], /'unavailable',false,true/);
  assert.doesNotMatch(variantInsert[0], /purchase_price_cents|source_price_cents/);
});
