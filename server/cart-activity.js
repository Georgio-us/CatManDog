import { randomUUID } from 'node:crypto';
import { products as siteProducts } from '../data.js';

const stages = ['cart', 'checkout', 'review', 'payment'];
export const validCartId = value =>
  /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(String(value || ''));

export function cartInput(body) {
  if (!validCartId(body?.cartId) || !stages.includes(body?.stage) ||
      !Array.isArray(body?.items) || body.items.length > 50)
    throw Object.assign(new Error('Некорректная корзина'), { status: 400 });
  const grouped = new Map();
  for (const item of body.items) {
    const productId = String(item?.productId || '');
    const variantId = item?.variantId == null ? null : String(item.variantId);
    const qty = Number(item?.qty);
    if (!/^[a-zA-Z0-9_-]{1,180}$/.test(productId) ||
        (variantId !== null && !/^[a-zA-Z0-9_-]{1,180}$/.test(variantId)) ||
        !Number.isInteger(qty) || qty < 1 || qty > 99)
      throw Object.assign(new Error('Некорректный товар в корзине'), { status: 400 });
    const key = `${productId}:${variantId || ''}`;
    const previous = grouped.get(key);
    if (previous) previous.qty += qty;
    else grouped.set(key, { productId, variantId, qty });
  }
  const items = [...grouped.values()];
  return { cartId: body.cartId.toLowerCase(), stage: body.stage, items };
}

export function cartChanges(previous, next) {
  const before = new Map(previous.map(item => [`${item.productId}:${item.variantId || ''}`, item]));
  const after = new Map(next.map(item => [`${item.productId}:${item.variantId || ''}`, item]));
  const changes = [];
  for (const [key, item] of after) {
    const delta = item.qty - (before.get(key)?.qty || 0);
    if (delta) changes.push({ ...item, delta });
  }
  for (const [key, item] of before) {
    if (!after.has(key)) changes.push({ ...item, delta: -item.qty });
  }
  return changes;
}

async function namedCartItems(client, items) {
  const variants = items.filter(item => item.variantId).map(item => item.variantId);
  const products = items.filter(item => !item.variantId).map(item => item.productId);
  const [variantRows, productRows] = await Promise.all([
    variants.length ? client.query(`SELECT v.id,v.product_id,p.name,v.label
      FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
      WHERE v.id=ANY($1::text[])`, [variants]) : { rows: [] },
    products.length ? client.query(`SELECT id,name FROM catalog_products
      WHERE id=ANY($1::text[])`, [products]) : { rows: [] }
  ]);
  const byVariant = new Map(variantRows.rows.map(row => [row.id, row]));
  const byProduct = new Map(productRows.rows.map(row => [row.id, row]));
  const gifts = new Map(siteProducts.filter(product => product.gift)
    .map(product => [product.id, product]));
  return items.map(item => {
    const source = item.variantId ? byVariant.get(item.variantId)
      : byProduct.get(item.productId) || gifts.get(item.productId);
    if (!source || (item.variantId && source.product_id !== item.productId))
      return { ...item, name: 'Товар без связи с каталогом',
        label: [item.productId, item.variantId].filter(Boolean).join(' / '), unresolved: true };
    return { ...item, name: source.name, label: source.label || '' };
  });
}

export async function saveObservedCart(db, body) {
  const input = cartInput(body);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const items = await namedCartItems(client, input.items);
    await client.query(`INSERT INTO observed_carts(id)
      VALUES($1) ON CONFLICT DO NOTHING`, [input.cartId]);
    const existing = await client.query(`SELECT items,current_stage,furthest_stage
      FROM observed_carts WHERE id=$1 FOR UPDATE`, [input.cartId]);
    if (!existing.rows.length) {
      await client.query('COMMIT');
      return { accepted: false };
    }
    const row = existing.rows[0];
    const changes = cartChanges(row.items, items);
    const stageChanged = row.current_stage !== input.stage;
    if (changes.length || stageChanged || body.touch === true) {
      const furthest = stages[Math.max(stages.indexOf(row.furthest_stage), stages.indexOf(input.stage))];
      await client.query(`UPDATE observed_carts SET items=$2,current_stage=$3,
        furthest_stage=$4,updated_at=now() WHERE id=$1`,
      [input.cartId, JSON.stringify(items), input.stage, furthest]);
      if (changes.length || stageChanged) await client.query(`INSERT INTO observed_cart_events(id,cart_id,changes,stage)
        VALUES($1,$2,$3,$4)`, [randomUUID(), input.cartId, JSON.stringify(changes), input.stage]);
    }
    await client.query('COMMIT');
    return { accepted: true };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function deleteObservedCart(db, cartId) {
  if (!validCartId(cartId)) return { removed: false };
  const result = await db.query('DELETE FROM observed_carts WHERE id=$1', [cartId]);
  return { removed: result.rowCount > 0 };
}

export async function listObservedCarts(db) {
  const { rows } = await db.query(`SELECT c.id,c.items,c.current_stage,c.furthest_stage,
    c.created_at,c.updated_at,
    EXISTS(SELECT 1 FROM observed_cart_events e,
      LATERAL jsonb_array_elements(e.changes) change
      WHERE e.cart_id=c.id AND (change->>'delta')::integer > 0) AS had_items,
    EXISTS(SELECT 1 FROM orders o WHERE o.cart_session_id=c.id
      AND o.payment_status='paid') AS has_paid_order,
    (SELECT o.number FROM orders o WHERE o.cart_session_id=c.id
      ORDER BY (o.payment_status='paid') DESC,o.created_at DESC LIMIT 1) AS order_number,
    (SELECT coalesce(jsonb_agg(jsonb_build_object('name',i.name,
      'variant_label',i.variant_label,'quantity',i.quantity) ORDER BY i.id),'[]'::jsonb)
      FROM order_items i WHERE i.order_id=(SELECT o.id FROM orders o
        WHERE o.cart_session_id=c.id AND o.payment_status='paid'
        ORDER BY o.created_at DESC LIMIT 1)) AS purchased_items
    FROM observed_carts c
    WHERE NOT EXISTS(SELECT 1 FROM orders t WHERE t.cart_session_id=c.id AND t.is_test=true)
    ORDER BY c.updated_at DESC LIMIT 100`);
  return rows;
}

export function startObservedCartCleanup(db) {
  if (!db) return () => {};
  const clean = () => db.query(`DELETE FROM observed_carts
    WHERE updated_at < now() - interval '30 days'`)
    .catch(error => console.error('Cart cleanup failed:', error.message));
  void clean();
  const timer = setInterval(clean, 6 * 60 * 60 * 1000);
  timer.unref?.();
  return () => clearInterval(timer);
}

export async function observedCartEvents(db, cartId) {
  if (!validCartId(cartId))
    throw Object.assign(new Error('Корзина не найдена'), { status: 404 });
  const { rows } = await db.query(`SELECT changes,stage,created_at FROM observed_cart_events
    WHERE cart_id=$1 ORDER BY created_at DESC LIMIT 40`, [cartId]);
  return rows;
}
