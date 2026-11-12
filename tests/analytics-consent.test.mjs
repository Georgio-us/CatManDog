import test from 'node:test';
import assert from 'node:assert/strict';
import { consentCopy, installAnalytics, publicPageLocation, visitSource } from '../analytics-consent.js';

test('analytics page locations omit searches and private routes', () => {
  const location = { origin: 'https://catmandog.es', pathname: '/catalogo/gatos/pienso-seco', hash: '', search: '?q=private' };
  assert.equal(publicPageLocation(location), 'https://catmandog.es/catalogo/gatos/pienso-seco');
  assert.equal(publicPageLocation({ ...location, pathname: '/', hash: '#/product/leonardo-1?ref=email' }), 'https://catmandog.es/#/product/leonardo-1');
  assert.equal(publicPageLocation({ ...location, pathname: '/', hash: '#/account?pet=Leo' }), null);
  assert.equal(publicPageLocation({ ...location, pathname: '/catalogo', hash: '#/account?pet=Leo' }), null);
  assert.equal(publicPageLocation({ ...location, pathname: '/', hash: '#/support?order=CMD-001' }), null);
  assert.equal(publicPageLocation({ ...location, pathname: '/producto/leonardo-adult', hash: '' }), 'https://catmandog.es/producto/leonardo-adult');
  assert.equal(visitSource('https://www.google.es/search?q=private', location.origin), 'search');
  assert.equal(visitSource('https://www.instagram.com/catmandog', location.origin), 'social');
  assert.equal(visitSource('https://catmandog.es/catalogo', location.origin), 'internal');
  assert.equal(visitSource('', location.origin), 'direct');
  assert.equal(consentCopy('es').reject, 'Rechazar');
  assert.equal(consentCopy('ru').accept, 'Принять');
});

test('Google tag and commerce events start only after acceptance; rejected visits stay local', async () => {
  const previous = { document: globalThis.document, window: globalThis.window,
    localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage };
  const listeners = {};
  const scripts = [];
  const values = new Map();
  const sessionValues = new Map();
  const visitRequests = [];
  const element = () => ({ textContent: '', listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; }, focus() {} });
  const title = element(), description = element(), privacy = element();
  const accept = element(), reject = element(), settings = element();
  const panel = { hidden: true, querySelector(selector) {
    return { h2: title, p: description, a: privacy,
      '[data-analytics-accept]': accept, '[data-analytics-reject]': reject }[selector];
  } };
  let reloads = 0;
  globalThis.document = {
    cookie: '', referrer: 'https://www.google.es/search?q=private', head: { append(script) { scripts.push(script); } },
    createElement() { return {}; },
    querySelector(selector) { return { '#analytics-consent': panel, '#analytics-settings': settings }[selector]; }
  };
  globalThis.window = {
    location: { origin: 'https://catmandog.es', pathname: '/', hash: '', reload() { reloads++; } },
    fetch(url, options) { visitRequests.push({ url, options }); return Promise.resolve({ ok: true }); },
    addEventListener(type, fn) { listeners[type] = fn; }
  };
  globalThis.localStorage = {
    getItem(key) { return values.get(key) ?? null; }, setItem(key, value) { values.set(key, value); }
  };
  globalThis.sessionStorage = {
    getItem(key) { return sessionValues.get(key) ?? null; },
    setItem(key, value) { sessionValues.set(key, value); }
  };
  try {
    const analytics = installAnalytics('es');
    assert.equal(panel.hidden, false);
    assert.equal(scripts.length, 0);
    analytics.pageView();
    assert.equal(visitRequests.length, 0);
    listeners['catmandog:commerce']({ detail: { event: 'add_to_cart', ecommerce: { items: [{ item_id: 'sku', email: 'private@example.com' }] } } });
    assert.equal(globalThis.window.dataLayer, undefined);

    reject.listeners.click();
    assert.equal(values.get('catmandog-analytics-consent-v1'), 'rejected');
    assert.equal(scripts.length, 0);
    assert.equal(visitRequests.length, 0);
    settings.listeners.click();
    accept.listeners.click();
    assert.equal(values.get('catmandog-analytics-consent-v1'), 'accepted');
    assert.equal(scripts.length, 1);
    assert.equal(visitRequests.length, 1);
    assert.equal(visitRequests[0].url, '/api/telemetry/visit');
    assert.equal(visitRequests[0].options.method, 'POST');
    assert.deepEqual(JSON.parse(visitRequests[0].options.body), { page: '/', source: 'search' });
    globalThis.window.location.hash = '#/product/leonardo-1';
    analytics.pageView();
    assert.equal(visitRequests.length, 1);
    assert.match(scripts[0].src, /^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-/);
    listeners['catmandog:commerce']({ detail: { event: 'add_to_cart', ecommerce: { items: [{ item_id: 'sku', email: 'private@example.com', price: 12 }] } } });
    listeners['catmandog:commerce']({ detail: { event: 'purchase', ecommerce: {
      transaction_id: 'CMD-10001', value: 12, shipping: 3.99,
      items: [{ item_id: 'sku', item_name: 'Food', quantity: 1, price: 12, email: 'private@example.com' }] } } });
    const commands = globalThis.window.dataLayer.map(args => [...args]);
    assert.deepEqual(commands[0].slice(0,2), ['consent','default']);
    assert.equal(commands[0][2].analytics_storage, 'denied');
    assert.equal(commands.some(args => args[0] === 'event' && args[1] === 'page_view'), true);
    assert.equal(commands.some(args => args[0] === 'event' && args[1] === 'add_to_cart'), true);
    const purchase = commands.find(args => args[0] === 'event' && args[1] === 'purchase');
    assert.equal(purchase[2].transaction_id, 'CMD-10001');
    assert.equal(purchase[2].value, 12);
    assert.equal(purchase[2].shipping, 3.99);
    assert.equal(JSON.stringify(commands).includes('private@example.com'), false);

    reject.listeners.click();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(reloads, 1);
    assert.equal(values.get('catmandog-analytics-consent-v1'), 'rejected');
  } finally {
    globalThis.document = previous.document;
    globalThis.window = previous.window;
    globalThis.localStorage = previous.localStorage;
    globalThis.sessionStorage = previous.sessionStorage;
  }
});
