import test from 'node:test';
import assert from 'node:assert/strict';
import { consentCopy, installAnalytics, publicPageLocation } from '../analytics-consent.js';

test('analytics page locations omit searches and private routes', () => {
  const location = { origin: 'https://catmandog.es', pathname: '/catalogo/gatos/pienso-seco', hash: '', search: '?q=private' };
  assert.equal(publicPageLocation(location), 'https://catmandog.es/catalogo/gatos/pienso-seco');
  assert.equal(publicPageLocation({ ...location, pathname: '/', hash: '#/product/leonardo-1?ref=email' }), 'https://catmandog.es/#/product/leonardo-1');
  assert.equal(publicPageLocation({ ...location, pathname: '/', hash: '#/account?pet=Leo' }), null);
  assert.equal(publicPageLocation({ ...location, pathname: '/catalogo', hash: '#/account?pet=Leo' }), null);
  assert.equal(publicPageLocation({ ...location, pathname: '/', hash: '#/support?order=CMD-001' }), null);
  assert.equal(consentCopy('es').reject, 'Rechazar');
  assert.equal(consentCopy('ru').accept, 'Принять');
});

test('Google tag and commerce events start only after acceptance; rejected visits stay local', () => {
  const previous = { document: globalThis.document, window: globalThis.window, localStorage: globalThis.localStorage };
  const listeners = {};
  const scripts = [];
  const values = new Map();
  const element = () => ({ textContent: '', listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; }, focus() {} });
  const title = element(), description = element(), privacy = element();
  const accept = element(), reject = element(), settings = element();
  const panel = { hidden: true, querySelector(selector) {
    return { h2: title, p: description, a: privacy,
      '[data-analytics-accept]': accept, '[data-analytics-reject]': reject }[selector];
  } };
  let reloads = 0;
  globalThis.document = {
    cookie: '', head: { append(script) { scripts.push(script); } },
    createElement() { return {}; },
    querySelector(selector) { return { '#analytics-consent': panel, '#analytics-settings': settings }[selector]; }
  };
  globalThis.window = {
    location: { origin: 'https://catmandog.es', pathname: '/', hash: '', reload() { reloads++; } },
    addEventListener(type, fn) { listeners[type] = fn; }
  };
  globalThis.localStorage = {
    getItem(key) { return values.get(key) ?? null; }, setItem(key, value) { values.set(key, value); }
  };
  try {
    const analytics = installAnalytics('es');
    assert.equal(panel.hidden, false);
    assert.equal(scripts.length, 0);
    analytics.pageView();
    listeners['catmandog:commerce']({ detail: { event: 'add_to_cart', ecommerce: { items: [{ item_id: 'sku', email: 'private@example.com' }] } } });
    assert.equal(globalThis.window.dataLayer, undefined);

    reject.listeners.click();
    assert.equal(values.get('catmandog-analytics-consent-v1'), 'rejected');
    assert.equal(scripts.length, 0);
    settings.listeners.click();
    accept.listeners.click();
    assert.equal(values.get('catmandog-analytics-consent-v1'), 'accepted');
    assert.equal(scripts.length, 1);
    assert.match(scripts[0].src, /^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-/);
    listeners['catmandog:commerce']({ detail: { event: 'add_to_cart', ecommerce: { items: [{ item_id: 'sku', email: 'private@example.com', price: 12 }] } } });
    const commands = globalThis.window.dataLayer.map(args => [...args]);
    assert.deepEqual(commands[0].slice(0,2), ['consent','default']);
    assert.equal(commands[0][2].analytics_storage, 'denied');
    assert.equal(commands.some(args => args[0] === 'event' && args[1] === 'page_view'), true);
    assert.equal(commands.some(args => args[0] === 'event' && args[1] === 'add_to_cart'), true);
    assert.equal(JSON.stringify(commands).includes('private@example.com'), false);

    reject.listeners.click();
    assert.equal(reloads, 1);
    assert.equal(values.get('catmandog-analytics-consent-v1'), 'rejected');
  } finally {
    globalThis.document = previous.document;
    globalThis.window = previous.window;
    globalThis.localStorage = previous.localStorage;
  }
});
