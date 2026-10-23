import { createServer } from 'node:http';
import { createDatabase, initializeDatabase } from './db.js';
import { handleApi } from './api.js';
import { serveStatic } from './http.js';
import { startBackupScheduler } from './backup.js';

const port = Number(process.env.PORT || 8080);
const db = createDatabase();
let initialized = false;
if (db) {
  try {
    await initializeDatabase(db);
    initialized = true;
  } catch (error) { console.error('Database initialization failed:', error.message); }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname.startsWith('/api/')) return await handleApi(initialized ? db : null, req, res, url.pathname);
    if (process.env.R2_MEDIA_REDIRECT_ENABLED !== 'false' && url.pathname.startsWith('/assets/')) {
      const base = new URL(process.env.R2_PUBLIC_BASE_URL || 'https://img.catmandog.es');
      if (base.protocol === 'https:' && !url.pathname.includes('..')) {
        res.writeHead(302, { Location: `${base.href.replace(/\/$/, '')}${url.pathname}`,
          'Cache-Control': 'public, max-age=3600' });
        return res.end();
      }
    }
    return await serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error('Request error:', error.message);
    res.writeHead(500);
    res.end('Server error');
  }
});

server.listen(port, '0.0.0.0', () => console.info(`CatManDog listening on ${port}`));
const stopBackups = startBackupScheduler(initialized ? db : null);
process.on('SIGTERM', () => { stopBackups(); server.close(() => db?.end()); });
