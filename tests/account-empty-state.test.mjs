import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountStore } from '../account-store.js';

test('a signed-in account without pets can leave onboarding or sign out', async () => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value)
  };
  globalThis.location = { hash: '#/join' };
  globalThis.fetch = async path => {
    assert.equal(path, '/api/auth/logout');
    return { ok: true, json: async () => ({ ok: true }) };
  };

  const { createAccountUI } = await import('../account.js');
  const account = createAccountUI({ escape: value => String(value), icon: () => '<svg></svg>',
    products: [], render: () => {}, notify: () => {} });
  const snapshot = createAccountStore(localStorage).get();
  snapshot.human.email = 'support@catmandog.es';
  account.store.connectRemote(snapshot, 0, async () => ({ revision: 1 }));

  const join = account.page('/join', new URLSearchParams());
  assert.match(join, /href="#\/account">Вернуться в кабинет/);
  assert.match(join, /data-account-exit>Выйти из аккаунта/);

  const cabinet = account.page('/account', new URLSearchParams());
  assert.match(cabinet, /support@catmandog\.es/);
  assert.match(cabinet, /href="#\/join">Добавить питомца/);
  assert.match(cabinet, /data-account-exit>Выйти из аккаунта/);
  assert.doesNotMatch(cabinet, /data-account-form="join"/);

  await account.click({ hasAttribute: name => name === 'data-account-exit' });
  assert.equal(account.store.mode(), 'personal');
  assert.equal(location.hash, '/account/login');
});
