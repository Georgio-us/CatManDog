import { telegramCommandText, telegramCampaignLabel } from './telegram-stats.js';

const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;

export function telegramReady(env = process.env) {
  return tokenPattern.test(env.TELEGRAM_BOT_TOKEN || '') &&
    /^-?\d+$/.test(env.TELEGRAM_CHAT_ID || '');
}

const oneLine = (value, limit = 160) => String(value ?? '')
  .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]+/g, ' ')
  .trim().slice(0, limit);

const madridTime = value => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Madrid',
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit',
    minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
};

function deliverySummary(delivery = {}) {
  if (delivery.mode === 'pickup') return 'Самовывоз: согласовать время выдачи с покупателем';
  if (delivery.mode === 'slot')
    return `Желаемая доставка: ${[oneLine(delivery.date, 10), oneLine(delivery.window, 30)].filter(Boolean).join(', ')}`;
  if (delivery.mode === 'scheduled')
    return `${delivery.reserved ? 'Согласованная доставка' : 'Желаемая доставка'}: ${[oneLine(delivery.date, 10), oneLine(delivery.time, 10)].filter(Boolean).join(', ')}`;
  if (delivery.mode === 'national') return 'Доставка: по материковой Испании, срок уточняется';
  if (delivery.mode === 'preorder') return 'Доставка: срок согласуется';
  if (delivery.mode === 'soon') return 'Желаемая доставка: как можно скорее';
  return 'Доставка: уточняется';
}

