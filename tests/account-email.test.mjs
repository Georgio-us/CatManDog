import test from 'node:test';
import assert from 'node:assert/strict';
import { emailReady, sendAccountLink } from '../server/email.js';

test('account email uses the public HTTPS domain and an individual one-time link', async () => {
  const previous = Object.fromEntries(['RESEND_API_KEY', 'RESEND_FROM', 'PUBLIC_BASE_URL']
    .map(key => [key, process.env[key]]));
  try {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM = 'CatManDog <hola@catmandog.es>';
    process.env.PUBLIC_BASE_URL = 'https://catmandog.es/';
    assert.equal(emailReady(), true);
    let sent;
    await sendAccountLink('pet@example.test', 'reset', 'token-value', async (url, options) => {
      sent = { url, options };
      return { ok: true };
    });
    assert.equal(sent.url, 'https://api.resend.com/emails');
    assert.deepEqual(JSON.parse(sent.options.body).to, ['pet@example.test']);
    assert.match(JSON.parse(sent.options.body).text,
      /https:\/\/catmandog\.es\/#\/account\/reset\?token=token-value/);
    await sendAccountLink('pet@example.test', 'verify', 'otro-token', async (url, options) => {
      sent = { url, options };
      return { ok: true };
    }, 'es');
    const spanish = JSON.parse(sent.options.body);
    assert.equal(spanish.subject, 'Confirma tu email - CatManDog');
    assert.match(spanish.text, /Confirmar email: https:\/\/catmandog\.es\/#\/account\/verify\?token=otro-token/);
    assert.doesNotMatch(spanish.text, /[А-Яа-яЁё]/u);
    process.env.PUBLIC_BASE_URL = 'http://catmandog.es/';
    assert.equal(emailReady(), false);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
