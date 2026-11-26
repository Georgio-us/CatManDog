const dayStart = "(date_trunc('day', now() AT TIME ZONE 'Europe/Madrid') AT TIME ZONE 'Europe/Madrid')";

const count = value => Number(value) || 0;
const euros = cents => `${(count(cents) / 100).toFixed(2).replace('.', ',')} €`;

export async function visitStatsText(db) {
  const { rows } = await db.query(`SELECT
    count(*)::integer AS all_visits,
    count(DISTINCT cart_id)::integer AS all_browsers,
    count(*) FILTER (WHERE created_at >= ${dayStart})::integer AS visits,
    count(DISTINCT cart_id) FILTER (WHERE created_at >= ${dayStart})::integer AS browsers,
    count(*) FILTER (WHERE source='search' AND created_at >= ${dayStart})::integer AS search,
    count(*) FILTER (WHERE source='telegram' AND created_at >= ${dayStart})::integer AS telegram,
    count(*) FILTER (WHERE source='instagram' AND created_at >= ${dayStart})::integer AS instagram,
    count(*) FILTER (WHERE source='direct' AND created_at >= ${dayStart})::integer AS direct,
    count(*) FILTER (WHERE source NOT IN ('search','telegram','instagram','direct')
      AND created_at >= ${dayStart})::integer AS other
    FROM site_visit_events`);
  const value = rows[0] || {};
  return `📊 Посещения сегодня (Валенсия)\n` +
    `Визиты: ${count(value.visits)} · браузеры: ${count(value.browsers)}\n` +
    `За всё время: визитов ${count(value.all_visits)} · браузеров ${count(value.all_browsers)}\n` +
    `🔎 Поиск: ${count(value.search)}\n` +
    `📨 Telegram: ${count(value.telegram)}\n` +
    `📸 Instagram: ${count(value.instagram)}\n` +
    `🔗 Прямые или скрытый источник: ${count(value.direct)}\n` +
    `🌐 Остальные: ${count(value.other)}\n` +
    `Только посетители, согласившиеся на аналитику; владелец исключён`;
}

export async function salesStatsText(db) {
  const { rows } = await db.query(`WITH paid AS (
    SELECT total_cents AS cents,
      COALESCE((SELECT max(e.created_at) FROM order_events e
        WHERE e.order_id=orders.id AND e.type='payment_paid'), created_at) AS at,
      'site' AS channel
      FROM orders WHERE payment_status='paid' AND is_test=false AND status!='cancelled'
    UNION ALL
    SELECT gross_cents AS cents, COALESCE(paid_on,sale_date)::timestamp AT TIME ZONE 'Europe/Madrid' AS at,
      'outside' AS channel FROM external_sales WHERE payment_status='paid'
  ) SELECT count(*)::integer AS all_count, coalesce(sum(cents),0)::bigint AS all_cents,
    count(*) FILTER (WHERE channel='site')::integer AS site_count,
    count(*) FILTER (WHERE channel='outside')::integer AS outside_count,
    count(*) FILTER (WHERE at >= ${dayStart})::integer AS today_count,
    coalesce(sum(cents) FILTER (WHERE at >= ${dayStart}),0)::bigint AS today_cents
    FROM paid`);
  const value = rows[0] || {};
  return `🛍 Продажи\nСегодня: ${count(value.today_count)} · ${euros(value.today_cents)}\n` +
    `Всего: ${count(value.all_count)} · ${euros(value.all_cents)}\n` +
    `Через сайт: ${count(value.site_count)} · вне сайта: ${count(value.outside_count)}\n` +
    `Тесты и возвраты исключены; суммы до вычета расходов`;
}

export async function linksStatsText(db) {
  const [{ rows }, { rows: landings }] = await Promise.all([
    db.query(`SELECT campaign_id,destination,
    count(*)::integer AS total,
    count(*) FILTER (WHERE created_at >= ${dayStart})::integer AS today
    FROM campaign_link_clicks WHERE campaign_id IN ('tg-vlc-01-w1','tg-vlc-02-w1')
    GROUP BY campaign_id,destination`),
    db.query(`SELECT campaign_id,count(*)::integer AS total,
      count(*) FILTER (WHERE created_at >= ${dayStart})::integer AS today
      FROM site_visit_events WHERE campaign_id IN ('tg-vlc-01-w1','tg-vlc-02-w1')
      GROUP BY campaign_id`)
  ]);
  const values = new Map(rows.map(row => [`${row.campaign_id}:${row.destination}`, row]));
  const siteVisits = new Map(landings.map(row => [row.campaign_id, row]));
  const line = (campaign, destination, label) => {
    const row = values.get(`${campaign}:${destination}`);
    return `${label}: ${count(row?.today)} сегодня · ${count(row?.total)} всего`;
  };
  return `🔗 Ссылки Telegram (клики по редиректу)\n` +
    `Метка 01 · tg-vlc-01-w1\n${line('tg-vlc-01-w1','site','Сайт')}\n${line('tg-vlc-01-w1','instagram','Instagram')}\n` +
    `Визиты с согласием: ${count(siteVisits.get('tg-vlc-01-w1')?.today)} сегодня\n` +
    `Метка 02 · tg-vlc-02-w1\n${line('tg-vlc-02-w1','site','Сайт')}\n${line('tg-vlc-02-w1','instagram','Instagram')}\n` +
    `Визиты с согласием: ${count(siteVisits.get('tg-vlc-02-w1')?.today)} сегодня\n` +
    `Метка показывает URL, а не подтверждённый чат публикации. Клики не равны уникальным посетителям или покупкам`;
}

export async function telegramCommandText(db, command) {
  if (command === '/help' || command === '/start')
    return `Команды CatManDog\n/visits - визиты и источники сегодня\n/sales - оплаченные продажи\n/links - клики по четырём ссылкам Telegram\n/stats - краткая сводка`;
  if (command === '/visits') return visitStatsText(db);
  if (command === '/sales') return salesStatsText(db);
  if (command === '/links') return linksStatsText(db);
  if (command === '/stats') return `${await visitStatsText(db)}\n\n${await salesStatsText(db)}\n\n${await linksStatsText(db)}`;
  return null;
}
