import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { products } from '../data.js';
import { catalogRows } from '../server/catalog.js';

const skus = ['7515987','7514968','M0295','7516254','7516245','7514697','40BW822',
  '1128038','1128044','1127850','1128077','1127836','7571307','7571313','1127841',
  '7515814','7515813','9235150','7588782','1126841','1126845','40BW230'];

test('all 22 selected Yagu variants have a distinct studio asset and exact supplier code', () => {
  const rows = catalogRows(products);
  for (const sku of skus) {
    const matches = rows.filter(row => row.variant.source.supplier?.sku === sku);
    assert.equal(matches.length, 1, `supplier SKU ${sku} appears once`);
    const [row] = matches;
    assert.equal(row.variant.source.image.src, `/media/yagu/${sku}-studio-v1.webp`);
    assert.ok(existsSync(new URL(`../media/yagu/${sku}-studio-v1.webp`, import.meta.url)));
    assert.equal(row.variant.source.purchasePrice, null);
    assert.notEqual(row.variant.source.availabilityStatus, 'on_hand');
  }
  assert.equal(products.find(product => product.id === 'yagu-7515812').variants.length, 2);
  assert.equal(products.find(product => product.id === 'yagu-7515817').variants.length, 2);
});

test('sale unit and provisional retail price stay explicit', () => {
  const bySku = new Map(catalogRows(products).map(row => [row.variant.source.supplier?.sku, row.variant.source]));
  for (const sku of ['40BW822','40BW230']) {
    assert.match(bySku.get(sku).label, /15 × 60 г/);
    assert.match(bySku.get(sku).details.join(' '), /Цена указана за короб/);
  }
  for (const sku of skus) {
    assert.ok(bySku.get(sku).price > 0);
    assert.equal(bySku.get(sku).retailPrice?.type, 'retail');
  }
  assert.equal(bySku.get('7588782').price, 15.99);
  assert.equal(bySku.get('7515987').price, 6.46);
  assert.equal(bySku.get('7516254').price, 3.49);
  assert.equal(bySku.get('7516245').price, 3.49);
  assert.equal(bySku.get('1126841').price, 10.08);
});
