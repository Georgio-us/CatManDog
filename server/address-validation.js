import { isMainlandPostcode } from '../shipping-policy.js';

// CartoCiudad is the Spanish public address register (CC BY 4.0).
// Check the complete address: a postcode prefix alone cannot establish the delivery zone.
const GEOCODER_URL = 'https://www.cartociudad.es/geocoder/api/geocoder/candidates';
const VALENCIA_ORIGIN = { lat: 39.45282181, lng: -0.33749143 };
const LOCAL_RADIUS_KM = 20;
const cache = new Map();

const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const streetName = value => normalized(value).split(' ').filter(word =>
  !['c', 'cl', 'calle', 'carrer', 'avenida', 'avinguda', 'av', 'plaza', 'placa', 'passeig',
    'paseo', 'de', 'del', 'la', 'las', 'el', 'els', 'les', 'los', 'l', 'd'].includes(word)).join(' ');
const error = message => Object.assign(new Error(message), { status: 400 });

function distanceKm(a, b) {
  const radians = degrees => degrees * Math.PI / 180;
  const lat = radians(b.lat - a.lat);
  const lng = radians(b.lng - a.lng);
  const arc = Math.sin(lat / 2) ** 2 + Math.cos(radians(a.lat)) *
    Math.cos(radians(b.lat)) * Math.sin(lng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
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
    return streetName(candidateStreet) === streetName(street) &&
      [candidate.muni, candidate.poblacion].some(place => normalized(place) === normalized(city));
  });
  if (!matched) throw error('Улица, дом, город и почтовый индекс не совпали. Проверьте адрес');
  if (mode === 'local' && (matched.provinceCode !== '46' ||
      distanceKm(VALENCIA_ORIGIN, { lat: Number(matched.lat), lng: Number(matched.lng) }) > LOCAL_RADIUS_KM))
    throw error('Адрес вне зоны местной доставки. Выберите доставку по Испании');

  const value = { city: matched.muni || city, postcode, local: matched.provinceCode === '46' &&
    distanceKm(VALENCIA_ORIGIN, { lat: Number(matched.lat), lng: Number(matched.lng) }) <= LOCAL_RADIUS_KM };
  if (cache.size > 500) cache.clear();
  cache.set(key, { value, expires: Date.now() + 24 * 60 * 60 * 1000 });
  return value;
}
