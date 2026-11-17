import { isMainlandPostcode } from '../shipping-policy.js';
import { readFileSync } from 'node:fs';

// CartoCiudad is the Spanish public address register (CC BY 4.0).
// Check the complete address: a postcode prefix alone cannot establish the delivery zone.
const GEOCODER_URL = 'https://www.cartociudad.es/geocoder/api/geocoder/candidates';
const urbanDistricts = JSON.parse(readFileSync(new URL('./local-delivery-districts.json', import.meta.url),
  'utf8')).features;
const cache = new Map();

const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const streetName = value => normalized(value).split(' ').filter(word =>
  !['c', 'cl', 'calle', 'carrer', 'avenida', 'avinguda', 'av', 'plaza', 'placa', 'passeig',
    'paseo', 'de', 'del', 'la', 'las', 'el', 'els', 'les', 'los', 'l', 'd'].includes(word)).join(' ');
const error = message => Object.assign(new Error(message), { status: 400 });

function pointInRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j];
    const b = ring[i];
    const cross = (point[0] - a[0]) * (b[1] - a[1]) - (point[1] - a[1]) * (b[0] - a[0]);
    if (Math.abs(cross) < 1e-12 && point[0] >= Math.min(a[0], b[0]) &&
        point[0] <= Math.max(a[0], b[0]) && point[1] >= Math.min(a[1], b[1]) &&
        point[1] <= Math.max(a[1], b[1])) return true;
    if ((a[1] > point[1]) !== (b[1] > point[1]) &&
        point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function inUrbanDistrict(point) {
  return urbanDistricts.some(({ geometry }) => geometry.type === 'Polygon' &&
    pointInRing(point, geometry.coordinates[0]) &&
    !geometry.coordinates.slice(1).some(hole => pointInRing(point, hole)));
}

function localDeliveryZone(candidate) {
  if (candidate.provinceCode !== '46') return false;
  // Xirivella is included as a nearby service area even though it is another municipality.
  if (String(candidate.muniCode) === '46110' ||
      ['xirivella', 'chirivella'].includes(normalized(candidate.muni))) return true;
  return inUrbanDistrict([Number(candidate.lng), Number(candidate.lat)]);
}

export async function verifyDeliveryAddress(address, mode, fetchImpl = fetch) {
  const postcode = String(address?.postcode || '').trim();
  const city = String(address?.city || '').trim();
  const street = String(address?.street || '').trim();
  const building = String(address?.building || '').trim();
  const house = building.match(/^(\d+)\s*([a-z])?$/i);
  if (!/^\d{5}$/.test(postcode) || !city || !street || !house)
    throw error('Проверьте город, улицу, номер дома и почтовый индекс');
  if (!isMainlandPostcode(postcode)) throw error('Сейчас доставляем только по материковой Испании');
  const key = [postcode, normalized(city), streetName(street), normalized(building), mode].join('|');
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  const url = new URL(GEOCODER_URL);
  url.searchParams.set('q', `${street} ${building}`);
  url.searchParams.set('cod_postal_filter', postcode);
  url.searchParams.set('limit', '20');
  let candidates;
  try {
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error(`CartoCiudad ${response.status}`);
    candidates = await response.json();
    if (!Array.isArray(candidates)) throw new Error('Unexpected CartoCiudad response');
  } catch {
    throw Object.assign(new Error('Не удалось проверить адрес. Попробуйте ещё раз через минуту'), { status: 503 });
  }

  const matched = candidates.find(candidate => {
    if (candidate.type !== 'portal' || String(candidate.postalCode) !== postcode ||
        Number(candidate.portalNumber) !== Number(house[1]) ||
        !Number.isFinite(Number(candidate.lat)) || !Number.isFinite(Number(candidate.lng))) return false;
    if (house[2] && normalized(candidate.extension) !== normalized(house[2])) return false;
    const candidateStreet = String(candidate.address || '').split(',')[0]
      .replace(/\s+\d+(?:\s+[a-z])?$/i, '');
    return candidateStreet.split(/\s*\/\s*/).some(alias => streetName(alias) === streetName(street)) &&
      [candidate.muni, candidate.poblacion].some(place => normalized(place) === normalized(city));
  });
  if (!matched) throw error('Улица, дом, город и почтовый индекс не совпали. Проверьте адрес');
  const local = localDeliveryZone(matched);
  if (mode === 'local' && !local)
    throw error('Адрес вне зоны местной доставки. Выберите доставку по Испании или напишите нам для проверки адреса');

  const value = { city: matched.muni || city, postcode, local };
  if (cache.size > 500) cache.clear();
  cache.set(key, { value, expires: Date.now() + 24 * 60 * 60 * 1000 });
  return value;
}
