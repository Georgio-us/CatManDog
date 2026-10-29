import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../server/api.js';
import { importSupplierCatalog, validateSupplierCatalog } from '../server/supplier-catalog.js';
import { leonardoCatalogMatches } from '../server/leonardo-matcher.js';

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
    shopPriceTaxBasis: 'unspecified' }), /Неверный формат/);
});

test('supplier snapshots keep different price meanings and only exact EAN links are automatic', async () => {
  const royal = { ...snapshot, id: 'royal-canin-2026-03-01', supplierName: 'Royal Canin',
    brand: 'Royal Canin', shopPriceTaxBasis: 'excludes_iva',
    items: [{ ...snapshot.items[0], article: 'R601188',
      shopPriceCents: 1428, recommendedPriceCents: null, minimumPriceCents: null,
      rawPrices: { kind: 'supplier_tariff_ex_iva', unit: 'case' } }] };
  assert.equal(validateSupplierCatalog(royal), royal);
  const ownat = { ...snapshot, id: 'ownat-2026-02-01-online-wetline-2026',
    supplierName: 'Comercial Química Muñoz', brand: 'Ownat', priceDate: '2026-02-01',
    shopPriceTaxBasis: 'excludes_iva', items: [{ ...snapshot.items[0],
      shopPriceCents: null, recommendedPriceCents: 179, minimumPriceCents: null,
      rawPrices: { kind: 'recommended_shop_ex_iva', recommendedShopCaseCents: 1255 } }] };
  assert.equal(validateSupplierCatalog(ownat), ownat);
  const queries = [];
  const client = { async query(sql, params) {
    queries.push([sql, params]);
    return { rowCount: sql.includes('INSERT INTO supplier_catalog_matches') ? 0 : 1, rows: [] };
  }, release() {} };
  await importSupplierCatalog({ async connect() { return client; } }, royal, 'owner-1');
  assert.equal(queries.some(([sql]) => sql.includes("'catalog'")), false);
  assert.equal(queries.some(([sql]) => /(?:UPDATE|INSERT INTO) catalog_variants/.test(sql)), false);
  assert.equal(queries.some(([sql]) => sql.includes('supplier_offers')), false);
});

test('import records supplier prices without changing public prices or purchase costs', async () => {
  const queries = [];
  const client = { async query(sql, params) {
    queries.push([sql, params]);
    return { rowCount: sql.includes('INSERT INTO supplier_catalog_matches') ? 0 : 1, rows: [] };
  }, release() {} };
  const result = await importSupplierCatalog({ async connect() { return client; } }, snapshot, 'owner-1');
  assert.deepEqual(result, { imported: 1, alreadyImported: false, autoMatched: 0, catalogMatched: 0 });
  const itemInsert = queries.find(([sql]) => sql.includes('INSERT INTO supplier_catalog_items'));
  assert.deepEqual(itemInsert[1].slice(7, 10), [321, 599, 499]);
  assert.equal(queries.some(([sql]) => /(?:UPDATE|INSERT INTO) catalog_variants/.test(sql)), false);
  assert.equal(queries.some(([sql]) => sql.includes('supplier_offers')), false);
});

test('Leonardo recipe and pack matching links only unique products and respects EAN conflicts', () => {
  const items = [
    { id:'a',name:'LEONARDO Salmón + extra filete',line:'Leonardo alimento húmedo con extra filete (latas)',weight:'200 g',ean:'111' },
    { id:'b',name:'Leonardo Adult GF Poultry',line:'Leonardo GF - alimento seco SIN CEREALES - con 30% de carne fresca',weight:'1,8 kg',ean:'222' },
    { id:'c',name:'Leonardo Drink Duck',line:'Leonardo húmedo Drink (pouches)',weight:'40g',ean:'333' },
    { id:'d',name:'LEONARDO Salmón + extra filete',line:'Leonardo alimento húmedo con extra filete (latas)',weight:'400 g',ean:'444' },
  ];
  const sites = [
    { id:'salmon-200',name:'Leonardo Extra Filet Salmon',label:'200 г',ean:'' },
    { id:'poultry-1800',name:'Leonardo Adult GF Poultry',label:'1,8 кг',ean:'222' },
    { id:'salmon-400',name:'Leonardo Extra Filet Salmon',label:'400 г',ean:'different' },
  ];
  assert.deepEqual(leonardoCatalogMatches(items, sites).map(pair => [pair.itemId,pair.variantId]),
    [['a','salmon-200'],['b','poultry-1800']]);
});

test('re-importing an existing Leonardo price list fills catalog links without rewriting prices', async () => {
  const rows = [];
  const client = { async query(sql, params) {
    rows.push([sql, params]);
    if (sql.includes('INSERT INTO supplier_catalog_sources')) return { rowCount: 0 };
    if (sql.includes('SELECT id,name,line,weight,ean')) return { rows: [{
      id:'albet-leonardo-2026-03-01:123456',name:'Leonardo Adult GF Poultry',
      line:'Leonardo GF - alimento seco SIN CEREALES - con 30% de carne fresca',
      weight:'1,8 kg',ean:'4000000000000' }] };
    if (sql.includes('SELECT v.id,p.name,v.label')) return { rows: [{
      id:'leonardo-poultry-1800g',name:'Leonardo Adult GF Poultry',label:'1,8 кг',ean:'' }] };
    if (sql.includes("SELECT i.id,i.source_id,v.id,'catalog'")) return { rowCount: 1 };
    return { rowCount: 0 };
  }, release() {} };
  const result = await importSupplierCatalog({ async connect() { return client; } }, snapshot, 'owner-1');
  assert.deepEqual(result, { imported: 0, alreadyImported: true, autoMatched: 0, catalogMatched: 1 });
  assert.equal(rows.some(([sql]) => sql.includes('INSERT INTO supplier_catalog_items')), false);
  assert.equal(rows.some(([sql]) => /(?:UPDATE|INSERT INTO) catalog_variants/.test(sql)), false);
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
