import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyDeliveryAddress } from '../server/address-validation.js';

const candidate = (overrides = {}) => ({ type: 'portal', address: 'CALLE ANDARELLA 2 A, València (Xirivella)',
  portalNumber: 2, extension: 'A', postalCode: '46950', muni: 'Xirivella', muniCode: null,
  poblacion: 'València', provinceCode: '46', lat: 39.462769233711825,
  lng: -0.41441587181456224, ...overrides });
const response = candidates => async () => ({ ok: true, json: async () => candidates });
const address = { city: 'Xirivella', postcode: '46950', street: 'Andarella', building: '2A' };

test('a nearby Xirivella address gets local delivery and its actual municipality', async () => {
  const result = await verifyDeliveryAddress(address, 'local', response([candidate({ muniCode: '46110' })]));
  assert.deepEqual(result, { city: 'Xirivella', postcode: '46950', local: true });
  const abbreviated = await verifyDeliveryAddress({ ...address, street: 'C/ Andarella' },
    'local', response([candidate()]));
  assert.equal(abbreviated.local, true);
  const cityLabel = await verifyDeliveryAddress({ ...address, city: 'València' },
    'local', response([candidate()]));
  assert.equal(cityLabel.local, true);
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

test('a bilingual official street name accepts either listed name', async () => {
  const portal = candidate({ address: 'CALLE PEU DE LA CREU / PIE DE LA CRUZ 12, València',
    portalNumber: 12, extension: null, postalCode: '46001', muni: 'València',
    poblacion: 'València', lat: 39.4734018, lng: -0.3809343 });
  const base = { city: 'València', postcode: '46001', building: '12' };
  for (const street of ['Calle Peu de la Creu', 'Calle Pie de la Cruz']) {
    assert.equal((await verifyDeliveryAddress({ ...base, street }, 'local', response([portal]))).local,
      true);
  }
  await assert.rejects(verifyDeliveryAddress({ ...base, street: 'Calle Colón' },
    'local', response([portal])), /не совпали/);
});

test('local delivery covers the core districts and excludes Pobles del Nord', async () => {
  for (const [name, lat, lng] of [
    ['Patraix', 39.45779268, -0.40064487],
    ['Jesús', 39.44993065, -0.39354619],
    ['Benimaclet', 39.48609007, -0.35629424],
    ['Benicalap', 39.49445683, -0.39129900]
  ]) {
    const destination = { city: 'València', postcode: '46014', street: name, building: '2' };
    const portal = candidate({ address: `CALLE ${name.toUpperCase()} 2, València`,
      extension: null, postalCode: '46014', muni: 'València', portalNumber: 2, lat, lng });
    assert.equal((await verifyDeliveryAddress(destination, 'local', response([portal]))).local, true,
      name);
  }
  const northern = { city: 'València', postcode: '46113', street: 'Pobles Nord', building: '2' };
  const portal = candidate({ address: 'CALLE POBLES NORD 2, València', extension: null,
    postalCode: '46113', muni: 'València', lat: 39.55817627, lng: -0.30377495 });
  await assert.rejects(verifyDeliveryAddress(northern, 'local', response([portal])), /вне зоны/);
});

test('national delivery can use distant verified addresses', async () => {
  const far = candidate({ address: 'CALLE ANDARELLA 2, Gandia', postalCode: '46701',
    muni: 'Gandia', poblacion: 'Gandia', lat: 38.969, lng: -0.185 });
  const destination = { ...address, city: 'Gandia', postcode: '46701' };
  await assert.rejects(verifyDeliveryAddress(destination, 'local', response([far])), /fuera|вне зоны/);
  assert.equal((await verifyDeliveryAddress(destination, 'national', response([far]))).local, false);
});

test('island, Ceuta and Melilla addresses pass national verification', async () => {
  for (const [city, postcode, provinceCode] of [
    ['Palma', '07001', '07'], ['Las Palmas de Gran Canaria', '35001', '35'],
    ['Santa Cruz de Tenerife', '38001', '38'], ['Ceuta', '51001', '51'],
    ['Melilla', '52001', '52']
  ]) {
    const destination = { city, postcode, street: 'Mayor', building: '2' };
    const portal = candidate({ address: 'CALLE MAYOR 2', extension: null,
      postalCode: postcode, muni: city, poblacion: city, provinceCode });
    assert.equal((await verifyDeliveryAddress(destination, 'national', response([portal]))).local, false);
  }
});

test('Paterna and Torrent are not treated as local solely because they are nearby', async () => {
  for (const [city, postcode, lat, lng] of [
    ['Paterna', '46980', 39.502, -0.44],
    ['Torrent', '46900', 39.44, -0.47]
  ]) {
    const destination = { city, postcode, street: 'Ejemplo', building: '2' };
    const portal = candidate({ address: `CALLE EJEMPLO 2, ${city}`, extension: null,
      postalCode: postcode, muni: city, poblacion: city, lat, lng });
    await assert.rejects(verifyDeliveryAddress(destination, 'local', response([portal])), /вне зоны/);
    assert.equal((await verifyDeliveryAddress(destination, 'national', response([portal]))).local,
      false);
  }
});
