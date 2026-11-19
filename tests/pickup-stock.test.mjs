import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogSnapshot } from '../server/catalog.js';
import { seoDocument } from '../server/seo.js';

test('pickup includes only free physical stock, not supplier availability or reservations', async () => {
  const rows = [
    { variant_id: 'free', availability: 'on_hand', stock_quantity: 2, reserved_quantity: 1 },
    { variant_id: 'reserved', availability: 'on_hand', stock_quantity: 1, reserved_quantity: 1 },
    { variant_id: 'committed', availability: 'on_hand', stock_quantity: 1,
      reserved_quantity: 0, committed_quantity: 1 },
    { variant_id: 'supplier', availability: 'source_on_demand', stock_quantity: 0, reserved_quantity: 0 },
    { variant_id: 'pending', availability: 'pending', stock_quantity: 3, reserved_quantity: 0 }
  ].map(row => ({ ...row, product_id: row.variant_id, name: row.variant_id,
    source_price_cents: 1000, price_override_cents: null, price_confirmed: true,
    sale_status: 'available', source_orderable: true }));
  const db = { query: async sql => ({ rows: sql.includes('FROM catalog_variants v JOIN catalog_products')
    ? rows : [{ variant_id: 'supplier', source_count: 1, selected_units: 0 }] }) };
  const result = await catalogSnapshot(db);
  assert.deepEqual(result.filter(row => row.pickup_available).map(row => row.variant_id), ['free']);
  assert.equal(result.find(row => row.variant_id === 'supplier').sourcing_availability,
    'source_on_demand');
});

test('direct pickup URL serves a dedicated HTML document', async () => {
  const html = await seoDocument('/recogida');
  assert.match(html, /<h1 class="page-title">Disponible para recogida<\/h1>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/catmandog\.es\/recogida">/);
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
});
