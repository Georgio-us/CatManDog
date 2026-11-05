import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { launchSelectedImageMap } from '../launch-selected-image-map.js';
import { launchHeyboPetProducts } from '../launch-heybopet-products.js';
import { catalogSnapshot, publishSelectedLaunchImages } from '../server/catalog.js';

test('the first basket image map contains 23 distinct supplier drafts', () => {
  const variants = launchSelectedImageMap.flatMap(product => product.variants);
  assert.equal(launchSelectedImageMap.length, 15);
  assert.equal(variants.length, 23);
  assert.equal(new Set(variants.map(variant => variant.id)).size, 23);
  assert.ok(variants.every(variant => variant.imagePath.startsWith('https://img.catmandog.es/assets/launch-studio-2026-11-04/')));
  const generated = JSON.parse(readFileSync(new URL('../research/launch-studio-images-2026-11-04.json', import.meta.url)));
  const byCode = new Map(generated.items.map(item => [item.supplierCode, item]));
  assert.ok(variants.every(variant => variant.imagePath.endsWith(`/${byCode.get(variant.supplierCode)?.image}`)));
  const fountain = launchHeyboPetProducts[0];
  assert.equal(fountain.manufacturerSku, 'HB-PWFS-S30S');
  assert.deepEqual(fountain.variants.map(variant => variant.label), ['Чёрный', 'Белый']);
  assert.ok(fountain.variants.every(variant => existsSync(`.${variant.image}`)));
});

test('first basket publication attaches photos without creating warehouse stock', async () => {
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.startsWith('SELECT name FROM catalog_migrations')) return { rows: [] };
      if (sql.includes('UPDATE catalog_products')) return { rowCount: 1 };
      return { rowCount: 1 };
    }
  };
  assert.equal(await publishSelectedLaunchImages(client), 15);
  assert.equal(calls.filter(call => call.sql.includes('UPDATE catalog_products')).length, 15);
  assert.equal(calls.filter(call => call.sql.includes('UPDATE catalog_variants')).length, 23);
  assert.equal(calls.filter(call => call.sql.includes('INSERT INTO catalog_migrations')).length, 1);
  assert.ok(calls.filter(call => call.sql.includes('UPDATE catalog_products'))
    .every(call => call.sql.includes("source=source-'catalogHidden'")));
  assert.deepEqual(calls.filter(call => call.sql.includes('UPDATE catalog_variants') &&
    call.values[0] === 'cmd-source-sku-9c96bc24c8863222').map(call => call.values[3]), [false]);
  assert.ok(calls.every(call => !call.sql.includes('stock_quantity')));
});

test('a selected supplier item with zero received stock is shown as on demand', async () => {
  const db = {
    async query(sql) {
      return sql.includes('FROM catalog_variants v JOIN catalog_products p')
        ? { rows: [{ variant_id: 'selected-dog-food', price_confirmed: true,
          source_orderable: true, availability: 'source_on_demand', stock_quantity: 0,
          price_override_cents: 2228, source_price_cents: null }] }
        : { rows: [{ variant_id: 'selected-dog-food', source_count: 1, selected_units: 1 }] };
    }
  };
  const [row] = await catalogSnapshot(db);
  assert.equal(row.sourcing_availability, 'source_on_demand');
  assert.equal(row.stock_quantity, 0);
});
