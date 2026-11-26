import test from 'node:test';
import assert from 'node:assert/strict';
import { pollTelegramCommands } from '../server/telegram.js';

const env = { TELEGRAM_BOT_TOKEN: '123456:valid_token', TELEGRAM_CHAT_ID: '123456' };

test('bot commands show visit, sales and link counts only to the configured chat', async () => {
  const sent = [];
  const cursor = [];
  const db = { async query(sql, args) {
    if (sql.includes('SELECT value FROM telegram_bot_state')) return { rows: [{ value: 10 }] };
    if (sql.includes('INSERT INTO telegram_bot_state')) { cursor.push(args[0]); return { rows: [] }; }
    if (sql.includes('AS all_visits')) return { rows: [{
      all_visits: 124, all_browsers: 80, visits: 8, browsers: 6,
      search: 3, telegram: 2, instagram: 1, direct: 2, other: 0
    }] };
    if (sql.includes('FROM paid')) return { rows: [{ all_count: 4, all_cents: 9135,
      site_count: 1, outside_count: 3, today_count: 1, today_cents: 1500 }] };
    if (sql.includes('FROM campaign_link_clicks')) return { rows: [{
      campaign_id: 'tg-vlc-01-w1', destination: 'site', today: 5, total: 10
    }] };
    if (sql.includes('FROM site_visit_events WHERE campaign_id')) return { rows: [{
      campaign_id: 'tg-vlc-01-w1', today: 3, total: 7
    }] };
    throw new Error(`Unexpected query: ${sql}`);
  } };
  const updates = ['/visits', '/sales', '/links', '/stats', '/help'].map((text, index) => ({
    update_id: 10 + index, message: { chat: { id: 123456 }, text }
  }));
  updates.push({ update_id: 15, message: { chat: { id: 999 }, text: '/sales' } });
  const fetcher = async (url, options) => {
    if (url.endsWith('/getUpdates')) return { ok: true, json: async () => ({ ok: true, result: updates }) };
    sent.push(JSON.parse(options.body).text);
    return { ok: true, json: async () => ({ ok: true }) };
  };
  await pollTelegramCommands(db, fetcher, env);
  assert.equal(sent.length, 5);
  assert.match(sent[0], /Поиск: 3/);
  assert.match(sent[0], /За всё время: визитов 124/);
  assert.match(sent[1], /Всего: 4 · 91,35 €/);
  assert.match(sent[2], /Барахолка · tg-vlc-01-w1\nСайт: 5 сегодня/);
  assert.match(sent[2], /Женский чат · tg-vlc-02-w1/);
  assert.match(sent[2], /Визиты с согласием: 3 сегодня/);
  assert.match(sent[3], /Посещения сегодня/);
  assert.match(sent[4], /\/visits/);
  assert.deepEqual(cursor, [11, 12, 13, 14, 15, 16]);
});
