import test from 'node:test';
import assert from 'node:assert/strict';
import { orderAlertText, visitAlertText, sendTelegramOrderAlert, telegramReady,
  startTelegramOrderAlerts } from '../server/telegram.js';
import { currentVisitStaff, staffVisitCookie } from '../server/staff.js';
import { handleApi } from '../server/api.js';

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

test('visit alert distinguishes verified owner without leaking private URLs', async () => {
  const text = visitAlertText({ page: '/#/product/leonardo-adult', source: 'search', owner: true });
  assert.match(text, /вход владельца подтверждён/);
  assert.match(text, /leonardo-adult/);
  assert.match(text, /поиск/);
  const unknown = visitAlertText({ page: '/#/account?email=private@example.com',
    source: 'https://private.example.com', owner: false });
  assert.match(unknown, /владелец не распознан/);
  assert.doesNotMatch(unknown, /private@example.com|private.example.com/);
  assert.match(visitAlertText({ source: 'constructor' }), /Источник: неизвестен/);
  const cookie = staffVisitCookie('a'.repeat(64), true);
  assert.match(cookie, /Path=\/api\/telemetry/);
  const db = { async query() { return { rows: [{ role: 'owner' }] }; } };
  assert.equal((await currentVisitStaff(db, { headers: { cookie: `cmd_staff_visit=${'a'.repeat(64)}` } })).role, 'owner');
});

test('visit endpoint verifies the owner server-side before sending Telegram', async () => {
  const keys = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'TELEGRAM_VISIT_ALERTS_ENABLED'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const sent = [];
  try {
    process.env.TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
    process.env.TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID;
    process.env.TELEGRAM_VISIT_ALERTS_ENABLED = 'true';
    globalThis.fetch = async (_url, options) => {
      sent.push(JSON.parse(options.body).text);
      return { ok: true, json: async () => ({ ok: true }) };
    };
    const db = { async query(sql) {
      if (sql.includes('FROM staff_sessions')) return { rows: [{ role: 'owner' }] };
      throw new Error(`Unexpected SQL: ${sql}`);
    } };
    const run = async (cookie, ip) => {
      const req = { method: 'POST', headers: { host: 'catmandog.es', origin: 'https://catmandog.es', cookie },
        socket: { remoteAddress: ip },
        async *[Symbol.asyncIterator]() { yield JSON.stringify({ page: '/#/product/leonardo-adult',
          source: 'search', owner: true }); } };
      let status, body;
      const res = { writeHead(value) { status = value; }, end(value) { body = JSON.parse(value); } };
      await handleApi(db, req, res, '/api/telemetry/visit');
      assert.equal(status, 200);
      assert.equal(body.accepted, true);
    };
    await run('', 'test-visit-unknown');
    await run(`cmd_staff_visit=${'a'.repeat(64)}`, 'test-visit-owner');
    assert.match(sent[0], /владелец не распознан/);
    assert.match(sent[1], /вход владельца подтверждён/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
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
