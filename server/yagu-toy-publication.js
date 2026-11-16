import { yaguToyExpansionProducts } from '../yagu-toy-expansion-products.js';

// Keep supplier quotations and customer prices in separate records. The exact
// Yagu article is one purchase unit per retail pack for each of these toys.
export async function publishYaguToys(client) {
  const sourceId = 'grupo-yagu-duvo-toys-2026-11-16';
  await client.query(`INSERT INTO supplier_catalog_sources
    (id,supplier_name,brand,price_date,source_file,shop_price_tax_basis,retail_price_tax_basis)
    VALUES($1,'Grupo Yagu','Duvo+','2026-11-16',
      'Grupo Yagu B2B product pages, checked 2026-11-16','excludes_iva','includes_iva')
    ON CONFLICT(id) DO NOTHING`, [sourceId]);

  for (const [index, product] of yaguToyExpansionProducts.entries()) {
    const variant = product.variants[0];
    const sku = variant.supplier.sku;
    const itemId = `${sourceId}:${sku}`;
    await client.query(`INSERT INTO supplier_catalog_items
      (id,source_id,article,name,line,weight,ean,shop_price_cents,
        recommended_price_cents,minimum_price_cents,raw_prices,source_row)
      VALUES($1,$2,$3,$4,'Duvo+ toys',$5,'',$6,NULL,NULL,$7::jsonb,$8)
      ON CONFLICT(id) DO NOTHING`, [itemId, sourceId, sku, product.name,
      variant.label, Math.round(variant.purchasePrice * 100),
      JSON.stringify({ sourceUrl: variant.supplier.url, purchaseUnit: variant.purchaseUnit,
        checkedAt: variant.purchasePriceCheckedAt, taxIncluded: false }), index + 1]);
    await client.query(`INSERT INTO supplier_catalog_matches
      (item_id,source_id,variant_id,match_method)
      VALUES($1,$2,$3,'catalog') ON CONFLICT DO NOTHING`,
    [itemId, sourceId, variant.id]);
    await client.query(`UPDATE catalog_variants SET tax_rate_bps=coalesce(tax_rate_bps,2100)
      WHERE id=$1`, [variant.id]);
  }
}
