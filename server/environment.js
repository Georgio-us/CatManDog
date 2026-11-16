import { createHash, timingSafeEqual } from 'node:crypto';

export const isStaging = (env = process.env) => env.APP_ENV === 'staging';

export function validateStagingEnvironment(env = process.env) {
  if (!isStaging(env)) return;
  let base;
  try { base = new URL(env.PUBLIC_BASE_URL); }
  catch { throw new Error('Staging requires a public HTTPS URL'); }
  if (base.protocol !== 'https:' || !base.hostname ||
      ['catmandog.es', 'www.catmandog.es'].includes(base.hostname) ||
      base.username || base.password || base.search || base.hash)
    throw new Error('Staging must use a separate HTTPS host');
  if (!env.STAGING_DATABASE_URL || env.DATABASE_URL)
    throw new Error('Staging requires STAGING_DATABASE_URL and no DATABASE_URL');
  if (!/^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY || '') ||
      !/^whsec_/.test(env.STRIPE_WEBHOOK_SECRET || ''))
    throw new Error('Staging requires Stripe test keys and its webhook secret');
  if (!env.STAGING_BASIC_AUTH_USER || env.STAGING_BASIC_AUTH_USER.includes(':') ||
      (env.STAGING_BASIC_AUTH_PASSWORD || '').length < 16)
    throw new Error('Staging requires Basic Auth credentials and a 16-character password');
  if (env.ORDERS_ENABLED !== 'true' || env.PAYMENTS_ENABLED !== 'true')
    throw new Error('Staging requires orders and payments enabled');
  const forbidden = ['RESEND_API_KEY', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID',
    'SENDCLOUD_PUBLIC_KEY', 'SENDCLOUD_SECRET_KEY', 'GOOGLE_CLIENT_ID'];
  if (forbidden.some(name => env[name]) ||
      ['ACCOUNTS_ENABLED','SUPPORT_ENABLED','BACKUP_ENABLED','TELEGRAM_VISIT_ALERTS_ENABLED',
        'NATIONAL_CHECKOUT_ENABLED'].some(name => env[name] === 'true'))
    throw new Error('Staging cannot use live notifications, accounts, carrier or backup integrations');
}

export function stagingAuthorized(req, pathname, env = process.env) {
  if (!isStaging(env) || (pathname === '/api/stripe/webhook' && req.method === 'POST'))
    return true;
  const value = req.headers.authorization || '';
  if (!/^Basic [A-Za-z0-9+/=]+$/.test(value)) return false;
  let supplied;
  try { supplied = Buffer.from(value.slice(6), 'base64').toString('utf8'); }
  catch { return false; }
  const expected = `${env.STAGING_BASIC_AUTH_USER}:${env.STAGING_BASIC_AUTH_PASSWORD}`;
  const hash = text => createHash('sha256').update(text).digest();
  return timingSafeEqual(hash(supplied), hash(expected));
}
