import { randomUUID } from 'node:crypto';

const packaging = [
  ['black_bag', 'Большой чёрный пакет', 3284],
  ['green_bag', 'Маленький зелёный пакет', 2776],
  ['sticker', 'Наклейка', 2738],
  ['welcome_card', 'Welcome открытка', 4068],
  ['paper_coupon', 'Бумажный купон 10%', 4158]
];

async function isolatedReconciliation(client, label, action) {
  await client.query(`SAVEPOINT ${label}`);
  try {
    const result = await action();
    await client.query(`RELEASE SAVEPOINT ${label}`);
    return result;
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${label}`);
    await client.query(`RELEASE SAVEPOINT ${label}`);
    console.warn(`${label} paused: ${error.message}`);
    return null;
  }
}

async function addPackaging(client, owner, quantities) {
  for (const [code, name, unitCost] of packaging) {
    const quantity = quantities[code] || 0;
    if (!quantity) continue;
    await client.query(`INSERT INTO sale_packaging_items
      (id,order_id,external_sale_id,material_code,material_name,quantity,
       unit_cost_1e4,source_document)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
    [randomUUID(), owner.orderId || null, owner.saleId || null, code, name,
      quantity, unitCost, code === 'black_bag' || code === 'green_bag'
        ? 'Wangda, фактура 19.11.2026' : 'Imprenta Soriano 00004808']);
  }
}

async function seedUniko(client) {
  const reference = 'lolita-uniko-tofu-6l-2026-11';
  const exists = await client.query('SELECT id FROM external_sales WHERE reference=$1', [reference]);
  if (exists.rows.length) return exists.rows[0].id;
  const variantId = 'cat-litter-uniko-tofu-6l-pack';
  const movements = await client.query(`SELECT id FROM inventory_movements
    WHERE variant_id=$1 AND reason='personal_expense' AND delta_on_hand=-1
      AND note ILIKE '%Продажа вне сайта%' ORDER BY created_at DESC`, [variantId]);
  if (movements.rows.length !== 1) {
    console.warn('Uniko paid sale not imported: exact existing stock movement was not unique');
    return null;
  }
  const saleId = randomUUID();
  await client.query(`INSERT INTO external_sales
    (id,reference,sale_date,customer_note,payment_channel,payment_status,paid_on,
     gross_cents,product_cost_cents,gift_cost_cents,documentation_status,note,date_basis)
    VALUES($1,$2,'2026-11-24','Лолита','cash','paid','2026-11-24',
      1100,568,46,'pending',$3,'confirmation')`, [saleId, reference,
    'Точная дата передачи не названа; 24.11 - дата подтверждения. Один тюбик Churu из отдельной подарочной пачки. Склад уже был списан вручную.']);
  await client.query(`INSERT INTO external_sale_items
    (sale_id,variant_id,quantity,unit_price_cents,purchase_cost_cents,stock_movement_id)
    VALUES($1,$2,1,1100,568,$3)`, [saleId, variantId, movements.rows[0].id]);
  await client.query(`UPDATE inventory_movements SET reason='manual_sale' WHERE id=$1`,
    [movements.rows[0].id]);
  return saleId;
}

