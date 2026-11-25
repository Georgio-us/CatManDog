import assert from 'node:assert/strict';
import test from 'node:test';
import { searchCatalog } from '../catalog-search.js';

const royalCanin = {
  title: 'Royal Canin Sterilised 37',
  brand: 'Royal Canin',
  details: 'Pienso para gatos',
  variants: [
    { label: '4 кг', available: true },
    { label: '2 кг', available: true },
  ],
};
const churu = {
  title: 'Churu - atún',
  brand: 'Churu',
  details: 'Premios',
  variants: [{ label: '4 × 14 g', available: true }],
};
const entries = [royalCanin, churu];

test('search chooses the exact variant across localized units', () => {
  for (const query of ['Royal Canin Sterilised 2 kg', 'Royal Canin Sterilised 2kg', 'Royal Canin Sterilised 2 кг']) {
    assert.equal(searchCatalog(entries, query)[0]?.variant.label, '2 кг');
  }
  assert.equal(searchCatalog(entries, 'Royal Canin Sterilised 3 kg').length, 0);
});

test('search handles accents and one typo', () => {
  assert.equal(searchCatalog(entries, 'Churu atun')[0]?.entry, churu);
  assert.equal(searchCatalog(entries, 'Ryal Canin Sterilised')[0]?.entry, royalCanin);
});

test('related products are explicitly marked and exclude unavailable options', () => {
  const [hit] = searchCatalog(entries, 'Royal Canin Sterilised 5 kg', { alternatives: true });
  assert.equal(hit.entry, royalCanin);
  assert.equal(hit.alternative, true);
  assert.deepEqual(searchCatalog(entries, 'xyz', { alternatives: true }), []);
});
