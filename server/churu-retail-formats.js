import { products } from '../data.js';
import { churuPurchaseUnit } from '../churu-retail-formats.js';

// Publication is idempotent. The imported Albet purchase price remains the cost
// source; a customer format never creates another supplier purchase item.
export async function publishChuruRetailFormats(db) {
  const churu = products.filter(product => product.brand === 'Churu' &&
    (product.id.startsWith('tc-') || product.id === 'cmd-source-694e05cdc1b2582c'));
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043319)');
    const migration = await client.query(`SELECT 1 FROM catalog_migrations
      WHERE name='churu_retail_formats_2026_11_05'`);
    if (migration.rows.length) {
      await client.query('COMMIT');
      return;
    }
    await client.query(`UPDATE catalog_products SET active=true,source=source-'catalogHidden'
      WHERE id='cmd-source-694e05cdc1b2582c'`);
    for (const product of churu) {
      for (const variant of product.variants || []) {
        const format = variant.retailFormat;
        if (!format) continue;
        const code = format.sourceItemId.split(':').at(-1);
        const purchase = churuPurchaseUnit[code];
        if (!purchase || format.units > purchase.sticks)
          throw new Error(`Invalid Churu purchase conversion: ${variant.id}`);
        const updated = await client.query(`UPDATE catalog_variants SET
          source_price_cents=coalesce(source_price_cents,$3),
          purchase_price_cents=coalesce(purchase_price_cents,
            round(coalesce((SELECT i.shop_price_cents FROM supplier_catalog_items i
              WHERE i.id=$6 AND i.shop_price_cents>0),$7) * $8::numeric / $9::numeric)::integer),
          price_override_cents=$3,price_confirmed=true,source_orderable=true,active=true,
          availability=CASE WHEN $5 AND availability='unavailable' THEN 'source_on_demand'
            ELSE availability END,
          image_path=coalesce($10,image_path),details=$11::jsonb,
          source=jsonb_set(source,'{retailFormat}',$4::jsonb,true),updated_at=now()
          WHERE id=$1 AND product_id=$2`, [variant.id, product.id,
          Math.round(variant.price * 100), JSON.stringify(format),
          format.kind === 'mixedBox20',
          format.sourceItemId, purchase.wholesaleCents, format.units, purchase.sticks,
          variant.image?.src || null, JSON.stringify(variant.details || [])]);
        if (updated.rowCount !== 1) throw new Error(`Missing Churu retail SKU: ${variant.id}`);
      }
    }
    await client.query(`INSERT INTO catalog_migrations(name)
      VALUES('churu_retail_formats_2026_11_05')`);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