async function seedDuvoSale(client) {
  const reference = 'duvo-churu-royal-canin-2026-11-24';
  const exists = await client.query('SELECT id FROM external_sales WHERE reference=$1', [reference]);
  if (exists.rows.length) return exists.rows[0].id;
  const items = [
    ['royalcanin-93e8aeca-85g', 149, 125],
    ['tc-4e50c58957-reference-pack', 329, 194],
    ['tc-0707caf730-reference-pack', 329, 194],
    ['yagu-7515988-catalog-pack', 678, 424]
  ];
  const stock = await client.query(`SELECT id,stock_quantity,reserved_quantity FROM catalog_variants
    WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE`, [items.map(([id]) => id)]);
  const byId = new Map(stock.rows.map(row => [row.id, row]));
  if (items.some(([id]) => !byId.has(id) || Number(byId.get(id).stock_quantity) -
      Number(byId.get(id).reserved_quantity) < 1)) {
    console.warn('Duvo/Churu paid sale not imported: one of four exact SKUs lacks free stock');
    return null;
  }
  const saleId = randomUUID();
  await client.query(`INSERT INTO external_sales
    (id,reference,sale_date,customer_note,payment_channel,payment_status,paid_on,
     gross_cents,product_cost_cents,gift_cost_cents,documentation_status,note,
     date_basis,extra_received_cents)
    VALUES($1,$2,'2026-11-24','Славик','uah_card_transfer','paid','2026-11-25',
      1500,938,0,'pending',$3,'confirmation',15)`, [saleId, reference,
    'Товары по розничным ценам 14,85 €. Покупатель перевёл эквивалент 15,00 € в гривне на карту, сверх суммы товаров 0,15 €. Владелец подтвердил получение 25.11; фактический курс, комиссия карты и точная дата передачи не названы. Себестоимость товара 9,3750 €, округлена один раз до 9,38 €.']);
  for (const [variantId, unitPrice, unitCost] of items) {
    const movementId = randomUUID();
    const changed = await client.query(`UPDATE catalog_variants SET
      stock_quantity=stock_quantity-1,updated_at=now() WHERE id=$1
      AND stock_quantity-reserved_quantity>=1
      RETURNING stock_quantity,reserved_quantity`, [variantId]);
    if (changed.rows.length !== 1) throw new Error(`Stock changed during owner sale: ${variantId}`);
    await client.query(`INSERT INTO inventory_movements
      (id,variant_id,idempotency_key,reason,delta_on_hand,delta_reserved,
       on_hand_after,reserved_after,note)
      VALUES($1,$2,$3,'manual_sale',-1,0,$4,$5,$6)`, [movementId, variantId,
      `${reference}-${variantId}`, changed.rows[0].stock_quantity,
      changed.rows[0].reserved_quantity, `Продажа вне сайта ${reference}`]);
    await client.query(`INSERT INTO external_sale_items
      (sale_id,variant_id,quantity,unit_price_cents,purchase_cost_cents,stock_movement_id)
      VALUES($1,$2,1,$3,$4,$5)`, [saleId, variantId, unitPrice, unitCost, movementId]);
  }
  return saleId;
}

async function closeDeliveredAntonOrder(client) {
  const { rows } = await client.query(`SELECT id,status,stock_state,total_cents FROM orders
    WHERE number='CMD-10004' AND payment_status='paid' AND is_test=false FOR UPDATE`);
  if (rows.length !== 1 || rows[0].status === 'delivered') return;
  const order = rows[0];
  if (Number(order.total_cents) !== 3735 || order.stock_state !== 'reserved' ||
      !['received', 'packing', 'delivering'].includes(order.status)) {
    console.warn('Anton delivery status not reconciled: live order differs from confirmed paid reservation');
    return;
  }
  const items = await client.query(`SELECT variant_id,quantity,source_mode FROM order_items
    WHERE order_id=$1 ORDER BY variant_id`, [order.id]);
  if (items.rows.length !== 3) {
    console.warn('Anton delivery status not reconciled: expected exactly three sale lines');
    return;
  }
  for (const item of items.rows) {
    const onHand = item.source_mode === 'on_hand';
    const changed = onHand ? await client.query(`UPDATE catalog_variants SET
      stock_quantity=stock_quantity-$1,reserved_quantity=reserved_quantity-$1,
      updated_at=now() WHERE id=$2 AND stock_quantity>=$1 AND reserved_quantity>=$1
      RETURNING stock_quantity,reserved_quantity`, [item.quantity,item.variant_id]) :
      await client.query(`UPDATE catalog_variants SET stock_quantity=stock_quantity-$1,
        updated_at=now() WHERE id=$2 AND stock_quantity>=$1
        RETURNING stock_quantity,reserved_quantity`, [item.quantity,item.variant_id]);
    if (changed.rows.length !== 1) throw new Error(`Anton reserved stock changed: ${item.variant_id}`);
    await client.query(`INSERT INTO inventory_movements
      (id,variant_id,order_id,idempotency_key,reason,delta_on_hand,delta_reserved,
       on_hand_after,reserved_after,note)
      VALUES($1,$2,$3,$4,'order_fulfilled',$5,$6,$7,$8,$9)`,
    [randomUUID(), item.variant_id, order.id, `anton_owner_handoff_2026_11_25_${item.variant_id}`,
      -item.quantity, onHand ? -item.quantity : 0,
      changed.rows[0].stock_quantity, changed.rows[0].reserved_quantity,
      'Владелец подтвердил передачу оплаченного заказа 25.11.2026']);
  }
  await client.query(`UPDATE orders SET status='delivered',stock_state='consumed',
    updated_at=now() WHERE id=$1`, [order.id]);
  await client.query(`INSERT INTO order_events(id,order_id,type,actor,note)
    VALUES($1,$2,'delivered','owner-confirmed reconciliation',
      'Владелец подтвердил 25.11.2026, что заказ уже доставлен; точная дата вручения не названа')`,
    [randomUUID(), order.id]);
}

