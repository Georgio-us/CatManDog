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
    const body = JSON.stringify({ kind: 'support', orderNumber: 'CMD-12345',
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
    assert.deepEqual(sent.map(mail => mail.to[0]), ['support@catmandog.es', 'buyer@example.test']);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('admin reply sends a branded email and records it against the request', async () => {
  const keys = ['ADMIN_TOKEN', 'RESEND_API_KEY', 'RESEND_FROM', 'PUBLIC_BASE_URL'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const queries = [];
  const sent = [];
  try {
    process.env.ADMIN_TOKEN = 'a'.repeat(40);
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM = 'CatManDog <no-reply@notify.catmandog.es>';
    process.env.PUBLIC_BASE_URL = 'https://catmandog.es/';
    globalThis.fetch = async (_url, options) => {
      sent.push(JSON.parse(options.body));
      return { ok: true };
    };
    const db = { async query(sql, params) {
      queries.push({ sql, params });
      if (sql.startsWith('SELECT id,email FROM service_requests'))
        return { rows: [{ id: 'request-id', email: 'buyer@example.test' }] };
      return { rowCount: 1 };
    } };
    const req = { method: 'POST', headers: { authorization: `Bearer ${process.env.ADMIN_TOKEN}` },
      socket: { remoteAddress: 'test-admin-reply' },
      async *[Symbol.asyncIterator]() { yield JSON.stringify({ message: 'Ваш заказ уже в пути' }); } };
    let status, result;
    const res = { writeHead(code) { status = code; }, end(value) { result = JSON.parse(value); } };
    await handleApi(db, req, res, '/api/admin/service-requests/request-id/reply');
    assert.equal(status, 200);
    assert.equal(result.sent, true);
    assert.equal(sent[0].to[0], 'buyer@example.test');
    assert.match(sent[0].text, /Ваш заказ уже в пути/);
    assert.ok(queries.some(({ sql }) => sql.startsWith('INSERT INTO service_request_replies')));
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
