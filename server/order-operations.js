import { financePreview } from './finance.js';

const activeStatuses = new Set(['received', 'packing', 'delivering']);

function purchaseCost(item) {
  const manual = item.purchase_price_cents;
  const offer = item.offer_cost_cents;
  const catalog = item.catalog_cost_cents;
  let cents = null;
  let basis = 'unknown';
  let source = '';
  if (manual !== null && manual !== undefined) {
    cents = manual;
    if (manual === catalog) {
      basis = item.catalog_tax_basis;
      source = item.catalog_supplier || '';
    } else if (manual === offer) {
      basis = item.offer_vat_included ? 'includes_iva' : 'excludes_iva';
      source = item.offer_supplier || '';
    } else source = 'Цена в карточке SKU';
  } else if (offer !== null && offer !== undefined) {
    cents = offer;
    basis = item.offer_vat_included ? 'includes_iva' : 'excludes_iva';
    source = item.offer_supplier || '';
  } else if (catalog !== null && catalog !== undefined) {
    cents = catalog;
    basis = item.catalog_tax_basis;
    source = item.catalog_supplier || '';
  }
  const rate = item.tax_rate_bps;
  const grossCents = cents === null ? null : basis === 'includes_iva' ? cents :
    basis === 'excludes_iva' && Number.isInteger(rate)
      ? Math.round(cents * (1 + rate / 10000)) : null;
  return { cents, basis, source, grossCents };
}

export function summarizeOrder(order, items, demandByVariant = new Map()) {
  let tax;
  try { tax = financePreview(order, items, {}); }
  catch { tax = null; }
  const taxByVariant = new Map((tax?.lines || []).map(line => [line.variantId, line]));
  const lines = items.map(item => {
    const cost = purchaseCost(item);
    const physical = item.stock_quantity ?? 0;
    const commitments = demandByVariant.get(item.variant_id) || 0;
    const stockPosition = physical - (item.reserved_quantity || 0) - commitments;
    const taxLine = taxByVariant.get(item.variant_id);
    return { name: item.name, variantId: item.variant_id, variantLabel: item.variant_label,
      qty: item.quantity, unitPriceCents: item.unit_price_cents, sourceMode: item.source_mode,
      taxRateBps: item.tax_rate_bps, taxCents: taxLine?.taxCents ?? null,
      purchaseCostCents: cost.cents, purchaseCostGrossCents: cost.grossCents,
      purchaseCostBasis: cost.basis, purchaseCostSource: cost.source,
      physicalStock: physical, committedQuantity: commitments,
      stockPosition, orderStockDelta: !order.is_test && order.payment_status === 'paid' &&
        activeStatuses.has(order.status) && item.source_mode !== 'on_hand' ? -item.quantity : 0 };
  });
  const completeCost = lines.every(line => line.purchaseCostGrossCents !== null);
  const purchaseTotalCents = completeCost ? lines.reduce((sum, line) =>
    sum + line.purchaseCostGrossCents * line.qty, 0) : null;
  const merchandiseGrossCents = order.subtotal_cents - order.discount_cents;
  return { ...order, items: lines, merchandiseGrossCents, purchaseTotalCents,
    merchandiseSpreadCents: purchaseTotalCents === null ? null :
      merchandiseGrossCents - purchaseTotalCents,
    taxTotalCents: tax?.taxTotalCents ?? null, taxComplete: tax?.taxComplete ?? false,
    deliveryTaxRateBps: order.delivery_tax_rate_bps,
    deliveryTaxCents: tax?.delivery.taxCents ?? null,
    missingCostCount: lines.filter(line => line.purchaseCostGrossCents === null).length,
    costIsEstimate: lines.some(line => line.purchaseCostBasis === 'excludes_iva') };
}

