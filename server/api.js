import { randomUUID, randomBytes } from 'node:crypto';
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

const counters = new Map();
const cap = (value, length) => String(value || '').trim().slice(0, length);
const enabled = name => process.env[name] === 'true';
const bad = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
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

async function issueAccountLink(db, customerId, kind, email) {
  const token = randomBytes(32).toString('hex');
  await db.query('DELETE FROM auth_links WHERE customer_id=$1 AND kind=$2 AND consumed_at IS NULL',
    [customerId, kind]);
  await db.query(`INSERT INTO auth_links(id,customer_id,kind,token_hash,expires_at)
    VALUES($1,$2,$3,$4,now()+($5::integer * interval '1 minute'))`,
  [randomUUID(), customerId, kind, tokenDigest(token), kind === 'verify' ? 1440 : 30]);
  await sendAccountLink(email, kind, token);
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
  return { items: quote.items.map(({ orderable, sourceMode, ...item }) => ({ ...item, orderable,
      availability: sourceMode })),
    subtotalCents: quote.subtotalCents, discountCents: quote.discountCents,
    deliveryCents: quote.deliveryCents, totalCents: quote.totalCents,
    orderable: quote.orderable, addressVerification: quote.addressVerification,
    deliverySlot: quote.deliverySlot, promoCode: quote.promoCode };
}

