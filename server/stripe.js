import { createHmac, timingSafeEqual } from 'node:crypto';

const secretKey = () => process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = () => process.env.STRIPE_WEBHOOK_SECRET || '';

export function stripeReady() {
  return /^sk_(test|live)_/.test(secretKey()) && /^whsec_/.test(webhookSecret()) &&
    /^https:\/\/catmandog\.es\/?$/.test(process.env.PUBLIC_BASE_URL || '');
}

export function stripeMode() {
  return secretKey().startsWith('sk_live_') ? 'live' : 'test';
}

export function verifyStripeEvent(raw, signature, now = Date.now()) {
  if (!/^whsec_/.test(webhookSecret())) throw Object.assign(new Error('Webhook не настроен'), { status: 503 });
  if (!Buffer.isBuffer(raw) || raw.length > 1024 * 1024) throw Object.assign(new Error('Некорректный webhook'), { status: 400 });
  const parts = String(signature || '').split(',').map(part => part.trim().split('='));
  const timestamp = Number(parts.find(([key]) => key === 't')?.[1]);
  const signatures = parts.filter(([key, value]) => key === 'v1' && /^[a-f0-9]{64}$/i.test(value || ''));
  if (!Number.isSafeInteger(timestamp) || Math.abs(now / 1000 - timestamp) > 300 || !signatures.length)
    throw Object.assign(new Error('Неверная подпись Stripe'), { status: 400 });
  const expected = createHmac('sha256', webhookSecret()).update(`${timestamp}.`).update(raw).digest();
  if (!signatures.some(([, value]) => timingSafeEqual(expected, Buffer.from(value, 'hex'))))
    throw Object.assign(new Error('Неверная подпись Stripe'), { status: 400 });
  try { return JSON.parse(raw.toString('utf8')); }
  catch { throw Object.assign(new Error('Некорректный webhook'), { status: 400 }); }
}

export async function createStripeCheckout(order, language = 'es', fetcher = fetch) {
  if (!stripeReady()) throw Object.assign(new Error('Оплата ещё не настроена'), { status: 503 });
  if (!Array.isArray(order.items) || !order.items.length || order.total_cents < 50)
    throw Object.assign(new Error('Сумма заказа слишком мала для оплаты картой'), { status: 400 });
  const base = new URL(process.env.PUBLIC_BASE_URL);
  const success = new URL(base);
  success.hash = '/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}';
  const cancel = new URL(base);
  cancel.hash = '/checkout/payment-error';
  const params = new URLSearchParams({
    mode: 'payment',
    locale: language === 'ru' ? 'ru' : 'es',
    client_reference_id: order.id,
    customer_email: order.email,
    success_url: success.href,
    cancel_url: cancel.href,
    'metadata[order_id]': order.id,
    'payment_intent_data[metadata][order_id]': order.id,
    expires_at: String(Math.floor(Date.now() / 1000) + 3600)
  });
  // Card payments are the launch default. Other methods can be enabled deliberately later.
  params.append('payment_method_types[0]', 'card');
  let remainingDiscount = order.discount_cents;
  let charged = 0;
  let index = 0;
  order.items.forEach((item, position) => {
    const portion = position === order.items.length - 1 ? remainingDiscount
      : Math.floor(order.discount_cents * item.lineCents / order.subtotal_cents);
    remainingDiscount -= portion;
    const amount = item.lineCents - portion;
    if (amount <= 0) return;
    params.set(`line_items[${index}][price_data][currency]`, 'eur');
    params.set(`line_items[${index}][price_data][unit_amount]`, String(amount));
    params.set(`line_items[${index}][price_data][product_data][name]`,
      `${item.name} - ${item.variantLabel} × ${item.qty}`.slice(0, 500));
    params.set(`line_items[${index}][quantity]`, '1');
    charged += amount;
    index += 1;
  });
  if (order.delivery_cents > 0) {
    params.set(`line_items[${index}][price_data][currency]`, 'eur');
    params.set(`line_items[${index}][price_data][unit_amount]`, String(order.delivery_cents));
    params.set(`line_items[${index}][price_data][product_data][name]`,
      language === 'ru' ? 'Доставка по Валенсии' : 'Entrega en València');
    params.set(`line_items[${index}][quantity]`, '1');
    charged += order.delivery_cents;
  }
  if (charged !== order.total_cents) throw new Error('Сумма позиций Stripe не совпадает с заказом');
  const response = await fetcher('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey()}`, 'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `catmandog-order-${order.id}` },
    body: params,
    signal: AbortSignal.timeout(15000)
  });
  const session = await response.json().catch(() => ({}));
  if (!response.ok || !/^cs_(test|live)_/.test(session.id || '') ||
      !/^https:\/\/checkout\.stripe\.com\//.test(session.url || '') ||
      session.amount_total !== order.total_cents || session.currency !== 'eur')
    throw Object.assign(new Error('Stripe не создал корректную страницу оплаты'), { status: 502 });
  return session;
}
