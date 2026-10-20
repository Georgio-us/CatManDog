import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../server/api.js';
import { staffCookie, clearStaffCookie, bootstrapOwner } from '../server/staff.js';

function response() {
  const state = { status: null, body: null, headers: null };
  return { state, res: { writeHead(status, headers) { state.status = status; state.headers = headers; },
    end(body) { state.body = JSON.parse(body); } } };
}

test('staff cookie is scoped to admin API, HttpOnly and short lived', () => {
  const cookie = staffCookie('a'.repeat(64), true);
  assert.match(cookie, /HttpOnly; SameSite=Strict; Path=\/api\/admin; Max-Age=28800; Secure/);
  assert.match(clearStaffCookie(true), /Max-Age=0; Secure/);
});

test('old bearer key alone cannot read or modify the admin API', async () => {
  const previous = process.env.ADMIN_TOKEN;
  process.env.ADMIN_TOKEN = 'a'.repeat(40);
  try {
    const db = { query() { throw new Error('The database should not be reached'); } };
    for (const [method, path] of [['GET','/api/admin/sku-audit'], ['PATCH','/api/admin/variants/sku']]) {
      const { state, res } = response();
      const req = { method, headers: { authorization: `Bearer ${process.env.ADMIN_TOKEN}` },
        socket: { remoteAddress: 'test-old-admin-key' } };
      await handleApi(db, req, res, path);
      assert.equal(state.status, 403);
    }
  } finally {
    if (previous === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = previous;
  }
});

test('owner staff session can audit SKU, support staff cannot', async () => {
  let role = 'owner';
  const db = { async query(sql) {
    if (sql.includes('FROM staff_sessions')) return { rows: [{ id:'staff-1', email:'owner@example.test', role }] };
    if (sql.includes('FROM catalog_variants v JOIN catalog_products p')) return { rows: [{ variant_id:'sku-1' }] };
    throw new Error(`Unexpected query: ${sql}`);
  } };
  const req = { method:'GET', headers:{ cookie:`cmd_staff_session=${'b'.repeat(64)}` },
    socket:{ remoteAddress:'test-staff' } };
  const owner = response();
  await handleApi(db, req, owner.res, '/api/admin/sku-audit');
  assert.equal(owner.state.status, 200);
  assert.equal(owner.state.body.variants[0].variant_id, 'sku-1');
  role = 'support';
  const support = response();
  await handleApi(db, req, support.res, '/api/admin/sku-audit');
  assert.equal(support.state.status, 403);
});

test('owner bootstrap refuses to replace an existing owner', async () => {
  let rolledBack = false;
  const client = { async query(sql) {
    if (sql.includes("FROM staff_accounts WHERE role='owner'")) return { rows: [{ id:'existing' }] };
    if (sql === 'ROLLBACK') rolledBack = true;
    return { rows: [] };
  }, release() {} };
  await assert.rejects(bootstrapOwner({ connect: async () => client },
    { sub:'other-google-account', email:'other@example.test', name:'Other' }), /уже назначен/);
  assert.equal(rolledBack, true);
});
