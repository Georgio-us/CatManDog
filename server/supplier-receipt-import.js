import { createHash, randomUUID } from 'node:crypto';
import { parseSupplierDeliveryPdf, extractProofAmounts } from './supplier-receipt-parser.js';

const bad = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const albetKnown = new Map([
  ['940001', 'tc-4e50c58957-reference-pack'],
  ['940003', 'tc-0707caf730-reference-pack'],
  ['940004', 'tc-768abf17c2-reference-pack'],
  ['940007', 'tc-dc3d6d94c2-reference-pack'],
  ['949577', 'cmd-source-sku-9c96bc24c8863222'],
  ['931045', 'leonardo-fresh-salmon-1500g'],
  ['931293', 'leonardo-light-1800g'],
  ['931251', 'leonardo-wet-pure-chicken-85g'],
  ['931040', 'leonardo-fresh-duck-4000g']
]);

function fileBytes(file, kind) {
  if (!file) return null;
  const filename = String(file.filename || '').trim().slice(0, 150);
  const suppliedMime = String(file.mime || '').trim();
  const base64 = String(file.base64 || '');
  if (!filename || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length > 5_600_000)
    bad('Проверьте файл накладной или подтверждения оплаты');
  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length || bytes.length > 4_000_000) bad('Файл больше 4 МБ');
  const pdf = bytes.subarray(0, 5).toString() === '%PDF-';
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (kind === 'document' && (!pdf || (suppliedMime && suppliedMime !== 'application/pdf')))
    bad('Накладная должна быть файлом PDF');
  if (kind === 'proof' && !((pdf && (!suppliedMime || suppliedMime === 'application/pdf')) ||
      (png && (!suppliedMime || suppliedMime === 'image/png')) ||
      (jpeg && (!suppliedMime || suppliedMime === 'image/jpeg'))))
    bad('Подтверждение оплаты должно быть PDF, PNG или JPEG');
  const mime = pdf ? 'application/pdf' : png ? 'image/png' : 'image/jpeg';
  return { bytes, filename, mime, sha256: sha256(bytes) };
}

async function prepareFiles(payload) {
  const document = fileBytes(payload.document, 'document');
  if (!document) bad('Загрузите PDF накладной');
  const proof = fileBytes(payload.proof, 'proof');
  const parsed = await parseSupplierDeliveryPdf(document.bytes);
  const proofAmountsCents = proof?.mime === 'application/pdf'
    ? await extractProofAmounts(proof.bytes).catch(() => []) : [];
  return { document, proof, parsed, proofAmountsCents };
}

async function supplierFor(db, name) {
  const { rows } = await db.query(`SELECT id,name FROM suppliers
    WHERE lower(name)=lower($1) OR lower(name) LIKE lower($1 || ' /%')
    ORDER BY CASE WHEN lower(name)=lower($1) THEN 0 ELSE 1 END LIMIT 2`, [name]);
  if (!rows.length || (rows.length > 1 && rows[0].name.toLowerCase() !== name.toLowerCase()))
    bad('Поставщик в админке не найден однозначно');
  return rows[0];
}

