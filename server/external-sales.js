export async function listExternalSales(db) {
  const { rows } = await db.query(`SELECT s.id,s.reference,s.sale_date,s.customer_note,
    s.payment_channel,s.payment_status,s.paid_on,s.gross_cents,s.product_cost_cents,
    s.date_basis,s.extra_received_cents,s.discount_cents,
    s.gift_cost_cents,s.gift_description,s.documentation_status,s.note,s.created_at,
    coalesce((SELECT sum(p.quantity*p.unit_cost_1e4) FROM sale_packaging_items p
      WHERE p.external_sale_id=s.id),0)::integer AS packaging_cost_1e4,
    coalesce((SELECT json_agg(json_build_object('name',p.material_name,
      'quantity',p.quantity) ORDER BY p.material_code) FROM sale_packaging_items p
      WHERE p.external_sale_id=s.id),'[]'::json) AS packaging_items,
    coalesce((SELECT sum(e.amount_cents) FROM sale_cash_expenses e
      WHERE e.external_sale_id=s.id AND e.kind='delivery'),0)::integer AS delivery_cost_cents,
    coalesce((SELECT sum(e.amount_cents) FROM sale_cash_expenses e
      WHERE e.external_sale_id=s.id AND e.kind='other'),0)::integer AS other_cost_cents,
    coalesce((SELECT json_agg(json_build_object('kind',e.kind,'name',e.description,
      'amountCents',e.amount_cents) ORDER BY e.created_at) FROM sale_cash_expenses e
      WHERE e.external_sale_id=s.id),'[]'::json) AS cash_expenses,
    i.variant_id,i.quantity,i.unit_price_cents,i.purchase_cost_cents AS item_cost_cents,
    i.stock_movement_id,p.name AS product_name,
    coalesce(v.image_path,p.image_path,'') AS image_path
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
      dateBasis: row.date_basis || 'sale',
      extraReceivedCents: row.extra_received_cents || 0,
      discountCents: row.discount_cents || 0,
      giftCostCents: row.gift_cost_cents,
      giftDescription: row.gift_description || '',
      packagingCostCents: Math.round(Number(row.packaging_cost_1e4 || 0) / 100),
      packagingItems: row.packaging_items || [],
      deliveryCostCents: row.delivery_cost_cents || 0,
      otherCostCents: row.other_cost_cents || 0,
      cashExpenses: row.cash_expenses || [],
      marginCents: row.gross_cents - row.product_cost_cents - row.gift_cost_cents -
        Math.round(Number(row.packaging_cost_1e4 || 0) / 100) -
        Number(row.delivery_cost_cents || 0) - Number(row.other_cost_cents || 0),
      documentationStatus: row.documentation_status, note: row.note,
      items: []
    });
    if (row.variant_id) sales.get(row.id).items.push({
      variantId: row.variant_id, name: row.product_name || row.variant_id,
      imagePath: row.image_path || '',
      quantity: row.quantity, unitPriceCents: row.unit_price_cents,
      purchaseCostCents: row.item_cost_cents, stockMovementId: row.stock_movement_id
    });
  }
  return [...sales.values()];
}
