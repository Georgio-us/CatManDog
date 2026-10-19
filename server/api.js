import { randomUUID, randomBytes } from 'node:crypto';
import { catalogSnapshot } from './catalog.js';
import { priceQuote, validateAddress, validateDelivery } from './pricing.js';
import { json, readJson, sameOrigin } from './http.js';
import { normalizedEmail, validEmail, hashPassword, verifyPassword, currentCustomer,
  createSession, cookieToken, tokenDigest, sessionCookie, clearSessionCookie, isAdmin } from './auth.js';
import { loadCabinet, saveCabinet } from './cabinet.js';
import { emailReady, sendAccountLink } from './email.js';

const counters = new Map();
const cap = (value, length) => String(value || '').trim().slice(0, length);
const enabled = name => process.env[name] === 'true';
const bad = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
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
    const { rows } = await db.query('SELECT id,email,password_hash,name,email_verified_at FROM customers WHERE email=$1', [email]);
    if (!rows[0] || !await verifyPassword(body.password, rows[0].password_hash)) bad('Неверный email или пароль', 401);
    if (!rows[0].email_verified_at) bad('Подтвердите email по ссылке из письма', 403);
    const token = await createSession(db, rows[0].id);
    return json(res, 200, { id: rows[0].id, email, name: rows[0].name },
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
  if (!isAdmin(req)) bad('Доступ закрыт', 403);
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
      r.message,r.status,r.created_at,o.number AS order_number FROM service_requests r
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
    const { rowCount } = await db.query(`UPDATE catalog_variants SET price_override_cents=$1,
      purchase_price_cents=$2,price_confirmed=$3,availability=$4,stock_quantity=$5,updated_at=now()
      WHERE id=$6`, [price, purchase, body.priceConfirmed === true, body.availability, stock,
        decodeURIComponent(variant[1])]);
    if (!rowCount) bad('Вариант не найден', 404);
    return json(res, 200, { ok: true });
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
        emailEnabled: emailReady(), paymentsEnabled: enabled('PAYMENTS_ENABLED') });
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
      if (!enabled('SUPPORT_ENABLED')) bad('Приём обращений ещё не включён', 503);
      rateLimit(req, 'support', 10, 60);
      const body = await readJson(req);
      const email = normalizedEmail(body.email);
      if (!validEmail(email) || !['support','return'].includes(body.kind) || cap(body.message, 1200).length < 10)
        bad('Проверьте форму обращения');
      const orderNumber = cap(body.orderNumber, 40);
      const found = orderNumber ? await db.query('SELECT id FROM orders WHERE number=$1 AND email=$2',
        [orderNumber, email]) : { rows: [] };
      if (body.kind === 'return' && found.rows[0]) {
        const item = await db.query('SELECT quantity FROM order_items WHERE order_id=$1 AND product_id=$2 AND variant_id=$3',
          [found.rows[0].id, cap(body.productId, 180), cap(body.variantId, 180)]);
        if (!item.rows[0] || !Number.isInteger(body.quantity) || body.quantity < 1 ||
            body.quantity > item.rows[0].quantity) bad('Укажите товар и количество из заказа');
      }
      await db.query(`INSERT INTO service_requests(id,order_id,kind,email,product_id,variant_id,quantity,message)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [randomUUID(), found.rows[0]?.id || null,
        body.kind, email, cap(body.productId, 180) || null, cap(body.variantId, 180) || null,
        body.quantity && Number.isInteger(body.quantity) ? body.quantity : null, cap(body.message, 1200)]);
      return json(res, 202, { accepted: true });
    }
    bad('Не найдено', 404);
  } catch (error) {
    if (!error.status || error.status >= 500) console.error('API error:', error.message);
    return json(res, error.status || 500, { error: error.status ? error.message : 'Ошибка сервера' });
  }
}
