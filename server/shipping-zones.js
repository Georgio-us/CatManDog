// A delivery zone describes where the parcel goes, not when a SKU is ready.
// Rates and promises are deliberately kept out of this module.
const normalizedCity = city => String(city || '').trim().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function shippingZone(address) {
  const postcode = String(address?.postcode || '').trim();
  if (!/^\d{5}$/.test(postcode)) return 'invalid';
  const province = Number(postcode.slice(0, 2));
  if (province < 1 || province > 52) return 'invalid';
  if (province === 7) return 'balearic';
  if (province === 35 || province === 38) return 'canary';
  if (province === 51 || province === 52) return 'ceuta_melilla';
  if (/^460\d{2}$/.test(postcode) && normalizedCity(address?.city) === 'valencia')
    return 'valencia_local';
  return 'peninsula';
}

export function hasNationalDeliveryRate(rates, zone, parcelClass) {
  if (zone !== 'peninsula' || !parcelClass) return false;
  const cents = rates?.[parcelClass];
  return Number.isInteger(cents) && cents >= 0;
}
