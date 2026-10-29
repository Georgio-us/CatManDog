import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../server/api.js';

test('support API stores the request and emails the team and buyer', async () => {
  const keys = ['SUPPORT_ENABLED', 'RESEND_API_KEY', 'RESEND_FROM', 'PUBLIC_BASE_URL'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const sent = [];
  const inserted = [];
  try {
    process.env.SUPPORT_ENABLED = 'true';
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM = 'CatManDog <no-reply@notify.catmandog.es>';
    process.env.PUBLIC_BASE_URL = 'https://catmandog.es/';
    globalThis.fetch = async (_url, options) => {
      sent.push(JSON.parse(options.body));
      return { ok: true };
    };
    const db = { async query(sql, params) {
      if (sql.startsWith('SELECT id FROM orders')) return { rows: [] };
      if (sql.startsWith('INSERT INTO service_requests')) {
        inserted.push(params);
        return { rowCount: 1 };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    } };
    const body = JSON.stringify({ kind: 'support', orderNumber: 'CMD-12345', locale: 'es',
      email: 'buyer@example.test', message: 'Мне нужна помощь с заказом' });
    const req = { method: 'POST', headers: {}, socket: { remoteAddress: 'test-support-route' },
      async *[Symbol.asyncIterator]() { yield body; } };
    let status, result;
    const res = { writeHead(code) { status = code; }, end(value) { result = JSON.parse(value); } };
    await handleApi(db, req, res, '/api/service-requests');
    assert.equal(status, 202);
    assert.equal(result.accepted, true);
    assert.equal(inserted.length, 1);
    assert.equal(inserted[0][8], 'CMD-12345');
    assert.equal(inserted[0][9], 'es');
    assert.deepEqual(sent.map(mail => mail.to[0]), ['support@catmandog.es', 'buyer@example.test']);
    assert.match(sent[1].subject, /Hemos recibido tu consulta/);

    const withdrawal = JSON.stringify({ kind: 'return', locale: 'es',
      email: 'buyer@example.test', quantity: 1,
      message: 'Comunico mi decisión de desistir de la compra a distancia' });
    const returnReq = { method: 'POST', headers: {}, socket: { remoteAddress: 'test-withdrawal-route' },
      async *[Symbol.asyncIterator]() { yield withdrawal; } };
    await handleApi(db, returnReq, res, '/api/service-requests');
    assert.equal(status, 202);
    assert.equal(inserted.length, 2);
    assert.equal(inserted[1][8], null);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('admin reply sends a branded email and records it against the request', async () => {
  const keys = ['RESEND_API_KEY', 'RESEND_FROM', 'PUBLIC_BASE_URL'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const queries = [];
  const sent = [];
  try {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM = 'CatManDog <no-reply@notify.catmandog.es>';
    process.env.PUBLIC_BASE_URL = 'https://catmandog.es/';
    globalThis.fetch = async (_url, options) => {
      sent.push(JSON.parse(options.body));
      return { ok: true };
    };
    const db = { async query(sql, params) {
      queries.push({ sql, params });
      if (sql.includes('FROM staff_sessions'))
        return { rows: [{ id: 'staff-id', email: 'owner@example.test', role: 'owner' }] };
      if (sql.startsWith('SELECT id,email,locale FROM service_requests'))
        return { rows: [{ id: 'request-id', email: 'buyer@example.test', locale: 'es' }] };
      return { rowCount: 1 };
    } };
    const req = { method: 'POST', headers: { cookie: `cmd_staff_session=${'a'.repeat(64)}` },
      socket: { remoteAddress: 'test-admin-reply' },
      async *[Symbol.asyncIterator]() { yield JSON.stringify({ message: 'Tu pedido está en camino' }); } };
    let status, result;
    const res = { writeHead(code) { status = code; }, end(value) { result = JSON.parse(value); } };
    await handleApi(db, req, res, '/api/admin/service-requests/request-id/reply');
    assert.equal(status, 200);
    assert.equal(result.sent, true);
    assert.equal(sent[0].to[0], 'buyer@example.test');
    assert.match(sent[0].subject, /Respuesta de CatManDog/);
    assert.match(sent[0].text, /Tu pedido está en camino/);
    assert.doesNotMatch(sent[0].text, /[А-Яа-яЁё]/u);
    assert.ok(queries.some(({ sql }) => sql.startsWith('INSERT INTO service_request_replies')));
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('verified support session can see requests but cannot edit prices or orders', async () => {
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions')) return { rows: [] };
    if (sql.includes('FROM customer_sessions')) return { rows: [{ id: 'staff',
      email: 'support@catmandog.es', googleLinked: true, emailVerified: true }] };
    if (sql.includes('FROM service_requests r')) return { rows: [] };
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
  const request = path => ({ method: 'GET', headers: { cookie: `cmd_session=${'a'.repeat(64)}` },
    socket: { remoteAddress: 'test-staff-access' } });
  const response = () => {
    const result = { status: null, body: null };
    return { result, res: { writeHead(code) { result.status = code; },
      end(value) { result.body = JSON.parse(value); } } };
  };
  const permitted = response();
  await handleApi(db, request(), permitted.res, '/api/admin/service-requests');
  assert.equal(permitted.result.status, 200);
  const denied = response();
  await handleApi(db, request(), denied.res, '/api/admin/variants');
  assert.equal(denied.result.status, 403);
});

test('admin requests can be searched and paged without a fixed first-100 limit', async () => {
  let queryParams;
  const db = { async query(sql, params) {
    if (sql.includes('FROM staff_sessions'))
      return { rows: [{ id: 'owner', email: 'owner@example.test', role: 'owner' }] };
    if (sql.includes('FROM service_requests r')) {
      queryParams = params;
      return { rows: Array.from({ length: 26 }, (_, index) => ({ id: `request-${index}` })) };
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  } };
  const req = { method: 'GET', url: '/api/admin/service-requests?page=2&q=CMD-42&status=new',
    headers: { cookie: `cmd_staff_session=${'a'.repeat(64)}` },
    socket: { remoteAddress: 'test-request-pagination' } };
  let result;
  const res = { writeHead() {}, end(value) { result = JSON.parse(value); } };
  await handleApi(db, req, res, '/api/admin/service-requests');
  assert.deepEqual(queryParams, ['CMD-42', 'new', 50]);
  assert.equal(result.requests.length, 25);
  assert.equal(result.hasMore, true);
});
