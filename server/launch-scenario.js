import { randomUUID } from 'node:crypto';

const DELIVERY_FEE_CENTS = 399;
const FREE_DELIVERY_FROM_CENTS = 4900;
const trim = (value, limit) => String(value ?? '').trim().slice(0, limit);

export function launchState(selected, matched) {
  if (selected) return 'on_hand';
  if (matched) return 'source_on_demand';
  return 'unavailable';
}

export function launchPrice(row) {
  return row.price_confirmed && (row.price_override_cents ?? row.source_price_cents) > 0
    ? row.price_override_cents ?? row.source_price_cents : 777;
}

export async function launchCatalog(db) {
  const { rows } = await db.query(`SELECT v.id AS variant_id,v.product_id,v.label,v.active AS variant_active,
      p.name,p.brand,p.category,p.pet,p.image_path,p.active AS product_active,
      v.image_path AS variant_image_path,v.price_confirmed,v.price_override_cents,v.source_price_cents,
      coalesce(s.selected_units,0)::integer AS selected_units,
      coalesce(m.source_count,0)::integer AS source_count
    FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
    LEFT JOIN LATERAL (SELECT count(*)::integer AS source_count
      FROM supplier_catalog_matches sm JOIN supplier_catalog_items i ON i.id=sm.item_id
      WHERE sm.variant_id=v.id AND i.shop_price_cents>0) m ON true
    LEFT JOIN LATERAL (SELECT sum(si.quantity * coalesce(si.retail_units_per_purchase_unit,1))::integer AS selected_units
      FROM selected_supplier_items si JOIN supplier_catalog_matches sm ON sm.item_id=si.item_id
      WHERE sm.variant_id=v.id) s ON true
    WHERE coalesce(p.source->>'gift','')='' AND coalesce(p.source->>'catalogHidden','false')!='true'
    ORDER BY p.brand,p.name,v.label`);
  return rows.map(row => ({
    variantId: row.variant_id, productId: row.product_id, name: row.name,
    label: row.label, brand: row.brand, category: row.category, pet: row.pet,
    image: row.variant_image_path || row.image_path,
    state: launchState(row.selected_units > 0, row.source_count > 0),
    selectedUnits: row.selected_units, sourceCount: row.source_count,
    published: row.product_active && row.variant_active,
    priceCents: launchPrice(row), priceConfirmed: row.price_confirmed === true
  }));
}

export function launchGroups(lines, byId, grouping = 'together') {
  if (!Array.isArray(lines) || !lines.length || lines.length > 40) throw new Error('Проверьте корзину');
  const seen = new Set();
  const items = lines.map(line => {
    const id = trim(line?.variantId, 180);
    const item = byId.get(id);
    if (!item || item.state === 'unavailable' || seen.has(id) ||
        !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99)
      throw new Error('Проверьте товар и количество');
    seen.add(id);
    return { variantId: id, productId: item.productId, name: item.name,
      label: item.label, image: item.image, quantity: line.quantity,
      state: item.state, unitPriceCents: item.priceCents,
      priceConfirmed: item.priceConfirmed };
  });
  if (!['together', 'separate'].includes(grouping)) throw new Error('Выберите способ доставки');
  const stock = items.filter(item => item.state === 'on_hand');
  const supplier = items.filter(item => item.state === 'source_on_demand');
  const lists = grouping === 'separate' && stock.length && supplier.length ? [stock, supplier] : [items];
  return lists.map(list => {
    const subtotalCents = list.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
    const deliveryCents = subtotalCents >= FREE_DELIVERY_FROM_CENTS ? 0 : DELIVERY_FEE_CENTS;
    return { items: list, subtotalCents, deliveryCents, totalCents: subtotalCents + deliveryCents,
      deliveryType: list.some(item => item.state === 'source_on_demand') ? 'supplier' : 'stock' };
  });
}

export async function saveLaunchOrder(db, ownerId, payload) {
  const catalog = await launchCatalog(db);
  const groups = launchGroups(payload?.items, new Map(catalog.map(item => [item.variantId, item])), payload?.grouping);
  const contact = {
    name: trim(payload?.contact?.name, 100), email: trim(payload?.contact?.email, 160),
    phone: trim(payload?.contact?.phone, 24)
  };
  const address = {
    city: 'València', postcode: trim(payload?.address?.postcode, 5),
    street: trim(payload?.address?.street, 120), building: trim(payload?.address?.building, 16),
    apartment: trim(payload?.address?.apartment, 80)
  };
  if (!contact.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) || contact.phone.length < 6)
    throw new Error('Укажите имя, email и телефон');
  if (!/^460\d{2}$/.test(address.postcode) || !address.street || !address.building)
    throw new Error('Укажите адрес в городе Валенсия');
  const delivery = {
    day: trim(payload?.delivery?.day, 10), slot: trim(payload?.delivery?.slot, 11),
    supplierNote: 'Срок согласуем после подтверждения наличия'
  };
  if (groups.some(group => group.deliveryType === 'stock') &&
      (!['today','tomorrow'].includes(delivery.day) ||
        !['10:00-14:00','14:00-18:00','18:00-22:00'].includes(delivery.slot)))
    throw new Error('Выберите удобное время для товара в наличии');
  const client = await db.connect();
  const batchId = randomUUID();
  try {
    await client.query('BEGIN');
    const orders = [];
    for (const group of groups) {
      const { rows } = await client.query(`INSERT INTO launch_test_orders
        (id,batch_id,owner_id,number,items,contact,address,delivery,subtotal_cents,delivery_cents,total_cents)
        VALUES($1,$2,$3,'TEST-' || nextval('launch_test_order_number_seq'),$4,$5,$6,$7,$8,$9,$10)
        RETURNING id,number,subtotal_cents,delivery_cents,total_cents,delivery,created_at`,
      [randomUUID(), batchId, ownerId, JSON.stringify(group.items), JSON.stringify(contact),
        JSON.stringify(address), JSON.stringify({ type: group.deliveryType, ...delivery }),
        group.subtotalCents, group.deliveryCents, group.totalCents]);
      orders.push(rows[0]);
    }
    await client.query('COMMIT');
    return { orders, batchId };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
