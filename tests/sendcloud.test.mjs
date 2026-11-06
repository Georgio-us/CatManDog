import test from 'node:test';
import assert from 'node:assert/strict';
import { sendcloudReady, sendcloudShippingOptions, shippingQuoteInput } from '../server/sendcloud.js';

test('Sendcloud quote uses measured parcels, Spanish addresses, and server-only keys', async () => {
  const env = { SENDCLOUD_PUBLIC_KEY: 'public', SENDCLOUD_SECRET_KEY: 'private' };
  assert.equal(sendcloudReady(env), true);
  let called = false;
  const options = await sendcloudShippingOptions({ postalCode: '28001', parcels: [
    { weightKg: 2, lengthCm: 30, widthCm: 20, heightCm: 15 }
  ] }, async (url, init) => {
    called = true;
    assert.equal(url, 'https://panel.sendcloud.sc/api/v3/shipping-options');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.Authorization, 'Basic ' + Buffer.from('public:private').toString('base64'));
    const body = JSON.parse(init.body);
    assert.equal(body.from_address.postal_code, '46024');
    assert.equal(body.to_address.postal_code, '28001');
    assert.equal(body.parcels[0].weight.value, '2');
    assert.equal(body.calculate_quotes, true);
    return { ok: true, json: async () => ({ data: [{ code: 'correos' }] }) };
  }, env);
  assert.equal(called, true);
  assert.deepEqual(options, [{ code: 'correos' }]);
});

test('Sendcloud quote rejects missing dimensions before any API request', async () => {
  assert.throws(() => shippingQuoteInput({ postalCode: '46024', parcels: [{ weightKg: 2 }] }),
    /вес и размеры/);
});
