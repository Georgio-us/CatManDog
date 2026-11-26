import { createServer } from 'node:http';
import { createDatabase, initializeDatabase } from './db.js';
import { handleApi } from './api.js';
import { serveStatic } from './http.js';
import { serveSeo, serveMerchantFeed } from './seo.js';
import { serveCampaignLink } from './campaign-links.js';
import { startBackupScheduler } from './backup.js';
import { startTelegramOrderAlerts, startTelegramCommands } from './telegram.js';
import { startObservedCartCleanup } from './cart-activity.js';
import { isStaging, requiresDatabaseAtStartup, stagingAuthorized, validateStagingEnvironment } from './environment.js';

validateStagingEnvironment();
const port = Number(process.env.PORT || 8080);
const db = createDatabase();
let initialized = false;
if (db) {
  try {
    await initializeDatabase(db);
    initialized = true;
  } catch (error) { console.error('Database initialization failed:', error.message); }
}
if (requiresDatabaseAtStartup() && !initialized) throw new Error('Database initialization failed');

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (!stagingAuthorized(req, url.pathname)) {
      res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="CatManDog test", charset="UTF-8"',
        'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Тестовая среда CatManDog: требуется вход');
    }
    if (url.pathname.startsWith('/api/')) return await handleApi(initialized ? db : null, req, res, url.pathname);
    if (await serveCampaignLink(initialized ? db : null, req, res, url.pathname)) return;
    if (await serveMerchantFeed(req, res, url.pathname, initialized ? db : null)) return;
    if (await serveSeo(req, res, url.pathname, initialized ? db : null)) return;
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
const stopTelegramAlerts = startTelegramOrderAlerts(initialized && !isStaging() ? db : null);
const stopTelegramCommands = startTelegramCommands(initialized && !isStaging() ? db : null);
const stopCartCleanup = startObservedCartCleanup(initialized ? db : null);
process.on('SIGTERM', () => { stopBackups(); stopTelegramAlerts(); stopTelegramCommands(); stopCartCleanup(); server.close(() => db?.end()); });
