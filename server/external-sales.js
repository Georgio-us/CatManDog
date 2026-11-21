export async function listExternalSales(db) {
  const { rows } = await db.query(`SELECT s.id,s.reference,s.sale_date,s.customer_note,
    s.payment_channel,s.payment_status,s.paid_on,s.gross_cents,s.product_cost_cents,
    s.gift_cost_cents,s.documentation_status,s.note,s.created_at,
    i.variant_id,i.quantity,i.unit_price_cents,i.purchase_cost_cents AS item_cost_cents,
    i.stock_movement_id,p.name AS product_name
    FROM external_sales s
    LEFT JOIN external_sale_items i ON i.sale_id=s.id
    LEFT JOIN catalog_variants v ON v.id=i.variant_id
    LEFT JOIN catalog_products p ON p.id=v.product_id
    WHERE s.id IN (SELECT id FROM external_sales ORDER BY sale_date DESC,created_at DESC LIMIT 100)
    ORDER BY s.sale_date DESC,s.created_at DESC,p.name`);
  const sales = new Map();
  for (const row of rows) {
    if (!sales.has(row.id)) sales.set(row.id, {
      id: row.id, reference: row.reference, saleDate: row.sale_date,
      customerNote: row.customer_note, paymentChannel: row.payment_channel,
      paymentStatus: row.payment_status, paidOn: row.paid_on,
      grossCents: row.gross_cents, productCostCents: row.product_cost_cents,
      giftCostCents: row.gift_cost_cents,
      marginCents: row.gross_cents - row.product_cost_cents - row.gift_cost_cents,
      documentationStatus: row.documentation_status, note: row.note,
      items: []
    });
    if (row.variant_id) sales.get(row.id).items.push({
      variantId: row.variant_id, name: row.product_name || row.variant_id,
      quantity: row.quantity, unitPriceCents: row.unit_price_cents,
      purchaseCostCents: row.item_cost_cents, stockMovementId: row.stock_movement_id
    });
  }
  return [...sales.values()];
}
