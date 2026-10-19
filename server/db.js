import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { importCatalog } from './catalog.js';

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
  console.info(`Catalog imported: ${count} variants`);
  return count;
}
