import { products } from '../data.js';
import { retiredProductIds } from '../catalog-policy.js';
import { snapshots, confirmedPrice, canBuy } from '../variants.js';
import { yaguRetailBenchmarks } from '../yagu-retail-benchmarks.js';

const cents = value => Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
const imagePath = image => typeof image === 'string' ? image : image?.src || null;

export function catalogRows(items = products) {
  return items.filter(product => !product.gift && !product.catalogHidden)
    .flatMap(product => snapshots(product).map(variant => ({
    product: {
      id: product.id, name: product.name, brand: product.brand || null,
      category: product.category || null, pet: product.pet || null,
      imagePath: imagePath(product.image), description: product.description || '',
      details: Array.isArray(product.details) ? product.details : [],
      foodType: product.foodType || null, source: product
    },
    variant: {
      id: variant === product ? product.id : variant.id,
      productId: product.id,
      label: variant.label || variant.weight || product.weight || '1 шт',
      imagePath: imagePath(variant.image) !== imagePath(product.image) ? imagePath(variant.image) : null,
      description: variant.description || product.description || '',
      details: Array.isArray(variant.details) ? variant.details :
        Array.isArray(product.details) ? product.details : [],
      sourcePriceCents: cents(confirmedPrice(variant)),
      sourceOrderable: canBuy(variant),
      source: variant
    }
  })));
}

export async function importCatalog(db, items = products) {
  const rows = catalogRows(items);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043319)');
    for (const { product, variant } of rows) {
      await client.query(`INSERT INTO catalog_products(id,name,brand,category,pet,image_path,description,details,food_type,source,imported_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now()) ON CONFLICT(id) DO NOTHING`,
      [product.id, product.name, product.brand, product.category, product.pet, product.imagePath,
        product.description, JSON.stringify(product.details), product.foodType, product.source]);
      await client.query(`INSERT INTO catalog_variants(id,product_id,label,image_path,description,details,
        source_price_cents,source_orderable,availability,source,imported_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now()) ON CONFLICT(id) DO NOTHING`,
      [variant.id, variant.productId, variant.label, variant.imagePath, variant.description,
        JSON.stringify(variant.details), variant.sourcePriceCents,variant.sourceOrderable,
        variant.source.availabilityStatus === 'pending' ? 'pending' :
          variant.sourceOrderable ? 'source_on_demand' : 'unavailable', variant.source]);
      // Existing launch variants may have been imported before retail research was completed.
      // Fill only empty reference prices; never replace an owner-approved or edited price.
      if (Object.hasOwn(yaguRetailBenchmarks, variant.source.supplier?.sku) && variant.sourcePriceCents) {
        await client.query(`UPDATE catalog_variants SET source_price_cents=$2
          WHERE id=$1 AND source_price_cents IS NULL AND price_override_cents IS NULL
            AND price_confirmed=false`, [variant.id, variant.sourcePriceCents]);
      }
    }
    if (items === products) {
      const localMigration = await client.query("SELECT name FROM catalog_migrations WHERE name='local_only_products_archived'");
      if (!localMigration.rows.length) {
        await client.query('UPDATE catalog_products SET active=false WHERE id = ANY($1::text[])',
          [products.filter(product => product.gift || product.catalogHidden).map(product => product.id)]);
        await client.query("INSERT INTO catalog_migrations(name) VALUES('local_only_products_archived')");
      }
      const editorMigration = await client.query("SELECT name FROM catalog_migrations WHERE name='product_editor_fields_backfilled'");
      if (!editorMigration.rows.length) {
        await client.query(`UPDATE catalog_products SET description=coalesce(source->>'description',''),
          details=CASE WHEN jsonb_typeof(source->'details')='array' THEN source->'details' ELSE '[]'::jsonb END,
          food_type=nullif(source->>'foodType','')`);
        await client.query("INSERT INTO catalog_migrations(name) VALUES('product_editor_fields_backfilled')");
      }
      const variantMigration = await client.query("SELECT name FROM catalog_migrations WHERE name='variant_editor_fields_backfilled'");
      if (!variantMigration.rows.length) {
        await client.query(`UPDATE catalog_variants v SET description=coalesce(v.source->>'description',p.description),
          details=CASE WHEN jsonb_typeof(v.source->'details')='array' THEN v.source->'details'
            ELSE p.details END,
          image_path=CASE WHEN jsonb_typeof(v.source->'image')='string' AND
            v.source->>'image' IS DISTINCT FROM p.image_path THEN v.source->>'image'
            WHEN jsonb_typeof(v.source->'image')='object' AND
            v.source->'image'->>'src' IS DISTINCT FROM p.image_path
            THEN v.source->'image'->>'src' ELSE NULL END
          FROM catalog_products p WHERE p.id=v.product_id`);
        await client.query("INSERT INTO catalog_migrations(name) VALUES('variant_editor_fields_backfilled')");
      }
      const migration = await client.query("SELECT name FROM catalog_migrations WHERE name='retired_products_archived'");
      if (!migration.rows.length) {
        await client.query('UPDATE catalog_products SET active=false WHERE id = ANY($1::text[])',
          [[...retiredProductIds]]);
        await client.query("INSERT INTO catalog_migrations(name) VALUES('retired_products_archived')");
      }
    }
    await client.query('COMMIT');
    return rows.length;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

export async function catalogSnapshot(db) {
  const { rows } = await db.query(`SELECT v.id AS variant_id,v.product_id,p.name,p.brand,p.category,p.pet,p.image_path,
    p.description,p.details,p.food_type,v.image_path AS variant_image_path,
    v.description AS variant_description,v.details AS variant_details,
    v.label,v.source_price_cents,v.price_override_cents,v.purchase_price_cents,
    v.price_confirmed,v.source_orderable,v.availability,v.stock_quantity,v.reorder_point,v.target_stock,
    v.tax_rate_bps,v.display_priority
    FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
    WHERE p.active=true AND v.active=true
      AND coalesce(p.source->>'gift','')='' AND coalesce(p.source->>'catalogHidden','false')!='true'
    ORDER BY p.name,v.display_priority DESC,v.label`);
  return rows.map(row => ({
    ...row, sale_price_cents: row.price_override_cents ?? row.source_price_cents,
    orderable: row.price_confirmed && row.source_orderable && row.availability !== 'unavailable' &&
      (row.availability !== 'on_hand' || row.stock_quantity > 0) &&
      (row.price_override_cents ?? row.source_price_cents) > 0
  }));
}
