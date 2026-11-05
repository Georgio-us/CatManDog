import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { once } from 'node:events';
import { serveStatic } from '../server/http.js';
import { createAccountStore } from '../account-store.js';

test('permanent pet URL serves the storefront directly', async () => {
  const response = new PassThrough();
  let status;
  let body = '';
  response.setEncoding('utf8');
  response.on('data', chunk => { body += chunk; });
  response.writeHead = code => { status = code; };
  const finished = once(response, 'finish');
  await serveStatic({ method: 'GET' }, response, '/pet');
  await finished;
  assert.equal(status, 200);
  assert.match(body, /<script type="module" src="\/app\.js/);
});

test('postcard route opens account onboarding or editable profile by pet state', async () => {
  const previous = { storage: globalThis.localStorage, location: globalThis.location };
  const entries = new Map();
  globalThis.localStorage = { getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
  globalThis.location = { pathname: '/pet', hash: '', href: 'https://catmandog.es/pet' };
  try {
    const { createAccountUI } = await import('../account.js?welcome-card-test');
    const ui = createAccountUI({ escape: String, icon: () => '<svg></svg>', money: String,
      products: [], imageBlock: () => '', render: () => {}, notify: () => {} });
    assert.match(ui.page('/pet', new URLSearchParams()), /Открываем профиль питомца/);
    const snapshot = createAccountStore(localStorage).get();
    ui.store.connectRemote(snapshot, 0, async () => ({ revision: 1 }));
    assert.match(ui.page('/pet', new URLSearchParams()), /data-account-form="join"/);
    ui.store.savePet({ name: 'Лео', species: 'cat', food: 'Royal Canin Sterilised' });
    const profile = ui.page('/pet', new URLSearchParams());
    assert.match(profile, /data-account-form="profile"/);
    assert.match(profile, /Royal Canin Sterilised/);
    assert.doesNotMatch(profile, /data-account-form="join"/);
  } finally {
    globalThis.localStorage = previous.storage;
    globalThis.location = previous.location;
  }
});

test('email verification opened in another tab returns to the pet path', async () => {
  const previous = { storage: globalThis.localStorage, location: globalThis.location,
    fetch: globalThis.fetch };
  const entries = new Map();
  globalThis.localStorage = { getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
  globalThis.location = { pathname: '/', hash: '#/account/verify?token=' + 'a'.repeat(64) + '&return=pet',
    href: 'https://catmandog.es/#/account/verify?token=' + 'a'.repeat(64) + '&return=pet' };
  const blankCabinet = createAccountStore(localStorage).get();
  globalThis.fetch = async path => {
    if (path === '/api/config') return Response.json({ accountsEnabled: true, emailEnabled: true });
    if (path === '/api/auth/verify') return Response.json({ promoCodeProcessed: false });
    if (path === '/api/auth/me') return Response.json({ customer: { id: 'customer-1' } });
    if (path === '/api/me/cabinet') return Response.json({ cabinet: blankCabinet, revision: 0 });
    if (path === '/api/me/promo') return Response.json({ coupon: null });
    throw new Error(`Unexpected request ${path}`);
  };
  try {
    const { createAccountUI } = await import('../account.js?welcome-card-email-test');
    const ui = createAccountUI({ escape: String, icon: () => '', money: String,
      products: [], imageBlock: () => '', render: () => {}, notify: () => {} });
    await ui.initialize();
    assert.equal(location.hash, '/pet');
    assert.match(ui.page('/pet', new URLSearchParams()), /data-account-form="join"/);
  } finally {
    globalThis.localStorage = previous.storage;
    globalThis.location = previous.location;
    globalThis.fetch = previous.fetch;
  }
});
