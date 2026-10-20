import test from 'node:test';
import assert from 'node:assert/strict';
import { notifyServiceRequest, sendServiceReply } from '../server/email.js';

test('support request notifies the team and customer, and replies come from CatManDog', async () => {
  const keys = ['RESEND_API_KEY', 'RESEND_FROM', 'PUBLIC_BASE_URL', 'SUPPORT_INBOX'];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const sent = [];
  try {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM = 'CatManDog <no-reply@notify.catmandog.es>';
    process.env.PUBLIC_BASE_URL = 'https://catmandog.es/';
    process.env.SUPPORT_INBOX = 'support@catmandog.es';
    const fetcher = async (url, options) => {
      assert.equal(url, 'https://api.resend.com/emails');
      sent.push(JSON.parse(options.body));
      return { ok: true };
    };
    await notifyServiceRequest({ id: 'request-id', kind: 'support', email: 'pet@example.test',
      orderNumber: 'CMD-101', message: 'Где мой заказ?' }, fetcher);
    assert.deepEqual(sent.map(mail => mail.to[0]), ['support@catmandog.es', 'pet@example.test']);
    assert.match(sent[0].text, /CMD-101/);
    assert.match(sent[1].text, /request-id/);
    await sendServiceReply('pet@example.test', 'request-id', 'Ваш заказ в пути', fetcher);
    assert.deepEqual(sent[2].to, ['pet@example.test']);
    assert.equal(sent[2].reply_to, 'support@catmandog.es');
    assert.match(sent[2].text, /Ваш заказ в пути/);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
