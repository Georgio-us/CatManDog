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

// A follow-up migration corrects the descriptions and availability of rows
// created before the first production catalogue check.
export async function publishChuruRetailFormatDetails(db) {
  const churu = products.filter(product => product.brand === 'Churu' &&
    product.variants?.some(variant => variant.retailFormat));
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043319)');
    const migration = await client.query(`SELECT 1 FROM catalog_migrations
      WHERE name='churu_retail_format_details_2026_11_05'`);
    if (!migration.rows.length) {
      for (const product of churu) for (const variant of product.variants) {
        const result = await client.query(`UPDATE catalog_variants SET description=$3,
          availability=CASE WHEN $4 AND availability='pending' THEN 'source_on_demand'
            ELSE availability END,updated_at=now() WHERE id=$1 AND product_id=$2`,
        [variant.id, product.id, variant.description || product.description,
          variant.retailFormat.kind === 'carton48']);
        if (result.rowCount !== 1) throw new Error(`Missing Churu retail SKU: ${variant.id}`);
      }
      await client.query(`INSERT INTO catalog_migrations(name)
        VALUES('churu_retail_format_details_2026_11_05')`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

// Add the next exact Albet lines without changing the owner's existing Churu prices.
// The supplier buys one carton; the storefront sells distinct sealed formats.
export async function publishChuruAdditionalFormats(db) {
  const additions = [
    { productId: 'tc-713f42fb9a', article: '946512', name: 'Churu Kitten курица',
      ean: '4262365730589', row: 6 },
    { productId: 'churu-dog-chicken', article: '940300', name: 'Churu DOG курица',
      ean: '8859387701060', row: 7 }
  ];
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043319)');
    const migration = 'churu_kitten_dog_formats_2026_11_11';
    const done = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1', [migration]);
    if (done.rows.length) {
      await client.query('COMMIT');
      return;
    }
    const sourceId = 'albet-churu-2026-11-03';
    await client.query(`INSERT INTO supplier_catalog_sources
      (id,supplier_name,brand,price_date,source_file,shop_price_tax_basis,retail_price_tax_basis)
      VALUES($1,'Albet','Churu','2026-11-03',
        'ALBET-LIVE-AUDIT-2026-11-03.md','excludes_iva','excludes_iva')
      ON CONFLICT(id) DO NOTHING`, [sourceId]);
    for (const item of additions) {
      const product = products.find(candidate => candidate.id === item.productId);
      if (!product || product.variants.length !== 3)
        throw new Error(`Missing Churu format family: ${item.productId}`);
      const itemId = `${sourceId}:${item.article}`;
      await client.query(`INSERT INTO supplier_catalog_items
        (id,source_id,article,name,line,weight,ean,shop_price_cents,
          recommended_price_cents,minimum_price_cents,raw_prices,source_row)
        VALUES($1,$2,$3,$4,'Inaba CIAO / Churu','12 × 4 × 14 г',$5,2112,
          3589,NULL,$6::jsonb,$7)
        ON CONFLICT(id) DO NOTHING`, [itemId, sourceId, item.article, item.name,
        item.ean, JSON.stringify({ source: 'Authenticated Albet catalog, 2026-11-03',
          reference: 'ALBET-LIVE-AUDIT-2026-11-03.md', unit: 'purchase carton' }), item.row]);
      await client.query(`INSERT INTO supplier_catalog_matches
        (item_id,source_id,variant_id,match_method)
        VALUES($1,$2,$3,'catalog') ON CONFLICT DO NOTHING`,
      [itemId, sourceId, `${item.productId}-reference-pack`]);
      if (item.productId === 'tc-713f42fb9a') {
        await client.query(`UPDATE catalog_products SET description=$2,details=$3::jsonb
          WHERE id=$1 AND description='Churu Kitten - курица - 4 × 14 г'`,
        [product.id, product.description, JSON.stringify(product.details)]);
      }
      for (const variant of product.variants) {
        const format = variant.retailFormat;
        const priceCents = Math.round(variant.price * 100);
        const purchaseCents = Math.round(2112 * format.units / 48);
        const result = await client.query(`UPDATE catalog_variants SET
          source_price_cents=$3,
          price_override_cents=coalesce(price_override_cents,$3),
          price_confirmed=CASE WHEN price_override_cents IS NULL OR price_override_cents=$3
            THEN true ELSE price_confirmed END,
          purchase_price_cents=coalesce(purchase_price_cents,$4),
          tax_rate_bps=coalesce(tax_rate_bps,1000),
          image_path=$5,description=$6,details=$7::jsonb,
          source_orderable=true,availability='source_on_demand',sale_status='available',
          source=jsonb_set(source,'{retailFormat}',$8::jsonb,true),updated_at=now()
          WHERE id=$1 AND product_id=$2`, [variant.id, product.id, priceCents,
          purchaseCents, variant.image?.src || null, variant.description || product.description,
          JSON.stringify(variant.details || []), JSON.stringify(format)]);
        if (result.rowCount !== 1) throw new Error(`Missing Churu SKU: ${variant.id}`);
      }
    }
    await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [migration]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
