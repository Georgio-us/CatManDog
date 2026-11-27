import test from 'node:test';
import assert from 'node:assert/strict';
import { visitAttribution, visitCampaign, recordSiteVisit, deleteSiteVisitor } from '../server/visit-analytics.js';

const cartId = '641c5edb-152a-4788-9053-e880270a023e';
const visitId = '241c5edb-152a-4788-9053-e880270a023e';

test('visit attribution accepts known social sources and ignores arbitrary text', () => {
  assert.equal(visitAttribution({ source: 'social', platform: 'instagram' }), 'instagram');
  assert.equal(visitAttribution({ source: 'search', platform: 'javascript:alert(1)' }), 'search');
  assert.equal(visitAttribution({ source: 'constructor' }), 'unknown');
  assert.equal(visitAttribution({ source: 'social', platform: 'telegram' }), 'telegram');
  assert.equal(visitCampaign({ platform: 'telegram', campaignId: 'tg-vlc-01-w1' }), 'tg-vlc-01-w1');
  assert.equal(visitCampaign({ platform: 'telegram', campaignId: 'tg-vlc-03-w1' }), 'tg-vlc-03-w1');
  assert.equal(visitCampaign({ platform: 'telegram', campaignId: 'tg-vlc-04-w1' }), 'tg-vlc-04-w1');
  assert.equal(visitCampaign({ platform: 'telegram', campaignId: 'tg-es-01-w1' }), 'tg-es-01-w1');
  assert.equal(visitCampaign({ platform: 'instagram', campaignId: 'tg-vlc-01-w1' }), null);
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
  assert.deepEqual(result, { source: 'instagram', campaignId: null, visitorNumber: 42, visitCount: 2,
    visits_today: 9, visitors_today: 5, instagram_today: 3 });
  assert.equal(statements.some(({ sql, args }) => sql.includes('INSERT INTO site_visit_events') &&
    args[2] === 'instagram'), true);
  duplicate = true;
  assert.equal(await recordSiteVisit(db, { cartId, visitId }), null);
  assert.equal(statements.filter(({ sql }) => sql.includes('INSERT INTO site_visit_events')).length, 1);
});

test('rapid internal catalog reloads do not create visits, but a later return does', async () => {
  let recent = true;
  let count = 1;
  const inserted = [];
  const client = { async query(sql, args) {
    if (sql.includes('WHERE visit_id=$1')) return { rows: [] };
    if (sql.includes("interval '10 minutes'")) return { rows: recent ? [{ '?column?': 1 }] : [] };
    if (sql.includes('INSERT INTO site_visitors')) return { rows: [{ visitor_number: '127', visit_count: ++count }] };
    if (sql.includes('INSERT INTO site_visit_events')) inserted.push(args);
    if (sql.includes('AS visits_today')) return { rows: [{ visits_today: count, visitors_today: 1 }] };
    return { rows: [] };
  }, release() {} };
  const db = { async connect() { return client; } };
  const internal = { cartId, visitId, source: 'internal' };
  assert.equal(await recordSiteVisit(db, internal), null);
  assert.equal(inserted.length, 0);
  recent = false;
  const returned = await recordSiteVisit(db, internal);
  assert.equal(returned.visitCount, 2);
  assert.equal(inserted.length, 1);
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
