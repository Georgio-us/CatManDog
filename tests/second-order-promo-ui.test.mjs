import test from 'node:test';
import assert from 'node:assert/strict';

const coupon = { code: 'CMD-PAPER', percent: 10, status: 'ready' };
const cabinet = { version: 1, pets: [], activePetId: null, human: {}, orders: [],
  reminders: [], clinics: {}, trips: [], tripDrafts: {} };

function browser(url) {
  const saved = { fetch: globalThis.fetch, localStorage: globalThis.localStorage,
    location: globalThis.location, history: globalThis.history, FormData: globalThis.FormData };
  const local = new Map();
  globalThis.localStorage = { getItem: key => local.get(key) ?? null,
    setItem: (key, value) => local.set(key, value), removeItem: key => local.delete(key) };
  globalThis.location = { href: url, hash: new URL(url).hash };
  globalThis.history = { replaceState: (_state, _title, next) => {
    globalThis.location.href = String(next);
    globalThis.location.hash = new URL(String(next)).hash;
  } };
  globalThis.FormData = class { constructor(form) { this.values = form.values; }
    get(name) { return this.values[name]; } };
  return { local, restore: () => Object.assign(globalThis, saved) };
}

const uiHelpers = { escape: String, icon: () => '<svg></svg>', money: String,
  products: [], imageBlock: () => '', render: () => {}, notify: () => {}, getCart: () => [] };

test('the common QR applies a guest coupon immediately without registration', async () => {
  const session = browser('https://catmandog.es/?promo=CMD-PAPER#/catalog');
  const activations = [];
  globalThis.fetch = async (path, options) => {
    if (path === '/api/config') return Response.json({ accountsEnabled: false });
    if (path === '/api/coupon/activate') {
      activations.push(JSON.parse(options.body).code);
      return Response.json({ coupon });
    }
    throw new Error(`Unexpected route ${path}`);
  };
  try {
    const { createAccountUI } = await import('../account.js?shared-paper-guest');
    const ui = createAccountUI(uiHelpers);
    await ui.initialize();
    assert.deepEqual(activations, ['CMD-PAPER']);
    assert.equal(ui.promo().code, 'CMD-PAPER');
    assert.equal(globalThis.location.hash, '/coupon');
    assert.equal(globalThis.location.href.includes('promo='), false);
    assert.match(ui.page('/coupon', new URLSearchParams()), /Можно купить как гость/);
    assert.match(ui.page('/coupon', new URLSearchParams()), /Промокод принят: скидка 10% появится в корзине/);
    assert.doesNotMatch(ui.page('/coupon', new URLSearchParams()), /подтвердите email/);
    globalThis.location.hash = '#/catalog';
    await ui.handleLink();
    assert.equal(globalThis.location.hash, '#/catalog');
  } finally { session.restore(); }
});

test('an invalid scanned code shows a clear message on the coupon page', async () => {
  const session = browser('https://catmandog.es/?promo=BAD-CODE');
  globalThis.fetch = async path => {
    if (path === '/api/config') return Response.json({ accountsEnabled: false });
    if (path === '/api/coupon/activate') return Response.json(
      { error: 'Промокод недействителен' }, { status: 400 });
    throw new Error(`Unexpected route ${path}`);
  };
  try {
    const { createAccountUI } = await import('../account.js?shared-paper-invalid');
    const ui = createAccountUI(uiHelpers);
    await ui.initialize();
    assert.equal(globalThis.location.hash, '/coupon');
    assert.match(ui.page('/coupon', new URLSearchParams()), /role="alert">Промокод недействителен/);
  } finally { session.restore(); }
});

test('the same QR is saved to an existing account without a pet', async () => {
  const session = browser('https://catmandog.es/#/catalog?promo=CMD-PAPER');
  const claims = [];
  globalThis.fetch = async (path, options) => {
    if (path === '/api/config') return Response.json({ accountsEnabled: true });
    if (path === '/api/auth/me') return Response.json({ customer: {
      id: 'buyer-1', email: 'buyer@example.com' } });
    if (path === '/api/me/cabinet') return Response.json({ revision: 0, cabinet });
    if (path === '/api/me/promo' && options.method === 'GET') return Response.json({ coupon: null });
    if (path === '/api/me/promo' && options.method === 'POST') {
      claims.push(JSON.parse(options.body).code);
      return Response.json({ coupon });
    }
    throw new Error(`Unexpected route ${path}`);
  };
  try {
    const { createAccountUI } = await import('../account.js?shared-paper-account');
    const ui = createAccountUI(uiHelpers);
    await ui.initialize();
    assert.deepEqual(claims, ['CMD-PAPER']);
    assert.equal(ui.promo().code, 'CMD-PAPER');
    assert.equal(globalThis.location.hash, '/coupon');
    assert.equal(session.local.has('catmandog-pending-promo'), false);
    assert.match(ui.page('/account', new URLSearchParams()), /У вас есть промокод\?/);
  } finally { session.restore(); }
});

test('a guest can enter the printed code manually', async () => {
  const session = browser('https://catmandog.es/#/coupon');
  globalThis.fetch = async (path, options) => {
    if (path === '/api/config') return Response.json({ accountsEnabled: false });
    if (path === '/api/coupon/activate') return Response.json({ coupon });
    throw new Error(`Unexpected route ${path}`);
  };
  try {
    const { createAccountUI } = await import('../account.js?shared-paper-manual');
    const ui = createAccountUI(uiHelpers);
    await ui.initialize();
    assert.match(ui.page('/coupon', new URLSearchParams()), /Применить купон/);
    await ui.submit({ dataset: { accountForm: 'coupon-activate' },
      values: { code: 'CMD-PAPER' }, isConnected: true });
    assert.equal(ui.promo().code, 'CMD-PAPER');
  } finally { session.restore(); }
});

test('optional registration keeps the shared code until the account is created', async () => {
  const session = browser('https://catmandog.es/?promo=CMD-PAPER#/catalog');
  let registration;
  globalThis.fetch = async (path, options) => {
    if (path === '/api/config') return Response.json({ accountsEnabled: true, emailEnabled: true });
    if (path === '/api/auth/me') return Response.json({ error: 'Войдите в кабинет' }, { status: 401 });
    if (path === '/api/coupon/activate') return Response.json({ coupon });
    if (path === '/api/auth/register') {
      registration = JSON.parse(options.body);
      return Response.json({ pending: true, email: registration.email }, { status: 201 });
    }
    throw new Error(`Unexpected route ${path}`);
  };
  try {
    const { createAccountUI } = await import('../account.js?shared-paper-register');
    const ui = createAccountUI(uiHelpers);
    await ui.initialize();
    const form = { dataset: { accountForm: 'register' }, values: {
      email: 'new@example.com', password: 'long-enough-password',
      passwordConfirm: 'long-enough-password', name: 'Новый клиент'
    }, querySelector: () => ({ disabled: false }), isConnected: true };
    await ui.submit(form);
    assert.equal(registration.promoCode, 'CMD-PAPER');
    assert.equal(globalThis.location.hash, '/account/check-email');
  } finally { session.restore(); }
});
