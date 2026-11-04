import test from 'node:test';
import assert from 'node:assert/strict';
import { importSupplierDrafts, validateSupplierDrafts } from '../server/supplier-drafts.js';

const draft = {
  itemId: 'distrivet-acana-2026-10-29:ACC201',
  productId: 'cmd-source-abc123', variantId: 'cmd-source-sku-abc123',
  name: 'ACANA Classics Prairie Poultry', brand: 'ACANA',
  category: 'Корм', pet: 'dog', foodType: 'dry', label: '2 кг', ean: '064992560218'
};

test('supplier drafts require unique source rows and variants', () => {
  assert.equal(validateSupplierDrafts({ items: [draft] }).length, 1);
  assert.throws(() => validateSupplierDrafts({ items: [draft, draft] }), /Проверьте поля/);
  assert.throws(() => validateSupplierDrafts({ items: [{ ...draft, category: 'Лакомства' }] }),
    /Проверьте поля/);
});

test('draft import links a checked source row but keeps product hidden and price unset', async () => {
  const writes = [];
  const client = { async query(sql, params) {
    writes.push([sql, params]);
    if (sql.includes('FROM supplier_catalog_items i') && sql.includes('FOR UPDATE OF i'))
      return { rows: [{ id: draft.itemId, source_id: 'distrivet-acana-2026-10-29',
        article: 'ACC201', ean: draft.ean, brand: 'ACANA', matched_variant: null }] };
    return { rows: [], rowCount: 1 };
  }, release() {} };
  const result = await importSupplierDrafts({ async connect() { return client; } },
    { items: [draft] }, 'staff-1');
  assert.equal(result.createdVariants, 1);
  const product = writes.find(([sql]) => sql.includes('INSERT INTO catalog_products'));
  const variant = writes.find(([sql]) => sql.includes('INSERT INTO catalog_variants'));
  assert.match(product[0], /false/);
  assert.match(variant[0], /false,'unavailable',false,true/);
  assert.doesNotMatch(variant[0], /source_price_cents|purchase_price_cents|stock_quantity/);
  assert.equal(writes.some(([sql]) => sql.includes('INSERT INTO supplier_catalog_matches')), true);
});

test('draft import rejects mismatched source EAN before inserting catalog rows', async () => {
  const writes = [];
  const client = { async query(sql) {
    writes.push(sql);
    if (sql.includes('FROM supplier_catalog_items i')) return { rows: [{
      id: draft.itemId, source_id: 'distrivet-acana-2026-10-29',
      ean: 'different', brand: 'ACANA', matched_variant: null }] };
    return { rows: [], rowCount: 1 };
  }, release() {} };
  await assert.rejects(importSupplierDrafts({ async connect() { return client; } },
    { items: [draft] }, 'staff-1'), /Проверьте бренд, EAN/);
  assert.equal(writes.some(sql => sql.includes('INSERT INTO catalog_products')), false);
  assert.equal(writes.includes('ROLLBACK'), true);
});
