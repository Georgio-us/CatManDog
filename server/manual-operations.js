import { randomUUID } from 'node:crypto';
import { salePriceDecision } from './sale-price-policy.js';

export const packagingMaterials = [
  { code: 'black_bag', name: 'Большой чёрный пакет', cost1e4: 3284 },
  { code: 'green_bag', name: 'Маленький зелёный пакет', cost1e4: 2776 },
  { code: 'sticker', name: 'Наклейка', cost1e4: 2738 },
  { code: 'welcome_card', name: 'Welcome открытка', cost1e4: 4068 },
  { code: 'paper_coupon', name: 'Бумажный купон 10%', cost1e4: 4158 }
];

const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const uuid = value => /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value || '');

export async function manualOperationChoices(db) {
  const { rows } = await db.query(`SELECT v.id AS variant_id,v.label,v.stock_quantity,
    v.reserved_quantity,v.source_price_cents,v.price_override_cents,v.price_confirmed,
    v.source AS price_source,p.name,coalesce(v.image_path,p.image_path) AS image_path,
    verified.quantity AS verified_quantity,verified.total_cost_cents AS verified_cost_cents
    FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
    LEFT JOIN verified_purchase_costs verified ON verified.variant_id=v.id
    WHERE v.active=true AND p.active=true AND coalesce(v.stock_quantity,0)>v.reserved_quantity
    ORDER BY p.name,v.label`);
  return { variants: rows.map(row => {
    const retail = salePriceDecision(row);
    return { variantId: row.variant_id, name: row.name, label: row.label,
      imagePath: row.image_path || '', available: row.stock_quantity - row.reserved_quantity,
      priceCents: retail.accepted ? retail.priceCents : null,
      costCents: row.verified_quantity > 0
        ? Math.round(row.verified_cost_cents / row.verified_quantity) : null };
  }), packaging: packagingMaterials };
}

