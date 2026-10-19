import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCabinet } from '../server/cabinet.js';

const petId = '86e579dd-20c2-4b5e-a4b8-65f9510f8c27';
const reminderId = 'a36b7d20-0e24-45de-9c0d-ce86725c0fc2';

test('cabinet input cannot inject orders and keeps plans scoped to a saved pet', () => {
  const result = normalizeCabinet({ pets: [{ id: petId, name: 'Лео.', species: 'cat', notes: 'Любит играть' }],
    activePetId: petId, orders: [{ total_cents: 0, status: 'paid' }], promo: 'WELCOME10',
    reminders: [{ id: reminderId, petId, title: 'Корм', date: '2026-11-01' },
      { id: '74f17b92-e030-4a75-8f48-6ca5bf421a59', petId: '7b439d2d-5bfa-4015-9c72-d09680797c81',
        title: 'Чужой план', date: '2026-11-01' }] });
  assert.equal(result.pets[0].name, 'Лео.');
  assert.equal(result.data.reminders.length, 1);
  assert.equal(result.data.reminders[0].title, 'Корм');
  assert.equal('orders' in result.data, false);
  assert.equal('promo' in result.data, false);
  assert.throws(() => normalizeCabinet({ pets: [{ id: 'not-uuid', name: 'Лео', species: 'cat' }] }));
});

test('signed-in profile loads from API and saves without writing it to browser storage', async () => {
  const previous = { fetch: globalThis.fetch, localStorage: globalThis.localStorage,
    location: globalThis.location };
  const entries = new Map();
  const writes = [];
  globalThis.localStorage = { getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value) };
  globalThis.location = { hash: '#/account', href: 'https://example.test/#/account' };
  globalThis.fetch = async (path, options) => {
    if (path === '/api/config') return Response.json({ accountsEnabled: true, emailEnabled: true });
    if (path === '/api/auth/me') return Response.json({ customer: { id: petId, email: 'a@example.test' } });
    if (path === '/api/me/cabinet' && options.method === 'GET') return Response.json({ revision: 0,
      cabinet: { version: 1, pets: [{ id: petId, name: 'Лео', species: 'cat' }], activePetId: petId,
        human: {}, orders: [], reminders: [], clinics: {}, trips: [], tripDrafts: {} } });
    if (path === '/api/me/cabinet' && options.method === 'PUT') {
      writes.push(JSON.parse(options.body));
      return Response.json({ revision: writes.length });
    }
    throw new Error(`Unexpected route ${path}`);
  };
  try {
    const { createAccountUI } = await import('../account.js?remote-cabinet-test');
    const ui = createAccountUI({ escape: String, icon: () => '', money: String, products: [],
      imageBlock: () => '', render: () => {}, notify: () => {}, getCart: () => [], repeatOrder: () => {} });
    await ui.initialize();
    assert.equal(ui.store.mode(), 'remote');
    ui.store.savePet({ name: 'Лео.', species: 'cat' }, petId);
    await ui.syncChanges();
    assert.equal(writes[0].revision, 0);
    assert.equal(writes[0].cabinet.pets[0].name, 'Лео.');
    assert.equal(entries.has('catmandog-pet-account-v1'), false);
  } finally {
    globalThis.fetch = previous.fetch;
    globalThis.localStorage = previous.localStorage;
    globalThis.location = previous.location;
  }
});
