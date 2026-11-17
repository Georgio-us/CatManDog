import test from 'node:test';
import assert from 'node:assert/strict';
import { visitAttribution, recordSiteVisit, deleteSiteVisitor } from '../server/visit-analytics.js';

const cartId = '641c5edb-152a-4788-9053-e880270a023e';
const visitId = '241c5edb-152a-4788-9053-e880270a023e';

test('visit attribution accepts known social sources and ignores arbitrary text', () => {
  assert.equal(visitAttribution({ source: 'social', platform: 'instagram' }), 'instagram');
  assert.equal(visitAttribution({ source: 'search', platform: 'javascript:alert(1)' }), 'search');
  assert.equal(visitAttribution({ source: 'constructor' }), 'unknown');
});

test('visit recording returns stable browser ordinal, daily totals and ignores a repeated session', async () => {
  let duplicate = false;
  const statements = [];
  const client = { async query(sql, args) {
    statements.push({ sql, args });
    if (sql.includes('SELECT 1 FROM site_visit_events')) return { rows: duplicate ? [{ '?column?': 1 }] : [] };
    if (sql.includes('INSERT INTO site_visitors'))
      return { rows: [{ visitor_number: '42', visit_count: 2 }] };
    if (sql.includes('AS visits_today'))
      return { rows: [{ visits_today: 9, visitors_today: 5, instagram_today: 3 }] };
    return { rows: [] };
  }, release() {} };
  const db = { async connect() { return client; } };
  const result = await recordSiteVisit(db, { cartId, visitId, platform: 'instagram', source: 'social' });
  assert.deepEqual(result, { source: 'instagram', visitorNumber: 42, visitCount: 2,
    visits_today: 9, visitors_today: 5, instagram_today: 3 });
  assert.equal(statements.some(({ sql, args }) => sql.includes('INSERT INTO site_visit_events') &&
    args[2] === 'instagram'), true);
  duplicate = true;
  assert.equal(await recordSiteVisit(db, { cartId, visitId }), null);
  assert.equal(statements.filter(({ sql }) => sql.includes('INSERT INTO site_visit_events')).length, 1);
});

test('withdrawing analytics deletes the browser and its visit history', async () => {
  const db = { async query(sql, args) {
    assert.match(sql, /DELETE FROM site_visitors/);
    assert.deepEqual(args, [cartId]);
    return { rowCount: 1 };
  } };
  assert.equal(await deleteSiteVisitor(db, cartId), true);
  assert.equal(await deleteSiteVisitor(db, 'invalid'), false);
});
