// Consumer prices include IVA. The supplier's purchase IVA and equivalence
// surcharge are cash costs for this pricing scenario, not sale tax rates.
import { randomUUID } from 'node:crypto';

const IVA_BPS = 1000;
const EQUIVALENCE_BPS = 140;
const MARKUP_BPS = 2000;

// Albet's authenticated catalog showed these consumer PVP references on
// 2026-11-03. They were recorded in FIRST-PURCHASE.md but not in the import.
const CHURU_PVP = new Map([
  ['940001', 329], ['940003', 329], ['940004', 329], ['940007', 329],
  ['949577', 1529]
]);

export function selectedPrice(row) {
  // Albet's Leonardo tariff lists the wet pouch individually, while its
  // purchase basket lists a case of 16. Churu 949577 is sold as one 20-pack.
  const units = row.brand === 'Leonardo' && row.article === '756315' ||
    row.brand === 'Churu' && row.article === '949577'
    ? 1 : Number(row.retail_units_per_purchase_unit);
  const purchase = Number(row.shop_price_cents);
  if (!row.variant_id || !Number.isInteger(units) || units < 1 ||
      !Number.isInteger(purchase) || purchase <= 0) return null;
  const grossUnitCostCents = purchase * (10000 + IVA_BPS + EQUIVALENCE_BPS) /
    (10000 * units);
  const markupPriceCents = Math.ceil(grossUnitCostCents * (10000 + MARKUP_BPS) / 10000);
  const supplierPvp = row.recommended_price_cents > 0 &&
    row.retail_price_tax_basis === 'includes_iva'
    ? Number(row.recommended_price_cents) : null;
  const knownPvp = row.brand === 'Churu' ? CHURU_PVP.get(row.article) : null;
  const reference = supplierPvp || knownPvp;
  // PVP can be for a single retail unit (Leonardo pouch) or a purchase case.
  // The Leonardo imported catalog stores the single-unit PVP already.
  const priceCents = reference ? Math.max(reference, markupPriceCents) : markupPriceCents;
  return { priceCents, grossUnitCostCents: Math.ceil(grossUnitCostCents),
    basis: supplierPvp ? 'supplier_pvp' : knownPvp ? 'albet_pvp' : 'cost_plus_20',
    belowReference: reference !== null && reference < markupPriceCents };
}

export async function selectedPriceRows(db) {
  const { rows } = await db.query(`SELECT s.item_id,s.retail_units_per_purchase_unit,
      i.article,i.name,i.shop_price_cents,i.recommended_price_cents,
      c.brand,c.retail_price_tax_basis,m.variant_id,v.price_override_cents,
      v.source_price_cents,v.price_confirmed
    FROM selected_supplier_items s JOIN supplier_catalog_items i ON i.id=s.item_id
    JOIN supplier_catalog_sources c ON c.id=i.source_id
    LEFT JOIN supplier_catalog_matches m ON m.item_id=i.id
    LEFT JOIN catalog_variants v ON v.id=m.variant_id
    ORDER BY c.brand,i.name,i.weight`);
  return rows.map(row => ({ ...row, proposal: selectedPrice(row) }));
}

export async function applySelectedPrices(db, staffId, { automatic = false } = {}) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043321)');
    const migration = 'selected_sale_prices_2026_11_05';
    if (automatic) {
      const done = await client.query('SELECT 1 FROM catalog_migrations WHERE name=$1', [migration]);
      if (done.rowCount) {
        await client.query('COMMIT');
        return { selected: 50, applied: 0, alreadyApplied: true };
      }
    }
    const rows = await selectedPriceRows(client);
    if (rows.length !== 50 || rows.some(row => !row.proposal) ||
        new Set(rows.map(row => row.variant_id)).size !== 50)
      throw Object.assign(new Error('Сверьте 50 выбранных SKU, фасовки и источники'), { status: 409 });
    let applied = 0;
    for (const row of rows) {
      if (row.price_confirmed) continue;
      const result = await client.query(`UPDATE catalog_variants
        SET price_override_cents=$1,price_confirmed=true,updated_at=now()
        WHERE id=$2 AND price_confirmed=false`, [row.proposal.priceCents, row.variant_id]);
      applied += result.rowCount;
    }
    if (applied) await client.query(`INSERT INTO admin_audit_events(id,staff_id,action,target_id,details)
      VALUES($1,$2,'selected_supplier_prices_applied',$3,$4)`,
    [randomUUID(), staffId, 'selected_supplier_items', { selected: rows.length, applied,
      automatic, policy: 'supplier_pvp_or_purchase_gross_plus_20', ivaBps: IVA_BPS,
      equivalenceBps: EQUIVALENCE_BPS }]);
    if (automatic) await client.query('INSERT INTO catalog_migrations(name) VALUES($1)', [migration]);
    await client.query('COMMIT');
    return { selected: rows.length, applied };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
