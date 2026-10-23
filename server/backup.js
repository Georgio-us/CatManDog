import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client
} from '@aws-sdk/client-s3';

const prefix = 'postgres/';
const minimumIntervalMs = 7 * 24 * 60 * 60 * 1000;
const checkIntervalMs = 6 * 60 * 60 * 1000;
const maximumBytes = 1024 * 1024 * 1024;
const backupLock = 1043320;

export function backupConfiguration(env = process.env) {
  if (env.BACKUP_ENABLED !== 'true') return null;
  const names = ['DATABASE_URL', 'R2_ACCOUNT_ID', 'R2_BACKUP_BUCKET',
    'R2_BACKUP_ACCESS_KEY_ID', 'R2_BACKUP_SECRET_ACCESS_KEY'];
  const missing = names.filter(name => !env[name]);
  if (missing.length) throw new Error(`Backup variables missing: ${missing.join(', ')}`);
  const database = new URL(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('Invalid DATABASE_URL');
  return { env, database, bucket: env.R2_BACKUP_BUCKET,
    s3: new S3Client({ region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: env.R2_BACKUP_ACCESS_KEY_ID,
        secretAccessKey: env.R2_BACKUP_SECRET_ACCESS_KEY } }) };
}

function postgresEnvironment(config) {
  const { database } = config;
  const sslmode = database.searchParams.get('sslmode');
  return { ...process.env, PGHOST: database.hostname, PGPORT: database.port || '5432',
    PGUSER: decodeURIComponent(database.username), PGPASSWORD: decodeURIComponent(database.password),
    PGDATABASE: decodeURIComponent(database.pathname.slice(1)),
    ...(sslmode ? { PGSSLMODE: sslmode } : {}) };
}

function run(program, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, { env, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr = `${stderr}${chunk}`.slice(-4000); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${program} exited ${code}: ${stderr.trim()}`)));
  });
}

async function digest(stream) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of stream) { hash.update(chunk); bytes += chunk.length; }
  return { sha256: hash.digest('hex'), bytes };
}

export async function listBackups(s3, bucket) {
  const objects = [];
  let continuationToken;
  do {
    const result = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix,
      ContinuationToken: continuationToken }));
    objects.push(...(result.Contents || []).filter(item => /^postgres\/catmandog-\d{8}T\d{6}Z\.dump$/.test(item.Key)));
    continuationToken = result.NextContinuationToken;
  } while (continuationToken);
  return objects.sort((a, b) => Number(b.LastModified) - Number(a.LastModified));
}

export function backupDue(backups, now = new Date()) {
  return !backups.length || now.getTime() - new Date(backups[0].LastModified).getTime() >= minimumIntervalMs;
}

export async function createBackup(db, config, now = new Date()) {
  const connection = await db.connect();
  let locked = false;
  let directory;
  try {
    const result = await connection.query('SELECT pg_try_advisory_lock($1) AS locked', [backupLock]);
    locked = result.rows[0].locked;
    if (!locked) return { status: 'busy' };
    const existing = await listBackups(config.s3, config.bucket);
    if (!backupDue(existing, now)) return { status: 'not-due' };

    directory = await mkdtemp(join(tmpdir(), 'catmandog-backup-'));
    const path = join(directory, 'database.dump');
    const pgEnv = postgresEnvironment(config);
    await run('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--file', path], pgEnv);
    await run('pg_restore', ['--list', path], pgEnv);
    const { size } = await stat(path);
    if (!size || size > maximumBytes) throw new Error(`Backup size outside allowed range: ${size}`);
    const local = await digest(createReadStream(path));
    const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const key = `${prefix}catmandog-${timestamp}.dump`;
    await config.s3.send(new PutObjectCommand({ Bucket: config.bucket, Key: key,
      Body: createReadStream(path), ContentLength: size,
      ContentType: 'application/octet-stream', Metadata: { sha256: local.sha256 } }));

    try {
      const downloaded = await config.s3.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
      const remote = await digest(downloaded.Body);
      if (remote.bytes !== size || remote.sha256 !== local.sha256)
        throw new Error('Uploaded backup did not pass SHA-256 verification');
    } catch (error) {
      await config.s3.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key })).catch(() => {});
      throw error;
    }
    const retained = await listBackups(config.s3, config.bucket);
    for (const old of retained.slice(2)) {
      await config.s3.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: old.Key }));
    }
    return { status: 'created', key, bytes: size, sha256: local.sha256 };
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true });
    if (locked) await connection.query('SELECT pg_advisory_unlock($1)', [backupLock]).catch(() => {});
    connection.release();
  }
}

export function startBackupScheduler(db, env = process.env) {
  let config;
  try { config = backupConfiguration(env); }
  catch (error) { console.error('Backup configuration error:', error.message); return () => {}; }
  if (!db || !config) return () => {};
  let running = false;
  const check = async () => {
    if (running) return;
    running = true;
    try {
      const result = await createBackup(db, config);
      if (result.status === 'created') console.info('Database backup verified:', result.key, result.bytes);
    } catch (error) { console.error('Database backup failed:', error.message); }
    finally { running = false; }
  };
  const timer = setInterval(check, checkIntervalMs);
  timer.unref();
  const initial = setTimeout(check, 30_000);
  initial.unref();
  return () => { clearTimeout(initial); clearInterval(timer); config.s3.destroy(); };
}
