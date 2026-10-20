import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const root = resolve(new URL('..', import.meta.url).pathname);
const hidden = name => name.startsWith('.') || name === 'server' || name === 'node_modules' ||
  name === 'tests' || name === 'research' || name.endsWith('.md') || name === 'package.json' ||
  name === 'package-lock.json';

export function json(res, status, value, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(JSON.stringify(value));
}

export async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 65536) throw Object.assign(new Error('Слишком большой запрос'), { status: 413 });
  }
  try { return body ? JSON.parse(body) : {}; }
  catch { throw Object.assign(new Error('Некорректный JSON'), { status: 400 }); }
}

export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return parsed.host === req.headers.host && ['https:', 'http:'].includes(parsed.protocol);
  } catch { return false; }
}

export async function serveStatic(req, res, pathname) {
  if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Метод не поддерживается' });
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return json(res, 400, { error: 'Неверный путь' }); }
  const parts = decoded.split('/').filter(Boolean);
  if (parts.some(part => part === '..' || hidden(part))) return json(res, 404, { error: 'Не найдено' });
  const file = resolve(root, ...(!parts.length ? ['index.html'] :
    parts.length === 1 && parts[0] === 'admin' ? ['admin','index.html'] : parts));
  if (file !== root && !file.startsWith(root + sep)) return json(res, 404, { error: 'Не найдено' });
  let info;
  try { info = await stat(file); } catch { return json(res, 404, { error: 'Не найдено' }); }
  if (!info.isFile()) return json(res, 404, { error: 'Не найдено' });
  const adminAsset = parts[0] === 'admin';
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream',
    'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff',
    'Cache-Control': adminAsset ? 'no-store' :
      ['.html', '.js', '.css'].includes(extname(file)) ? 'no-cache' : 'public, max-age=3600',
    ...(adminAsset ? { 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "frame-ancestors 'none'" } : {}) });
  if (req.method === 'HEAD') res.end(); else createReadStream(file).pipe(res);
}
