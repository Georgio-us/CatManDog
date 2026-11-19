export const LOCAL_FREE_DELIVERY_FROM_CENTS = 4900;
export const LOCAL_DELIVERY_FEE_CENTS = 399;
export const NATIONAL_LOWER_THRESHOLD_CENTS = 4900;
export const NATIONAL_FREE_DELIVERY_FROM_CENTS = 9900;
export const NATIONAL_LOW_ORDER_FEE_CENTS = 999;
export const NATIONAL_MID_ORDER_FEE_CENTS = 399;

const plain = value => String(value || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function swissStreet(value) {
  const name = plain(value).replace(/^(?:c[./]?|calle|carrer)\s+(?:de\s+)?/, '')
    .replace(/^de\s+/, '').replace(/[^a-z]/g, '');
  if (['suissa', 'suiza', 'suisa'].includes(name)) return true;
  // One wrong, missing or extra letter, or two adjacent letters transposed.
  return ['suissa', 'suiza'].some(target => {
    if (Math.abs(name.length - target.length) > 1) return false;
    if (name.length === target.length) {
      const differing = [...name].flatMap((letter, index) =>
        letter === target[index] ? [] : [index]);
      if (differing.length === 2 && differing[1] === differing[0] + 1 &&
          name[differing[0]] === target[differing[1]] &&
          name[differing[1]] === target[differing[0]]) return true;
    }
    let errors = 0;
    for (let i = 0, j = 0; i < name.length && j < target.length;) {
      if (name[i] === target[j]) { i++; j++; continue; }
      if (++errors > 1) return false;
      if (name.length > target.length) i++;
      else if (name.length < target.length) j++;
      else { i++; j++; }
    }
    return true;
  });
}

export function isFreeLocalDeliveryAddress(address) {
  return String(address?.postcode || '').trim() === '46024' &&
    plain(address?.city).replace(/[^a-z]/g, '') === 'valencia' &&
    swissStreet(address?.street) && /^14$/.test(String(address?.building || '').trim());
}

export function isMainlandPostcode(value) {
  const postcode = String(value || '').trim();
  if (!/^\d{5}$/.test(postcode)) return false;
  const province = Number(postcode.slice(0, 2));
  return province >= 1 && province <= 50 && ![7, 35, 38].includes(province);
}

export function nationalDeliveryFeeCents(productsCents, freeDelivery = false) {
  if (!Number.isInteger(productsCents) || productsCents < 0)
    throw new Error('Некорректная стоимость товаров');
  if (freeDelivery || productsCents >= NATIONAL_FREE_DELIVERY_FROM_CENTS) return 0;
  return productsCents >= NATIONAL_LOWER_THRESHOLD_CENTS
    ? NATIONAL_MID_ORDER_FEE_CENTS : NATIONAL_LOW_ORDER_FEE_CENTS;
}
