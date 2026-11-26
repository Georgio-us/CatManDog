import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignLink, serveCampaignLink, listCampaignClicks } from '../server/campaign-links.js';

function response() {
  return { status: null, headers: null, ended: false,
    writeHead(status, headers) { this.status = status; this.headers = headers; },
    end() { this.ended = true; } };
}

test('first Telegram placement has separate short links for site and Instagram', () => {
  const site = campaignLink('/go/tg-vlc-01-w1-site');
  const instagram = campaignLink('/go/tg-vlc-01-w1-instagram');
  assert.equal(site.id, instagram.id);
  assert.equal(site.destination, 'site');
  assert.equal(instagram.destination, 'instagram');
  assert.match(site.url, /utm_source=telegram.*utm_campaign=tg-vlc-01-w1/);
  assert.equal(instagram.url, 'https://www.instagram.com/catmandog.es/');
  assert.equal(campaignLink('/go/unknown'), null);
});

test('TikTok profile has separate tracked links for site and Instagram', () => {
  const site = campaignLink('/go/tiktok-profile-site');
  const instagram = campaignLink('/go/tiktok-profile-instagram');
  assert.equal(site.id, 'tiktok-profile');
  assert.equal(instagram.id, 'tiktok-profile');
  assert.equal(site.destination, 'site');
  assert.equal(instagram.destination, 'instagram');
  assert.equal(site.url,
    '/?utm_source=tiktok&utm_medium=organic_social&utm_campaign=tiktok-profile');
  assert.equal(instagram.url, 'https://www.instagram.com/catmandog.es/');
});

test('second short-link pair has a distinct campaign identifier', () => {
  const firstSite = campaignLink('/go/tg-vlc-01-w1-site');
  const secondSite = campaignLink('/go/tg-vlc-02-w1-site');
  const secondInstagram = campaignLink('/go/tg-vlc-02-w1-instagram');
  assert.notEqual(firstSite.id, secondSite.id);
  assert.equal(secondSite.id, secondInstagram.id);
  assert.match(secondSite.url, /utm_campaign=tg-vlc-02-w1/);
});

test('human opens are counted by destination, preview bots and HEAD requests are not', async () => {
  const writes = [];
  const db = { async query(sql, params) { writes.push(params); return { rows: [] }; } };
  const site = response();
  assert.equal(await serveCampaignLink(db, { method: 'GET', headers: { 'user-agent': 'Safari' } },
    site, '/go/tg-vlc-01-w1-site'), true);
  assert.equal(site.status, 302);
  assert.match(site.headers.Location, /^\/\?utm_source=telegram/);
  assert.deepEqual(writes, [['tg-vlc-01-w1', 'site']]);

  const instagram = response();
  await serveCampaignLink(db, { method: 'GET', headers: { 'user-agent': 'Chrome' } },
    instagram, '/go/tg-vlc-01-w1-instagram');
  assert.equal(instagram.headers.Location, 'https://www.instagram.com/catmandog.es/');
  assert.deepEqual(writes[1], ['tg-vlc-01-w1', 'instagram']);

  await serveCampaignLink(db, { method: 'GET', headers: { 'user-agent': 'TelegramBot' } },
    response(), '/go/tg-vlc-01-w1-site');
  await serveCampaignLink(db, { method: 'HEAD', headers: {} },
    response(), '/go/tg-vlc-01-w1-site');
  assert.equal(writes.length, 2);
});

test('owner report returns counts from the campaign link table', async () => {
  const db = { async query(sql) {
    assert.match(sql, /campaign_link_clicks/);
    return { rows: [{ campaign_id: 'tg-vlc-01-w1', destination: 'site', clicks: 3 }] };
  } };
  assert.equal((await listCampaignClicks(db))[0].clicks, 3);
});
