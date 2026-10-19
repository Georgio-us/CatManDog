export const FREE_DELIVERY_FROM = 49;
export const DELIVERY_FEE = 3.99;

const cents = amount => Math.round(Number(amount) * 100);

export function checkoutTotals(items, promo = null) {
  const subtotalCents = items.reduce((sum, item) => sum + cents(item.price) * item.qty, 0);
  const percent = Math.max(0, Math.min(100, Number(promo?.percent) || 0));
  const discountCents = Math.round(subtotalCents * percent / 100);
  const productsCents = subtotalCents - discountCents;
  const deliveryCents = !items.length || productsCents >= cents(FREE_DELIVERY_FROM) || promo?.freeShipping ? 0 : cents(DELIVERY_FEE);
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
  if (field('city') !== 'València') return 'Пока оформляем доставку только в городе Валенсия';
  if (!field('street') || !field('building')) return 'Укажите улицу и номер дома';
  const timing = deliveryTiming(now);
  if (field('deliveryMode') === 'soon' && !timing.todayAvailable) return 'Сегодня уже нет доступного времени - выберите другую дату';
  if (field('deliveryMode') === 'scheduled') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(field('deliveryDate')) || !/^\d{2}:\d{2}$/.test(field('deliveryTime'))) return 'Укажите желаемые дату и время';
    if (`${field('deliveryDate')}T${field('deliveryTime')}` < `${timing.date}T${timing.time}`) return 'Выберите время не раньше доступного ориентира';
  } else if (field('deliveryMode') !== 'soon') return 'Выберите время доставки';
  return null;
}