async function createOrder(db, payload, customer) {
  if (!enabled('ORDERS_ENABLED') || !enabled('PAYMENTS_ENABLED'))
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
    const existing = await client.query('SELECT id,number,email FROM orders WHERE idempotency_key=$1', [idempotency]);
    if (existing.rows[0]) {
      if (existing.rows[0].email !== email) bad('Ключ оформления уже использован', 409);
      await client.query('COMMIT'); return existing.rows[0];
    }
    const ids = lines.map(line => cap(line.variantId, 180));
    const variants = await client.query(`SELECT v.id AS variant_id,v.product_id,v.label,v.source_price_cents,
      v.price_override_cents,v.price_confirmed,v.source_orderable,v.availability,v.stock_quantity,p.name
      FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
      WHERE v.id=ANY($1::text[]) FOR UPDATE OF v`, [ids]);
    const promo = await promoFor(client, payload.promoCode, true);
    const quote = priceQuote(lines, variants.rows, promo);
    if (!quote.orderable) bad('Один из товаров пока нельзя заказать');
    const orderId = randomUUID();
    const numberResult = await client.query("SELECT 'CMD-' || nextval('order_number_seq') AS number");
    const number = numberResult.rows[0].number;
    const cleanAddress = { city: 'València', postcode: cap(address.postcode, 5),
      street: cap(address.street, 120), building: cap(address.building, 16),
      apartment: cap(address.apartment, 80), note: cap(address.note, 300), verified: false };
    const cleanDelivery = delivery.mode === 'soon' ? { mode: 'soon', reserved: false }
      : { mode: 'scheduled', date: delivery.date, time: delivery.time, reserved: false };
    const inserted = await client.query(`INSERT INTO orders(id,number,customer_id,customer_name,email,phone,whatsapp_opt_in,
      delivery_address,delivery_preference,subtotal_cents,discount_cents,delivery_cents,total_cents,
      promo_code,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT(idempotency_key) DO NOTHING RETURNING id,number`,
    [orderId, number, customer?.id || null, name, email, phone, !!payload.whatsapp,
      cleanAddress, cleanDelivery, quote.subtotalCents, quote.discountCents,
      quote.deliveryCents, quote.totalCents, quote.promoCode, idempotency]);
    if (!inserted.rows.length) {
      const duplicate = await client.query('SELECT id,number,email FROM orders WHERE idempotency_key=$1', [idempotency]);
      if (duplicate.rows[0]?.email !== email) bad('Ключ оформления уже использован', 409);
      await client.query('COMMIT');
      return duplicate.rows[0];
    }
    for (const item of quote.items) {
      await client.query(`INSERT INTO order_items(id,order_id,product_id,variant_id,name,variant_label,quantity,
        unit_price_cents,source_mode) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [randomUUID(), orderId, item.productId, item.variantId, item.name, item.variantLabel,
        item.qty, item.unitPriceCents, item.sourceMode]);
      if (item.sourceMode === 'on_hand') await client.query(`UPDATE catalog_variants SET stock_quantity=stock_quantity-$1,
        updated_at=now() WHERE id=$2`, [item.qty, item.variantId]);
    }
    await client.query('INSERT INTO order_events(id,order_id,type,actor) VALUES($1,$2,$3,$4)',
      [randomUUID(), orderId, 'received', 'system']);
    if (promo) await client.query('UPDATE promo_codes SET used_count=used_count+1 WHERE code=$1', [promo.code]);
    await client.query('COMMIT');
    return { id: orderId, number, paymentStatus: 'awaiting_payment', addressVerified: false,
      deliveryReserved: false };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
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
    await issueAccountLink(db, id, 'verify', email);
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
      try { await issueAccountLink(db, customer.id, kind, email); }
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
  if (path === '/api/admin/overview' && req.method === 'GET') {
    const [catalog, orders, requests, top] = await Promise.all([
      db.query(`SELECT count(*)::integer AS total,
        count(*) FILTER (WHERE v.price_confirmed=false)::integer AS unconfirmed_prices,
        count(*) FILTER (WHERE v.purchase_price_cents IS NULL AND so.cost_cents IS NULL)::integer AS missing_costs,
        count(*) FILTER (WHERE so.id IS NULL)::integer AS missing_suppliers,
        count(*) FILTER (WHERE v.availability='on_hand' AND coalesce(v.stock_quantity,0)<3)::integer AS low_stock
        FROM catalog_variants v LEFT JOIN supplier_offers so ON so.variant_id=v.id AND so.preferred=true`),
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
        GROUP BY i.variant_id,i.name ORDER BY quantity DESC LIMIT 5`)
    ]);
    return json(res, 200, { catalog: catalog.rows[0], orders: orders.rows[0],
      requests: requests.rows[0], topPaidSkus: top.rows });
  }
  if (path === '/api/admin/sku-audit' && req.method === 'GET') {
    const { rows } = await db.query(`SELECT v.id AS variant_id,v.product_id,p.name,p.brand,p.category,p.pet,
      v.label,v.source_price_cents,v.price_override_cents,v.purchase_price_cents,
      v.price_confirmed,v.source_orderable,v.availability,v.stock_quantity,
      v.display_priority,v.review_note,v.reviewed_at,
      so.cost_cents AS supplier_cost_cents,so.vat_included AS supplier_vat_included,
      so.checked_at AS supplier_checked_at,s.name AS supplier_name
      FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
      LEFT JOIN supplier_offers so ON so.variant_id=v.id AND so.preferred=true
      LEFT JOIN suppliers s ON s.id=so.supplier_id
      ORDER BY p.name,v.label LIMIT 2000`);
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
    const leadDays = body.leadDays === null || body.leadDays === '' ? null : Number(body.leadDays);
    if (leadDays !== null && (!Number.isInteger(leadDays) || leadDays < 0 || leadDays > 365))
      bad('Некорректный срок поставки');
    const id = randomUUID();
    try {
      await db.query(`INSERT INTO suppliers(id,name,contact_name,email,website,terms,lead_days)
        VALUES($1,$2,$3,$4,$5,$6,$7)`, [id, name, cap(body.contactName, 120),
        normalizedEmail(email), optionalWebUrl(body.website), cap(body.terms, 1000), leadDays]);
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
    if (name.length < 2 || (email && !validEmail(email)) ||
      (leadDays !== null && (!Number.isInteger(leadDays) || leadDays < 0 || leadDays > 365)))
      bad('Проверьте данные поставщика');
    const { rowCount } = await db.query(`UPDATE suppliers SET name=$1,contact_name=$2,email=$3,
      website=$4,terms=$5,lead_days=$6,active=$7,updated_at=now() WHERE id=$8`,
    [name, cap(body.contactName, 120), email, optionalWebUrl(body.website), cap(body.terms, 1000),
      leadDays, body.active === true, supplier[1]]);
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
    if (!variantId || !/^[a-f0-9-]{36}$/.test(supplierId) ||
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
  if (path === '/api/admin/orders' && req.method === 'GET') {
    const { rows } = await db.query(`SELECT o.id,o.number,o.customer_name,o.email,o.phone,o.delivery_address,
      o.delivery_preference,o.status,o.payment_status,o.total_cents,o.created_at,
      COALESCE(json_agg(json_build_object('name',i.name,'variantLabel',i.variant_label,
      'qty',i.quantity,'unitPriceCents',i.unit_price_cents,'sourceMode',i.source_mode))
      FILTER (WHERE i.id IS NOT NULL),'[]') AS items
      FROM orders o LEFT JOIN order_items i ON i.order_id=o.id GROUP BY o.id
      ORDER BY o.created_at DESC LIMIT 100`);
    return json(res, 200, { orders: rows });
  }
  if (path === '/api/admin/service-requests' && req.method === 'GET') {
    const { rows } = await db.query(`SELECT r.id,r.kind,r.email,r.product_id,r.variant_id,r.quantity,
      r.message,r.status,r.created_at,COALESCE(o.number,r.order_number_input) AS order_number,
      (SELECT sent_at FROM service_request_replies WHERE request_id=r.id
        ORDER BY sent_at DESC LIMIT 1) AS last_reply_at,
      (SELECT message FROM service_request_replies WHERE request_id=r.id
        ORDER BY sent_at DESC LIMIT 1) AS last_reply_message
      FROM service_requests r
      LEFT JOIN orders o ON o.id=r.order_id ORDER BY r.created_at DESC LIMIT 100`);
    return json(res, 200, { requests: rows });
  }
  if (path === '/api/admin/variants' && req.method === 'GET') {
    return json(res, 200, { variants: await catalogSnapshot(db) });
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
    const variantId = decodeURIComponent(variant[1]);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const previous = await client.query(`SELECT price_override_cents,purchase_price_cents,
        price_confirmed,availability,stock_quantity FROM catalog_variants WHERE id=$1 FOR UPDATE`, [variantId]);
      if (!previous.rows.length) bad('Вариант не найден', 404);
      await client.query(`UPDATE catalog_variants SET price_override_cents=$1,
        purchase_price_cents=$2,price_confirmed=$3,availability=$4,stock_quantity=$5,updated_at=now()
        WHERE id=$6`, [price, purchase, body.priceConfirmed === true, body.availability, stock, variantId]);
      await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
        VALUES($1,$2,'variant_terms_updated',$3,$4)`, [randomUUID(), operator.id, variantId,
        { before: previous.rows[0], after: { price_override_cents: price,
          purchase_price_cents: purchase, price_confirmed: body.priceConfirmed === true,
          availability: body.availability, stock_quantity: stock } }]);
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
      const { rowCount } = await client.query('UPDATE orders SET status=$1,updated_at=now() WHERE id=$2',
        [body.status, status[1]]);
      if (!rowCount) bad('Заказ не найден', 404);
      await client.query('INSERT INTO order_events(id,order_id,type,actor,note) VALUES($1,$2,$3,$4,$5)',
        [randomUUID(), status[1], body.status, 'admin', cap(body.note, 300)]);
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
    const { rows } = await db.query('SELECT id,email FROM service_requests WHERE id=$1', [reply[1]]);
    if (!rows[0]) bad('Обращение не найдено', 404);
    await sendServiceReply(rows[0].email, rows[0].id, message);
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
    if (!sameOrigin(req) && !['GET','HEAD'].includes(req.method)) bad('Источник запроса не разрешён', 403);
    if (pathname === '/api/health') {
      if (!db) return json(res, 503, { ok: false, database: 'not_configured' });
      await db.query('SELECT 1');
      return json(res, 200, { ok: true, database: 'connected' });
    }
    if (!db) bad('База данных ещё не подключена', 503);
    if (pathname === '/api/config' && req.method === 'GET') return json(res, 200,
      { ordersEnabled: enabled('ORDERS_ENABLED'), accountsEnabled: enabled('ACCOUNTS_ENABLED'),
        emailEnabled: emailReady(), googleClientId: enabled('ACCOUNTS_ENABLED') ? googleClientId() : null,
        paymentsEnabled: enabled('PAYMENTS_ENABLED'),
        supportEnabled: enabled('SUPPORT_ENABLED') && emailReady() });
    if (pathname === '/api/catalog' && req.method === 'GET') {
      const list = await catalogSnapshot(db);
      return json(res, 200, { variants: list.map(({ price_override_cents, source_price_cents,
        purchase_price_cents, stock_quantity, ...entry }) => ({ ...entry,
        priceCents: price_override_cents ?? source_price_cents,
        availability: entry.availability })) });
    }
    if (pathname === '/api/checkout/quote' && req.method === 'POST') {
      rateLimit(req, 'quote', 100);
      const body = await readJson(req);
      const promo = await promoFor(db, body.promoCode);
      const quote = priceQuote(body.items, await catalogSnapshot(db), promo);
      return json(res, 200, publicQuote(quote));
    }
    if (pathname.startsWith('/api/admin/')) return await adminRoute(db, req, res, pathname);
    if (pathname.startsWith('/api/auth/') && req.method === 'POST') return await authRoute(db, req, res, pathname);
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const customer = await currentCustomer(db, req);
      if (!customer) bad('Войдите в кабинет', 401);
      return json(res, 200, { customer });
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
      rateLimit(req, 'order', 20);
      const body = await readJson(req);
      const customer = await currentCustomer(db, req);
      return json(res, 201, { order: await createOrder(db, body, customer) });
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
      if (body.kind === 'return' && !orderNumber) bad('Укажите номер заказа');
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
      await db.query(`INSERT INTO service_requests(id,order_id,kind,email,product_id,variant_id,quantity,message,order_number_input)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [requestId, found.rows[0]?.id || null,
        body.kind, email, cap(body.productId, 180) || null, cap(body.variantId, 180) || null,
        body.quantity && Number.isInteger(body.quantity) ? body.quantity : null, cap(body.message, 1200), orderNumber || null]);
      try { await notifyServiceRequest({ id: requestId, kind: body.kind, email,
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
