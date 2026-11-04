import { randomUUID } from 'node:crypto';

const invalid = message => { throw Object.assign(new Error(message), { status: 400 }); };
const idPattern = /^[a-z0-9-]{1,100}$/;
const itemPattern = /^[a-z0-9-]+:[A-Za-z0-9._-]{1,40}$/;
const categories = new Set(['Корм', 'Лакомства']);

export function validateSupplierDrafts(input) {
  const items = input?.items;
  if (!Array.isArray(items) || !items.length || items.length > 100) invalid('Проверьте список черновиков');
  const seenItems = new Set();
  const seenVariants = new Set();
  const products = new Map();
  for (const item of items) {
    if (!item || !itemPattern.test(item.itemId) || !idPattern.test(item.productId) ||
      !idPattern.test(item.variantId) || item.productId === item.variantId ||
      seenItems.has(item.itemId) || seenVariants.has(item.variantId) ||
      typeof item.name !== 'string' || item.name.length < 2 || item.name.length > 160 ||
      typeof item.brand !== 'string' || item.brand.length < 2 || item.brand.length > 100 ||
      !categories.has(item.category) || !['cat','dog'].includes(item.pet) ||
      (item.category === 'Корм' && !['dry','wet'].includes(item.foodType)) ||
      (item.category !== 'Корм' && item.foodType !== null) ||
      typeof item.label !== 'string' || !item.label || item.label.length > 100 ||
      typeof item.ean !== 'string' || item.ean.length > 30)
      invalid('Проверьте поля черновиков');
    const identity = JSON.stringify([item.name,item.brand,item.category,item.pet,item.foodType]);
    if (products.has(item.productId) && products.get(item.productId) !== identity)
      invalid('Один товар содержит разные названия или категории');
    products.set(item.productId, identity);
    seenItems.add(item.itemId);
    seenVariants.add(item.variantId);
  }
  return items;
}

export async function importSupplierDrafts(db, input, staffId) {
  const items = validateSupplierDrafts(input);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043321)');
    const { rows: sourceRows } = await client.query(`SELECT i.id,i.source_id,i.article,i.ean,s.brand,
      m.variant_id AS matched_variant FROM supplier_catalog_items i
      JOIN supplier_catalog_sources s ON s.id=i.source_id
      LEFT JOIN supplier_catalog_matches m ON m.item_id=i.id
      WHERE i.id=ANY($1::text[]) FOR UPDATE OF i`, [items.map(item => item.itemId)]);
    if (sourceRows.length !== items.length) invalid('Не все позиции найдены в загруженных прайсах');
    const sources = new Map(sourceRows.map(row => [row.id,row]));
    for (const item of items) {
      const source = sources.get(item.itemId);
      if (source.brand.toLowerCase() !== item.brand.toLowerCase() ||
        (source.ean || '').replace(/^0+/, '') !== item.ean.replace(/^0+/, '') ||
        source.matched_variant && source.matched_variant !== item.variantId)
        invalid(`Проверьте бренд, EAN или связь ${item.itemId}`);
    }
    let createdProducts = 0;
    let createdVariants = 0;
    for (const item of items) {
      const product = await client.query(`INSERT INTO catalog_products
        (id,name,brand,category,pet,food_type,active,source)
        VALUES($1,$2,$3,$4,$5,$6,false,$7)
        ON CONFLICT(id) DO NOTHING RETURNING id`,
      [item.productId,item.name,item.brand,item.category,item.pet,item.foodType,
        JSON.stringify({ draftFromSupplier: true })]);
      createdProducts += product.rowCount;
      if (!product.rowCount) {
        const { rows } = await client.query(`SELECT name,brand,category,pet,food_type,active
          FROM catalog_products WHERE id=$1`, [item.productId]);
        if (!rows.length || rows[0].name !== item.name ||
          rows[0].brand.toLowerCase() !== item.brand.toLowerCase() ||
          rows[0].category !== item.category || rows[0].pet !== item.pet ||
          rows[0].food_type !== item.foodType) invalid(`Конфликт товара ${item.productId}`);
      }
      const variant = await client.query(`INSERT INTO catalog_variants
        (id,product_id,label,source_orderable,availability,price_confirmed,active,source)
        VALUES($1,$2,$3,false,'unavailable',false,true,$4)
        ON CONFLICT(id) DO NOTHING RETURNING id`,
      [item.variantId,item.productId,item.label,
        JSON.stringify({ ean: item.ean, supplierItemId: item.itemId })]);
      createdVariants += variant.rowCount;
      if (!variant.rowCount) {
        const { rows } = await client.query('SELECT product_id,label FROM catalog_variants WHERE id=$1',
          [item.variantId]);
        if (!rows.length || rows[0].product_id !== item.productId || rows[0].label !== item.label)
          invalid(`Конфликт SKU ${item.variantId}`);
      }
      await client.query(`INSERT INTO supplier_catalog_matches
        (item_id,source_id,variant_id,match_method,matched_by)
        VALUES($1,$2,$3,'draft',$4) ON CONFLICT(item_id) DO NOTHING`,
      [item.itemId,sources.get(item.itemId).source_id,item.variantId,staffId]);
    }
    await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,'supplier_catalog_drafts_imported',$3,$4)`,
    [randomUUID(),staffId,'supplier_catalog_drafts',
      { count: items.length, createdProducts, createdVariants }]);
    await client.query('COMMIT');
    return { count: items.length, createdProducts, createdVariants };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