export async function loadAdminOrders(db) {
  const { rows: orders } = await db.query(`SELECT o.id,o.number,o.customer_name,o.email,o.phone,
    o.delivery_address,o.delivery_preference,o.status,o.payment_status,o.stock_state,
    o.subtotal_cents,o.discount_cents,o.delivery_cents,o.delivery_tax_rate_bps,
    o.total_cents,o.created_at,o.is_test,o.confirmation_sent_at,o.confirmation_error,
    (SELECT max(e.created_at) FROM order_events e
      WHERE e.order_id=o.id AND e.type='payment_paid') AS paid_at
    FROM orders o ORDER BY o.created_at DESC LIMIT 100`);
  if (!orders.length) return [];
  const ids = orders.map(order => order.id);
  const [items, demand] = await Promise.all([
    db.query(`SELECT i.order_id,i.variant_id,i.name,i.variant_label,i.quantity,
      i.unit_price_cents,i.source_mode,i.tax_rate_bps,
      v.stock_quantity,v.reserved_quantity,v.purchase_price_cents,
      so.cost_cents AS offer_cost_cents,so.vat_included AS offer_vat_included,
      s.name AS offer_supplier,catalog.shop_price_cents AS catalog_cost_cents,
      catalog.shop_price_tax_basis AS catalog_tax_basis,
      catalog.supplier_name AS catalog_supplier
      FROM order_items i
      LEFT JOIN catalog_variants v ON v.id=i.variant_id
      LEFT JOIN supplier_offers so ON so.variant_id=i.variant_id AND so.preferred=true
      LEFT JOIN suppliers s ON s.id=so.supplier_id
      LEFT JOIN LATERAL (SELECT ci.shop_price_cents,cs.shop_price_tax_basis,
        cs.supplier_name FROM supplier_catalog_matches m
        JOIN supplier_catalog_items ci ON ci.id=m.item_id
        JOIN supplier_catalog_sources cs ON cs.id=ci.source_id
        WHERE m.variant_id=i.variant_id AND ci.shop_price_cents IS NOT NULL
        ORDER BY cs.price_date DESC,cs.imported_at DESC LIMIT 1) catalog ON true
      WHERE i.order_id=ANY($1::uuid[]) ORDER BY i.id`, [ids]),
    db.query(`SELECT i.variant_id,sum(i.quantity)::integer AS quantity
      FROM order_items i JOIN orders o ON o.id=i.order_id
      WHERE i.source_mode!='on_hand' AND o.payment_status='paid' AND o.is_test=false
        AND o.status IN ('received','packing','delivering')
      GROUP BY i.variant_id`)
  ]);
  const byOrder = new Map(orders.map(order => [order.id, []]));
  for (const item of items.rows) byOrder.get(item.order_id)?.push(item);
  const demandByVariant = new Map(demand.rows.map(row => [row.variant_id, row.quantity]));
  return orders.map(order => summarizeOrder(order, byOrder.get(order.id), demandByVariant));
}

export async function loadStockCommitments(db) {
  const { rows } = await db.query(`SELECT i.variant_id,sum(i.quantity)::integer AS quantity
    FROM order_items i JOIN orders o ON o.id=i.order_id
    WHERE i.source_mode!='on_hand' AND o.payment_status='paid' AND o.is_test=false
      AND o.status IN ('received','packing','delivering')
    GROUP BY i.variant_id`);
  return new Map(rows.map(row => [row.variant_id, row.quantity]));
}

export async function loadOpenOrderDemand(db) {
  const { rows } = await db.query(`SELECT i.variant_id,p.name,v.label,p.brand,
    coalesce(v.stock_quantity,0) AS physical_stock,
    sum(i.quantity)::integer AS quantity,
    string_agg(DISTINCT o.number, ', ' ORDER BY o.number) AS order_numbers
    FROM order_items i JOIN orders o ON o.id=i.order_id
    LEFT JOIN catalog_variants v ON v.id=i.variant_id
    LEFT JOIN catalog_products p ON p.id=v.product_id
    WHERE i.source_mode!='on_hand' AND o.payment_status='paid' AND o.is_test=false
      AND o.status IN ('received','packing','delivering')
    GROUP BY i.variant_id,p.name,v.label,p.brand,v.stock_quantity
    ORDER BY min(o.created_at),i.variant_id`);
  return rows;
}
