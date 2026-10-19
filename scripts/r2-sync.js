import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { resolve, relative, sep, extname } from 'node:path';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const root = resolve('assets');
const apply = process.argv.includes('--apply');
const verify = process.argv.includes('--verify');
const required = ['R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY'];
if ((apply || verify) && required.some(key => !process.env[key])) {
  console.error(`Missing environment variables: ${required.filter(key => !process.env[key]).join(', ')}`);
  process.exit(1);
}
const client = apply || verify ? new S3Client({
  region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }
}) : null;
const types = { '.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml' };
// Filenames are stable, so browsers must be able to pick up later image replacements.
const cacheControl = 'public, max-age=86400';

async function* files(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (entry.isFile() && !entry.name.startsWith('.')) yield path;
  }
}
async function sha256(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

let count = 0, bytes = 0, uploaded = 0, missing = 0, failed = 0;
const localFiles = [];
for await (const file of files(root)) localFiles.push(file);

async function syncFile(file) {
  const info = await stat(file);
  const key = `assets/${relative(root, file).split(sep).join('/')}`;
  count += 1; bytes += info.size;
  if (!client) return;
  const digest = await sha256(file);
  let remote = null;
  try { remote = await client.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key })); }
  catch (error) { if (error.$metadata?.httpStatusCode !== 404 && error.name !== 'NotFound') throw error; }
  if (remote?.ContentLength === info.size && remote.Metadata?.sha256 === digest &&
      remote.CacheControl === cacheControl) return;
  if (verify) { missing += 1; console.log(`Missing or changed: ${key}`); return; }
  try {
    await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key,
      Body: createReadStream(file), ContentLength: info.size,
      ContentType: types[extname(file).toLowerCase()] || 'application/octet-stream',
      CacheControl: cacheControl, Metadata: { sha256: digest } }));
    uploaded += 1;
    if (uploaded % 25 === 0) console.log(`Uploaded ${uploaded} files`);
  } catch (error) { failed += 1; console.error(`Failed: ${key}: ${error.message}`); }
}

let nextFile = 0;
async function worker() {
  while (nextFile < localFiles.length) await syncFile(localFiles[nextFile++]);
}
await Promise.all(Array.from({ length: Math.min(8, localFiles.length) }, worker));
console.log(JSON.stringify({ count, megabytes: Math.round(bytes / 1048576), uploaded, missing, failed,
  mode: apply ? 'upload' : verify ? 'verify' : 'dry-run' }));
if (missing || failed) process.exitCode = 1;
