import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { isStaging } from './environment.js';
import { importCatalog } from './catalog.js';
import { applySelectedPrices } from './selected-pricing.js';
import { applyMatchedPrices } from './matched-pricing.js';
import { publishChuruRetailFormats, publishChuruRetailFormatDetails,
  publishChuruAdditionalFormats, publishChuruDogAssortment } from './churu-retail-formats.js';

export function createDatabase(url = isStaging() ? process.env.STAGING_DATABASE_URL : process.env.DATABASE_URL) {
  if (!url) return null;
  const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000 });
  pool.on('error', error => console.error('Database pool error:', error.message));
  return pool;
}

export async function claimDatabaseEnvironment(client, stage = isStaging()) {
  const identity = await client.query(`SELECT to_regclass('public.catalog_products') IS NOT NULL AS catalog,
    to_regclass('public.app_environment') IS NOT NULL AS marker`);
  if (identity.rows[0].marker) {
    const marker = await client.query('SELECT mode FROM app_environment WHERE id=true');
    if (marker.rows[0]?.mode !== (stage ? 'staging' : 'production'))
      throw new Error('Database belongs to another CatManDog environment');
  } else if (stage && identity.rows[0].catalog) {
    throw new Error('Staging refuses an existing unmarked database');
  }
  if (stage) {
    await client.query(`CREATE TABLE IF NOT EXISTS app_environment
      (id boolean PRIMARY KEY DEFAULT true CHECK (id), mode text NOT NULL
        CHECK (mode IN ('production','staging')))`);
    await client.query("INSERT INTO app_environment(id,mode) VALUES(true,'staging') ON CONFLICT DO NOTHING");
  }
}

export async function initializeDatabase(db) {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043319)');
    await claimDatabaseEnvironment(client);
    await client.query(schema);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
  const count = await importCatalog(db);
  await publishChuruRetailFormats(db);
  await publishChuruRetailFormatDetails(db);
  await publishChuruAdditionalFormats(db);
  await publishChuruDogAssortment(db);
  console.info(`Catalog imported: ${count} variants`);
  try {
    const pricing = await applySelectedPrices(db, null, { automatic: true });
    if (!pricing.alreadyApplied) console.info(`Selected sale prices applied: ${pricing.applied}/${pricing.selected}`);
  } catch (error) {
    if (error.status !== 409) throw error;
    console.info('Selected sale prices pending: supplier selection is incomplete');
  }
  const matchedPricing = await applyMatchedPrices(db);
  console.info(`Matched supplier sale prices applied: ${matchedPricing.applied}/${matchedPricing.matched}`);
  return count;
}
