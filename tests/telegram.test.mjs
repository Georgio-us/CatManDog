import test from 'node:test';
import assert from 'node:assert/strict';
import { orderAlertText, sendTelegramOrderAlert, telegramReady,
  startTelegramOrderAlerts } from '../server/telegram.js';

const env = { TELEGRAM_BOT_TOKEN: '12345:example_token', TELEGRAM_CHAT_ID: '-1001234567890' };
const order = { id: 12, number: 'CMD-1024', total_cents: 3203,
  stripe_checkout_session_id: 'cs_live_example', email: 'buyer@example.com',
  phone: '600000000', address: 'Private street' };

test('Telegram order notification contains only the order reference and amount', async () => {
  assert.equal(telegramReady(env), true);
  assert.equal(telegramReady({ ...env, TELEGRAM_BOT_TOKEN: '' }), false);
  const text = orderAlertText(order);
  assert.match(text, /CMD-1024/);
  assert.match(text, /32,03 €/);
  assert.doesNotMatch(text, /buyer@example.com|600000000|Private street/);
  let request;
  const delivered = await sendTelegramOrderAlert(order, async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ ok: true }) };
  }, env);
  assert.equal(delivered, true);
  assert.equal(request.options.method, 'POST');
  assert.equal(JSON.parse(request.options.body).chat_id, env.TELEGRAM_CHAT_ID);
  assert.match(request.url, /^https:\/\/api\.telegram\.org\/bot/);
});

test('failed Telegram delivery leaves the paid order pending for retry', async () => {
  const statements = [];
  const client = {
    async query(sql) {
      statements.push(sql);
      if (sql.includes('SELECT id,number')) return { rows: [order] };
      return { rows: [] };
    },
    release() {}
  };
  const db = { async connect() { return client; } };
  const previousError = console.error;
  console.error = () => {};
  try {
    const stop = startTelegramOrderAlerts(db, { intervalMs: 60000,
      fetcher: async () => ({ ok: false, status: 500 }), env });
    await new Promise(resolve => setTimeout(resolve, 15));
    stop();
  } finally { console.error = previousError; }
  assert.equal(statements.some(sql => sql.includes('telegram_alert_attempted_at=now() WHERE id=$1')), true);
  assert.equal(statements.some(sql => sql.includes('telegram_alert_pending=false')), false);
});

test('successful Telegram delivery clears the pending flag', async () => {
  const statements = [];
  let selects = 0;
  const client = {
    async query(sql) {
      statements.push(sql);
      if (sql.includes('SELECT id,number')) return { rows: selects++ === 0 ? [order] : [] };
      return { rows: [] };
    },
    release() {}
  };
  const db = { async connect() { return client; } };
  const stop = startTelegramOrderAlerts(db, { intervalMs: 60000,
    fetcher: async () => ({ ok: true, json: async () => ({ ok: true }) }), env });
  await new Promise(resolve => setTimeout(resolve, 15));
  stop();
  assert.equal(statements.some(sql => sql.includes('telegram_alert_pending=false')), true);
});
