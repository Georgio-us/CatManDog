export const LOCAL_FREE_DELIVERY_FROM_CENTS = 4900;
export const LOCAL_DELIVERY_FEE_CENTS = 399;
export const NATIONAL_LOWER_THRESHOLD_CENTS = 4900;
export const NATIONAL_FREE_DELIVERY_FROM_CENTS = 9900;
export const NATIONAL_LOW_ORDER_FEE_CENTS = 999;
export const NATIONAL_MID_ORDER_FEE_CENTS = 399;

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