async function matchLine(db, supplier, line, documentNumber) {
  const saved = await db.query(`SELECT m.variant_id,m.retail_units_per_purchase_unit,
    m.pieces_per_retail_unit,p.name,v.label,v.active
    FROM supplier_delivery_mappings m JOIN catalog_variants v ON v.id=m.variant_id
    JOIN catalog_products p ON p.id=v.product_id
    WHERE m.supplier_id=$1 AND m.supplier_code=$2`, [supplier.id, line.supplierCode]);
  let variant = saved.rows[0] || null;
  let matchMethod = variant ? 'saved' : '';
  const packagingChanged = !!variant &&
    (variant.retail_units_per_purchase_unit !== line.retailUnitsPerPurchaseUnit ||
      variant.pieces_per_retail_unit !== line.piecesPerRetailUnit);
  if (!variant && supplier.name.toLowerCase().startsWith('albet')) {
    const known = albetKnown.get(line.supplierCode);
    if (known) {
      const { rows } = await db.query(`SELECT v.id AS variant_id,p.name,v.label,v.active
        FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id WHERE v.id=$1`, [known]);
      variant = rows[0] || null;
      if (variant) matchMethod = 'known';
    }
  }
  if (!variant) {
    const { rows } = await db.query(`SELECT DISTINCT v.id AS variant_id,p.name,v.label,v.active
      FROM supplier_catalog_items i JOIN supplier_catalog_sources s ON s.id=i.source_id
      JOIN supplier_catalog_matches m ON m.item_id=i.id
      JOIN catalog_variants v ON v.id=m.variant_id JOIN catalog_products p ON p.id=v.product_id
      WHERE lower(s.supplier_name)=lower($1) AND (i.article=$2 OR i.ean=$3)
      LIMIT 3`, [supplier.name.split(' /')[0], line.supplierCode, line.ean]);
    if (rows.length === 1) { variant = rows[0]; matchMethod = 'catalog'; }
  }
  const { rows: existing } = variant ? await db.query(`SELECT coalesce(sum(delta_on_hand),0)::integer AS quantity
    FROM inventory_movements WHERE supplier_id=$1 AND variant_id=$2 AND reason='receipt'
      AND position($3 in note)>0`, [supplier.id, variant.variant_id, documentNumber]) : { rows: [] };
  return { ...line, variantId: variant?.active ? variant.variant_id : null, packagingChanged,
    productName: variant?.active ? variant.name : '', variantLabel: variant?.active ? variant.label : '',
    matchMethod, existingReceivedUnits: existing[0]?.quantity || 0,
    unitCostCents: Math.round(line.lineCostCents / line.retailUnits) };
}

async function preparedPreview(db, files) {
  const supplier = await supplierFor(db, files.parsed.supplier);
  const { rows: prior } = await db.query(`SELECT id,document_sha256 FROM supplier_delivery_imports
    WHERE document_sha256=$1 OR (supplier_id=$2 AND document_number=$3) LIMIT 1`,
  [files.document.sha256, supplier.id, files.parsed.documentNumber]);
  const items = [];
  for (const item of files.parsed.items)
    items.push(await matchLine(db, supplier, item, files.parsed.documentNumber));
  return { supplier, documentSha256: files.document.sha256, proofSha256: files.proof?.sha256 || null,
    parsed: { ...files.parsed, items }, proofAmountsCents: files.proofAmountsCents,
    proofAmountMatches: files.proofAmountsCents.includes(files.parsed.totals.totalCents),
    alreadyImported: !!prior[0], existingImportId: prior[0]?.id || null,
    conflictingDocument: !!prior[0] && prior[0].document_sha256 !== files.document.sha256 };
}

export async function previewSupplierReceipt(db, payload) {
  const files = await prepareFiles(payload);
  return preparedPreview(db, files);
}

function choicesFor(items, supplied) {
  if (!Array.isArray(supplied) || supplied.length !== items.length) bad('Проверьте сопоставление строк');
  const byCode = new Map(supplied.map(item => [String(item.supplierCode), item]));
  if (byCode.size !== items.length) bad('Повторяются артикулы накладной');
  return items.map(item => {
    const choice = byCode.get(item.supplierCode);
    const variantId = String(choice?.variantId || '').trim();
    if (!variantId) bad(`Укажите SKU для строки ${item.supplierCode}`);
    return { ...item, variantId };
  });
}

