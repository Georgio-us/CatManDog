import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { catalogSnapshot } from './catalog.js';
import { priceQuote, validateAddress, validateDelivery } from './pricing.js';
import { json, readJson, sameOrigin } from './http.js';
import { normalizedEmail, validEmail, hashPassword, verifyPassword, currentCustomer,
  createSession, cookieToken, tokenDigest, sessionCookie, clearSessionCookie, isAdmin } from './auth.js';
import { loadCabinet, saveCabinet } from './cabinet.js';
import { emailReady, sendAccountLink, notifyServiceRequest, sendServiceReply } from './email.js';
import { googleClientId, verifyGoogleCredential, googleOwnsEmail } from './google-auth.js';
import { currentStaff, createStaffSession, staffCookie, clearStaffCookie,
  revokeStaffSession, bootstrapOwner } from './staff.js';
import { financePreview } from './finance.js';
import { backupConfiguration, listBackups } from './backup.js';
import { createStripeCheckout, stripeMode, stripeReady, verifyStripeEvent } from './stripe.js';
import { importSupplierCatalog } from './supplier-catalog.js';

const counters = new Map();
const cap = (value, length) => String(value || '').trim().slice(0, length);
const enabled = name => process.env[name] === 'true';
const ordersReady = () => stripeReady() && enabled('ORDERS_ENABLED') && enabled('PAYMENTS_ENABLED');
async function checkoutAllowed(db, req) {
  if (!ordersReady()) return false;
  if (stripeMode() === 'live') return true;
  const customer = await currentCustomer(db, req);
  if (!customer?.emailVerified) return false;
  const { rows } = await db.query(`SELECT EXISTS(SELECT 1 FROM staff_accounts
    WHERE email=$1 AND role='owner' AND active=true) AS allowed`, [customer.email]);
  return rows[0]?.allowed === true;
}
const bad = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
async function latestLeonardoSource(db) {
  const { rows } = await db.query(`SELECT id,supplier_name,brand,price_date,source_file,
    shop_price_tax_basis,retail_price_tax_basis FROM supplier_catalog_sources
    WHERE supplier_name='Albet' AND brand='Leonardo'
    ORDER BY price_date DESC,imported_at DESC LIMIT 1`);
  return rows[0] || null;
}
const optionalWebUrl = value => {
  const url = cap(value, 300);
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) return parsed.href;
  } catch { /* Пустой или некорректный URL */ }
  bad('Укажите адрес сайта с https://');
};
const secure = req => req.headers['x-forwarded-proto'] === 'https' || !!req.socket.encrypted;
const authToken = value => /^[a-f0-9]{64}$/.test(String(value || ''));
const validUuid = value => /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(String(value || ''));
const catalogPets = new Set(['cat', 'dog', 'both']);
const catalogCategories = new Set(['Корм', 'Лакомства', 'Наполнитель', 'Лотки',
  'Лотки и гигиена',
  'Игрушки и аксессуары', 'Миски и поилки', 'Переноски', 'Окна и балконы', 'Уход', 'Подарочные наборы']);
function catalogImagePath(value) {
  const path = cap(value, 500);
  if (path && !path.startsWith('/assets/') && !path.startsWith('https://img.catmandog.es/'))
    bad('Для фото используйте адрес из CatManDog R2');
  return path;
}
function productFields(body) {
  const name = cap(body.name, 160);
  const brand = cap(body.brand, 100);
  const category = cap(body.category, 80);
  const pet = cap(body.pet, 10);
  const description = cap(body.description, 3000);
  const foodType = category === 'Корм' ? cap(body.foodType, 12) || null : null;
  const imagePath = catalogImagePath(body.imagePath);
  const details = Array.isArray(body.details) ? body.details.map(item => cap(item, 300)).filter(Boolean).slice(0, 20) : [];
  if (name.length < 2 || brand.length < 2 || !catalogCategories.has(category) || !catalogPets.has(pet))
    bad('Укажите название, бренд, категорию и питомца');
  if (category === 'Корм' && !foodType) bad('Для корма выберите сухой или влажный');
  if (foodType && !['dry','wet'].includes(foodType)) bad('Некорректный тип корма');
  return { name, brand, category, pet, description, foodType, imagePath, details };
}

async function issueAccountLink(db, customerId, kind, email, language = 'ru') {
  const token = randomBytes(32).toString('hex');
  await db.query('DELETE FROM auth_links WHERE customer_id=$1 AND kind=$2 AND consumed_at IS NULL',
    [customerId, kind]);
  await db.query(`INSERT INTO auth_links(id,customer_id,kind,token_hash,expires_at)
    VALUES($1,$2,$3,$4,now()+($5::integer * interval '1 minute'))`,
  [randomUUID(), customerId, kind, tokenDigest(token), kind === 'verify' ? 1440 : 30]);
  await sendAccountLink(email, kind, token, fetch, language);
}

function rateLimit(req, group, limit, minutes = 15) {
  const ip = String(req.socket.remoteAddress || 'unknown');
  const key = `${ip}:${group}`;
  const now = Date.now();
  const value = counters.get(key) || { count: 0, until: now + minutes * 60000 };
  if (now > value.until) { value.count = 0; value.until = now + minutes * 60000; }
  value.count += 1;
  counters.set(key, value);
  if (value.count > limit) bad('Слишком много запросов. Попробуйте позже', 429);
  if (counters.size > 10000) for (const [entry, counter] of counters) if (counter.until < now) counters.delete(entry);
}

async function promoFor(db, code, lock = false) {
  if (!code) return null;
  const value = cap(code, 40).toUpperCase();
  const { rows } = await db.query(`SELECT code,percent_off,free_delivery,max_uses,used_count FROM promo_codes
    WHERE code=$1 AND active=true AND (expires_at IS NULL OR expires_at>now())
    ${lock ? 'FOR UPDATE' : ''}`, [value]);
  const promo = rows[0];
  if (!promo || (promo.max_uses !== null && promo.used_count >= promo.max_uses)) bad('Промокод недоступен');
  return promo;
}

function publicQuote(quote) {
  const canSource = enabled('SOURCE_ON_DEMAND_PAYMENT_ENABLED');
  return { items: quote.items.map(({ orderable, sourceMode, ...item }) => ({ ...item,
      orderable: orderable && (sourceMode === 'on_hand' || canSource),
      availability: sourceMode })),
    subtotalCents: quote.subtotalCents, discountCents: quote.discountCents,
    deliveryCents: quote.deliveryCents, totalCents: quote.totalCents,
    orderable: quote.orderable && (canSource || quote.items.every(item => item.sourceMode === 'on_hand')),
    addressVerification: quote.addressVerification,
    deliverySlot: quote.deliverySlot, promoCode: quote.promoCode };
}

async function liveCatalogSnapshot(db) {
  const list = await catalogSnapshot(db);
  const { rows } = await db.query('SELECT id,reserved_quantity FROM catalog_variants WHERE reserved_quantity>0');
  const reserved = new Map(rows.map(row => [row.id, row.reserved_quantity]));
  return list.map(row => {
    const reservedQuantity = reserved.get(row.variant_id) || 0;
    return { ...row, reserved_quantity: reservedQuantity,
      orderable: row.orderable && (row.availability !== 'on_hand' ||
        row.stock_quantity - reservedQuantity > 0) };
  });
}

async function recordInventoryMovement(client, values) {
  await client.query(`INSERT INTO inventory_movements(id,variant_id,order_id,staff_id,supplier_id,
    unit_cost_cents,idempotency_key,reason,delta_on_hand,delta_reserved,on_hand_after,reserved_after,note,
    purchase_order_item_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
  [randomUUID(), values.variantId, values.orderId || null, values.staffId || null,
    values.supplierId || null, values.unitCostCents ?? null, values.idempotencyKey || null,
    values.reason, values.deltaOnHand || 0, values.deltaReserved || 0,
    values.onHandAfter, values.reservedAfter, values.note || '', values.purchaseOrderItemId || null]);
}

async function createOrder(db, payload, customer) {
  if (!ordersReady())
    bad('Приём заказов ещё не включён', 503);
  const idempotency = cap(payload.idempotencyKey, 100);
  if (!/^[a-zA-Z0-9_-]{20,100}$/.test(idempotency)) bad('Повторите оформление заказа');
  const name = cap(payload.name, 100);
  const email = normalizedEmail(payload.email);
  const phone = cap(payload.phone, 24);
  if (!name || !validEmail(email) || phone.length < 6) bad('Укажите имя, email и телефон');
  const address = payload.address;
  const addressError = validateAddress(address);
  if (addressError) bad(addressError);
  const delivery = payload.delivery;
  const deliveryError = validateDelivery(delivery);
  if (deliveryError) bad(deliveryError);
  const lines = payload.items;
  if (!Array.isArray(lines) || !lines.length || lines.length > 50) bad('Проверьте корзину');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(`SELECT id,number,email,payment_status,
      stripe_checkout_url,payment_expires_at FROM orders WHERE idempotency_key=$1`, [idempotency]);
    if (existing.rows[0]) {
      if (existing.rows[0].email !== email) bad('Ключ оформления уже использован', 409);
      if (existing.rows[0].payment_status === 'paid') bad('Этот заказ уже оплачен', 409);
      if (!existing.rows[0].stripe_checkout_url || existing.rows[0].payment_expires_at <= new Date())
        bad('Время оплаты истекло. Начните оформление заново', 409);
      await client.query('COMMIT');
      return { url: existing.rows[0].stripe_checkout_url, orderNumber: existing.rows[0].number };
    }
    const ids = lines.map(line => cap(line.variantId, 180));
    const variants = await client.query(`SELECT v.id AS variant_id,v.product_id,v.label,v.source_price_cents,
      v.price_override_cents,v.price_confirmed,v.source_orderable,v.availability,v.tax_rate_bps,
      v.stock_quantity,v.reserved_quantity,p.name
      FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
      WHERE v.id=ANY($1::text[]) AND v.active=true AND p.active=true FOR UPDATE OF v`, [ids]);
    const promo = await promoFor(client, payload.promoCode, true);
    const quote = priceQuote(lines, variants.rows, promo);
    if (!quote.orderable) bad('Один из товаров пока нельзя заказать');
    if (!enabled('SOURCE_ON_DEMAND_PAYMENT_ENABLED') && quote.items.some(item => item.sourceMode !== 'on_hand'))
      bad('Для оплаты доступны только товары с подтверждённым наличием');
    const orderId = randomUUID();
    const numberResult = await client.query("SELECT 'CMD-' || nextval('order_number_seq') AS number");
    const number = numberResult.rows[0].number;
    const cleanAddress = { city: 'València', postcode: cap(address.postcode, 5),
      street: cap(address.street, 120), building: cap(address.building, 16),
      apartment: cap(address.apartment, 80), note: cap(address.note, 300), verified: false };
    const cleanDelivery = delivery.mode === 'soon' ? { mode: 'soon', reserved: false }
      : { mode: 'scheduled', date: delivery.date, time: delivery.time, reserved: false };
    const billingProfile = await client.query('SELECT delivery_tax_rate_bps FROM billing_profile WHERE id=true');
    const deliveryTaxRate = billingProfile.rows[0]?.delivery_tax_rate_bps ?? null;
    const inserted = await client.query(`INSERT INTO orders(id,number,customer_id,customer_name,email,phone,whatsapp_opt_in,
      delivery_address,delivery_preference,subtotal_cents,discount_cents,delivery_cents,delivery_tax_rate_bps,total_cents,
      promo_code,idempotency_key,stock_state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'reserved')
      ON CONFLICT(idempotency_key) DO NOTHING RETURNING id,number`,
    [orderId, number, customer?.id || null, name, email, phone, !!payload.whatsapp,
      cleanAddress, cleanDelivery, quote.subtotalCents, quote.discountCents,
      quote.deliveryCents, deliveryTaxRate, quote.totalCents, quote.promoCode, idempotency]);
    if (!inserted.rows.length) {
      const duplicate = await client.query(`SELECT id,number,email,stripe_checkout_url,payment_expires_at
        FROM orders WHERE idempotency_key=$1`, [idempotency]);
      if (duplicate.rows[0]?.email !== email) bad('Ключ оформления уже использован', 409);
      if (!duplicate.rows[0]?.stripe_checkout_url || duplicate.rows[0].payment_expires_at <= new Date())
        bad('Время оплаты истекло. Начните оформление заново', 409);
      await client.query('COMMIT');
      return { url: duplicate.rows[0].stripe_checkout_url, orderNumber: duplicate.rows[0].number };
    }
    for (const item of quote.items) {
      await client.query(`INSERT INTO order_items(id,order_id,product_id,variant_id,name,variant_label,quantity,
        unit_price_cents,source_mode,tax_rate_bps) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [randomUUID(), orderId, item.productId, item.variantId, item.name, item.variantLabel,
        item.qty, item.unitPriceCents, item.sourceMode,
        variants.rows.find(row => row.variant_id === item.variantId)?.tax_rate_bps ?? null]);
      if (item.sourceMode === 'on_hand') {
        const changed = await client.query(`UPDATE catalog_variants
          SET reserved_quantity=reserved_quantity+$1,updated_at=now() WHERE id=$2
          RETURNING stock_quantity,reserved_quantity`, [item.qty, item.variantId]);
        await recordInventoryMovement(client, { variantId: item.variantId, orderId,
          reason: 'order_reserved', deltaReserved: item.qty,
          onHandAfter: changed.rows[0].stock_quantity,
          reservedAfter: changed.rows[0].reserved_quantity });
      }
    }
    await client.query('INSERT INTO order_events(id,order_id,type,actor) VALUES($1,$2,$3,$4)',
      [randomUUID(), orderId, 'received', 'system']);
    if (promo) await client.query('UPDATE promo_codes SET used_count=used_count+1 WHERE code=$1', [promo.code]);
    const session = await createStripeCheckout({ id: orderId, number, email,
      items: quote.items, subtotal_cents: quote.subtotalCents, discount_cents: quote.discountCents,
      delivery_cents: quote.deliveryCents, total_cents: quote.totalCents }, payload.locale);
    await client.query(`UPDATE orders SET stripe_checkout_session_id=$2,stripe_checkout_url=$3,
      payment_expires_at=to_timestamp($4),payment_status='pending',updated_at=now() WHERE id=$1`,
    [orderId, session.id, session.url, session.expires_at]);
    await client.query('COMMIT');
    return { url: session.url, orderNumber: number };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

