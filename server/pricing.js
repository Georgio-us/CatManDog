import { deliveryTiming, availableDeliverySlots } from '../checkout-model.js';
import { LOCAL_DELIVERY_FEE_CENTS, LOCAL_FREE_DELIVERY_FROM_CENTS,
  isMainlandPostcode } from '../shipping-policy.js';
import { salePriceDecision } from './sale-price-policy.js';

export const DELIVERY_FEE_CENTS = LOCAL_DELIVERY_FEE_CENTS;
export const FREE_DELIVERY_FROM_CENTS = LOCAL_FREE_DELIVERY_FROM_CENTS;

export function validateAddress(address, deliveryMode = 'slot') {
  if (!address || typeof address !== 'object') return 'Укажите адрес доставки';
  if (deliveryMode === 'national') {
    if (!String(address.city || '').trim()) return 'Укажите город доставки';
    if (!/^\d{5}$/.test(String(address.postcode || ''))) return 'Укажите почтовый индекс Испании';
    if (!isMainlandPostcode(address.postcode))
      return 'Сейчас отправляем заказы только по материковой Испании';
  } else {
    if (address.city !== 'València') return 'Для доставки в выбранный интервал укажите город Валенсия';
    if (!/^460\d{2}$/.test(String(address.postcode || ''))) return 'Укажите почтовый индекс в городе Валенсия';
  }
  if (!String(address.street || '').trim() || !String(address.building || '').trim()) return 'Укажите улицу и номер дома';
  return null;
}

export function validateDelivery(delivery, now = new Date()) {
  if (!delivery || typeof delivery !== 'object') return 'Укажите время доставки';
  if (delivery.mode === 'national') return null;
  if (delivery.mode === 'preorder') return null;
  if (delivery.mode === 'slot') return availableDeliverySlots(now).some(option =>
    option.date === delivery.date && option.window === delivery.window)
    ? null : 'Выберите доступный интервал доставки';
  const earliest = deliveryTiming(now);
  if (delivery.mode === 'soon') return earliest.todayAvailable ? null : 'Сегодня уже нет доступного времени';
  if (delivery.mode !== 'scheduled') return 'Выберите способ доставки';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(delivery.date || '')) ||
      !/^\d{2}:\d{2}$/.test(String(delivery.time || ''))) return 'Укажите дату и время';
  const [year, month, day] = delivery.date.split('-').map(Number);
  const [hour, minute] = delivery.time.split(':').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month ||
      check.getUTCDate() !== day || hour > 23 || minute > 59) return 'Некорректные дата или время';
  if (`${delivery.date}T${delivery.time}` < `${earliest.date}T${earliest.time}`) return 'Выберите время позже доступного ориентира';
  return null;
}

export function priceQuote(lines, variants, promo = null, shippingCents = null) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 50) throw new Error('Корзина пуста или слишком велика');
  const byId = new Map(variants.map(variant => [variant.variant_id, variant]));
  const seen = new Set();
  const items = lines.map(line => {
    const id = String(line?.variantId || '');
    const variant = byId.get(id);
    if (!variant || variant.product_id !== line.productId) throw new Error('Вариант товара не найден');
    if (seen.has(id)) throw new Error('Повторяющийся вариант в корзине');
    seen.add(id);
    if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > 99) throw new Error('Некорректное количество');
    const decision = salePriceDecision(variant);
    const price = decision.priceCents;
    if (!Number.isInteger(price) || price <= 0) throw new Error('Цена товара уточняется');
    const saleStatus = variant.sale_status;
    const sourceMode = saleStatus === 'preorder' ? 'source_on_demand' :
      saleStatus === 'available' ?
        (variant.availability === 'on_hand' &&
          variant.stock_quantity - (variant.reserved_quantity ?? 0) >= line.qty
          ? 'on_hand' : 'open_order') : variant.availability;
    return { productId: variant.product_id, variantId: id, name: variant.name, saleStatus,
      variantLabel: variant.label, qty: line.qty, unitPriceCents: price,
      lineCents: price * line.qty, sourceMode,
      orderable: saleStatus ? decision.accepted && saleStatus !== 'unavailable' :
        decision.accepted && variant.source_orderable !== false &&
        variant.sourcing_availability !== 'unavailable' && variant.supplier_matched !== false &&
        variant.availability !== 'unavailable' &&
        (variant.availability !== 'on_hand' ||
          variant.stock_quantity - (variant.reserved_quantity ?? 0) >= line.qty) };
  });
  const subtotalCents = items.reduce((sum, item) => sum + item.lineCents, 0);
  const percent = promo?.percent_off ?? 0;
  const discountCents = Math.round(subtotalCents * percent / 100);
  const productsCents = subtotalCents - discountCents;
  const deliveryCents = shippingCents === null
    ? productsCents >= FREE_DELIVERY_FROM_CENTS || promo?.free_delivery ? 0 : DELIVERY_FEE_CENTS
    : shippingCents;
  return { items, subtotalCents, discountCents, deliveryCents,
    totalCents: productsCents + deliveryCents,
    orderable: items.every(item => item.orderable),
    addressVerification: 'manual_required',
    deliverySlot: 'requested_not_reserved',
    promoCode: promo?.code || null };
}