// One transaction covers the sale, materials, gifts, expenses and every stock movement.
export async function recordManualOperation(db, staffId, body) {
  const kind = body?.kind;
  const key = body?.idempotencyKey;
  if (!['sale', 'personal'].includes(kind) || !uuid(key)) fail('Проверьте тип операции и ключ');
  const items = body.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > 40 ||
      items.some(item => typeof item.variantId !== 'string' ||
        !integer(item.quantity, 1, 999) ||
        (item.unitPriceCents !== undefined && !integer(item.unitPriceCents, 0, 1000000)) ||
        (item.unitCostCents !== undefined && !integer(item.unitCostCents, 0, 1000000))))
    fail('Проверьте товары и количество');
  const ids = items.map(item => item.variantId);
  if (new Set(ids).size !== ids.length) fail('Один SKU укажите одной строкой');
  const gift = kind === 'sale' && body.gift?.variantId ? body.gift : null;
  if (gift && (typeof gift.variantId !== 'string' ||
      !integer(gift.quantity, 1, 999) ||
      (gift.unitCostCents !== undefined && !integer(gift.unitCostCents, 0, 1000000))))
    fail('Проверьте подарочный товар');
  if (kind === 'personal' && (body.gift || body.packaging || body.expenses))
    fail('Личный расход не содержит продажи и упаковки');
  const customer = String(body.customer || '').trim().slice(0, 140);
  const payment = String(body.paymentChannel || '').trim();
  const received = body.receivedCents;
  if (kind === 'sale' && (!customer || !['cash','bank_transfer','card_terminal',
    'privatbank_ua','uah_card_transfer','other'].includes(payment) ||
    !integer(received, 1, 100000000))) fail('Укажите покупателя, оплату и полученную сумму');
  const materials = body.packaging || {};
  if (kind === 'sale' && (typeof materials !== 'object' || Array.isArray(materials) ||
    Object.entries(materials).some(([code, qty]) =>
      !packagingMaterials.some(material => material.code === code) || !integer(qty, 0, 999))))
    fail('Проверьте упаковку');
  const expenses = body.expenses || [];
  if (kind === 'sale' && (!Array.isArray(expenses) || expenses.length > 10 ||
    expenses.some(expense => !['delivery','other'].includes(expense.kind) ||
      !String(expense.description || '').trim() ||
      !integer(expense.amountCents, 1, 1000000)))) fail('Проверьте дополнительные расходы');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
    const prior = await client.query(`SELECT id,reference FROM external_sales WHERE reference=$1`,
      [`admin-${key}`]);
    const priorPersonal = kind === 'personal' ? await client.query(
      `SELECT id FROM owner_expenses WHERE reference=$1`, [`personal-${key}-${ids[0]}`]) : { rows: [] };
    if (prior.rows.length || priorPersonal.rows.length) {
      await client.query('COMMIT');
      return { ok: true, alreadyRecorded: true, reference: prior.rows[0]?.reference || `personal-${key}` };
    }
    const allIds = [...ids, ...(gift ? [gift.variantId] : [])];
    const locked = await client.query(`SELECT v.id,v.stock_quantity,v.reserved_quantity,
      v.source_price_cents,v.price_override_cents,v.price_confirmed,v.source AS price_source,
      v.purchase_price_cents,p.name,
      verified.quantity AS verified_quantity,verified.total_cost_cents AS verified_cost_cents
      FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
      LEFT JOIN verified_purchase_costs verified ON verified.variant_id=v.id
      WHERE v.id=ANY($1::text[]) AND v.active=true AND p.active=true
      ORDER BY v.id FOR UPDATE OF v`, [allIds]);
    const variants = new Map(locked.rows.map(row => [row.id, row]));
    const lines = [...items, ...(gift ? [gift] : [])].map(item => {
      const row = variants.get(item.variantId);
      if (!row) fail(`SKU не найден: ${item.variantId}`, 404);
      if (Number(row.stock_quantity || 0) - Number(row.reserved_quantity || 0) < item.quantity)
        fail(`Недостаточно свободного остатка: ${row.name}`, 409);
      const verifiedCost = row.verified_quantity > 0
        ? Math.round(row.verified_cost_cents / row.verified_quantity) : null;
      const cost = item.unitCostCents ?? verifiedCost;
      if (!integer(cost, 0, 1000000)) fail(`Укажите фактическую закупку с налогами: ${row.name}`);
      const retail = salePriceDecision({ ...row, variant_id: row.id });
      const price = item.unitPriceCents ?? (retail.accepted ? retail.priceCents : null);
      if (kind === 'sale' && item !== gift && !integer(price, 0, 1000000))
        fail(`Укажите цену продажи: ${row.name}`);
      return { ...item, row, cost, price };
    });
    const saleLines = lines.slice(0, items.length);
    const giftLine = gift ? lines.at(-1) : null;
    const merchandise = saleLines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    if (kind === 'sale' && received > merchandise + 1000000)
      fail('Полученная сумма слишком отличается от стоимости товаров');
    const saleId = randomUUID();
    const reference = `admin-${key}`;
    if (kind === 'sale') await client.query(`INSERT INTO external_sales
      (id,reference,sale_date,customer_note,payment_channel,payment_status,paid_on,
       gross_cents,product_cost_cents,gift_cost_cents,documentation_status,
       extra_received_cents,gift_description,discount_cents)
      VALUES($1,$2,(now() AT TIME ZONE 'Europe/Madrid')::date,$3,$4,'paid',
        (now() AT TIME ZONE 'Europe/Madrid')::date,$5,$6,$7,'pending',$8,$9,$10)`,
    [saleId, reference, customer, payment, received,
      saleLines.reduce((sum, line) => sum + line.cost * line.quantity, 0),
      giftLine ? giftLine.cost * giftLine.quantity : 0,
      Math.max(0, received - merchandise), giftLine?.row.name || null,
      Math.max(0, merchandise - received)]);
    for (const line of lines) {
      const movementId = randomUUID();
      const changed = await client.query(`UPDATE catalog_variants SET
        stock_quantity=stock_quantity-$1,
        availability=CASE WHEN stock_quantity-$1=0 THEN 'source_on_demand' ELSE availability END,
        updated_at=now() WHERE id=$2 AND stock_quantity-reserved_quantity >= $1
        RETURNING stock_quantity,reserved_quantity`, [line.quantity, line.variantId]);
      if (!changed.rows.length) fail(`Остаток изменился: ${line.row.name}`, 409);
      await client.query(`INSERT INTO inventory_movements
        (id,variant_id,staff_id,unit_cost_cents,idempotency_key,reason,delta_on_hand,
         on_hand_after,reserved_after,note,unit_cost_includes_iva)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)`, [movementId,line.variantId,staffId,
        line.cost,`${key}-${line.variantId}${line === giftLine ? '-gift' : ''}`, kind === 'personal' || line === giftLine
          ? 'personal_expense' : 'manual_sale', -line.quantity,
        changed.rows[0].stock_quantity,changed.rows[0].reserved_quantity,
        kind === 'personal' ? 'Для себя' : line === giftLine ? `Подарок к продаже ${reference}` :
          `Продажа вне сайта ${reference}`]);
      if (kind === 'sale' && line !== giftLine) await client.query(`INSERT INTO external_sale_items
        (sale_id,variant_id,quantity,unit_price_cents,purchase_cost_cents,stock_movement_id)
        VALUES($1,$2,$3,$4,$5,$6)`, [saleId,line.variantId,line.quantity,line.price,
          line.cost * line.quantity,movementId]);
      if (kind === 'personal' || line === giftLine) await client.query(`INSERT INTO owner_expenses
        (id,reference,expense_date,item_name,variant_id,quantity,total_cost_cents,
         category,recipient,stock_movement_id,related_sale_reference)
        VALUES($1,$2,(now() AT TIME ZONE 'Europe/Madrid')::date,$3,$4,$5,$6,$7,$8,$9,$10)`, [randomUUID(),
          kind === 'personal' ? `personal-${key}-${line.variantId}` : `gift-${key}`,
          line.row.name,line.variantId,line.quantity,line.cost * line.quantity,
          kind === 'personal' ? 'personal' : 'welcome_gift',
          kind === 'personal' ? 'Владелец' : customer,movementId,
          kind === 'personal' ? null : reference]);
    }
    if (kind === 'sale') {
      for (const material of packagingMaterials) {
        const qty = materials[material.code] || 0;
        if (!qty) continue;
        await client.query(`INSERT INTO sale_packaging_items
          (id,external_sale_id,material_code,material_name,quantity,unit_cost_1e4,source_document)
          VALUES($1,$2,$3,$4,$5,$6,$7)`, [randomUUID(),saleId,material.code,
          material.name,qty,material.cost1e4,'Подтверждённая стоимость упаковки']);
      }
      for (const expense of expenses) await client.query(`INSERT INTO sale_cash_expenses
        (id,external_sale_id,kind,description,amount_cents,idempotency_key)
        VALUES($1,$2,$3,$4,$5,$6)`, [randomUUID(),saleId,expense.kind,
          String(expense.description).trim().slice(0,140),expense.amountCents,randomUUID()]);
    }
    await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,$3,$4,$5)`, [randomUUID(),staffId,
        kind === 'sale' ? 'external_sale_recorded' : 'personal_purchase_recorded',
        kind === 'sale' ? saleId : key,{ reference, items: ids, customer: kind === 'sale' ? customer : null }]);
    await client.query('COMMIT');
    return { ok: true, alreadyRecorded: false, reference };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
