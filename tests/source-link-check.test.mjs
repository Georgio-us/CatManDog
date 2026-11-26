import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceLinkProblems } from '../scripts/verify-source-links.mjs';
import { directSupplierSources } from '../server/direct-supplier-sources.js';

test('publication gate catches an orderable SKU without a linked source', () => {
  const row = { orderable: true, availableForCart: true, pickupAvailable: false,
    availability: 'source_on_demand', sourcingAvailability: 'unavailable', sourceLinkVerified: false };
  assert.match(sourceLinkProblems(row).join(' '), /источник unavailable/u);
  assert.match(sourceLinkProblems(row).join(' '), /нет подтверждённой связи/u);
  assert.deepEqual(sourceLinkProblems({ ...row, sourcingAvailability: 'source_on_demand',
    sourceLinkVerified: true, direct_supplier_verified_at: '2026-11-26' },
  directSupplierSources['rc-labrador-puppy-3kg']), []);
  assert.match(sourceLinkProblems({ ...row, sourcingAvailability: 'source_on_demand',
    sourceLinkVerified: true }, directSupplierSources['rc-labrador-puppy-3kg']).join(' '),
  /дата B2B-проверки/u);
});