async function recordVerifiedAntonStripeFee(client, orderId) {
  // The live Stripe payment breakdown shows EUR 37.35 charged, EUR 0.81 in
  // processing fees and EUR 36.54 net. The PaymentIntent metadata matches this order.
  const paymentIntentId = 'pi_3Ub3s1FHvDnlkvf61NDJrKRX';
  const { rows } = await client.query(`UPDATE orders SET stripe_fee_cents=81,
    stripe_payment_intent_id=coalesce(stripe_payment_intent_id,$2),
    stripe_fee_checked_at=now() WHERE id=$1 AND id='ca67dce9-2601-4e79-a25c-fc9d9bd62dc8'
    AND number='CMD-10004' AND payment_status='paid' AND is_test=false
    AND total_cents=3735 AND stripe_fee_cents IS NULL
    AND (stripe_payment_intent_id IS NULL OR stripe_payment_intent_id=$2)
    RETURNING id`, [orderId, paymentIntentId]);
  if (!rows.length) return;
  await client.query(`INSERT INTO order_events(id,order_id,type,actor,note)
    VALUES($1,$2,'stripe_fee_verified','stripe-dashboard-reconciliation',
      'Stripe PaymentIntent pi_3Ub3s1FHvDnlkvf61NDJrKRX: charged EUR 37.35, processing fee EUR 0.81, net EUR 36.54; verified in live dashboard 25.11.2026')`,
    [randomUUID(), orderId]);
}

export async function seedInitialSalesLedger(client) {
  await client.query(`UPDATE external_sales SET gift_description='Отдельный тюбик Churu'
    WHERE reference IN ('neighbor-pouches-2026-11-21',
      'lolita-uniko-tofu-6l-2026-11') AND gift_cost_cents=46
      AND gift_description IS NULL`);
  const neighbor = await client.query(`SELECT id FROM external_sales
    WHERE reference='neighbor-pouches-2026-11-21'`);
  if (neighbor.rows.length) await addPackaging(client, { saleId: neighbor.rows[0].id },
    { black_bag: 1, green_bag: 1, sticker: 2, welcome_card: 1, paper_coupon: 1 });
  const anton = await client.query(`SELECT id FROM orders WHERE number='CMD-10004'
    AND payment_status='paid' AND is_test=false`);
  if (anton.rows.length === 1) {
    const orderId = anton.rows[0].id;
    await isolatedReconciliation(client, 'anton_stripe_fee', () =>
      recordVerifiedAntonStripeFee(client, orderId));
    await addPackaging(client, { orderId },
      { black_bag: 1, green_bag: 1, sticker: 2, welcome_card: 1, paper_coupon: 1 });
    for (const [code, description, cost, expenseRef] of [
      ['churu_stick', 'Подарочный тюбик Churu', 46,
        'owner-expense-2026-11-21-churu-anton-gift'],
      ['leonardo_pouch', 'Подарочный пауч Leonardo', 102,
        'owner-expense-2026-11-21-leonardo-anton-gift']
    ]) await client.query(`INSERT INTO order_gift_items
      (id,order_id,gift_code,description,cost_cents,expense_reference)
      VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
      [randomUUID(), orderId, code, description, cost, expenseRef]);
  }
  await isolatedReconciliation(client, 'anton_handoff', () => closeDeliveredAntonOrder(client));
  const unikoId = await isolatedReconciliation(client, 'uniko_sale', () => seedUniko(client));
  if (unikoId) {
    await client.query(`UPDATE external_sales SET gift_description='Отдельный тюбик Churu'
      WHERE id=$1 AND gift_cost_cents=46 AND gift_description IS NULL`, [unikoId]);
    await addPackaging(client, { saleId: unikoId },
      { black_bag: 1, sticker: 1, welcome_card: 1, paper_coupon: 1 });
  }
  const duvoId = await isolatedReconciliation(client, 'duvo_sale', () => seedDuvoSale(client));
  if (duvoId) await addPackaging(client, { saleId: duvoId },
    { green_bag: 1, sticker: 1, welcome_card: 1, paper_coupon: 1 });
}
