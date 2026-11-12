import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyDeliveryAddress } from '../server/address-validation.js';

const candidate = (overrides = {}) => ({ type: 'portal', address: 'CALLE ANDARELLA 2, València (Xirivella)',
  portalNumber: 2, extension: null, postalCode: '46014', muni: 'Xirivella',
  poblacion: 'València', provinceCode: '46', lat: 39.46222, lng: -0.41417, ...overrides });
const response = candidates => async () => ({ ok: true, json: async () => candidates });
const address = { city: 'València', postcode: '46014', street: 'Andarella', building: '2' };

test('a nearby Xirivella address gets local delivery and its actual municipality', async () => {
  const result = await verifyDeliveryAddress(address, 'local', response([candidate()]));
  assert.deepEqual(result, { city: 'Xirivella', postcode: '46014', local: true });
  const abbreviated = await verifyDeliveryAddress({ ...address, street: 'C/ Andarella' },
    'local', response([candidate()]));
  assert.equal(abbreviated.local, true);
});

test('a false postcode or city cannot pass address verification', async () => {
  await assert.rejects(verifyDeliveryAddress({ ...address, postcode: '46001' }, 'local', response([])),
    /не совпали/);
  await assert.rejects(verifyDeliveryAddress({ ...address, city: 'Madrid' }, 'national', response([candidate()])),
    /не совпали/);
});

test('street and house number must match the official address', async () => {
  await assert.rejects(verifyDeliveryAddress({ ...address, street: 'Otra' }, 'local', response([candidate()])),
    /не совпали/);
  await assert.rejects(verifyDeliveryAddress({ ...address, building: '3' }, 'local', response([candidate()])),
    /не совпали/);
});

test('local delivery depends on coordinates; national delivery can use distant verified addresses', async () => {
  const far = candidate({ address: 'CALLE ANDARELLA 2, Gandia', postalCode: '46701',
    muni: 'Gandia', poblacion: 'Gandia', lat: 38.969, lng: -0.185 });
  const destination = { ...address, city: 'Gandia', postcode: '46701' };
  await assert.rejects(verifyDeliveryAddress(destination, 'local', response([far])), /fuera|вне зоны/);
  assert.equal((await verifyDeliveryAddress(destination, 'national', response([far]))).local, false);
});
