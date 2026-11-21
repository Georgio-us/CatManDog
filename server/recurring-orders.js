import { randomUUID } from 'node:crypto';

const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
export const recurringCadences = [2, 4, 6];
function desiredNextDate(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('Выберите дату следующего заказа');
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== value ||
      value <= new Date().toISOString().slice(0,10)) fail('Выберите будущую дату следующего заказа');
  return value;
}

export function selectedRecurringItems(selection, purchased) {
  if (!Array.isArray(selection) || !selection.length || selection.length > 50)
    fail('Выберите товары для регулярного заказа');
  const available = new Map(purchased.map(item => [`${item.productId}|${item.variantId}`, item]));
  const seen = new Set();
  return selection.map(item => {
    const productId = String(item?.productId || '');
    const variantId = String(item?.variantId || '');
    const key = `${productId}|${variantId}`;
    const source = available.get(key);
    const qty = Number(item?.qty);
    if (!source || seen.has(key) || !Number.isInteger(qty) || qty < 1 || qty > Number(source.qty))
      fail('Товары регулярного заказа не совпадают с покупкой');
    seen.add(key);
    return { productId, variantId, name: source.name, label: source.label, qty };
  });
}

export function recurringChoice(choice, purchased) {
  if (!choice) return null;
  const cadenceWeeks = Number(choice.cadenceWeeks);
  if (!recurringCadences.includes(cadenceWeeks)) fail('Выберите период регулярного заказа');
  const nextDate=desiredNextDate(choice.nextDate);
  return { cadenceWeeks, items: selectedRecurringItems(choice.items, purchased), ...(nextDate ? {nextDate} : {}) };
}

const orderLines = async (db, orderId) => (await db.query(`SELECT product_id AS "productId",
  variant_id AS "variantId",name,variant_label AS label,quantity AS qty
  FROM order_items WHERE order_id=$1 ORDER BY id`, [orderId])).rows;

export async function activateRecurringIntent(db, orderId) {
  const { rows } = await db.query(`SELECT customer_id,recurring_intent FROM orders
    WHERE id=$1 AND payment_status='paid'`, [orderId]);
  const order = rows[0];
  if (!order?.customer_id || !order.recurring_intent) return null;
  const choice = recurringChoice(order.recurring_intent, await orderLines(db, orderId));
  const inserted = await db.query(`INSERT INTO recurring_orders
    (id,customer_id,source_order_id,items,cadence_weeks,next_review_on)
    VALUES($1,$2,$3,$4,$5,coalesce($6::date,current_date+($5*7)))
    ON CONFLICT(source_order_id) DO NOTHING RETURNING id`,
  [randomUUID(), order.customer_id, orderId, JSON.stringify(choice.items), choice.cadenceWeeks, choice.nextDate || null]);
  return inserted.rows[0]?.id || null;
}

export async function createRecurringFromPurchase(db, customer, orderId, choice) {
  const { rows } = await db.query(`SELECT id FROM orders WHERE id=$1 AND payment_status='paid'
    AND status!='cancelled' AND (customer_id=$2 OR
      (customer_id IS NULL AND $4=true AND lower(email)=lower($3)))`,
  [orderId, customer.id, customer.email, customer.emailVerified === true]);
  if (!rows[0]) fail('Оплаченный заказ не найден в вашем кабинете', 404);
  if (!choice) fail('Выберите товары и период регулярного заказа');
  const normalized = recurringChoice(choice, await orderLines(db, orderId));
  const inserted = await db.query(`INSERT INTO recurring_orders
    (id,customer_id,source_order_id,items,cadence_weeks,next_review_on)
    VALUES($1,$2,$3,$4,$5,coalesce($6::date,current_date+($5*7)))
    ON CONFLICT(source_order_id) DO NOTHING RETURNING id`,
  [randomUUID(), customer.id, orderId, JSON.stringify(normalized.items), normalized.cadenceWeeks, normalized.nextDate || null]);
  if (!inserted.rows[0]) fail('Для этого заказа регулярный заказ уже сохранён', 409);
  return inserted.rows[0].id;
}

export async function listRecurringForCustomer(db, customerId) {
  const { rows } = await db.query(`SELECT id,source_order_id AS "sourceOrderId",items,
    cadence_weeks AS "cadenceWeeks",status,next_review_on AS "nextReviewOn",
    created_at AS "createdAt" FROM recurring_orders WHERE customer_id=$1
    ORDER BY created_at DESC`, [customerId]);
  return rows;
}

export async function updateRecurringForCustomer(db, customerId, id, change) {
  if (!change || typeof change !== 'object' || Array.isArray(change)) fail('Некорректные изменения');
  const { rows } = await db.query(`SELECT source_order_id,items,cadence_weeks,status,next_review_on
    FROM recurring_orders WHERE id=$1 AND customer_id=$2`, [id, customerId]);
  const plan = rows[0];
  if (!plan) fail('Регулярный заказ не найден', 404);
  if (plan.status === 'cancelled') fail('Регулярный заказ уже отменён', 409);
  const status = change.status === undefined ? plan.status : change.status;
  if (!['active','paused','cancelled'].includes(status)) fail('Некорректный статус');
  const cadence = change.cadenceWeeks === undefined ? plan.cadence_weeks : Number(change.cadenceWeeks);
  if (!recurringCadences.includes(cadence)) fail('Выберите период регулярного заказа');
  const items = change.items === undefined ? plan.items
    : selectedRecurringItems(change.items, await orderLines(db, plan.source_order_id));
  const nextDate=desiredNextDate(change.nextDate);
  await db.query(`UPDATE recurring_orders SET items=$3,cadence_weeks=$4,status=$5,
    next_review_on=CASE WHEN $8::date IS NOT NULL THEN $8::date WHEN $5='active' AND ($6!='active' OR $4!=$7)
      THEN current_date+($4*7) ELSE next_review_on END,updated_at=now()
    WHERE id=$1 AND customer_id=$2`,
  [id, customerId, JSON.stringify(items), cadence, status, plan.status, plan.cadence_weeks, nextDate]);
}

export async function listRecurringDue(db) {
  const { rows } = await db.query(`SELECT r.id,r.items,r.cadence_weeks AS "cadenceWeeks",
    r.next_review_on AS "nextReviewOn",r.status,o.is_test AS "isTest",c.name AS "customerName",c.email,
    o.phone,o.delivery_address AS "deliveryAddress"
    FROM recurring_orders r JOIN customers c ON c.id=r.customer_id
    JOIN orders o ON o.id=r.source_order_id
    WHERE r.status='active' AND r.next_review_on<=current_date+interval '3 days'
    ORDER BY r.next_review_on,r.created_at LIMIT 100`);
  return rows;
}

export async function markRecurringReviewed(db, id) {
  const { rowCount } = await db.query(`UPDATE recurring_orders SET
    next_review_on=greatest(current_date,next_review_on)+(cadence_weeks*7),
    last_reviewed_at=now(),updated_at=now()
    WHERE id=$1 AND status='active' AND next_review_on<=current_date+interval '3 days'`, [id]);
  if (!rowCount) fail('Регулярный заказ не найден или ещё не требует проверки', 404);
}
