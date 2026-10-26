import { deliveryTiming } from '../checkout-model.js';

export const DELIVERY_FEE_CENTS = 399;
export const FREE_DELIVERY_FROM_CENTS = 4900;

export function validateAddress(address) {
  if (!address || typeof address !== 'object') return 'Укажите адрес доставки';
  if (address.city !== 'València') return 'Пока доставляем только по городу Валенсия';
  if (!/^460\d{2}$/.test(String(address.postcode || ''))) return 'Укажите почтовый индекс в городе Валенсия';
  if (!String(address.street || '').trim() || !String(address.building || '').trim()) return 'Укажите улицу и номер дома';
  return null;
}

export function validateDelivery(delivery, now = new Date()) {
  if (!delivery || typeof delivery !== 'object') return 'Укажите время доставки';
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

export function priceQuote(lines, variants, promo = null) {
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
    const price = variant.price_confirmed
      ? variant.price_override_cents ?? variant.source_price_cents
      : variant.source_price_cents;
    if (!Number.isInteger(price) || price <= 0) throw new Error('Цена товара ещё не подтверждена');
    return { productId: variant.product_id, variantId: id, name: variant.name,
      variantLabel: variant.label, qty: line.qty, unitPriceCents: price,
      lineCents: price * line.qty, sourceMode: variant.availability,
      orderable: !!variant.price_confirmed && variant.source_orderable !== false && variant.availability !== 'unavailable' &&
        (variant.availability !== 'on_hand' ||
          variant.stock_quantity - (variant.reserved_quantity ?? 0) >= line.qty) };
  });
  const subtotalCents = items.reduce((sum, item) => sum + item.lineCents, 0);
  const percent = promo?.percent_off ?? 0;
  const discountCents = Math.round(subtotalCents * percent / 100);
  const productsCents = subtotalCents - discountCents;
  const deliveryCents = productsCents >= FREE_DELIVERY_FROM_CENTS || promo?.free_delivery ? 0 : DELIVERY_FEE_CENTS;
  return { items, subtotalCents, discountCents, deliveryCents,
    totalCents: productsCents + deliveryCents,
    orderable: items.every(item => item.orderable),
    addressVerification: 'manual_required',
    deliverySlot: 'requested_not_reserved',
    promoCode: promo?.code || null };
}
