import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { importCatalog } from './catalog.js';
import { applySelectedPrices } from './selected-pricing.js';
import { applyMatchedPrices } from './matched-pricing.js';
import { publishChuruRetailFormats } from './churu-retail-formats.js';

export function createDatabase(url = process.env.DATABASE_URL) {
  if (!url) return null;
  const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000 });
  pool.on('error', error => console.error('Database pool error:', error.message));
  return pool;
}

export async function initializeDatabase(db) {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043319)');
    await client.query(schema);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
  const count = await importCatalog(db);
  await publishChuruRetailFormats(db);
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
