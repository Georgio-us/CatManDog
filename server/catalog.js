import { products } from '../data.js';
import { snapshots, confirmedPrice, canBuy } from '../variants.js';

const cents = value => Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
const imagePath = image => typeof image === 'string' ? image : image?.src || null;

export function catalogRows(items = products) {
  return items.flatMap(product => snapshots(product).map(variant => ({
    product: {
      id: product.id, name: product.name, brand: product.brand || null,
      category: product.category || null, pet: product.pet || null,
      imagePath: imagePath(product.image), source: product
    },
    variant: {
      id: variant === product ? product.id : variant.id,
      productId: product.id,
      label: variant.label || variant.weight || product.weight || '1 шт',
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
    for (const { product, variant } of rows) {
      await client.query(`INSERT INTO catalog_products(id,name,brand,category,pet,image_path,source,imported_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,now())
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,brand=EXCLUDED.brand,category=EXCLUDED.category,
          pet=EXCLUDED.pet,image_path=EXCLUDED.image_path,source=EXCLUDED.source,imported_at=now()`,
      [product.id, product.name, product.brand, product.category, product.pet, product.imagePath, product.source]);
      await client.query(`INSERT INTO catalog_variants(id,product_id,label,source_price_cents,source_orderable,availability,source,imported_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,now())
        ON CONFLICT(id) DO UPDATE SET product_id=EXCLUDED.product_id,label=EXCLUDED.label,
          source_price_cents=EXCLUDED.source_price_cents,source_orderable=EXCLUDED.source_orderable,
          source=EXCLUDED.source,imported_at=now(),
          availability=CASE WHEN catalog_variants.availability='unavailable' THEN 'unavailable'
            ELSE catalog_variants.availability END`,
      [variant.id, variant.productId, variant.label, variant.sourcePriceCents,variant.sourceOrderable,
        variant.sourceOrderable ? 'source_on_demand' : 'unavailable', variant.source]);
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
    v.label,v.source_price_cents,v.price_override_cents,v.purchase_price_cents,
    v.price_confirmed,v.source_orderable,v.availability,v.stock_quantity
    FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id ORDER BY p.name,v.label`);
  return rows.map(row => ({
    ...row, sale_price_cents: row.price_override_cents ?? row.source_price_cents,
    orderable: row.price_confirmed && row.source_orderable && row.availability !== 'unavailable' &&
      (row.availability !== 'on_hand' || row.stock_quantity > 0) &&
      (row.price_override_cents ?? row.source_price_cents) > 0
  }));
}
