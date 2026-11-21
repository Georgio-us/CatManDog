import test from 'node:test';
import assert from 'node:assert/strict';
import { requiresDatabaseAtStartup, stagingAuthorized, validateStagingEnvironment } from '../server/environment.js';
import { stripeReady } from '../server/stripe.js';
import { claimDatabaseEnvironment } from '../server/db.js';

const base = () => ({ APP_ENV: 'staging', STAGING_DATABASE_URL: 'postgres://test-only',
  PUBLIC_BASE_URL: 'https://staging.example.com/', STRIPE_SECRET_KEY: 'sk_test_example',
  STRIPE_WEBHOOK_SECRET: 'whsec_example', STAGING_BASIC_AUTH_USER: 'owner',
  STAGING_BASIC_AUTH_PASSWORD: 'a-long-staging-password', ORDERS_ENABLED: 'true',
  PAYMENTS_ENABLED: 'true' });

test('deployed production and staging require a connected database before serving pages', () => {
  assert.equal(requiresDatabaseAtStartup({ APP_ENV: 'staging' }), true);
  assert.equal(requiresDatabaseAtStartup({ APP_ENV: 'production' }), true);
  assert.equal(requiresDatabaseAtStartup({ RAILWAY_ENVIRONMENT_NAME: 'production' }), true);
  assert.equal(requiresDatabaseAtStartup({}), false);
});

test('staging rejects live payment, database, domain and notification settings', () => {
  assert.doesNotThrow(() => validateStagingEnvironment(base()));
  for (const changed of [
    { STRIPE_SECRET_KEY: 'rk_live_example' }, { DATABASE_URL: 'postgres://production' },
    { PUBLIC_BASE_URL: 'https://catmandog.es/' }, { RESEND_API_KEY: 're_live' },
    { TELEGRAM_BOT_TOKEN: 'bot' }, { BACKUP_ENABLED: 'true' },
    { STAGING_BASIC_AUTH_PASSWORD: 'short' }
  ]) assert.throws(() => validateStagingEnvironment({ ...base(), ...changed }));
});

test('staging HTTP auth protects pages and API but leaves the signed webhook endpoint reachable', () => {
  const env = base();
  const auth = 'Basic ' + Buffer.from('owner:a-long-staging-password').toString('base64');
  assert.equal(stagingAuthorized({ method: 'GET', headers: {} }, '/', env), false);
  assert.equal(stagingAuthorized({ method: 'GET', headers: { authorization: auth } }, '/api/config', env), true);
  assert.equal(stagingAuthorized({ method: 'GET', headers: { authorization: 'Basic abc' } }, '/', env), false);
  assert.equal(stagingAuthorized({ method: 'POST', headers: {} }, '/api/stripe/webhook', env), true);
  assert.equal(stagingAuthorized({ method: 'GET', headers: {} }, '/api/stripe/webhook', env), false);
});

test('staging Stripe readiness accepts only a test key on a separate HTTPS host', () => {
  const names = ['APP_ENV','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','PUBLIC_BASE_URL'];
  const prior = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    Object.assign(process.env, base());
    assert.equal(stripeReady(), true);
    process.env.STRIPE_SECRET_KEY = 'rk_live_example';
    assert.equal(stripeReady(), false);
    process.env.STRIPE_SECRET_KEY = 'sk_test_example';
    process.env.PUBLIC_BASE_URL = 'https://catmandog.es/';
    assert.equal(stripeReady(), false);
  } finally {
    for (const name of names) {
      if (prior[name] === undefined) delete process.env[name];
      else process.env[name] = prior[name];
    }
  }
});

test('staging never initializes an existing production database', async () => {
  const client = (catalog, marker, mode) => ({ queries: [], async query(sql) {
    this.queries.push(sql);
    if (sql.includes('to_regclass')) return { rows: [{ catalog, marker }] };
    if (sql.startsWith('SELECT mode')) return { rows: mode ? [{ mode }] : [] };
    return { rows: [] };
  } });
  await assert.rejects(claimDatabaseEnvironment(client(true, false), true),
    /existing unmarked database/);
  await assert.rejects(claimDatabaseEnvironment(client(true, true, 'production'), true),
    /another CatManDog environment/);
  await assert.rejects(claimDatabaseEnvironment(client(true, true, 'staging'), false),
    /another CatManDog environment/);
  const fresh = client(false, false);
  await claimDatabaseEnvironment(fresh, true);
  assert.ok(fresh.queries.some(sql => sql.includes("VALUES(true,'staging')")));
});
