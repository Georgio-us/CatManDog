export function sourcingStatus(supplierMatch, selectedUnits) {
  if (selectedUnits > 0 && supplierMatch) return 'on_hand';
  if (supplierMatch) return 'source_on_demand';
  return 'unavailable';
}

export async function supplierSourcingByVariant(db) {
  const { rows } = await db.query(`SELECT m.variant_id,
    count(*)::integer AS source_count,
    coalesce(sum(s.quantity * coalesce(s.retail_units_per_purchase_unit,1)),0)::integer AS selected_units
    FROM supplier_catalog_matches m
    JOIN supplier_catalog_items i ON i.id=m.item_id
    JOIN supplier_catalog_sources c ON c.id=i.source_id
    LEFT JOIN selected_supplier_items s ON s.item_id=i.id
    WHERE i.shop_price_cents > 0
    GROUP BY m.variant_id`);
  return new Map(rows.map(row => [row.variant_id, {
    sourceCount: Number(row.source_count), selectedUnits: Number(row.selected_units),
    status: sourcingStatus(Number(row.source_count) > 0, Number(row.selected_units))
  }]));
}
