import { randomUUID } from 'node:crypto';

const FOOD_IVA_BPS = 1000;
const FOOD_EQUIVALENCE_BPS = 140;
const MARKUP_BPS = 2000;
const COST_BASED_BRANDS = new Set(['ACANA', 'ORIJEN', 'Royal Canin', 'Churu']);

function grams(text) {
  const value = String(text || '').toLowerCase().replace(/,/g, '.').replace(/\s/g, '');
  const match = /^(?:(\d+)x)?(?:(\d+)x)?(\d+(?:\.\d+)?)(kg|кг|gr|гр|g|г)$/.exec(value);
  if (!match) return null;
  return Number(match[3]) * (match[4] === 'kg' || match[4] === 'кг' ? 1000 : 1) *
    Number(match[1] || 1) * Number(match[2] || 1);
}

export function retailUnits(sourceWeight, siteLabel) {
  const source = grams(sourceWeight);
  const retail = grams(siteLabel);
  if (!source || !retail) return null;
  const count = source / retail;
  const rounded = Math.round(count);
  return rounded >= 1 && rounded <= 48 && Math.abs(count - rounded) < 0.01
    ? rounded : null;
}

export function matchedPrice(row) {
  if (!row?.variant_id || !Number.isInteger(Number(row.shop_price_cents)) &&
      !Number.isInteger(Number(row.recommended_price_cents))) return null;
  const pvp = Number(row.recommended_price_cents);
  if (pvp > 0 && row.retail_price_tax_basis === 'includes_iva') {
    // Ownat's shop column is a recommendation, not our agreed purchase cost.
    return { priceCents: pvp, basis: 'supplier_pvp', retailUnits: 1 };
  }
  if (!COST_BASED_BRANDS.has(row.brand) ||
      row.shop_price_tax_basis !== 'excludes_iva') return null;
  const purchase = Number(row.shop_price_cents);
  const inferredWeight = row.weight ||
    /(?:^|\s)(\d+(?:[.,]\d+)?\s*(?:kg|кг|gr|гр|g|г))$/i.exec(row.source_name || '')?.[1];
  const units = retailUnits(inferredWeight, row.site_label);
  if (!Number.isInteger(purchase) || purchase <= 0 || !units) return null;
  return { priceCents: Math.ceil(purchase *
      (10000 + FOOD_IVA_BPS + FOOD_EQUIVALENCE_BPS) *
      (10000 + MARKUP_BPS) / (10000 * 10000 * units)),
    basis: 'cost_plus_20', retailUnits: units };
}

export async function matchedPriceRows(db) {
  const { rows } = await db.query(`SELECT m.variant_id,i.id AS item_id,i.article,i.name AS source_name,i.weight,
      i.shop_price_cents,i.recommended_price_cents,c.brand,c.price_date,
      c.shop_price_tax_basis,c.retail_price_tax_basis,v.label AS site_label,
      v.price_confirmed,v.price_override_cents,p.category
    FROM supplier_catalog_matches m
    JOIN supplier_catalog_items i ON i.id=m.item_id
    JOIN supplier_catalog_sources c ON c.id=i.source_id
    JOIN catalog_variants v ON v.id=m.variant_id
    JOIN catalog_products p ON p.id=v.product_id
    LEFT JOIN selected_supplier_items s ON s.item_id=i.id
    WHERE s.item_id IS NULL AND v.active=true AND p.active=true
      AND NOT EXISTS (SELECT 1 FROM selected_supplier_items chosen
        JOIN supplier_catalog_matches chosen_match ON chosen_match.item_id=chosen.item_id
        WHERE chosen_match.variant_id=v.id)
    ORDER BY m.variant_id,c.price_date DESC,c.imported_at DESC,i.id`);
  return rows.map(row => ({ ...row, proposal: matchedPrice(row) }));
}

export async function applyMatchedPrices(db, staffId = null) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043322)');
    const rows = await matchedPriceRows(client);
    const byVariant = new Map();
    for (const row of rows) {
      if (!byVariant.has(row.variant_id)) byVariant.set(row.variant_id, []);
      byVariant.get(row.variant_id).push(row);
    }
    let applied = 0;
    let ambiguous = 0;
    let noPrice = 0;
    for (const [variantId, sources] of byVariant) {
      if (sources.some(row => row.price_confirmed || row.price_override_cents !== null)) continue;
      const proposals = sources.filter(row => row.proposal);
      if (!proposals.length) { noPrice++; continue; }
      // Different supplier prices require a deliberate choice of source.
      if (new Set(proposals.map(row => row.proposal.priceCents)).size > 1) {
        ambiguous++;
        continue;
      }
      const proposal = proposals[0].proposal;
      const result = await client.query(`UPDATE catalog_variants
        SET price_override_cents=$1,price_confirmed=true,updated_at=now()
        WHERE id=$2 AND price_confirmed=false AND price_override_cents IS NULL`,
      [proposal.priceCents, variantId]);
      applied += result.rowCount;
    }
    if (applied) await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,'matched_supplier_prices_applied',$3,$4)`,
    [randomUUID(), staffId, 'supplier_catalog_matches',
      { applied, ambiguous, noPrice, policy: 'supplier_pvp_or_cost_plus_20',
        ivaBps: FOOD_IVA_BPS, equivalenceBps: FOOD_EQUIVALENCE_BPS }]);
    await client.query('COMMIT');
    return { matched: byVariant.size, applied, ambiguous, noPrice };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
