import test from 'node:test';
import assert from 'node:assert/strict';
import { shippingZone, hasNationalDeliveryRate } from '../server/shipping-zones.js';

test('local delivery requires both a Valencia city and a local postcode', () => {
  assert.equal(shippingZone({ city: 'València', postcode: '46001' }), 'valencia_local');
  assert.equal(shippingZone({ city: 'Valencia', postcode: '46025' }), 'valencia_local');
  assert.equal(shippingZone({ city: 'Paterna', postcode: '46980' }), 'peninsula');
  assert.equal(shippingZone({ city: 'Madrid', postcode: '28001' }), 'peninsula');
});

test('islands and autonomous cities never inherit mainland shipping', () => {
  assert.equal(shippingZone({ postcode: '07001' }), 'balearic');
  assert.equal(shippingZone({ postcode: '35001' }), 'canary');
  assert.equal(shippingZone({ postcode: '38001' }), 'canary');
  assert.equal(shippingZone({ postcode: '51001' }), 'ceuta_melilla');
  assert.equal(shippingZone({ postcode: '52001' }), 'ceuta_melilla');
  assert.equal(shippingZone({ postcode: '00001' }), 'invalid');
  assert.equal(shippingZone({ postcode: '99999' }), 'invalid');
});

test('national delivery needs an explicitly configured rate for its parcel class', () => {
  assert.equal(hasNationalDeliveryRate({}, 'peninsula', 'small'), false);
  assert.equal(hasNationalDeliveryRate({ small: 499 }, 'peninsula', 'small'), true);
  assert.equal(hasNationalDeliveryRate({ small: 499 }, 'canary', 'small'), false);
});
