import test from 'node:test';
import assert from 'node:assert/strict';
import { orderAlertText, visitAlertText, sendTelegramOrderAlert, telegramReady,
  startTelegramOrderAlerts, pollTelegramCommands } from '../server/telegram.js';
import { currentVisitStaff, staffVisitCookie } from '../server/staff.js';
import { handleApi } from '../server/api.js';

const env = { TELEGRAM_BOT_TOKEN: '12345:example_token', TELEGRAM_CHAT_ID: '-1001234567890' };
const order = { id: 12, number: 'CMD-1024', total_cents: 3203,
  stripe_checkout_session_id: 'cs_live_example', customer_name: 'Анна',
  email: 'buyer@example.com', phone: '+34 600 000 000', whatsapp_opt_in: true,
  paid_at: '2026-11-16T16:30:00Z',
  delivery_address: { street: 'Carrer de la Pau', building: '12', apartment: '2º',
    postcode: '46001', city: 'València', note: 'Код двери 1234' },
  delivery_preference: { mode: 'slot', date: '2026-11-18', window: '10-14' } };

test('Telegram order notification highlights payment and includes buyer contact and delivery preference', async () => {
  assert.equal(telegramReady(env), true);
  assert.equal(telegramReady({ ...env, TELEGRAM_BOT_TOKEN: '' }), false);
  const text = orderAlertText(order);
  assert.match(text, /^❗️ НОВЫЙ ОПЛАЧЕННЫЙ ЗАКАЗ/);
  assert.match(text, /CMD-1024/);
  assert.match(text, /32,03 €/);
  assert.match(text, /Оплачен: 16\.11\.2026, 17:30 \(Валенсия\)/);
  assert.match(text, /Клиент: Анна/);
  assert.match(text, /Телефон: \+34 600 000 000 \(WhatsApp\)/);
  assert.match(text, /Email: buyer@example.com/);
  assert.match(text, /Адрес: Carrer de la Pau, 12, 2º, 46001, València/);
  assert.match(text, /Желаемая доставка: 2026-11-18, 10-14/);
  assert.doesNotMatch(text, /Код двери 1234/);
  let request;
  const delivered = await sendTelegramOrderAlert(order, async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ ok: true }) };
  }, env);
  assert.equal(delivered, true);
  assert.equal(request.options.method, 'POST');
  assert.equal(JSON.parse(request.options.body).chat_id, env.TELEGRAM_CHAT_ID);
  assert.match(request.url, /^https:\/\/api\.telegram\.org\/bot/);
  assert.equal(JSON.parse(request.options.body).text, text);
});

test('test payments stay clearly separate and customer text cannot forge notification lines', () => {
  const text = orderAlertText({ ...order, is_test: true, customer_name: 'Анна\nСумма: 0 €',
    delivery_preference: { mode: 'scheduled', date: '2026-11-18', time: '17:00', reserved: true } });
  assert.match(text, /^🧪 ТЕСТОВЫЙ ОПЛАЧЕННЫЙ ЗАКАЗ/);
  assert.match(text, /Клиент: Анна Сумма: 0 €/);
  assert.match(text, /Согласованная доставка: 2026-11-18, 17:00/);
});

test('visit alert shows new and repeat browser counts without leaking private URLs', async () => {
  const text = visitAlertText({ page: '/#/product/leonardo-adult', source: 'instagram',
    visitorNumber: 12, visitCount: 1, visits_today: 8, visitors_today: 6,
    instagram_today: 4 });
  assert.match(text, /👋 Новый посетитель №12/);
  assert.match(text, /leonardo-adult/);
  assert.match(text, /Источник: Instagram/);
  assert.match(text, /Сегодня: 8 визитов · 6 браузеров/);
  assert.match(text, /Из Instagram сегодня: 4/);
  const unknown = visitAlertText({ page: '/#/account?email=private@example.com',
    source: 'https://private.example.com', visitorNumber: 12, visitCount: 3 });
  assert.match(unknown, /🔁 Повторный визит №12/);
  assert.doesNotMatch(unknown, /private@example.com|private.example.com/);
  assert.match(visitAlertText({ source: 'constructor' }), /Источник: неизвестен/);
  const telegram = visitAlertText({ source: 'telegram', campaignId: 'tg-vlc-02-w1',
    visits_today: 4, visitors_today: 3, search_today: 1, telegram_today: 2, direct_today: 1 });
  assert.match(telegram, /Источник: Telegram/);
  assert.match(telegram, /Метка ссылки: tg-vlc-02-w1/);
  assert.doesNotMatch(telegram, /Женский чат|Барахолка/);
  assert.match(telegram, /Из поиска сегодня: 1/);
  const cookie = staffVisitCookie('a'.repeat(64), true);
  assert.match(cookie, /Path=\/api\/telemetry/);
  const db = { async query() { return { rows: [{ role: 'owner' }] }; } };
  assert.equal((await currentVisitStaff(db, { headers: { cookie: `cmd_staff_visit=${'a'.repeat(64)}` } })).role, 'owner');
});

test('visit endpoint counts consented browsers and excludes a verified owner', async () => {
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
    const client = { async query(sql) {
      if (sql.includes('FROM site_visit_events WHERE visit_id')) return { rows: [] };
      if (sql.includes('INSERT INTO site_visitors'))
        return { rows: [{ visitor_number: '7', visit_count: 1 }] };
      if (sql.includes('AS visits_today'))
        return { rows: [{ visits_today: 3, visitors_today: 2, instagram_today: 2 }] };
      return { rows: [] };
    }, release() {} };
    const db = { async query(sql) {
      if (sql.includes('FROM staff_sessions')) return { rows: [{ role: 'owner' }] };
      throw new Error(`Unexpected SQL: ${sql}`);
    }, async connect() { return client; } };
    const run = async (cookie, ip) => {
      const req = { method: 'POST', headers: { host: 'catmandog.es', origin: 'https://catmandog.es', cookie },
        socket: { remoteAddress: ip },
        async *[Symbol.asyncIterator]() { yield JSON.stringify({ page: '/#/product/leonardo-adult',
          source: 'social', platform: 'instagram', owner: true,
          cartId: '641c5edb-152a-4788-9053-e880270a023e',
          visitId: '241c5edb-152a-4788-9053-e880270a023e' }); } };
      let status, body;
      const res = { writeHead(value) { status = value; }, end(value) { body = JSON.parse(value); } };
      await handleApi(db, req, res, '/api/telemetry/visit');
      assert.equal(status, 200);
      return body;
    };
    assert.equal((await run('', 'test-visit-unknown')).accepted, true);
    assert.equal((await run(`cmd_staff_visit=${'a'.repeat(64)}`, 'test-visit-owner')).owner, true);
    assert.equal(sent.length, 1);
    assert.match(sent[0], /Новый посетитель №7/);
    assert.match(sent[0], /Источник: Instagram/);
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
  const messages = [];
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
    fetcher: async (_url, options) => { messages.push(JSON.parse(options.body).text);
      return { ok: true, json: async () => ({ ok: true }) }; }, env });
  await new Promise(resolve => setTimeout(resolve, 15));
  stop();
  assert.equal(statements.some(sql => sql.includes('telegram_alert_pending=false')), true);
  assert.equal(statements.some(sql => sql.includes('customer_name,email,phone,buyer_phone')), true);
  assert.match(messages[0], /buyer@example.com/);
});
