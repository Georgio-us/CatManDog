import test from 'node:test';
import assert from 'node:assert/strict';
import { sourcingStatus, supplierSourcingByVariant } from '../server/sourcing-status.js';

test('selection does not convert a supplier source into physical stock', () => {
  assert.equal(sourcingStatus(true), 'source_on_demand');
  assert.equal(sourcingStatus(false), 'unavailable');
});

test('supplier links and selected purchase units are read without changing inventory', async () => {
  const db = { async query(sql) {
    assert.match(sql, /supplier_catalog_matches/);
    assert.match(sql, /selected_supplier_items/);
    assert.doesNotMatch(sql, /UPDATE catalog_variants/);
    return { rows: [
      { variant_id: 'selected', source_count: 1, selected_units: 12 },
      { variant_id: 'source-only', source_count: 1, selected_units: 0 }
    ] };
  } };
  const statuses = await supplierSourcingByVariant(db);
  assert.equal(statuses.get('selected').status, 'source_on_demand');
  assert.equal(statuses.get('selected').selectedUnits, 12);
  assert.equal(statuses.get('source-only').status, 'source_on_demand');
  assert.equal(statuses.has('unlinked'), false);
});
