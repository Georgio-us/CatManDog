import { LOCAL_FREE_DELIVERY_FROM_CENTS, LOCAL_DELIVERY_FEE_CENTS,
  isMainlandPostcode } from './shipping-policy.js';

export const FREE_DELIVERY_FROM = LOCAL_FREE_DELIVERY_FROM_CENTS / 100;
export const DELIVERY_FEE = LOCAL_DELIVERY_FEE_CENTS / 100;

const cents = amount => Math.round(Number(amount) * 100);

export function checkoutTotals(items, promo = null, shippingCents = null) {
  const subtotalCents = items.reduce((sum, item) => sum + cents(item.price) * item.qty, 0);
  const percent = Math.max(0, Math.min(100, Number(promo?.percent) || 0));
  const discountCents = Math.round(subtotalCents * percent / 100);
  const productsCents = subtotalCents - discountCents;
  const deliveryCents = shippingCents === null
    ? !items.length || productsCents >= cents(FREE_DELIVERY_FROM) || promo?.freeShipping ? 0 : cents(DELIVERY_FEE)
    : shippingCents;
  return {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    products: productsCents / 100,
    delivery: deliveryCents / 100,
    total: (productsCents + deliveryCents) / 100,
    freeDelivery: deliveryCents === 0
  };
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});

function valenciaTime(date) {
  const parts = Object.fromEntries(dateTimeFormatter.formatToParts(date).map(part => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export const DELIVERY_WINDOWS = [
  { id:'10-14', label:'10:00-14:00', start:10 },
  { id:'14-18', label:'14:00-18:00', start:14 },
  { id:'18-22', label:'18:00-22:00', start:18 }
];

export function availableDeliverySlots(now = new Date(), days = 7) {
  const local = valenciaTime(now);
  const hour = Number(local.time.slice(0,2));
  const minute = Number(local.time.slice(3));
  const base = new Date(`${local.date}T12:00:00Z`);
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(base.getTime() + offset * 86400000).toISOString().slice(0,10);
    return DELIVERY_WINDOWS.filter(window => offset > 0 || hour * 60 + minute < window.start * 60)
      .map(window => ({ date, window: window.id, label: window.label, day: offset }));
  }).flat();
}

export function deliveryTiming(now = new Date()) {
  const earliestMs = now.getTime() + 2 * 60 * 60 * 1000;
  const roundedHourMs = Math.ceil(earliestMs / 3600000) * 3600000;
  const today = valenciaTime(now).date;
  const earliest = valenciaTime(new Date(roundedHourMs));
  return { today, ...earliest, todayAvailable: earliest.date === today };
}

export function validateCheckout(values, now = new Date()) {
  const field = name => String(values[name] || '').trim();
  if (!field('name') || !field('email') || !field('phone')) return 'Укажите имя, email и телефон';
  if (!/^\d{5}$/.test(field('postcode'))) return 'Укажите почтовый индекс из пяти цифр';
  if (field('deliveryRegion') !== 'national' && !field('city'))
    return 'Укажите город доставки';
  if (field('deliveryRegion') !== 'national' && !/^46\d{3}$/.test(field('postcode')))
    return 'Для местной доставки укажите индекс провинции Валенсия';
  if (field('deliveryRegion') === 'national' && !field('city')) return 'Укажите город доставки';
  if (field('deliveryRegion') === 'national' && !isMainlandPostcode(field('postcode')))
    return 'Сейчас отправляем заказы только по материковой Испании';
  if (!field('street') || !field('building')) return 'Укажите улицу и номер дома';
  if (field('deliveryRegion') === 'national') return null;
  if (field('deliveryMode') === 'preorder') return null;
  if (field('deliveryMode') === 'slot') {
    const [date, window] = field('deliverySlot').split('|');
    return availableDeliverySlots(now).some(option => option.date === date && option.window === window)
      ? null : 'Выберите доступный интервал доставки';
  }
  const timing = deliveryTiming(now);
  if (field('deliveryMode') === 'soon' && !timing.todayAvailable) return 'Сегодня уже нет доступного времени - выберите другую дату';
  if (field('deliveryMode') === 'scheduled') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(field('deliveryDate')) || !/^\d{2}:\d{2}$/.test(field('deliveryTime'))) return 'Укажите желаемые дату и время';
    if (`${field('deliveryDate')}T${field('deliveryTime')}` < `${timing.date}T${timing.time}`) return 'Выберите время не раньше доступного ориентира';
  } else if (field('deliveryMode') !== 'soon') return 'Выберите время доставки';
  return null;
}
