import { randomUUID } from 'node:crypto';

const invalid = message => { throw Object.assign(new Error(message), { status: 400 }); };

export function validateSupplierCatalog(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) ||
    !/^albet-leonardo-\d{4}-\d{2}-\d{2}$/.test(snapshot.id || '') ||
    snapshot.supplierName !== 'Albet' || snapshot.brand !== 'Leonardo' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.priceDate || '') ||
    snapshot.id.slice(-10) !== snapshot.priceDate ||
    snapshot.shopPriceTaxBasis !== 'unknown' ||
    snapshot.retailPriceTaxBasis !== 'includes_iva' ||
    typeof snapshot.sourceFile !== 'string' || snapshot.sourceFile.length > 200 ||
    !Array.isArray(snapshot.items) || !snapshot.items.length || snapshot.items.length > 1000)
    invalid('Неверный формат прайса Leonardo');
  const articles = new Set();
  for (const item of snapshot.items) {
    if (!item || !/^\d{1,20}$/.test(item.article || '') || articles.has(item.article) ||
      typeof item.name !== 'string' || !item.name.trim() || item.name.length > 200 ||
      typeof item.line !== 'string' || item.line.length > 200 ||
      typeof item.weight !== 'string' || item.weight.length > 50 ||
      typeof item.ean !== 'string' || item.ean.length > 30 ||
      ![item.shopPriceCents,item.recommendedPriceCents,item.minimumPriceCents]
        .every(value => value === null || Number.isInteger(value) && value >= 0 && value <= 10000000) ||
      !Number.isInteger(item.sourceRow) || item.sourceRow < 1 || item.sourceRow > 100000 ||
      !item.rawPrices || typeof item.rawPrices !== 'object') invalid('Проверьте строки прайса Leonardo');
    articles.add(item.article);
  }
  return snapshot;
}
export async function importSupplierCatalog(db, input, staffId) {
  const snapshot = validateSupplierCatalog(input);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043320)');
    const source = await client.query(`INSERT INTO supplier_catalog_sources
      (id,supplier_name,brand,price_date,source_file,shop_price_tax_basis,retail_price_tax_basis)
      VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING RETURNING id`,
    [snapshot.id, snapshot.supplierName, snapshot.brand, snapshot.priceDate,
      snapshot.sourceFile, snapshot.shopPriceTaxBasis, snapshot.retailPriceTaxBasis]);
    if (source.rowCount) {
      for (const item of snapshot.items) {
        await client.query(`INSERT INTO supplier_catalog_items
          (id,source_id,article,name,line,weight,ean,shop_price_cents,
            recommended_price_cents,minimum_price_cents,raw_prices,source_row)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [`${snapshot.id}:${item.article}`, snapshot.id, item.article, item.name,
          item.line, item.weight, item.ean, item.shopPriceCents,
          item.recommendedPriceCents, item.minimumPriceCents,
          JSON.stringify(item.rawPrices), item.sourceRow]);
      }
    }
    // Only an EAN unique in both catalogs is safe to link without a person reviewing it.
    const matches = await client.query(`WITH supplier_eans AS (
        SELECT ean FROM supplier_catalog_items WHERE source_id=$1 AND ean!=''
        GROUP BY ean HAVING count(*)=1
      ), shop_eans AS (
        SELECT v.source->>'ean' AS ean,min(v.id) AS variant_id
        FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
        WHERE lower(p.brand)='leonardo' AND coalesce(v.source->>'ean','')!=''
        GROUP BY v.source->>'ean' HAVING count(*)=1
      )
      INSERT INTO supplier_catalog_matches(item_id,source_id,variant_id,match_method)
      SELECT i.id,i.source_id,s.variant_id,'ean'
      FROM supplier_catalog_items i JOIN supplier_eans e ON e.ean=i.ean
      JOIN shop_eans s ON s.ean=i.ean WHERE i.source_id=$1
      ON CONFLICT DO NOTHING RETURNING item_id`, [snapshot.id]);
    if (source.rowCount) await client.query(`INSERT INTO admin_audit_events
      (id,staff_id,action,target_id,details) VALUES($1,$2,'supplier_catalog_imported',$3,$4)`,
    [randomUUID(), staffId, snapshot.id, { rows: snapshot.items.length,
      autoMatched: matches.rowCount, sourceFile: snapshot.sourceFile }]);
    await client.query('COMMIT');
    return { imported: source.rowCount ? snapshot.items.length : 0,
      alreadyImported: !source.rowCount, autoMatched: matches.rowCount };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