export function orderAlertText(order) {
  const amount = (Number(order.total_cents) / 100).toFixed(2).replace('.', ',');
  const test = order.is_test === true || order.stripe_checkout_session_id?.startsWith('cs_test_');
  const address = order.delivery_address || {};
  const destination = [address.street, address.building, address.apartment,
    address.postcode, address.city].map(part => oneLine(part, 120)).filter(Boolean).join(', ');
  const paidAt = madridTime(order.paid_at || order.created_at);
  return `${test ? '🧪 ТЕСТОВЫЙ ОПЛАЧЕННЫЙ ЗАКАЗ' : '❗️ НОВЫЙ ОПЛАЧЕННЫЙ ЗАКАЗ'} CatManDog\n` +
    `Номер: ${oneLine(order.number, 40)}\n` +
    (paidAt ? `${order.paid_at ? 'Оплачен' : 'Оформлен'}: ${paidAt} (Валенсия)\n` : '') +
    `Клиент: ${oneLine(order.customer_name, 100) || 'Не указано'}\n` +
    `Телефон: ${oneLine(order.phone || order.buyer_phone, 40) || 'Не указан'}${order.whatsapp_opt_in ? ' (WhatsApp)' : ''}\n` +
    `Email: ${oneLine(order.email, 160) || 'Не указан'}\n` +
    (order.delivery_preference?.mode === 'pickup' ? '' : `Адрес: ${destination || 'Не указан'}\n`) +
    `${deliverySummary(order.delivery_preference)}\n` +
    `Сумма: ${amount} €\n` +
    'Заказ в админке: https://catmandog.es/admin';
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

export function visitAlertText({ page, source, campaignId, visitorNumber, visitCount,
  visits_today, visitors_today, instagram_today, telegram_today, search_today, direct_today } = {}) {
  const safePage = typeof page === 'string' && page.length <= 120 &&
    (/^\/$/.test(page) || /^\/\#\/(?:catalog|journal(?:\/[a-z0-9-]+)?|product\/[a-z0-9-]+|picks\/(?:cat|dog))$/i.test(page) ||
      /^\/(?:catalogo|revista|selecciones\/(?:gatos|perros)|producto\/[a-z0-9-]+|(?:revista|catalogo\/(?:gatos|perros))\/[a-z0-9/-]+)$/i.test(page))
    ? page : 'неизвестна';
  const sources = { direct: 'прямой переход или источник скрыт', internal: 'переход внутри сайта',
    search: 'поиск', social: 'соцсети', other: 'другой сайт', instagram: 'Instagram',
    facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube', pinterest: 'Pinterest',
    telegram: 'Telegram',
    unknown: 'неизвестен' };
  const safeSource = typeof source === 'string' && Object.hasOwn(sources, source)
    ? sources[source] : 'неизвестен';
  const number = Number.isSafeInteger(visitorNumber) && visitorNumber > 0 ? visitorNumber : null;
  const count = Number.isSafeInteger(visitCount) && visitCount > 0 ? visitCount : null;
  const dailyVisits = Number.isSafeInteger(visits_today) ? visits_today : null;
  const dailyVisitors = Number.isSafeInteger(visitors_today) ? visitors_today : null;
  const instagram = Number.isSafeInteger(instagram_today) ? instagram_today : null;
  const telegram = Number.isSafeInteger(telegram_today) ? telegram_today : null;
  const search = Number.isSafeInteger(search_today) ? search_today : null;
  const direct = Number.isSafeInteger(direct_today) ? direct_today : null;
  const campaign = telegramCampaignLabel(campaignId);
  return `${count === 1 ? '👋 Новый посетитель' : '🔁 Повторный визит'}${number ? ` №${number}` : ''}\n` +
    (count ? `Это ${count}-й визит с этого браузера\n` : '') +
    `📍 Источник: ${safeSource}\n` +
    (source === 'telegram' && campaign ? `🔗 Ссылка: ${campaign}\n` : '') +
    `📄 Первая страница: ${safePage}\n` +
    (dailyVisits !== null && dailyVisitors !== null
      ? `📊 Сегодня: ${dailyVisits} визитов · ${dailyVisitors} браузеров\n` : '') +
    (search !== null ? `🔎 Из поиска сегодня: ${search}\n` : '') +
    (telegram !== null ? `📨 Из Telegram сегодня: ${telegram}\n` : '') +
    (instagram !== null ? `📸 Из Instagram сегодня: ${instagram}\n` : '') +
    (direct !== null ? `🔗 Прямые или скрытый источник: ${direct}\n` : '') +
    'Счёт по браузерам, посетившим сайт с согласием на аналитику';
}

export const sendTelegramVisitAlert = (visit, fetcher = fetch, env = process.env) =>
  sendMessage(visitAlertText(visit), fetcher, env);

export async function pollTelegramCommands(db, fetcher = fetch, env = process.env) {
  if (!db || !telegramReady(env)) return;
  const state = await db.query(`SELECT value FROM telegram_bot_state WHERE name='updates_offset'`);
  const offset = Number(state.rows[0]?.value || 0);
  const response = await fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offset, limit: 100, timeout: 0, allowed_updates: ['message'] }),
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`Telegram getUpdates returned HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.ok !== true || !Array.isArray(payload.result))
    throw new Error('Telegram getUpdates failed');
  for (const update of payload.result) {
    const nextOffset = Number(update.update_id) + 1;
    if (!Number.isSafeInteger(nextOffset) || nextOffset <= offset) continue;
    const message = update.message;
    if (String(message?.chat?.id) === env.TELEGRAM_CHAT_ID &&
        typeof message?.text === 'string') {
      const command = message.text.trim().split(/\s+/)[0].split('@')[0].toLowerCase();
      const reply = await telegramCommandText(db, command);
      if (reply) await sendMessage(reply, fetcher, env);
    }
    await db.query(`INSERT INTO telegram_bot_state(name,value) VALUES('updates_offset',$1)
      ON CONFLICT(name) DO UPDATE SET value=EXCLUDED.value`, [nextOffset]);
  }
}

export function startTelegramCommands(db, { intervalMs = 20000, fetcher = fetch,
  env = process.env } = {}) {
  if (!db || !telegramReady(env)) return () => {};
  let running = false;
  const poll = async () => {
    if (running) return;
    running = true;
    try { await pollTelegramCommands(db, fetcher, env); }
    catch (error) { console.error('Telegram commands failed:', error.message); }
    finally { running = false; }
  };
  const timer = setInterval(() => { void poll(); }, intervalMs);
  timer.unref?.();
  void fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands: [
      { command: 'stats', description: 'Сводка: визиты, продажи, ссылки' },
      { command: 'visits', description: 'Посещения и источники сегодня' },
      { command: 'sales', description: 'Оплаченные продажи' },
      { command: 'links', description: 'Четыре ссылки Telegram' },
      { command: 'help', description: 'Список команд' }
    ] }), signal: AbortSignal.timeout(5000)
  }).then(async response => {
    if (!response.ok || (await response.json())?.ok !== true)
      console.error('Telegram command menu failed');
  }).catch(error => console.error('Telegram command menu failed:', error.message));
  void poll();
  return () => clearInterval(timer);
}

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
            const { rows } = await client.query(`SELECT id,number,customer_name,email,phone,buyer_phone,
              whatsapp_opt_in,delivery_address,delivery_preference,total_cents,
              stripe_checkout_session_id,is_test,created_at,
              (SELECT max(e.created_at) FROM order_events e
                WHERE e.order_id=orders.id AND e.type='payment_paid') AS paid_at
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
