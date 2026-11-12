const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;

export function telegramReady(env = process.env) {
  return tokenPattern.test(env.TELEGRAM_BOT_TOKEN || '') &&
    /^-?\d+$/.test(env.TELEGRAM_CHAT_ID || '');
}

export function orderAlertText(order) {
  const amount = (Number(order.total_cents) / 100).toFixed(2).replace('.', ',');
  const test = order.stripe_checkout_session_id?.startsWith('cs_test_');
  return `${test ? 'Тестовый оплаченный заказ' : 'Новый оплаченный заказ'} CatManDog\n` +
    `Номер: ${order.number}\nСумма: ${amount} €\n` +
    'Детали: https://catmandog.es/admin';
}

async function sendMessage(text, fetcher, env) {
  if (!telegramReady(env)) return false;
  const response = await fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text,
      link_preview_options: { is_disabled: true } }),
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`Telegram API returned HTTP ${response.status}`);
  const result = await response.json().catch(() => null);
  if (result?.ok !== true) throw new Error('Telegram API did not accept the message');
  return true;
}

export const sendTelegramOrderAlert = (order, fetcher = fetch, env = process.env) =>
  sendMessage(orderAlertText(order), fetcher, env);

export function visitAlertText({ page, source, owner, cartId } = {}) {
  const safePage = typeof page === 'string' && page.length <= 120 &&
    (/^\/$/.test(page) || /^\/\#\/(?:catalog|journal(?:\/[a-z0-9-]+)?|product\/[a-z0-9-]+|picks\/(?:cat|dog))$/i.test(page) ||
      /^\/(?:catalogo|revista|selecciones\/(?:gatos|perros)|producto\/[a-z0-9-]+|(?:revista|catalogo\/(?:gatos|perros))\/[a-z0-9/-]+)$/i.test(page))
    ? page : 'неизвестна';
  const sources = { direct: 'источник не передан браузером', internal: 'переход внутри сайта',
    search: 'поиск', social: 'соцсети', other: 'другой сайт' };
  const safeSource = typeof source === 'string' && Object.hasOwn(sources, source)
    ? sources[source] : 'неизвестен';
  return `Посещение CatManDog\n` +
    `Владелец: ${owner === true ? 'вход подтверждён' : 'вход не подтверждён'}\n` +
    `Страница входа: ${safePage}\n` +
    `Источник: ${safeSource}\n` +
    (typeof cartId === 'string' && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(cartId)
      ? `ID корзины, если появится: ${cartId.slice(0, 8)}\n` : '') +
    'Подробнее: Google Analytics 4';
}

export const sendTelegramVisitAlert = (visit, fetcher = fetch, env = process.env) =>
  sendMessage(visitAlertText(visit), fetcher, env);

export function startTelegramOrderAlerts(db, { intervalMs = 30000, fetcher = fetch,
  env = process.env } = {}) {
  if (!db) return () => {};
  let running = false;
  async function deliverPending() {
    if (running || !telegramReady(env)) return;
    running = true;
    try {
      const client = await db.connect();
      try {
        for (let i = 0; i < 10; i += 1) {
          await client.query('BEGIN');
          try {
            const { rows } = await client.query(`SELECT id,number,total_cents,stripe_checkout_session_id
              FROM orders WHERE telegram_alert_pending=true AND payment_status='paid'
              AND (telegram_alert_attempted_at IS NULL OR telegram_alert_attempted_at < now() - interval '5 minutes')
              ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED`);
            const order = rows[0];
            if (!order) { await client.query('COMMIT'); break; }
            try {
              await sendTelegramOrderAlert(order, fetcher, env);
              await client.query(`UPDATE orders SET telegram_alert_pending=false,
                telegram_notified_at=now(),telegram_alert_attempted_at=now() WHERE id=$1`, [order.id]);
            } catch (error) {
              await client.query('UPDATE orders SET telegram_alert_attempted_at=now() WHERE id=$1', [order.id]);
              console.error('Telegram order alert failed:', error.message);
            }
            await client.query('COMMIT');
          } catch (error) { await client.query('ROLLBACK'); throw error; }
        }
      } finally { client.release(); }
    } catch (error) { console.error('Telegram order alert worker failed:', error.message); }
    finally { running = false; }
  }
  const timer = setInterval(() => { void deliverPending(); }, intervalMs);
  timer.unref?.();
  void deliverPending();
  return () => clearInterval(timer);
}
