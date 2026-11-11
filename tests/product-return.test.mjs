import assert from 'node:assert/strict';
import test from 'node:test';
import { rememberProductOrigin, productOrigin, requestProductReturn,
  takeProductReturnScroll } from '../product-return.js';

const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key) };
};

test('product opened from a collection returns to that collection at its former scroll position', () => {
  const session = storage();
  rememberProductOrigin('yagu-7815320', { url: '/#/picks/cat', path: '/picks/cat',
    scrollY: 1180 }, session);
  const origin = productOrigin('yagu-7815320', session);
  assert.equal(origin?.url, '/#/picks/cat');
  assert.equal(productOrigin('rc-sterilised', session), null);
  requestProductReturn(origin, session);
  assert.equal(takeProductReturnScroll('/#/catalog', session), null);
  assert.equal(takeProductReturnScroll('/#/picks/cat', session), 1180);
  assert.equal(takeProductReturnScroll('/#/picks/cat', session), null);
});

test('product return never saves an external destination', () => {
  const session = storage();
  rememberProductOrigin('yagu-7815320', { url: '//example.com', path: '/picks/cat',
    scrollY: 20 }, session);
  assert.equal(productOrigin('yagu-7815320', session), null);
});