async function readWebhookBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) bad('Слишком большой webhook', 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function releasePaymentReservation(client, order) {
  if (order.stock_state !== 'reserved') return;
  const { rows } = await client.query(`SELECT variant_id,quantity FROM order_items
    WHERE order_id=$1 AND source_mode='on_hand' ORDER BY variant_id`, [order.id]);
  for (const item of rows) {
    const changed = await client.query(`UPDATE catalog_variants SET reserved_quantity=reserved_quantity-$1,
      updated_at=now() WHERE id=$2 AND reserved_quantity>=$1
      RETURNING stock_quantity,reserved_quantity`, [item.quantity, item.variant_id]);
    if (!changed.rows.length) throw new Error('Резерв товара не найден');
    await recordInventoryMovement(client, { variantId: item.variant_id, orderId: order.id,
      reason: 'order_released', deltaReserved: -item.quantity,
      onHandAfter: changed.rows[0].stock_quantity, reservedAfter: changed.rows[0].reserved_quantity });
  }
  if (order.promo_code) await client.query(`UPDATE promo_codes
    SET used_count=greatest(0,used_count-1) WHERE code=$1`, [order.promo_code]);
}

async function handleStripeWebhook(db, req, res) {
  const event = verifyStripeEvent(await readWebhookBody(req), req.headers['stripe-signature']);
  if (!/^evt_/.test(event.id || '') || event.livemode !== (stripeMode() === 'live'))
    bad('Некорректное событие Stripe', 400);
  const types = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed', 'checkout.session.expired']);
  if (!types.has(event.type)) return json(res, 200, { received: true });
  const session = event.data?.object;
  if (!session || !/^cs_(test|live)_/.test(session.id || '') || !validUuid(session.client_reference_id) ||
      session.metadata?.order_id !== session.client_reference_id || session.currency !== 'eur')
    bad('Некорректная сессия оплаты', 400);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(`SELECT id,total_cents,payment_status,stock_state,promo_code,
      stripe_checkout_session_id FROM orders WHERE id=$1 FOR UPDATE`, [session.client_reference_id]);
    const order = found.rows[0];
    if (!order || order.total_cents !== session.amount_total ||
        order.stripe_checkout_session_id !== session.id)
      bad('Сумма или заказ Stripe не совпадают', 409);
    const inserted = await client.query(`INSERT INTO stripe_events(id,type,order_id)
      VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id`, [event.id, event.type, order.id]);
    if (!inserted.rows.length) { await client.query('COMMIT'); return json(res, 200, { received: true }); }
    const paid = (event.type === 'checkout.session.completed' && session.payment_status === 'paid') ||
      event.type === 'checkout.session.async_payment_succeeded';
    const failed = ['checkout.session.async_payment_failed', 'checkout.session.expired'].includes(event.type);
    if (paid && order.payment_status !== 'paid') {
      if (order.payment_status === 'failed' || order.stock_state === 'released')
        throw new Error('Оплата поступила после освобождения резерва');
      await client.query(`UPDATE orders SET payment_status='paid',
        stripe_checkout_session_id=coalesce(stripe_checkout_session_id,$2),
        stripe_payment_intent_id=$3,updated_at=now() WHERE id=$1`,
      [order.id, session.id, typeof session.payment_intent === 'string' ? session.payment_intent : null]);
      await client.query(`INSERT INTO order_events(id,order_id,type,actor)
        VALUES($1,$2,'payment_paid','stripe')`, [randomUUID(), order.id]);
    } else if (failed && order.payment_status !== 'paid' && order.payment_status !== 'failed') {
      await releasePaymentReservation(client, order);
      await client.query(`UPDATE orders SET payment_status='failed',status='cancelled',
        stock_state='released',updated_at=now() WHERE id=$1`, [order.id]);
      await client.query(`INSERT INTO order_events(id,order_id,type,actor)
        VALUES($1,$2,'payment_failed','stripe')`, [randomUUID(), order.id]);
    } else if (!paid && !failed && order.payment_status === 'awaiting_payment') {
      await client.query(`UPDATE orders SET payment_status='pending',
        stripe_checkout_session_id=coalesce(stripe_checkout_session_id,$2),updated_at=now() WHERE id=$1`,
      [order.id, session.id]);
    }
    await client.query('COMMIT');
    return json(res, 200, { received: true });
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

async function authRoute(db, req, res, path) {
  const body = await readJson(req);
  rateLimit(req, 'auth', 12);
  if (path === '/api/auth/register') {
    if (!enabled('ACCOUNTS_ENABLED')) bad('Регистрация будет доступна после подключения почты', 503);
    if (!emailReady()) bad('Почтовая отправка ещё не подключена', 503);
    const email = normalizedEmail(body.email);
    if (!validEmail(email)) bad('Укажите корректный email');
    if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 200)
      bad('Пароль должен содержать от 12 до 200 символов');
    const hash = await hashPassword(body.password);
    const id = randomUUID();
    try {
      await db.query('INSERT INTO customers(id,email,password_hash,name) VALUES($1,$2,$3,$4)',
        [id, email, hash, cap(body.name, 100)]);
    } catch (error) {
      if (error.code === '23505') bad('Этот email уже используется', 409);
      throw error;
    }
    await issueAccountLink(db, id, 'verify', email, body.locale === 'es' ? 'es' : 'ru');
    return json(res, 201, { pending: true, email });
  }
  if (path === '/api/auth/login') {
    if (!enabled('ACCOUNTS_ENABLED')) bad('Вход пока не подключён', 503);
    const email = normalizedEmail(body.email);
    const { rows } = await db.query('SELECT id,email,password_hash,name,email_verified_at,google_sub FROM customers WHERE email=$1', [email]);
    if (!rows[0] || !await verifyPassword(body.password, rows[0].password_hash)) bad('Неверный email или пароль', 401);
    if (!rows[0].email_verified_at) bad('Подтвердите email по ссылке из письма', 403);
    const token = await createSession(db, rows[0].id);
    return json(res, 200, { id: rows[0].id, email, name: rows[0].name, googleLinked: !!rows[0].google_sub },
      { 'Set-Cookie': sessionCookie(token, secure(req)) });
  }
  if (path === '/api/auth/google' || path === '/api/auth/google/link') {
    if (!enabled('ACCOUNTS_ENABLED') || !googleClientId()) bad('Google-вход пока не подключён', 503);
    let identity;
    try { identity = await verifyGoogleCredential(body.credential); }
    catch { bad('Не удалось подтвердить вход через Google', 401); }
    if (path.endsWith('/link')) {
      const customer = await currentCustomer(db, req);
      if (!customer) bad('Сначала войдите в кабинет по email', 401);
      if (customer.email !== identity.email) bad('Email аккаунта Google должен совпадать с email кабинета', 409);
      const { rows } = await db.query('SELECT google_sub FROM customers WHERE id=$1', [customer.id]);
      if (rows[0]?.google_sub && rows[0].google_sub !== identity.sub)
        bad('К кабинету уже подключён другой аккаунт Google', 409);
      try {
        const linked = await db.query(`UPDATE customers SET google_sub=$1 WHERE id=$2
          AND (google_sub IS NULL OR google_sub=$1)`, [identity.sub, customer.id]);
        if (!linked.rowCount) bad('К кабинету уже подключён другой аккаунт Google', 409);
      }
      catch (error) {
        if (error.code === '23505') bad('Этот аккаунт Google уже подключён к другому кабинету', 409);
        throw error;
      }
      return json(res, 200, { ok: true, googleLinked: true });
    }
    let account = (await db.query('SELECT id,email,name FROM customers WHERE google_sub=$1',
      [identity.sub])).rows[0];
    if (account && account.email !== identity.email)
      bad('Email аккаунта Google изменился. Обратитесь в поддержку', 409);
    if (!account) {
      const existing = (await db.query('SELECT id,email,name,google_sub,email_verified_at FROM customers WHERE email=$1', [identity.email])).rows[0];
      if (existing) {
        if (!existing.email_verified_at || !googleOwnsEmail(identity) || existing.google_sub)
          bad('Этот email уже зарегистрирован. Войдите по паролю и подключите Google в кабинете', 409);
        try {
          account = (await db.query(`UPDATE customers SET google_sub=$1 WHERE id=$2 AND google_sub IS NULL
            AND email_verified_at IS NOT NULL RETURNING id,email,name`, [identity.sub, existing.id])).rows[0];
        } catch (error) {
          if (error.code === '23505') bad('Этот аккаунт Google уже подключён к другому кабинету', 409);
          throw error;
        }
        if (!account) bad('Не удалось подключить Google. Повторите вход', 409);
      } else try {
        account = (await db.query(`INSERT INTO customers(id,email,password_hash,google_sub,name,email_verified_at)
          VALUES($1,$2,NULL,$3,$4,now()) RETURNING id,email,name`,
        [randomUUID(), identity.email, identity.sub, identity.name])).rows[0];
      } catch (error) {
        if (error.code === '23505') bad('Аккаунт уже существует. Повторите вход', 409);
        throw error;
      }
    }
    const token = await createSession(db, account.id);
    return json(res, 200, { ...account, googleLinked: true },
      { 'Set-Cookie': sessionCookie(token, secure(req)) });
  }
  if (path === '/api/auth/resend-verification' || path === '/api/auth/recover') {
    if (!enabled('ACCOUNTS_ENABLED') || !emailReady()) bad('Почтовая отправка ещё не подключена', 503);
    const email = normalizedEmail(body.email);
    if (!validEmail(email)) bad('Укажите корректный email');
    rateLimit(req, `email:${email}`, 3, 60);
    const { rows } = await db.query('SELECT id,email_verified_at FROM customers WHERE email=$1', [email]);
    const customer = rows[0];
    const kind = path.endsWith('recover') ? 'reset' : 'verify';
    if (customer && (kind === 'reset' ? !!customer.email_verified_at : !customer.email_verified_at)) {
      try { await issueAccountLink(db, customer.id, kind, email, body.locale === 'es' ? 'es' : 'ru'); }
      catch (error) { console.error('Account email failed:', error.message); }
    }
    return json(res, 202, { accepted: true });
  }
  if (path === '/api/auth/verify' || path === '/api/auth/reset') {
    if (!enabled('ACCOUNTS_ENABLED')) bad('Аккаунты пока не подключены', 503);
    const kind = path.endsWith('verify') ? 'verify' : 'reset';
    if (!authToken(body.token)) bad('Ссылка недействительна');
    const password = kind === 'reset' ? body.password : null;
    if (kind === 'reset' && (typeof password !== 'string' || password.length < 12 || password.length > 200))
      bad('Пароль должен содержать от 12 до 200 символов');
    const hash = password ? await hashPassword(password) : null;
    const client = await db.connect();
    let account;
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(`SELECT l.id,l.customer_id,c.email,c.name FROM auth_links l
        JOIN customers c ON c.id=l.customer_id WHERE l.token_hash=$1 AND l.kind=$2
        AND l.consumed_at IS NULL AND l.expires_at>now() FOR UPDATE OF l`,
      [tokenDigest(body.token), kind]);
      if (!rows[0]) bad('Ссылка истекла или уже использована');
      account = rows[0];
      if (kind === 'verify') await client.query('UPDATE customers SET email_verified_at=now() WHERE id=$1', [account.customer_id]);
      else {
        await client.query('UPDATE customers SET password_hash=$1 WHERE id=$2', [hash, account.customer_id]);
        await client.query('DELETE FROM customer_sessions WHERE customer_id=$1', [account.customer_id]);
      }
      await client.query('UPDATE auth_links SET consumed_at=now() WHERE customer_id=$1 AND kind=$2 AND consumed_at IS NULL',
        [account.customer_id, kind]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
    if (kind === 'reset') return json(res, 200, { ok: true });
    const session = await createSession(db, account.customer_id);
    return json(res, 200, { id: account.customer_id, email: account.email, name: account.name },
      { 'Set-Cookie': sessionCookie(session, secure(req)) });
  }
  if (path === '/api/auth/logout') {
    const token = cookieToken(req);
    if (token) await db.query('DELETE FROM customer_sessions WHERE token_hash=$1', [tokenDigest(token)]);
    return json(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie(secure(req)) });
  }
  bad('Не найдено', 404);
}

async function adminRoute(db, req, res, path) {
  if (path === '/api/admin/setup-status' && req.method === 'GET') {
    const { rows } = await db.query("SELECT 1 FROM staff_accounts WHERE role='owner' LIMIT 1");
    return json(res, 200, { needsBootstrap: rows.length === 0, googleClientId: googleClientId() });
  }
  if (path === '/api/admin/bootstrap' && req.method === 'POST') {
    rateLimit(req, 'staff-bootstrap', 5, 30);
    if (!isAdmin(req)) bad('Доступ закрыт', 403);
    const body = await readJson(req);
    let identity;
    try { identity = await verifyGoogleCredential(body.credential); }
    catch { bad('Не удалось подтвердить Google', 401); }
    const owner = await bootstrapOwner(db, identity);
    const token = await createStaffSession(db, owner.id);
    return json(res, 200, { role: owner.role, name: owner.name, email: owner.email },
      { 'Set-Cookie': staffCookie(token, secure(req)) });
  }
  if (path === '/api/admin/login' && req.method === 'POST') {
    rateLimit(req, 'staff-login', 12, 15);
    const body = await readJson(req);
    let identity;
    try { identity = await verifyGoogleCredential(body.credential); }
    catch { bad('Не удалось подтвердить Google', 401); }
    const { rows } = await db.query(`SELECT id,email,name,role FROM staff_accounts
      WHERE google_sub=$1 AND active=true`, [identity.sub]);
    const account = rows[0];
    if (!account) bad('Доступ закрыт', 403);
    if (account.email !== identity.email) bad('Email Google изменился. Обратитесь к владельцу', 403);
    await db.query('UPDATE staff_accounts SET last_login_at=now() WHERE id=$1', [account.id]);
    const token = await createStaffSession(db, account.id);
    return json(res, 200, { role: account.role, name: account.name, email: account.email },
      { 'Set-Cookie': staffCookie(token, secure(req)) });
  }
  if (path === '/api/admin/logout' && req.method === 'POST') {
    await revokeStaffSession(db, req);
    return json(res, 200, { ok: true }, { 'Set-Cookie': clearStaffCookie(secure(req)) });
  }
  const operator = await currentStaff(db, req);
  const customer = operator ? null : await currentCustomer(db, req);
  const supportStaff = operator?.role === 'support' ||
    (customer?.email === (process.env.SUPPORT_STAFF_EMAIL || 'support@catmandog.es') &&
      customer.googleLinked && customer.emailVerified);
  const fullAdmin = operator?.role === 'owner';
  if (!fullAdmin && !supportStaff) bad('Доступ закрыт', 403);
  if (path === '/api/admin/access' && req.method === 'GET')
    return json(res, 200, { role: fullAdmin ? 'admin' : 'support',
      name: operator?.name || customer?.name || '', email: operator?.email || customer?.email });
  if (!fullAdmin && !path.startsWith('/api/admin/service-requests')) bad('Доступ закрыт', 403);
  if (path === '/api/admin/backups' && req.method === 'GET') {
    const config = backupConfiguration();
    if (!config) return json(res, 200, { enabled: false, backups: [] });
    try {
      const backups = await listBackups(config.s3, config.bucket);
      return json(res, 200, { enabled: true, backups: backups.slice(0, 2).map(item =>
        ({ createdAt: item.LastModified, bytes: item.Size })) });
    } finally { config.s3.destroy(); }
  }
  if (path === '/api/admin/finance' && req.method === 'GET') {
    const [profile, totals, orders, taxCoverage] = await Promise.all([
      db.query('SELECT * FROM billing_profile WHERE id=true'),
      db.query(`SELECT count(*) FILTER (WHERE payment_status='paid' AND status!='cancelled')::integer AS paid_orders,
        coalesce(sum(total_cents) FILTER (WHERE payment_status='paid' AND status!='cancelled'),0)::bigint AS paid_total_cents,
        count(*) FILTER (WHERE payment_status IN ('awaiting_payment','pending'))::integer AS awaiting_orders,
        count(*) FILTER (WHERE payment_status='refunded')::integer AS refunded_orders
        FROM orders`),
      db.query(`SELECT o.id,o.number,o.customer_name,o.payment_status,o.status,o.total_cents,o.created_at,
        count(i.id) FILTER (WHERE i.tax_rate_bps IS NULL)::integer AS lines_without_tax,
        o.delivery_cents>0 AND o.delivery_tax_rate_bps IS NULL AS delivery_tax_missing
        FROM orders o LEFT JOIN order_items i ON i.order_id=o.id
        GROUP BY o.id ORDER BY o.created_at DESC LIMIT 50`),
      db.query(`SELECT count(*) FILTER (WHERE v.tax_rate_bps IS NULL)::integer AS missing_sku_rates,
        count(*)::integer AS active_skus FROM catalog_variants v
        JOIN catalog_products p ON p.id=v.product_id WHERE v.active=true AND p.active=true`)
    ]);
    return json(res, 200, { profile: profile.rows[0] || null, totals: totals.rows[0],
      orders: orders.rows, taxCoverage: taxCoverage.rows[0] });
  }
  if (path === '/api/admin/finance/settings' && req.method === 'PATCH') {
    const body = await readJson(req);
    const values = {
      legalName: cap(body.legalName, 160), taxId: cap(body.taxId, 40),
      streetAddress: cap(body.streetAddress, 200), postalCode: cap(body.postalCode, 20),
      city: cap(body.city, 100), province: cap(body.province, 100),
      contactEmail: normalizedEmail(cap(body.contactEmail, 160))
    };
    if (values.contactEmail && !validEmail(values.contactEmail)) bad('Некорректный email продавца');
    const deliveryTaxRate = body.deliveryTaxRateBps === null ? null : Number(body.deliveryTaxRateBps);
    if (deliveryTaxRate !== null && (!Number.isInteger(deliveryTaxRate) ||
      deliveryTaxRate < 0 || deliveryTaxRate > 10000)) bad('Некорректная ставка доставки');
    await db.query(`INSERT INTO billing_profile(id,legal_name,tax_id,street_address,postal_code,
      city,province,contact_email,delivery_tax_rate_bps) VALUES(true,$1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT(id) DO UPDATE SET legal_name=excluded.legal_name,tax_id=excluded.tax_id,
      street_address=excluded.street_address,postal_code=excluded.postal_code,
      city=excluded.city,province=excluded.province,contact_email=excluded.contact_email,
      delivery_tax_rate_bps=excluded.delivery_tax_rate_bps,updated_at=now()`,
    [values.legalName, values.taxId, values.streetAddress, values.postalCode,
      values.city, values.province, values.contactEmail, deliveryTaxRate]);
    await db.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,'billing_profile_updated','seller',$3)`,
    [randomUUID(), operator.id, { ...values, deliveryTaxRateBps: deliveryTaxRate }]);
    return json(res, 200, { ok: true });
  }
  const financeOrder = path.match(/^\/api\/admin\/finance\/orders\/([^/]+)$/);
  if (financeOrder && req.method === 'GET') {
    const orderId = decodeURIComponent(financeOrder[1]);
    if (!validUuid(orderId)) bad('Некорректный заказ');
    const [order, items, profile] = await Promise.all([
      db.query(`SELECT id,number,customer_name,payment_status,status,subtotal_cents,discount_cents,
        delivery_cents,delivery_tax_rate_bps,total_cents,created_at FROM orders WHERE id=$1`, [orderId]),
      db.query(`SELECT variant_id,name,variant_label,quantity,unit_price_cents,tax_rate_bps
        FROM order_items WHERE order_id=$1 ORDER BY id`, [orderId]),
      db.query('SELECT * FROM billing_profile WHERE id=true')
    ]);
    if (!order.rows.length) bad('Заказ не найден', 404);
    return json(res, 200, { order: order.rows[0],
      preview: financePreview(order.rows[0], items.rows, profile.rows[0] || {}) });
  }
  if (path === '/api/admin/customers' && req.method === 'GET') {
    const params = new URL(req.url || path, 'http://localhost').searchParams;
    const search = cap(params.get('q'), 100).toLocaleLowerCase('ru');
    const page = Number(params.get('page') || 0);
    if (!Number.isInteger(page) || page < 0 || page > 200) bad('Некорректная страница');
    const { rows } = await db.query(`SELECT c.id,c.email,c.name,c.phone,
      coalesce(nullif(c.phone,''),last_order_contact.phone,'') AS contact_phone,c.email_verified_at,
      c.google_sub IS NOT NULL AS google_linked,c.password_hash IS NOT NULL AS has_password,
      c.created_at,coalesce(pet_counts.pet_count,0)::integer AS pet_count,
      coalesce(order_counts.order_count,0)::integer AS order_count,
      coalesce(order_counts.paid_total_cents,0)::integer AS paid_total_cents,
      order_counts.last_order_at
      FROM customers c
      LEFT JOIN LATERAL (SELECT count(*)::integer AS pet_count FROM pets p
        WHERE p.customer_id=c.id) pet_counts ON true
      LEFT JOIN LATERAL (SELECT count(*)::integer AS order_count,
        coalesce(sum(o.total_cents) FILTER (WHERE o.payment_status='paid' AND o.status!='cancelled'),0)::integer AS paid_total_cents,
        max(o.created_at) AS last_order_at FROM orders o WHERE o.customer_id=c.id) order_counts ON true
      LEFT JOIN LATERAL (SELECT o.phone FROM orders o WHERE o.customer_id=c.id
        ORDER BY o.created_at DESC LIMIT 1) last_order_contact ON true
      WHERE $1='' OR strpos(lower(c.email),$1)>0 OR strpos(lower(c.name),$1)>0
        OR strpos(lower(coalesce(nullif(c.phone,''),last_order_contact.phone,'')),$1)>0
      ORDER BY coalesce(order_counts.last_order_at,c.created_at) DESC,c.id DESC
      LIMIT 51 OFFSET $2`, [search, page * 50]);
    return json(res, 200, { customers: rows.slice(0, 50), page, hasMore: rows.length > 50 });
  }
  const customerDetail = path.match(/^\/api\/admin\/customers\/([^/]+)$/);
  if (customerDetail && req.method === 'GET') {
    const customerId = decodeURIComponent(customerDetail[1]);
    if (!validUuid(customerId)) bad('Некорректный покупатель');
    const [account, pets, orders] = await Promise.all([
      db.query(`SELECT id,email,name,phone,email_verified_at,
        google_sub IS NOT NULL AS google_linked,password_hash IS NOT NULL AS has_password,created_at
        FROM customers WHERE id=$1`, [customerId]),
      db.query(`SELECT id,name,species,created_at FROM pets WHERE customer_id=$1
        ORDER BY created_at,name LIMIT 30`, [customerId]),
      db.query(`SELECT number,status,payment_status,total_cents,created_at
        FROM orders WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 30`, [customerId])
    ]);
    if (!account.rows.length) bad('Покупатель не найден', 404);
    return json(res, 200, { customer: account.rows[0], pets: pets.rows, orders: orders.rows });
  }
  if (path === '/api/admin/products' && req.method === 'GET') {
    const { rows } = await db.query(`SELECT p.id,p.name,p.brand,p.category,p.pet,p.image_path,
      p.description,p.details,p.food_type,p.active,
      coalesce(json_agg(json_build_object('id',v.id,'label',v.label,'active',v.active,
        'imagePath',v.image_path,'description',v.description,'details',v.details,
        'priceConfirmed',v.price_confirmed,'availability',v.availability,
        'reservedQuantity',v.reserved_quantity) ORDER BY v.display_priority DESC,v.label)
        FILTER (WHERE v.id IS NOT NULL),'[]'::json) AS variants
      FROM catalog_products p LEFT JOIN catalog_variants v ON v.product_id=p.id
      WHERE coalesce(p.source->>'gift','')='' AND coalesce(p.source->>'catalogHidden','false')!='true'
      GROUP BY p.id ORDER BY p.name LIMIT 2000`);
    return json(res, 200, { products: rows });
  }
  if (path === '/api/admin/brands/leonardo/import' && req.method === 'POST') {
    const payload = await readJson(req, 2000000);
    const result = await importSupplierCatalog(db, payload, operator.id);
    return json(res, result.alreadyImported ? 200 : 201, result);
  }
  if (path === '/api/admin/supplier-catalogs' && req.method === 'GET') {
    const { rows } = await db.query(`SELECT s.id,s.supplier_name,s.brand,s.price_date,s.source_file,
      s.shop_price_tax_basis,s.retail_price_tax_basis,s.imported_at,
      count(i.id)::integer AS item_count,count(m.item_id)::integer AS matched_count,
      count(m.item_id) FILTER (WHERE m.match_method='ean')::integer AS exact_count
      FROM supplier_catalog_sources s
      LEFT JOIN supplier_catalog_items i ON i.source_id=s.id
      LEFT JOIN supplier_catalog_matches m ON m.item_id=i.id
      GROUP BY s.id ORDER BY s.brand,s.price_date DESC,s.imported_at DESC`);
    return json(res, 200, { sources: rows });
  }
  if (path === '/api/admin/supplier-catalogs/import' && req.method === 'POST') {
    const payload = await readJson(req, 2000000);
    const result = await importSupplierCatalog(db, payload, operator.id);
    return json(res, result.alreadyImported ? 200 : 201, result);
  }
  const supplierCatalogDetail = path.match(/^\/api\/admin\/supplier-catalogs\/([a-z0-9-]+)$/);
  if (supplierCatalogDetail && req.method === 'GET') {
    const { rows: sources } = await db.query(`SELECT id,supplier_name,brand,price_date,source_file,
      shop_price_tax_basis,retail_price_tax_basis,imported_at FROM supplier_catalog_sources WHERE id=$1`,
    [supplierCatalogDetail[1]]);
    if (!sources.length) bad('Прайс не найден', 404);
    const { rows: items } = await db.query(`SELECT i.id,i.article,i.name,i.line,i.weight,i.ean,
      i.shop_price_cents,i.recommended_price_cents,i.minimum_price_cents,
      i.raw_prices,i.source_row,m.variant_id,m.match_method,
      p.id AS product_id,p.name AS site_name,v.label AS site_label,
      v.price_override_cents,v.source_price_cents,v.price_confirmed,
      v.availability,v.stock_quantity,v.reserved_quantity
      FROM supplier_catalog_items i
      LEFT JOIN supplier_catalog_matches m ON m.item_id=i.id
      LEFT JOIN catalog_variants v ON v.id=m.variant_id
      LEFT JOIN catalog_products p ON p.id=v.product_id
      WHERE i.source_id=$1 ORDER BY i.source_row`, [sources[0].id]);
    return json(res, 200, { source: sources[0], items });
  }
  if (path === '/api/admin/brands/leonardo' && req.method === 'GET') {
    const source = await latestLeonardoSource(db);
    const sourceId = source?.id || '';
    const [items, site] = await Promise.all([
      db.query(`SELECT i.id,i.article,i.name,i.line,i.weight,i.ean,i.shop_price_cents,
        i.recommended_price_cents,i.minimum_price_cents,i.source_row,
        m.variant_id,m.match_method,p.id AS product_id,p.name AS site_name,
        p.active AS product_active,v.label AS site_label,v.active AS variant_active,
        v.price_override_cents,v.source_price_cents,v.price_confirmed,
        v.availability,v.stock_quantity,v.reserved_quantity,
        coalesce(sales.quantity,0)::integer AS sold_quantity,
        coalesce(sales.order_count,0)::integer AS customer_order_count,
        coalesce(purchases.ordered_quantity,0)::integer AS ordered_quantity,
        coalesce(purchases.received_quantity,0)::integer AS purchased_quantity,
        coalesce(purchases.order_count,0)::integer AS purchase_order_count
        FROM supplier_catalog_items i
        LEFT JOIN supplier_catalog_matches m ON m.item_id=i.id
        LEFT JOIN catalog_variants v ON v.id=m.variant_id
        LEFT JOIN catalog_products p ON p.id=v.product_id
        LEFT JOIN LATERAL (SELECT sum(oi.quantity) AS quantity,
          count(DISTINCT oi.order_id) AS order_count FROM order_items oi
          JOIN orders o ON o.id=oi.order_id WHERE oi.variant_id=v.id
          AND o.payment_status='paid' AND o.status!='cancelled') sales ON true
        LEFT JOIN LATERAL (SELECT sum(poi.ordered_quantity) AS ordered_quantity,
          sum(poi.received_quantity) AS received_quantity,
          count(DISTINCT poi.purchase_order_id) AS order_count
          FROM purchase_order_items poi JOIN purchase_orders po ON po.id=poi.purchase_order_id
          WHERE poi.variant_id=v.id AND po.status IN ('ordered','partially_received','received')) purchases ON true
        WHERE i.source_id=$1 ORDER BY i.line,i.name,i.weight`, [sourceId]),
      db.query(`SELECT v.id AS variant_id,v.product_id,p.name,p.active AS product_active,
        v.label,v.active AS variant_active,v.price_override_cents,v.source_price_cents,
        v.price_confirmed,v.availability,v.stock_quantity,v.reserved_quantity,
        m.item_id,m.match_method,
        coalesce(sales.quantity,0)::integer AS sold_quantity,
        coalesce(sales.order_count,0)::integer AS customer_order_count,
        coalesce(purchases.ordered_quantity,0)::integer AS ordered_quantity,
        coalesce(purchases.received_quantity,0)::integer AS purchased_quantity,
        coalesce(purchases.order_count,0)::integer AS purchase_order_count
        FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
        LEFT JOIN supplier_catalog_matches m ON m.variant_id=v.id AND m.source_id=$1
        LEFT JOIN LATERAL (SELECT sum(oi.quantity) AS quantity,
          count(DISTINCT oi.order_id) AS order_count FROM order_items oi
          JOIN orders o ON o.id=oi.order_id WHERE oi.variant_id=v.id
          AND o.payment_status='paid' AND o.status!='cancelled') sales ON true
        LEFT JOIN LATERAL (SELECT sum(poi.ordered_quantity) AS ordered_quantity,
          sum(poi.received_quantity) AS received_quantity,
          count(DISTINCT poi.purchase_order_id) AS order_count
          FROM purchase_order_items poi JOIN purchase_orders po ON po.id=poi.purchase_order_id
          WHERE poi.variant_id=v.id AND po.status IN ('ordered','partially_received','received')) purchases ON true
        WHERE lower(p.brand)='leonardo' ORDER BY p.name,v.label`, [sourceId])
    ]);
    return json(res, 200, { source: source || { supplier_name: 'Albet', brand: 'Leonardo',
      price_date: null, source_file: '' }, items: items.rows, siteVariants: site.rows });
  }
  const supplierMatch = path.match(/^\/api\/admin\/brands\/leonardo\/items\/([0-9]+)\/match$/);
  if (supplierMatch && req.method === 'PUT') {
    const body = await readJson(req);
    const variantId = cap(body.variantId, 180);
    const sourceId = (await latestLeonardoSource(db))?.id;
    if (!sourceId) bad('Сначала загрузите прайс Leonardo', 409);
    const itemId = `${sourceId}:${supplierMatch[1]}`;
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const item = await client.query('SELECT id FROM supplier_catalog_items WHERE id=$1 FOR UPDATE', [itemId]);
      if (!item.rowCount) bad('Позиция прайса не найдена', 404);
      if (variantId) {
        const variant = await client.query(`SELECT v.id FROM catalog_variants v
          JOIN catalog_products p ON p.id=v.product_id WHERE v.id=$1 AND lower(p.brand)='leonardo'`, [variantId]);
        if (!variant.rowCount) bad('Выберите SKU Leonardo', 400);
      }
      await client.query('DELETE FROM supplier_catalog_matches WHERE item_id=$1', [itemId]);
      if (variantId) await client.query(`INSERT INTO supplier_catalog_matches
        (item_id,source_id,variant_id,match_method,matched_by)
        VALUES($1,$2,$3,'manual',$4)`, [itemId, sourceId, variantId, operator.id]);
      await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
        VALUES($1,$2,'supplier_catalog_match',$3,$4)`,
      [randomUUID(), operator.id, itemId, { variantId: variantId || null }]);
      await client.query('COMMIT');
      return json(res, 200, { ok: true });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') bad('Этот SKU уже связан с другой строкой прайса', 409);
      throw error;
    } finally { client.release(); }
  }
  const supplierDraft = path.match(/^\/api\/admin\/brands\/leonardo\/items\/([0-9]+)\/draft$/);
  if (supplierDraft && req.method === 'POST') {
    const sourceId = (await latestLeonardoSource(db))?.id;
    if (!sourceId) bad('Сначала загрузите прайс Leonardo', 409);
    const itemId = `${sourceId}:${supplierDraft[1]}`;
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(`SELECT i.* FROM supplier_catalog_items i
        LEFT JOIN supplier_catalog_matches m ON m.item_id=i.id
        WHERE i.id=$1 AND m.item_id IS NULL FOR UPDATE OF i`, [itemId]);
      if (!rows.length) bad('Позиция уже связана с товаром или не найдена', 409);
      const item = rows[0];
      const productId = `cmd-${randomUUID()}`;
      const variantId = `cmd-sku-${randomUUID()}`;
      const foodType = /seco|fresh meat|\bgf\b/i.test(item.line) ? 'dry' : 'wet';
      await client.query(`INSERT INTO catalog_products(id,name,brand,category,pet,food_type,active)
        VALUES($1,$2,'Leonardo','Корм','cat',$3,false)`, [productId, item.name, foodType]);
      await client.query(`INSERT INTO catalog_variants(id,product_id,label,source_orderable,
        availability,price_confirmed,active) VALUES($1,$2,$3,true,'unavailable',false,true)`,
      [variantId, productId, item.weight || '1 шт']);
      await client.query(`INSERT INTO supplier_catalog_matches
        (item_id,source_id,variant_id,match_method,matched_by)
        VALUES($1,$2,$3,'draft',$4)`, [itemId, sourceId, variantId, operator.id]);
      await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
        VALUES($1,$2,'supplier_catalog_draft_created',$3,$4)`,
      [randomUUID(), operator.id, productId, { itemId, variantId }]);
      await client.query('COMMIT');
      return json(res, 201, { productId, variantId });
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  if (path === '/api/admin/products' && req.method === 'POST') {
    const body = await readJson(req);
    const fields = productFields(body);
    const label = cap(body.variantLabel, 100);
    if (!label) bad('Укажите первый вариант товара');
    const productId = `cmd-${randomUUID()}`;
    const variantId = `cmd-sku-${randomUUID()}`;
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(`INSERT INTO catalog_products(id,name,brand,category,pet,image_path,
        description,details,food_type,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,false)`,
      [productId, fields.name, fields.brand, fields.category, fields.pet, fields.imagePath,
        fields.description, JSON.stringify(fields.details), fields.foodType]);
      await client.query(`INSERT INTO catalog_variants(id,product_id,label,source_orderable,availability)
        VALUES($1,$2,$3,true,'source_on_demand')`, [variantId, productId, label]);
      await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
        VALUES($1,$2,'product_created',$3,$4)`, [randomUUID(), operator.id, productId,
        { name: fields.name, variantId }]);
      await client.query('COMMIT');
      return json(res, 201, { id: productId, variantId });
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  const productMeta = path.match(/^\/api\/admin\/products\/([^/]+)$/);
  if (productMeta && req.method === 'PATCH') {
    const body = await readJson(req);
    const fields = productFields(body);
    const productId = decodeURIComponent(productMeta[1]);
    const active = body.active === true;
    if (active && !fields.imagePath) bad('Добавьте фото перед публикацией');
    const { rowCount } = await db.query(`UPDATE catalog_products SET name=$1,brand=$2,category=$3,
      pet=$4,image_path=$5,description=$6,details=$7,food_type=$8,active=$9 WHERE id=$10`,
    [fields.name, fields.brand, fields.category, fields.pet, fields.imagePath,
      fields.description, JSON.stringify(fields.details), fields.foodType, active, productId]);
    if (!rowCount) bad('Товар не найден', 404);
    await db.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,'product_updated',$3,$4)`, [randomUUID(), operator.id, productId,
      { ...fields, active }]);
    return json(res, 200, { ok: true });
  }
  const newVariant = path.match(/^\/api\/admin\/products\/([^/]+)\/variants$/);
  if (newVariant && req.method === 'POST') {
    const productId = decodeURIComponent(newVariant[1]);
    const body = await readJson(req);
    const label = cap(body.label, 100);
    if (!label) bad('Укажите фасовку или вариант');
    const variantId = `cmd-sku-${randomUUID()}`;
    const { rowCount } = await db.query(`INSERT INTO catalog_variants(id,product_id,label,source_orderable,
      availability) SELECT $1,id,$3,true,'source_on_demand' FROM catalog_products WHERE id=$2`,
    [variantId, productId, label]);
    if (!rowCount) bad('Товар не найден', 404);
    await db.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,'variant_created',$3,$4)`, [randomUUID(), operator.id, variantId, { productId, label }]);
    return json(res, 201, { id: variantId });
  }
  const variantMeta = path.match(/^\/api\/admin\/variants\/([^/]+)\/metadata$/);
  if (variantMeta && req.method === 'PATCH') {
    const body = await readJson(req);
    const label = cap(body.label, 100);
    if (!label) bad('Укажите фасовку или вариант');
    const variantId = decodeURIComponent(variantMeta[1]);
    const active = body.active === true;
    const imagePath = catalogImagePath(body.imagePath);
    const description = cap(body.description, 3000);
    const details = Array.isArray(body.details) ? body.details.map(item => cap(item, 300)).filter(Boolean).slice(0, 20) : [];
    const { rowCount } = await db.query(`UPDATE catalog_variants SET label=$1,active=$2,image_path=$3,
      description=$4,details=$5,updated_at=now() WHERE id=$6`,
    [label, active, imagePath || null, description, JSON.stringify(details), variantId]);
    if (!rowCount) bad('Вариант не найден', 404);
    await db.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,'variant_metadata_updated',$3,$4)`, [randomUUID(), operator.id, variantId,
      { label, active, imagePath, description, details }]);
    return json(res, 200, { ok: true });
  }
  if (path === '/api/admin/overview' && req.method === 'GET') {
    const [catalog, orders, requests, top, purchases, coverage, customers] = await Promise.all([
      db.query(`SELECT count(*)::integer AS total,
        count(*) FILTER (WHERE v.price_confirmed=false)::integer AS unconfirmed_prices,
        count(*) FILTER (WHERE v.purchase_price_cents IS NULL AND so.cost_cents IS NULL)::integer AS missing_costs,
        count(*) FILTER (WHERE v.tax_rate_bps IS NULL)::integer AS missing_tax_rates,
        count(*) FILTER (WHERE so.id IS NULL)::integer AS missing_suppliers,
        count(*) FILTER (WHERE v.availability='on_hand' AND
          coalesce(v.stock_quantity,0)-v.reserved_quantity<=v.reorder_point)::integer AS low_stock
        FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
        LEFT JOIN supplier_offers so ON so.variant_id=v.id AND so.preferred=true
        WHERE p.active=true AND v.active=true`),
      db.query(`SELECT count(*) FILTER (WHERE status IN ('received','packing','delivering'))::integer AS open_orders,
        count(*) FILTER (WHERE payment_status='paid' AND status!='cancelled' AND
          created_at>=now()-interval '30 days')::integer AS paid_orders_30d,
        coalesce(sum(total_cents) FILTER (WHERE payment_status='paid' AND
          status!='cancelled' AND created_at>=now()-interval '30 days'),0)::integer AS paid_total_30d
        FROM orders`),
      db.query("SELECT count(*)::integer AS new_requests FROM service_requests WHERE status='new'"),
      db.query(`SELECT i.variant_id,i.name,sum(i.quantity)::integer AS quantity
        FROM order_items i JOIN orders o ON o.id=i.order_id
        WHERE o.payment_status='paid' AND o.status!='cancelled'
        GROUP BY i.variant_id,i.name ORDER BY quantity DESC LIMIT 5`),
      db.query(`SELECT count(*)::integer AS open_purchase_orders FROM purchase_orders
        WHERE status IN ('draft','ordered','partially_received')`),
      db.query(`SELECT p.pet,p.category,count(DISTINCT p.id)::integer AS products,
        count(v.id)::integer AS variants,
        count(v.id) FILTER (WHERE v.price_confirmed=false)::integer AS unconfirmed_prices,
        count(v.id) FILTER (WHERE so.id IS NULL)::integer AS missing_suppliers
        FROM catalog_products p JOIN catalog_variants v ON v.product_id=p.id
        LEFT JOIN supplier_offers so ON so.variant_id=v.id AND so.preferred=true
        WHERE p.active=true AND v.active=true
        GROUP BY p.pet,p.category ORDER BY p.pet,p.category`),
      db.query('SELECT count(*)::integer AS registered FROM customers')
    ]);
    return json(res, 200, { catalog: catalog.rows[0], orders: orders.rows[0],
      requests: requests.rows[0], topPaidSkus: top.rows, purchases: purchases.rows[0],
      coverage: coverage.rows, customers: customers.rows[0] });
  }
  if (path === '/api/admin/sku-audit' && req.method === 'GET') {
    const { rows } = await db.query(`SELECT v.id AS variant_id,v.product_id,p.name,p.brand,p.category,p.pet,
      v.label,v.source_price_cents,v.price_override_cents,v.purchase_price_cents,
      v.price_confirmed,v.source_orderable,v.availability,v.stock_quantity,v.reserved_quantity,v.tax_rate_bps,
      v.display_priority,v.review_note,v.reviewed_at,
      so.cost_cents AS supplier_cost_cents,so.vat_included AS supplier_vat_included,
      so.checked_at AS supplier_checked_at,s.name AS supplier_name
      FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
      LEFT JOIN supplier_offers so ON so.variant_id=v.id AND so.preferred=true
      LEFT JOIN suppliers s ON s.id=so.supplier_id
      WHERE p.active=true AND v.active=true
      ORDER BY p.name,v.label LIMIT 2000`);
    return json(res, 200, { variants: rows });
  }
  if (path === '/api/admin/replenishment' && req.method === 'GET') {
    const { rows } = await db.query(`SELECT v.id AS variant_id,v.product_id,p.name,p.brand,p.pet,
      v.label,v.stock_quantity,v.reserved_quantity,v.reorder_point,v.target_stock,
      coalesce(v.stock_quantity,0)-v.reserved_quantity AS available_quantity,
      incoming.incoming_quantity,
      CASE WHEN v.target_stock-(coalesce(v.stock_quantity,0)-v.reserved_quantity+
        incoming.incoming_quantity)<=0 THEN 0
        ELSE least(99999,greatest(v.target_stock-(coalesce(v.stock_quantity,0)-v.reserved_quantity+
          incoming.incoming_quantity),coalesce(so.minimum_quantity,1))) END::integer AS suggested_quantity,
      s.id AS supplier_id,s.name AS supplier_name,s.lead_days,
      so.cost_cents,so.vat_included,so.minimum_quantity,so.checked_at
      FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
      LEFT JOIN supplier_offers so ON so.variant_id=v.id AND so.preferred=true
      LEFT JOIN suppliers s ON s.id=so.supplier_id
      LEFT JOIN LATERAL (SELECT coalesce(sum(poi.ordered_quantity-poi.received_quantity),0)::integer
        AS incoming_quantity FROM purchase_order_items poi
        JOIN purchase_orders po ON po.id=poi.purchase_order_id
        WHERE poi.variant_id=v.id AND po.status IN ('ordered','partially_received')) incoming ON true
      WHERE p.active=true AND v.active=true AND v.availability='on_hand'
        AND coalesce(v.stock_quantity,0)-v.reserved_quantity<=v.reorder_point
      ORDER BY available_quantity,p.name,v.label LIMIT 500`);
    return json(res, 200, { variants: rows });
  }
  const review = path.match(/^\/api\/admin\/variants\/([^/]+)\/review$/);
  if (review && req.method === 'PATCH') {
    const body = await readJson(req);
    const priority = Number(body.priority);
    const note = cap(body.note, 500);
    if (!Number.isInteger(priority) || priority < 0 || priority > 999) bad('Приоритет должен быть от 0 до 999');
    const variantId = decodeURIComponent(review[1]);
    const { rowCount } = await db.query(`UPDATE catalog_variants
      SET display_priority=$1,review_note=$2,reviewed_at=now(),updated_at=now() WHERE id=$3`,
    [priority, note, variantId]);
    if (!rowCount) bad('Вариант не найден', 404);
    await db.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,'variant_review',$3,$4)`,
    [randomUUID(), operator.id, variantId, { priority, note }]);
    return json(res, 200, { ok: true });
  }
  if (path === '/api/admin/suppliers' && req.method === 'GET') {
    const { rows } = await db.query(`SELECT s.*,count(o.id)::integer AS offer_count
      FROM suppliers s LEFT JOIN supplier_offers o ON o.supplier_id=s.id
      GROUP BY s.id ORDER BY s.name`);
    return json(res, 200, { suppliers: rows });
  }
  if (path === '/api/admin/suppliers' && req.method === 'POST') {
    const body = await readJson(req);
    const name = cap(body.name, 120);
    if (name.length < 2) bad('Укажите название поставщика');
    const email = cap(body.email, 160);
    if (email && !validEmail(normalizedEmail(email))) bad('Некорректный email');
    const kind = cap(body.kind, 20) || 'distributor';
    const stage = cap(body.stage, 20) || 'lead';
    if (!['distributor','brand'].includes(kind) ||
      !['lead','contacted','onboarding','catalog','ready','paused'].includes(stage))
      bad('Проверьте тип и этап поставщика');
    const leadDays = body.leadDays === null || body.leadDays === '' ? null : Number(body.leadDays);
    if (leadDays !== null && (!Number.isInteger(leadDays) || leadDays < 0 || leadDays > 365))
      bad('Некорректный срок поставки');
    const id = randomUUID();
    try {
      await db.query(`INSERT INTO suppliers
        (id,name,contact_name,email,phone,website,terms,notes,kind,stage,lead_days,active)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [id, name, cap(body.contactName, 120), normalizedEmail(email), cap(body.phone, 60),
        optionalWebUrl(body.website), cap(body.terms, 1000), cap(body.notes, 1500),
        kind, stage, leadDays, body.active === true]);
    } catch (error) { if (error.code === '23505') bad('Поставщик уже существует', 409); throw error; }
    await db.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,'supplier_created',$3,$4)`, [randomUUID(), operator.id, id, { name }]);
    return json(res, 201, { id });
  }
  const supplier = path.match(/^\/api\/admin\/suppliers\/([a-f0-9-]+)$/);
  if (supplier && req.method === 'PATCH') {
    const body = await readJson(req);
    const name = cap(body.name, 120);
    const email = normalizedEmail(body.email);
    const leadDays = body.leadDays === null || body.leadDays === '' ? null : Number(body.leadDays);
    const kind = cap(body.kind, 20) || 'distributor';
    const stage = cap(body.stage, 20) || 'lead';
    if (name.length < 2 || (email && !validEmail(email)) ||
      (leadDays !== null && (!Number.isInteger(leadDays) || leadDays < 0 || leadDays > 365)) ||
      !['distributor','brand'].includes(kind) ||
      !['lead','contacted','onboarding','catalog','ready','paused'].includes(stage))
      bad('Проверьте данные поставщика');
    const { rowCount } = await db.query(`UPDATE suppliers SET name=$1,contact_name=$2,email=$3,
      phone=$4,website=$5,terms=$6,notes=$7,kind=$8,stage=$9,lead_days=$10,
      active=$11,updated_at=now() WHERE id=$12`,
    [name, cap(body.contactName, 120), email, cap(body.phone, 60), optionalWebUrl(body.website),
      cap(body.terms, 1000), cap(body.notes, 1500), kind, stage, leadDays,
      body.active === true, supplier[1]]);
    if (!rowCount) bad('Поставщик не найден', 404);
    await db.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,'supplier_updated',$3,$4)`, [randomUUID(), operator.id, supplier[1], { name }]);
    return json(res, 200, { ok: true });
  }
  if (path === '/api/admin/supplier-offers' && req.method === 'GET') {
    const variantId = cap(new URL(req.url, 'http://localhost').searchParams.get('variantId'), 180);
    if (!variantId) bad('Укажите вариант');
    const { rows } = await db.query(`SELECT o.*,s.name AS supplier_name FROM supplier_offers o
      JOIN suppliers s ON s.id=o.supplier_id WHERE o.variant_id=$1 ORDER BY o.preferred DESC,s.name`, [variantId]);
    return json(res, 200, { offers: rows });
  }
  if (path === '/api/admin/supplier-offers' && req.method === 'PUT') {
    const body = await readJson(req);
    const variantId = cap(body.variantId, 180);
    const supplierId = cap(body.supplierId, 36);
    const cost = body.costCents === null || body.costCents === '' ? null : Number(body.costCents);
    const minimum = Number(body.minimumQuantity ?? 1);
    if (!variantId || !validUuid(supplierId) ||
      (cost !== null && (!Number.isInteger(cost) || cost < 0 || cost > 100000000)) ||
      !Number.isInteger(minimum) || minimum < 1 || minimum > 99999) bad('Проверьте предложение');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const variantRow = await client.query('SELECT id FROM catalog_variants WHERE id=$1 FOR UPDATE', [variantId]);
      if (!variantRow.rows.length) bad('Вариант не найден', 404);
      const supplierRow = await client.query('SELECT id FROM suppliers WHERE id=$1 AND active=true', [supplierId]);
      if (!supplierRow.rows.length) bad('Поставщик не найден', 404);
      if (body.preferred === true) await client.query('UPDATE supplier_offers SET preferred=false WHERE variant_id=$1', [variantId]);
      await client.query(`INSERT INTO supplier_offers(id,supplier_id,variant_id,cost_cents,vat_included,
        minimum_quantity,source_url,note,preferred,checked_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT(supplier_id,variant_id) DO UPDATE SET cost_cents=EXCLUDED.cost_cents,
          vat_included=EXCLUDED.vat_included,minimum_quantity=EXCLUDED.minimum_quantity,
          source_url=EXCLUDED.source_url,note=EXCLUDED.note,preferred=EXCLUDED.preferred,
          checked_at=EXCLUDED.checked_at,updated_at=now()`,
      [randomUUID(), supplierId, variantId, cost, body.vatIncluded !== false, minimum,
        optionalWebUrl(body.sourceUrl), cap(body.note, 500), body.preferred === true,
        cost === null ? null : new Date()]);
      await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
        VALUES($1,$2,'supplier_offer_saved',$3,$4)`, [randomUUID(), operator.id, variantId,
        { supplierId, costCents: cost, preferred: body.preferred === true }]);
      await client.query('COMMIT');
      return json(res, 200, { ok: true });
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  if (path === '/api/admin/purchase-order-candidates' && req.method === 'GET') {
    const supplierId = cap(new URL(req.url, 'http://localhost').searchParams.get('supplierId'), 36);
    if (!validUuid(supplierId)) bad('Выберите поставщика');
    const { rows } = await db.query(`SELECT v.id AS variant_id,p.name,p.brand,v.label,
      so.cost_cents,so.vat_included,so.minimum_quantity,
      v.stock_quantity,v.reserved_quantity
      FROM supplier_offers so JOIN catalog_variants v ON v.id=so.variant_id
      JOIN catalog_products p ON p.id=v.product_id
      WHERE so.supplier_id=$1 AND so.cost_cents IS NOT NULL AND p.active=true AND v.active=true
      ORDER BY p.name,v.label LIMIT 2000`, [supplierId]);
    return json(res, 200, { variants: rows });
  }
  if (path === '/api/admin/purchase-orders' && req.method === 'GET') {
    const { rows } = await db.query(`SELECT po.id,po.number,po.status,po.note,po.expected_date,
      po.ordered_at,po.created_at,s.id AS supplier_id,s.name AS supplier_name,
      coalesce((SELECT json_agg(json_build_object('id',i.id,'variantId',i.variant_id,
        'name',i.name_snapshot,'label',i.variant_label_snapshot,
        'orderedQuantity',i.ordered_quantity,'receivedQuantity',i.received_quantity,
        'unitCostCents',i.unit_cost_cents,'vatIncluded',i.vat_included)
        ORDER BY i.name_snapshot,i.variant_label_snapshot)
        FROM purchase_order_items i WHERE i.purchase_order_id=po.id),'[]'::json) AS items
      FROM purchase_orders po JOIN suppliers s ON s.id=po.supplier_id
      ORDER BY po.created_at DESC LIMIT 100`);
    return json(res, 200, { orders: rows });
  }
  if (path === '/api/admin/purchase-orders' && req.method === 'POST') {
    const body = await readJson(req);
    const supplierId = cap(body.supplierId, 36);
    const note = cap(body.note, 500);
    const expectedDate = String(body.expectedDate || '').trim() || null;
    const key = cap(body.idempotencyKey, 100);
    if (!validUuid(supplierId) ||
      !/^[a-zA-Z0-9_-]{20,100}$/.test(key) ||
      !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50)
      bad('Проверьте заявку поставщику');
    if (expectedDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expectedDate)) bad('Проверьте дату поставки');
      const [year, month, day] = expectedDate.split('-').map(Number);
      const parsed = new Date(Date.UTC(year, month - 1, day));
      if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month ||
        parsed.getUTCDate() !== day) bad('Проверьте дату поставки');
    }
    const items = body.items.map(item => ({ variantId: cap(item?.variantId, 180),
      quantity: Number(item?.quantity) }));
    if (items.some(item => !item.variantId || !Number.isInteger(item.quantity) ||
      item.quantity < 1 || item.quantity > 99999) ||
      new Set(items.map(item => item.variantId)).size !== items.length)
      bad('Проверьте товары и количество');
    const canonicalItems = [...items].sort((a, b) => a.variantId.localeCompare(b.variantId));
    const requestHash = createHash('sha256').update(JSON.stringify({ supplierId, note,
      expectedDate, items: canonicalItems })).digest('hex');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const prior = await client.query(`SELECT id,number,request_hash FROM purchase_orders
        WHERE creation_key=$1`, [key]);
      if (prior.rows[0]) {
        if (prior.rows[0].request_hash !== requestHash) bad('Ключ заявки уже использован с другими данными', 409);
        await client.query('COMMIT');
        return json(res, 200, { id: prior.rows[0].id, number: prior.rows[0].number,
          alreadyRecorded: true });
      }
      const supplier = await client.query('SELECT id FROM suppliers WHERE id=$1 AND active=true', [supplierId]);
      if (!supplier.rows.length) bad('Поставщик не найден', 404);
      const offers = await client.query(`SELECT so.variant_id,so.cost_cents,so.vat_included,
        so.minimum_quantity,p.name,v.label
        FROM supplier_offers so JOIN catalog_variants v ON v.id=so.variant_id
        JOIN catalog_products p ON p.id=v.product_id
        WHERE so.supplier_id=$1 AND so.variant_id=ANY($2::text[])
          AND p.active=true AND v.active=true FOR SHARE OF so`,
      [supplierId, items.map(item => item.variantId)]);
      const offerByVariant = new Map(offers.rows.map(item => [item.variant_id, item]));
      if (offerByVariant.size !== items.length) bad('У поставщика нет предложения для одного из SKU', 409);
      for (const item of items) {
        const offer = offerByVariant.get(item.variantId);
        if (offer.cost_cents === null || item.quantity < offer.minimum_quantity)
          bad('Укажите закупочную цену и соблюдайте минимальную партию', 409);
      }
      const number = (await client.query("SELECT 'PUR-' || nextval('purchase_order_number_seq') AS number")).rows[0].number;
      const orderId = randomUUID();
      const inserted = await client.query(`INSERT INTO purchase_orders
        (id,number,supplier_id,created_by,creation_key,request_hash,note,expected_date)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT(creation_key) DO NOTHING RETURNING id`,
      [orderId, number, supplierId, operator.id, key, requestHash, note, expectedDate]);
      if (!inserted.rows.length) {
        const duplicate = await client.query(`SELECT id,number,request_hash FROM purchase_orders
          WHERE creation_key=$1`, [key]);
        if (duplicate.rows[0]?.request_hash !== requestHash)
          bad('Ключ заявки уже использован с другими данными', 409);
        await client.query('COMMIT');
        return json(res, 200, { id: duplicate.rows[0].id, number: duplicate.rows[0].number,
          alreadyRecorded: true });
      }
      for (const item of canonicalItems) {
        const offer = offerByVariant.get(item.variantId);
        await client.query(`INSERT INTO purchase_order_items
          (id,purchase_order_id,variant_id,name_snapshot,variant_label_snapshot,
          ordered_quantity,unit_cost_cents,vat_included)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [randomUUID(), orderId, item.variantId,
          offer.name, offer.label, item.quantity, offer.cost_cents, offer.vat_included]);
      }
      await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
        VALUES($1,$2,'purchase_order_created',$3,$4)`, [randomUUID(), operator.id, orderId,
        { number, supplierId, items: canonicalItems }]);
      await client.query('COMMIT');
      return json(res, 201, { id: orderId, number });
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  const purchaseStatus = path.match(/^\/api\/admin\/purchase-orders\/([a-f0-9-]+)\/status$/);
  if (purchaseStatus && req.method === 'PATCH') {
    if (!validUuid(purchaseStatus[1])) bad('Заявка не найдена', 404);
    const body = await readJson(req);
    if (!['ordered','cancelled'].includes(body.status)) bad('Некорректный статус заявки');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(`SELECT id,status FROM purchase_orders WHERE id=$1 FOR UPDATE`,
        [purchaseStatus[1]]);
      const order = result.rows[0];
      if (!order) bad('Заявка не найдена', 404);
      if (order.status === body.status) { await client.query('COMMIT'); return json(res, 200, { ok: true }); }
      if (body.status === 'ordered' && order.status !== 'draft')
        bad('Заказать можно только черновик', 409);
      if (body.status === 'cancelled' && !['draft','ordered','partially_received'].includes(order.status))
        bad('Эту заявку нельзя закрыть', 409);
      await client.query(`UPDATE purchase_orders SET status=$1,
        ordered_at=CASE WHEN $1='ordered' THEN now() ELSE ordered_at END,
        updated_at=now() WHERE id=$2`, [body.status, order.id]);
      await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
        VALUES($1,$2,'purchase_order_status',$3,$4)`, [randomUUID(), operator.id, order.id,
        { from: order.status, to: body.status }]);
      await client.query('COMMIT');
      return json(res, 200, { ok: true });
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  const purchaseReceipt = path.match(/^\/api\/admin\/purchase-orders\/([a-f0-9-]+)\/receipts$/);
  if (purchaseReceipt && req.method === 'POST') {
    if (!validUuid(purchaseReceipt[1])) bad('Заявка не найдена', 404);
    const body = await readJson(req);
    const itemId = cap(body.itemId, 36);
    const quantity = Number(body.quantity);
    const key = cap(body.idempotencyKey, 100);
    const note = cap(body.note, 300);
    if (!validUuid(itemId) || !Number.isInteger(quantity) ||
      quantity < 1 || quantity > 99999 || !/^[a-zA-Z0-9_-]{20,100}$/.test(key))
      bad('Проверьте приёмку заявки');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const found = await client.query(`SELECT id,status,supplier_id FROM purchase_orders
        WHERE id=$1 FOR UPDATE`, [purchaseReceipt[1]]);
      const order = found.rows[0];
      if (!order) bad('Заявка не найдена', 404);
      const duplicate = await client.query(`SELECT id,purchase_order_item_id,delta_on_hand,note
        FROM inventory_movements WHERE idempotency_key=$1`, [key]);
      if (duplicate.rows[0]) {
        const previous = duplicate.rows[0];
        if (previous.purchase_order_item_id !== itemId || previous.delta_on_hand !== quantity ||
          previous.note !== note) bad('Ключ приёмки уже использован с другими данными', 409);
        await client.query('COMMIT');
        return json(res, 200, { ok: true, alreadyRecorded: true });
      }
      if (!['ordered','partially_received'].includes(order.status))
        bad('Приёмка доступна после отметки о заказе поставщику', 409);
      const selected = await client.query(`SELECT id,variant_id,ordered_quantity,received_quantity,
        unit_cost_cents FROM purchase_order_items
        WHERE id=$1 AND purchase_order_id=$2 FOR UPDATE`, [itemId, order.id]);
      const item = selected.rows[0];
      if (!item) bad('SKU не найден в заявке', 404);
      if (item.received_quantity + quantity > item.ordered_quantity)
        bad('Количество превышает остаток по заявке', 409);
      const changed = await client.query(`UPDATE catalog_variants
        SET stock_quantity=coalesce(stock_quantity,0)+$1,availability='on_hand',updated_at=now()
        WHERE id=$2 RETURNING stock_quantity,reserved_quantity`, [quantity, item.variant_id]);
      if (!changed.rows.length) bad('SKU больше нет в каталоге. Проверьте заявку', 409);
      await client.query(`UPDATE purchase_order_items SET received_quantity=received_quantity+$1
        WHERE id=$2`, [quantity, item.id]);
      await recordInventoryMovement(client, { variantId: item.variant_id, staffId: operator.id,
        supplierId: order.supplier_id, purchaseOrderItemId: item.id,
        unitCostCents: item.unit_cost_cents, idempotencyKey: key, reason: 'receipt',
        deltaOnHand: quantity, onHandAfter: changed.rows[0].stock_quantity,
        reservedAfter: changed.rows[0].reserved_quantity, note });
      const summary = await client.query(`SELECT bool_and(received_quantity=ordered_quantity) AS complete
        FROM purchase_order_items WHERE purchase_order_id=$1`, [order.id]);
      const next = summary.rows[0].complete ? 'received' : 'partially_received';
      await client.query(`UPDATE purchase_orders SET status=$1,updated_at=now() WHERE id=$2`, [next, order.id]);
      await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
        VALUES($1,$2,'purchase_order_received',$3,$4)`, [randomUUID(), operator.id, order.id,
        { itemId, quantity, status: next }]);
      await client.query('COMMIT');
      return json(res, 201, { ok: true, status: next });
    } catch (error) { await client.query('ROLLBACK');
      if (error.code === '23505') bad('Приёмка уже записана. Обновите заявку', 409);
      throw error;
    } finally { client.release(); }
  }
  if (path === '/api/admin/inventory-movements' && req.method === 'GET') {
    const variantId = cap(new URL(req.url, 'http://localhost').searchParams.get('variantId'), 180);
    if (!variantId) bad('Укажите вариант');
    const { rows } = await db.query(`SELECT m.id,m.variant_id,m.reason,m.delta_on_hand,m.delta_reserved,
      m.on_hand_after,m.reserved_after,m.unit_cost_cents,m.note,m.created_at,
      o.number AS order_number,po.number AS purchase_order_number,
      s.name AS supplier_name,a.email AS staff_email
      FROM inventory_movements m LEFT JOIN orders o ON o.id=m.order_id
      LEFT JOIN purchase_order_items poi ON poi.id=m.purchase_order_item_id
      LEFT JOIN purchase_orders po ON po.id=poi.purchase_order_id
      LEFT JOIN suppliers s ON s.id=m.supplier_id
      LEFT JOIN staff_accounts a ON a.id=m.staff_id
      WHERE m.variant_id=$1 ORDER BY m.created_at DESC LIMIT 100`, [variantId]);
    return json(res, 200, { movements: rows });
  }
  if (path === '/api/admin/inventory-receipts' && req.method === 'POST') {
    const body = await readJson(req);
    const variantId = cap(body.variantId, 180);
    const supplierId = cap(body.supplierId, 36);
    const quantity = Number(body.quantity);
    const cost = body.unitCostCents === null || body.unitCostCents === '' ? null : Number(body.unitCostCents);
    const note = cap(body.note, 300);
    const key = cap(body.idempotencyKey, 100);
    if (!variantId || (supplierId && !validUuid(supplierId)) ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 99999 ||
      (cost !== null && (!Number.isInteger(cost) || cost < 0 || cost > 100000000)) ||
      !/^[a-zA-Z0-9_-]{20,100}$/.test(key) || (!supplierId && note.length < 5))
      bad('Проверьте приёмку товара');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const variant = await client.query(`SELECT id FROM catalog_variants WHERE id=$1 FOR UPDATE`, [variantId]);
      if (!variant.rows.length) bad('Вариант не найден', 404);
      const existing = await client.query(`SELECT id,variant_id,delta_on_hand,supplier_id,unit_cost_cents,note
        FROM inventory_movements
        WHERE idempotency_key=$1`, [key]);
      if (existing.rows[0]) {
        const recorded = existing.rows[0];
        if (recorded.variant_id !== variantId || recorded.delta_on_hand !== quantity ||
          (recorded.supplier_id || '') !== supplierId || recorded.unit_cost_cents !== cost ||
          recorded.note !== note) bad('Ключ приёмки уже использован с другими данными', 409);
        await client.query('COMMIT');
        return json(res, 200, { ok: true, alreadyRecorded: true });
      }
      if (supplierId) {
        const supplier = await client.query('SELECT id FROM suppliers WHERE id=$1 AND active=true', [supplierId]);
        if (!supplier.rows.length) bad('Поставщик не найден', 404);
      }
      const changed = await client.query(`UPDATE catalog_variants
        SET stock_quantity=coalesce(stock_quantity,0)+$1,availability='on_hand',updated_at=now()
        WHERE id=$2 RETURNING stock_quantity,reserved_quantity`, [quantity, variantId]);
      await recordInventoryMovement(client, { variantId, staffId: operator.id, supplierId: supplierId || null,
        unitCostCents: cost, idempotencyKey: key, reason: 'receipt', deltaOnHand: quantity,
        onHandAfter: changed.rows[0].stock_quantity, reservedAfter: changed.rows[0].reserved_quantity, note });
      await client.query('COMMIT');
      return json(res, 201, { ok: true });
    } catch (error) { await client.query('ROLLBACK');
      if (error.code === '23505') bad('Приёмка уже записана. Обновите историю товара', 409);
      throw error;
    } finally { client.release(); }
  }
  if (path === '/api/admin/orders' && req.method === 'GET') {
    const { rows } = await db.query(`SELECT o.id,o.number,o.customer_name,o.email,o.phone,o.delivery_address,
      o.delivery_preference,o.status,o.payment_status,o.stock_state,o.total_cents,o.created_at,
      COALESCE(json_agg(json_build_object('name',i.name,'variantLabel',i.variant_label,
      'qty',i.quantity,'unitPriceCents',i.unit_price_cents,'sourceMode',i.source_mode))
      FILTER (WHERE i.id IS NOT NULL),'[]') AS items
      FROM orders o LEFT JOIN order_items i ON i.order_id=o.id GROUP BY o.id
      ORDER BY o.created_at DESC LIMIT 100`);
    return json(res, 200, { orders: rows });
  }
  if (path === '/api/admin/service-requests' && req.method === 'GET') {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const page = Math.max(0, Math.min(10000, Number.parseInt(params.get('page') || '0', 10) || 0));
    const search = cap(params.get('q'), 160);
    const status = ['new','in_progress','resolved'].includes(params.get('status')) ? params.get('status') : null;
    const { rows } = await db.query(`SELECT r.id,r.kind,r.email,r.locale,r.product_id,r.variant_id,r.quantity,
      r.message,r.status,r.created_at,COALESCE(o.number,r.order_number_input) AS order_number,
      (SELECT sent_at FROM service_request_replies WHERE request_id=r.id
        ORDER BY sent_at DESC LIMIT 1) AS last_reply_at,
      (SELECT message FROM service_request_replies WHERE request_id=r.id
        ORDER BY sent_at DESC LIMIT 1) AS last_reply_message
      FROM service_requests r
      LEFT JOIN orders o ON o.id=r.order_id
      WHERE ($1::text = '' OR r.email ILIKE '%' || $1 || '%' OR r.message ILIKE '%' || $1 || '%'
        OR COALESCE(o.number,r.order_number_input,'') ILIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR r.status=$2)
      ORDER BY r.created_at DESC LIMIT 26 OFFSET $3`, [search, status, page * 25]);
    return json(res, 200, { requests: rows.slice(0,25), hasMore: rows.length > 25 });
  }
  if (path === '/api/admin/variants' && req.method === 'GET') {
    return json(res, 200, { variants: await liveCatalogSnapshot(db) });
  }
  const variant = path.match(/^\/api\/admin\/variants\/([^/]+)$/);
  if (variant && req.method === 'PATCH') {
    const body = await readJson(req);
    if (!['on_hand','source_on_demand','unavailable'].includes(body.availability)) bad('Некорректный статус товара');
    const price = body.priceCents === null ? null : Number(body.priceCents);
    const purchase = body.purchasePriceCents === null ? null : Number(body.purchasePriceCents);
    if (price !== null && (!Number.isInteger(price) || price <= 0)) bad('Некорректная цена');
    if (purchase !== null && (!Number.isInteger(purchase) || purchase < 0)) bad('Некорректная закупочная цена');
    const stock = body.stockQuantity === null ? null : Number(body.stockQuantity);
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) bad('Некорректный остаток');
    const taxRate = body.taxRateBps === undefined ? undefined :
      body.taxRateBps === null ? null : Number(body.taxRateBps);
    if (taxRate !== undefined && taxRate !== null &&
      (!Number.isInteger(taxRate) || taxRate < 0 || taxRate > 10000))
      bad('Некорректная ставка IVA');
    const reorderPoint = body.reorderPoint === undefined ? undefined : Number(body.reorderPoint);
    const targetStock = body.targetStock === undefined ? undefined : Number(body.targetStock);
    const variantId = decodeURIComponent(variant[1]);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const previous = await client.query(`SELECT source_price_cents,price_override_cents,purchase_price_cents,
        price_confirmed,availability,stock_quantity,reserved_quantity,reorder_point,target_stock,tax_rate_bps
        FROM catalog_variants WHERE id=$1 FOR UPDATE`, [variantId]);
      if (!previous.rows.length) bad('Вариант не найден', 404);
      const before = previous.rows[0];
      const nextReorderPoint = reorderPoint ?? before.reorder_point;
      const nextTargetStock = targetStock ?? before.target_stock;
      const nextTaxRate = taxRate === undefined ? before.tax_rate_bps : taxRate;
      if (!Number.isInteger(nextReorderPoint) || nextReorderPoint < 0 || nextReorderPoint > 99998 ||
        !Number.isInteger(nextTargetStock) || nextTargetStock <= nextReorderPoint || nextTargetStock > 99999)
        bad('Целевой запас должен быть больше порога заказа');
      if (body.priceConfirmed === true && !(price ?? before.source_price_cents))
        bad('Укажите цену продажи перед подтверждением');
      if (body.availability === 'on_hand' && stock === null) bad('Для товара на складе укажите остаток');
      if (stock !== null && stock < before.reserved_quantity) bad('Остаток меньше зарезервированного', 409);
      if (stock === null && (before.stock_quantity > 0 || before.reserved_quantity > 0))
        bad('Нельзя очистить ненулевой остаток', 409);
      const stockDelta = (stock ?? 0) - (before.stock_quantity ?? 0);
      const stockNote = cap(body.stockNote, 300);
      if (stockDelta !== 0 && stockNote.length < 5) bad('Укажите причину изменения остатка');
      await client.query(`UPDATE catalog_variants SET price_override_cents=$1,
        purchase_price_cents=$2,price_confirmed=$3,availability=$4,stock_quantity=$5,
        reorder_point=$6,target_stock=$7,tax_rate_bps=$8,updated_at=now()
        WHERE id=$9`, [price, purchase, body.priceConfirmed === true, body.availability, stock,
        nextReorderPoint, nextTargetStock, nextTaxRate, variantId]);
      if (stockDelta !== 0) await recordInventoryMovement(client, { variantId, staffId: operator.id,
        reason: 'adjustment', deltaOnHand: stockDelta, onHandAfter: stock,
        reservedAfter: before.reserved_quantity, note: stockNote });
      await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
        VALUES($1,$2,'variant_terms_updated',$3,$4)`, [randomUUID(), operator.id, variantId,
        { before, after: { price_override_cents: price,
          purchase_price_cents: purchase, price_confirmed: body.priceConfirmed === true,
          availability: body.availability, stock_quantity: stock,
          reorder_point: nextReorderPoint, target_stock: nextTargetStock,
          tax_rate_bps: nextTaxRate }, stockNote }]);
      await client.query('COMMIT');
      return json(res, 200, { ok: true });
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  const status = path.match(/^\/api\/admin\/orders\/([^/]+)\/status$/);
  if (status && req.method === 'PATCH') {
    const body = await readJson(req);
    const allowed = ['received','packing','delivering','delivered','cancelled'];
    if (!allowed.includes(body.status)) bad('Некорректный статус');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const found = await client.query(`SELECT id,status,stock_state,payment_status
        FROM orders WHERE id=$1 FOR UPDATE`, [status[1]]);
      const order = found.rows[0];
      if (!order) bad('Заказ не найден', 404);
      if (order.status === body.status) { await client.query('COMMIT'); return json(res, 200, { ok: true }); }
      if (['cancelled','delivered'].includes(order.status)) bad('Закрытый заказ нельзя вернуть в работу', 409);
      if (body.status === 'cancelled' && order.payment_status === 'paid')
        bad('Сначала оформите возврат оплаты', 409);
      if (body.status === 'cancelled' && order.payment_status === 'pending')
        bad('Сначала завершите или отмените платёжную сессию Stripe', 409);
      if (['packing','delivering','delivered'].includes(body.status) && order.payment_status !== 'paid')
        bad('Обработка заказа возможна после подтверждения оплаты', 409);
      let nextStockState = order.stock_state;
      if (['cancelled','delivered'].includes(body.status)) {
        const items = await client.query(`SELECT variant_id,quantity FROM order_items
          WHERE order_id=$1 AND source_mode='on_hand' ORDER BY variant_id`, [order.id]);
        for (const item of items.rows) {
          let changed;
          let reason;
          let deltaOnHand = 0;
          let deltaReserved = 0;
          if (body.status === 'cancelled' && order.stock_state === 'reserved') {
            changed = await client.query(`UPDATE catalog_variants SET reserved_quantity=reserved_quantity-$1,
              updated_at=now() WHERE id=$2 AND reserved_quantity>=$1
              RETURNING stock_quantity,reserved_quantity`, [item.quantity, item.variant_id]);
            reason = 'order_released'; deltaReserved = -item.quantity;
          } else if (body.status === 'cancelled' && order.stock_state === 'legacy') {
            changed = await client.query(`UPDATE catalog_variants SET stock_quantity=coalesce(stock_quantity,0)+$1,
              updated_at=now() WHERE id=$2 RETURNING stock_quantity,reserved_quantity`,
            [item.quantity, item.variant_id]);
            reason = 'legacy_order_cancelled'; deltaOnHand = item.quantity;
          } else if (body.status === 'delivered' && order.stock_state === 'reserved') {
            changed = await client.query(`UPDATE catalog_variants SET stock_quantity=stock_quantity-$1,
              reserved_quantity=reserved_quantity-$1,updated_at=now()
              WHERE id=$2 AND stock_quantity>=$1 AND reserved_quantity>=$1
              RETURNING stock_quantity,reserved_quantity`, [item.quantity, item.variant_id]);
            reason = 'order_fulfilled'; deltaOnHand = -item.quantity; deltaReserved = -item.quantity;
          }
          if (changed) {
            if (!changed.rows.length) bad('Остаток заказа не найден или изменён', 409);
            await recordInventoryMovement(client, { variantId: item.variant_id, orderId: order.id,
              reason, deltaOnHand, deltaReserved, onHandAfter: changed.rows[0].stock_quantity,
              reservedAfter: changed.rows[0].reserved_quantity });
          }
        }
        nextStockState = body.status === 'cancelled' ? 'released' : 'consumed';
      }
      await client.query('UPDATE orders SET status=$1,stock_state=$2,updated_at=now() WHERE id=$3',
        [body.status, nextStockState, order.id]);
      await client.query('INSERT INTO order_events(id,order_id,type,actor,note) VALUES($1,$2,$3,$4,$5)',
        [randomUUID(), status[1], body.status, operator.email, cap(body.note, 300)]);
      await client.query('COMMIT');
      return json(res, 200, { ok: true });
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  const service = path.match(/^\/api\/admin\/service-requests\/([^/]+)\/status$/);
  if (service && req.method === 'PATCH') {
    const body = await readJson(req);
    if (!['new','in_progress','resolved'].includes(body.status)) bad('Некорректный статус обращения');
    const { rowCount } = await db.query('UPDATE service_requests SET status=$1 WHERE id=$2',
      [body.status, service[1]]);
    if (!rowCount) bad('Обращение не найдено', 404);
    return json(res, 200, { ok: true });
  }
  const reply = path.match(/^\/api\/admin\/service-requests\/([^/]+)\/reply$/);
  if (reply && req.method === 'POST') {
    if (!emailReady()) bad('Почтовая отправка не настроена', 503);
    const body = await readJson(req);
    const message = cap(body.message, 4000);
    if (message.length < 2) bad('Напишите ответ');
    const { rows } = await db.query('SELECT id,email,locale FROM service_requests WHERE id=$1', [reply[1]]);
    if (!rows[0]) bad('Обращение не найдено', 404);
    await sendServiceReply(rows[0].email, rows[0].id, message, undefined, rows[0].locale);
    await db.query('INSERT INTO service_request_replies(id,request_id,message) VALUES($1,$2,$3)',
      [randomUUID(), rows[0].id, message]);
    await db.query("UPDATE service_requests SET status='in_progress' WHERE id=$1 AND status='new'", [rows[0].id]);
    return json(res, 200, { sent: true });
  }
  bad('Не найдено', 404);
}

export async function handleApi(db, req, res, pathname) {
  try {
    if (req.method === 'OPTIONS') return json(res, 405, { error: 'CORS не используется' });
    if (pathname === '/api/stripe/webhook' && req.method === 'POST') {
      if (!db) bad('База данных ещё не подключена', 503);
      return await handleStripeWebhook(db, req, res);
    }
    if (!sameOrigin(req) && !['GET','HEAD'].includes(req.method)) bad('Источник запроса не разрешён', 403);
    if (pathname === '/api/health') {
      if (!db) return json(res, 503, { ok: false, database: 'not_configured' });
      await db.query('SELECT 1');
      return json(res, 200, { ok: true, database: 'connected' });
    }
    if (!db) bad('База данных ещё не подключена', 503);
    if (pathname === '/api/config' && req.method === 'GET') {
      const paymentAccess = await checkoutAllowed(db, req);
      return json(res, 200,
      { ordersEnabled: paymentAccess, accountsEnabled: enabled('ACCOUNTS_ENABLED'),
        emailEnabled: emailReady(), googleClientId: enabled('ACCOUNTS_ENABLED') ? googleClientId() : null,
        paymentsEnabled: paymentAccess,
        supportEnabled: enabled('SUPPORT_ENABLED') && emailReady() });
    }
    if (pathname === '/api/catalog' && req.method === 'GET') {
      const list = await liveCatalogSnapshot(db);
      return json(res, 200, { variants: list.map(({ price_override_cents, source_price_cents,
        purchase_price_cents, sale_price_cents, stock_quantity, reserved_quantity, reorder_point, target_stock,
        tax_rate_bps,
        ...entry }) => ({ ...entry,
        priceCents: entry.price_confirmed ? price_override_cents ?? source_price_cents : null,
        referencePriceCents: entry.price_confirmed ? null : source_price_cents,
        availableForCart: entry.source_orderable && entry.availability !== 'unavailable' &&
          (entry.availability !== 'on_hand' || stock_quantity - reserved_quantity > 0),
        availability: entry.availability })) });
    }
    if (pathname === '/api/checkout/quote' && req.method === 'POST') {
      rateLimit(req, 'quote', 100);
      const body = await readJson(req);
      const promo = await promoFor(db, body.promoCode);
      const quote = priceQuote(body.items, await liveCatalogSnapshot(db), promo);
      return json(res, 200, publicQuote(quote));
    }
    if (pathname.startsWith('/api/admin/')) return await adminRoute(db, req, res, pathname);
    if (pathname.startsWith('/api/auth/') && req.method === 'POST') return await authRoute(db, req, res, pathname);
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const customer = await currentCustomer(db, req);
      if (!customer) bad('Войдите в кабинет', 401);
      const { rows } = await db.query(`SELECT EXISTS (
        SELECT 1 FROM customers c JOIN staff_accounts s ON s.email=c.email
        WHERE c.id=$1 AND c.email_verified_at IS NOT NULL AND s.role='owner' AND s.active=true
      ) AS "canManageStore"`, [customer.id]);
      return json(res, 200, { customer: { ...customer, canManageStore: rows[0].canManageStore } });
    }
    if (pathname === '/api/me/cabinet' && ['GET', 'PUT'].includes(req.method)) {
      if (!enabled('ACCOUNTS_ENABLED')) bad('Кабинет пока не подключён', 503);
      const customer = await currentCustomer(db, req);
      if (!customer) bad('Войдите в кабинет', 401);
      if (req.method === 'GET') return json(res, 200, await loadCabinet(db, customer));
      const body = await readJson(req);
      return json(res, 200, await saveCabinet(db, customer, body));
    }
    if (pathname === '/api/me/pets' && req.method === 'GET') {
      const customer = await currentCustomer(db, req);
      if (!customer) bad('Войдите в кабинет', 401);
      const { rows } = await db.query('SELECT id,name,species,profile FROM pets WHERE customer_id=$1 ORDER BY created_at',
        [customer.id]);
      return json(res, 200, { pets: rows });
    }
    if (pathname === '/api/me/pets' && req.method === 'POST') {
      const customer = await currentCustomer(db, req);
      if (!customer) bad('Войдите в кабинет', 401);
      const body = await readJson(req);
      if (!cap(body.name, 100) || !['cat','dog'].includes(body.species)) bad('Укажите имя и вид питомца');
      const id = randomUUID();
      const profile = { birthday: cap(body.birthday, 10), breed: cap(body.breed, 100),
        notes: cap(body.notes, 500), preferences: Array.isArray(body.preferences) ? body.preferences.slice(0, 20).map(v => cap(v, 60)) : [] };
      await db.query('INSERT INTO pets(id,customer_id,name,species,profile) VALUES($1,$2,$3,$4,$5)',
        [id, customer.id, cap(body.name, 100), body.species, profile]);
      return json(res, 201, { id, name: body.name, species: body.species, profile });
    }
    if (pathname === '/api/orders' && req.method === 'POST') {
      bad('Используйте защищённое оформление через Stripe', 410);
    }
    if (pathname === '/api/checkout/start' && req.method === 'POST') {
      if (!await checkoutAllowed(db, req)) bad('Приём заказов ещё не включён', 503);
      rateLimit(req, 'order', 12);
      const body = await readJson(req);
      const customer = await currentCustomer(db, req);
      return json(res, 201, await createOrder(db, body, customer));
    }
    if (pathname === '/api/checkout/status' && req.method === 'GET') {
      const url = new URL(req.url || '/', 'https://catmandog.es');
      const sessionId = url.searchParams.get('session_id') || '';
      if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) bad('Некорректная сессия оплаты');
      const { rows } = await db.query(`SELECT number,payment_status,total_cents FROM orders
        WHERE stripe_checkout_session_id=$1`, [sessionId]);
      if (!rows[0]) bad('Заказ не найден', 404);
      return json(res, 200, { number: rows[0].number,
        paymentStatus: rows[0].payment_status, totalCents: rows[0].total_cents });
    }
    if (pathname === '/api/me/orders' && req.method === 'GET') {
      const customer = await currentCustomer(db, req);
      if (!customer) bad('Войдите в кабинет', 401);
      const { rows } = await db.query(`SELECT o.*,COALESCE(json_agg(json_build_object('productId',i.product_id,
        'variantId',i.variant_id,'name',i.name,'label',i.variant_label,'qty',i.quantity,
        'unitPriceCents',i.unit_price_cents)) FILTER (WHERE i.id IS NOT NULL),'[]') AS items
        FROM orders o LEFT JOIN order_items i ON i.order_id=o.id WHERE o.customer_id=$1
        GROUP BY o.id ORDER BY o.created_at DESC`, [customer.id]);
      return json(res, 200, { orders: rows });
    }
    if (pathname === '/api/service-requests' && req.method === 'POST') {
      if (!enabled('SUPPORT_ENABLED') || !emailReady()) bad('Приём обращений ещё не включён', 503);
      rateLimit(req, 'support', 10, 60);
      const body = await readJson(req);
      const email = normalizedEmail(body.email);
      if (!validEmail(email) || !['support','return'].includes(body.kind) || cap(body.message, 1200).length < 10)
        bad('Проверьте форму обращения');
      const orderNumber = cap(body.orderNumber, 40);
      if (/^DEMO-/i.test(orderNumber)) bad('Демонстрационный заказ нельзя отправить в поддержку');
      if (body.kind === 'return' && (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 99))
        bad('Укажите количество для возврата');
      const found = orderNumber ? await db.query('SELECT id FROM orders WHERE number=$1 AND email=$2',
        [orderNumber, email]) : { rows: [] };
      if (body.kind === 'return' && found.rows[0] && body.productId && body.variantId) {
        const item = await db.query('SELECT quantity FROM order_items WHERE order_id=$1 AND product_id=$2 AND variant_id=$3',
          [found.rows[0].id, cap(body.productId, 180), cap(body.variantId, 180)]);
        if (!item.rows[0] || !Number.isInteger(body.quantity) || body.quantity < 1 ||
            body.quantity > item.rows[0].quantity) bad('Укажите товар и количество из заказа');
      }
      const requestId = randomUUID();
      const requestLocale = body.locale === 'es' ? 'es' : 'ru';
      await db.query(`INSERT INTO service_requests(id,order_id,kind,email,product_id,variant_id,quantity,message,order_number_input,locale)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [requestId, found.rows[0]?.id || null,
        body.kind, email, cap(body.productId, 180) || null, cap(body.variantId, 180) || null,
        body.quantity && Number.isInteger(body.quantity) ? body.quantity : null, cap(body.message, 1200), orderNumber || null, requestLocale]);
      try { await notifyServiceRequest({ id: requestId, kind: body.kind, email,
        locale: requestLocale,
        orderNumber, message: cap(body.message, 1200) }); }
      catch (error) { console.error('Support notification failed:', error.message); }
      return json(res, 202, { accepted: true, id: requestId });
    }
    bad('Не найдено', 404);
  } catch (error) {
    if (!error.status || error.status >= 500) console.error('API error:', error.message);
    return json(res, error.status || 500, { error: error.status ? error.message : 'Ошибка сервера' });
  }
}