export async function applySupplierReceipt(db, payload, staffId) {
  const files = await prepareFiles(payload);
  const preview = await preparedPreview(db, files);
  if (payload.documentSha256 !== files.document.sha256 ||
    (payload.proofSha256 || null) !== (files.proof?.sha256 || null))
    bad('Файлы изменились после предварительного просмотра');
  if (preview.conflictingDocument) bad('Номер накладной уже загружен с другим файлом', 409);
  if (preview.alreadyImported) return { alreadyImported: true, id: preview.existingImportId };
  const lines = choicesFor(preview.parsed.items, payload.lines);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',
      [`supplier-receipt:${preview.supplier.id}:${preview.parsed.documentNumber}`]);
    const { rows: duplicate } = await client.query(`SELECT id,document_sha256 FROM supplier_delivery_imports
      WHERE document_sha256=$1 OR (supplier_id=$2 AND document_number=$3) LIMIT 1`,
    [files.document.sha256, preview.supplier.id, preview.parsed.documentNumber]);
    if (duplicate[0]) {
      if (duplicate[0].document_sha256 !== files.document.sha256)
        bad('Номер накладной уже загружен с другим файлом', 409);
      await client.query('COMMIT');
      return { alreadyImported: true, id: duplicate[0].id };
    }
    const receiptId = randomUUID();
    const recorded = [];
    for (const line of lines) {
      const { rows } = await client.query(`SELECT v.id,v.stock_quantity,v.reserved_quantity,v.active,
        p.active AS product_active FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id
        WHERE v.id=$1 FOR UPDATE OF v`, [line.variantId]);
      if (!rows[0]?.active || !rows[0].product_active)
        bad(`SKU ${line.variantId} отсутствует в активном каталоге`);
      const previous = await client.query(`SELECT coalesce(sum(delta_on_hand),0)::integer AS quantity
        FROM inventory_movements WHERE supplier_id=$1 AND variant_id=$2 AND reason='receipt'
          AND position($3 in note)>0`,
      [preview.supplier.id, line.variantId, preview.parsed.documentNumber]);
      const existingUnits = previous.rows[0].quantity;
      if (existingUnits > line.retailUnits)
        bad(`По строке ${line.supplierCode} уже принято больше товара, чем указано в накладной`, 409);
      const stockDelta = line.retailUnits - existingUnits;
      if (stockDelta > 0) {
        const changed = await client.query(`UPDATE catalog_variants
          SET stock_quantity=coalesce(stock_quantity,0)+$1,availability='on_hand',updated_at=now()
          WHERE id=$2 RETURNING stock_quantity,reserved_quantity`, [stockDelta, line.variantId]);
        const movementKey = `supplier_receipt_${files.document.sha256.slice(0,40)}_${line.lineNumber}`;
        await client.query(`INSERT INTO inventory_movements
          (id,variant_id,staff_id,supplier_id,unit_cost_cents,idempotency_key,reason,
           delta_on_hand,delta_reserved,on_hand_after,reserved_after,note)
          VALUES($1,$2,$3,$4,$5,$6,'receipt',$7,0,$8,$9,$10)`,
        [randomUUID(), line.variantId, staffId, preview.supplier.id,line.unitCostCents,movementKey,
          stockDelta,changed.rows[0].stock_quantity,changed.rows[0].reserved_quantity,
          `${preview.supplier.name} ${preview.parsed.documentNumber}; order ${preview.parsed.supplierOrder}; code ${line.supplierCode}; import ${receiptId}`]);
      }
      await client.query(`INSERT INTO supplier_delivery_mappings
        (supplier_id,supplier_code,variant_id,retail_units_per_purchase_unit,
         pieces_per_retail_unit,updated_by) VALUES($1,$2,$3,$4,$5,$6)
        ON CONFLICT(supplier_id,supplier_code) DO UPDATE SET
          variant_id=EXCLUDED.variant_id,
          retail_units_per_purchase_unit=EXCLUDED.retail_units_per_purchase_unit,
          pieces_per_retail_unit=EXCLUDED.pieces_per_retail_unit,
          updated_by=EXCLUDED.updated_by,updated_at=now()`,
      [preview.supplier.id,line.supplierCode,line.variantId,
        line.retailUnitsPerPurchaseUnit,line.piecesPerRetailUnit,staffId]);
      const preferred = await client.query(`SELECT supplier_id FROM supplier_offers
        WHERE variant_id=$1 AND preferred=true LIMIT 1`, [line.variantId]);
      const makePreferred = !preferred.rows[0] || preferred.rows[0].supplier_id === preview.supplier.id;
      await client.query(`INSERT INTO supplier_offers
        (id,supplier_id,variant_id,cost_cents,vat_included,minimum_quantity,
         note,preferred,checked_at)
        VALUES($1,$2,$3,$4,false,$5,$6,$7,$8)
        ON CONFLICT(supplier_id,variant_id) DO UPDATE SET cost_cents=EXCLUDED.cost_cents,
          vat_included=false,minimum_quantity=EXCLUDED.minimum_quantity,
          note=EXCLUDED.note,preferred=EXCLUDED.preferred,checked_at=EXCLUDED.checked_at,
          updated_at=now()`,
      [randomUUID(),preview.supplier.id,line.variantId,line.unitCostCents,
        line.retailUnitsPerPurchaseUnit,
        `Подтверждено ${preview.parsed.documentNumber} от ${preview.parsed.documentDate}; без IVA, до общей скидки`,
        makePreferred,preview.parsed.documentDate]);
      if (makePreferred) {
        await client.query(`UPDATE catalog_variants SET purchase_price_cents=$1,updated_at=now()
          WHERE id=$2`, [line.unitCostCents,line.variantId]);
      }
      recorded.push({ supplierCode: line.supplierCode, variantId: line.variantId,
        description: line.description, ean: line.ean, purchaseQuantity: line.purchaseQuantity,
        retailUnits: line.retailUnits, piecesPerRetailUnit: line.piecesPerRetailUnit,
        physicalPieces: line.physicalPieces,
        existingReceivedUnits: existingUnits, newStockUnits: stockDelta,
        unitCostCents: line.unitCostCents, lineCostCents: line.lineCostCents,
        expirationDate: line.expirationDate });
    }
    await client.query(`INSERT INTO supplier_delivery_imports
      (id,supplier_id,document_number,supplier_order,document_date,document_sha256,
       document_filename,document_bytes,proof_filename,proof_mime,proof_sha256,proof_bytes,
       proof_amounts_cents,totals,lines,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [receiptId,preview.supplier.id,preview.parsed.documentNumber,preview.parsed.supplierOrder,
      preview.parsed.documentDate,files.document.sha256,files.document.filename,files.document.bytes,
      files.proof?.filename || null,files.proof?.mime || null,files.proof?.sha256 || null,
      files.proof?.bytes || null,JSON.stringify(files.proofAmountsCents),
      JSON.stringify(preview.parsed.totals),JSON.stringify(recorded),staffId]);
    await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,'supplier_delivery_imported',$3,$4)`,
    [randomUUID(),staffId,receiptId,{ supplierId: preview.supplier.id,
      documentNumber: preview.parsed.documentNumber,documentSha256: files.document.sha256,
      lines: recorded.length,newStockUnits: recorded.reduce((sum,item)=>sum+item.newStockUnits,0) }]);
    await client.query('COMMIT');
    return { id: receiptId, alreadyImported: false, lines: recorded,
      totals: preview.parsed.totals, proofAmountMatches: preview.proofAmountMatches };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function listSupplierReceipts(db) {
  const { rows } = await db.query(`SELECT r.id,r.document_number,r.supplier_order,r.document_date,
    r.document_sha256,r.document_filename,r.proof_filename,r.proof_amounts_cents,
    r.totals,r.lines,r.created_at,s.name AS supplier_name
    FROM supplier_delivery_imports r JOIN suppliers s ON s.id=r.supplier_id
    ORDER BY r.document_date DESC,r.created_at DESC LIMIT 50`);
  return rows;
}

export async function receiptFile(db, id, kind) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id) ||
    !['document','proof'].includes(kind)) bad('Файл не найден',404);
  const { rows } = await db.query(`SELECT document_filename,document_mime,document_bytes,
    proof_filename,proof_mime,proof_bytes FROM supplier_delivery_imports WHERE id=$1`, [id]);
  const row = rows[0];
  if (!row || !row[`${kind}_bytes`]) bad('Файл не найден',404);
  return { filename: row[`${kind}_filename`], mime: row[`${kind}_mime`], bytes: row[`${kind}_bytes`] };
}
