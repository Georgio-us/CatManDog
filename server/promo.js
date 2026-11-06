import { normalizedEmail } from './auth.js';

const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
export const normalizePromoCode = value => String(value || '').trim().toUpperCase();
const validCode = value => /^[A-Z0-9_-]{4,40}$/.test(value);

// Compare the Spanish nine-digit number so 600 000 000 and +34 600 000 000
// identify the same checkout contact, regardless of delivery region.
export function normalizeBuyerPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : null;
}

export function promoProblem(promo, now = new Date()) {
  if (!promo || !promo.active) return 'Промокод недействителен';
  if (promo.expires_at && new Date(promo.expires_at) <= now) return 'Срок действия промокода истёк';
  if (promo.max_uses !== null && promo.used_count >= promo.max_uses)
    return promo.kind === 'paper_shared'
      ? 'Лимит купонов исчерпан - свяжитесь с поддержкой'
      : 'Промокод уже использован';
  return null;
}

async function promoRow(db, code, lock = false) {
  const { rows } = await db.query(`SELECT code,kind,percent_off,free_delivery,active,max_uses,
    used_count,expires_at FROM promo_codes WHERE code=$1 ${lock ? 'FOR UPDATE' : ''}`, [code]);
  return rows[0] || null;
}

async function previousUse(db, code, customer, identity) {
  const email = normalizedEmail(identity?.email || customer?.email);
  const accountEmail = normalizedEmail(customer?.email);
  const phone = normalizeBuyerPhone(identity?.phone);
  if (!customer?.id && !email && !accountEmail && !phone) return null;
  const { rows } = await db.query(`SELECT payment_status FROM orders WHERE promo_code=$1
    AND (($2::uuid IS NOT NULL AND customer_id=$2) OR
      ($3::text IS NOT NULL AND lower(email)=$3) OR
      ($4::text IS NOT NULL AND buyer_phone=$4) OR
      ($5::text IS NOT NULL AND lower(email)=$5))
    AND (payment_status='paid' OR
      (payment_status IN ('awaiting_payment','pending') AND stock_state='reserved'))
    ORDER BY CASE WHEN payment_status='paid' THEN 0 ELSE 1 END LIMIT 1`,
  [code, customer?.id || null, email || null, phone, accountEmail || null]);
  return rows[0]?.payment_status || null;
}

export async function couponStatus(db, promo, customer = null, identity = null) {
  const problem = promoProblem(promo);
  const used = promo?.kind === 'paper_shared'
    ? await previousUse(db, promo.code, customer, identity) : null;
  return { code: promo?.code || null, percent: promo?.percent_off || 0,
    expiresAt: promo?.expires_at || null,
    status: used === 'paid' ? 'used' : used ? 'pending_payment'
      : problem === 'Срок действия промокода истёк' ? 'expired'
      : problem?.startsWith('Лимит') ? 'limit_reached'
      : problem ? 'invalid' : 'ready' };
}

export async function activatePaperCoupon(db, rawCode, customer = null) {
  const code = normalizePromoCode(rawCode);
  if (!validCode(code)) fail('Промокод недействителен');
  const promo = await promoRow(db, code);
  if (!promo || promo.kind !== 'paper_shared' || promo.percent_off !== 10 || promo.max_uses !== 100)
    fail('Промокод недействителен');
  const status = await couponStatus(db, promo, customer);
  if (customer && status.status === 'ready') {
    await db.query(`INSERT INTO customer_promos(customer_id,code) VALUES($1,$2)
      ON CONFLICT(customer_id,code) DO NOTHING`, [customer.id, code]);
  }
  return status;
}

export async function savedPaperCoupon(db, customer) {
  if (!customer) return null;
  const { rows } = await db.query(`SELECT p.code,p.kind,p.percent_off,p.free_delivery,p.active,
    p.max_uses,p.used_count,p.expires_at FROM customer_promos cp
    JOIN promo_codes p ON p.code=cp.code WHERE cp.customer_id=$1 AND p.kind='paper_shared'
    ORDER BY cp.created_at DESC LIMIT 1`, [customer.id]);
  return rows[0] ? couponStatus(db, rows[0], customer) : null;
}

export async function resolvePromo(db, rawCode, customer = null, identity = null, lock = false) {
  const code = normalizePromoCode(rawCode);
  if (!code) return null;
  if (!validCode(code)) fail('Промокод недействителен');
  const promo = await promoRow(db, code, lock);
  if (!promo || promo.kind === 'second_order') fail('Промокод недействителен');
  if (promo.kind === 'paper_shared') {
    if (promo.percent_off !== 10 || promo.max_uses !== 100 || promo.free_delivery)
      fail('Промокод недействителен');
    const use = await previousUse(db, code, customer, identity);
    if (use === 'paid') fail('Вы уже использовали этот промокод');
    if (use) fail('Дождитесь завершения предыдущего оформления заказа');
  }
  const problem = promoProblem(promo);
  if (problem) fail(problem);
  return promo;
}
