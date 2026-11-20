import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApi } from '../server/api.js';
import { couponEs, couponUk } from '../locales/coupon.js';

const envKeys = ['RESEND_API_KEY', 'RESEND_FROM', 'PUBLIC_BASE_URL', 'SUPPORT_INBOX', 'STAGING_ENVIRONMENT'];

async function withEmail(testCase) {
  const previous = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const emails = [];
  const requests = [];
  try {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM = 'CatManDog <no-reply@notify.catmandog.es>';
    process.env.PUBLIC_BASE_URL = 'https://catmandog.es/';
    process.env.SUPPORT_INBOX = 'support@catmandog.es';
    delete process.env.STAGING_ENVIRONMENT;
    globalThis.fetch = async (_url, options) => {
      emails.push(JSON.parse(options.body));
      return { ok:true };
    };
    const db = { async query(sql, params) {
      if (sql.startsWith('INSERT INTO service_requests')) {
        requests.push(params);
        return { rowCount:1 };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    } };
    const submit = async (body, ip) => {
      const req = { method:'POST', headers:{}, socket:{ remoteAddress:ip },
        async *[Symbol.asyncIterator]() { yield JSON.stringify(body); } };
      let status, result;
      const res = { writeHead(code) { status=code; }, end(value) { result=JSON.parse(value); } };
      await handleApi(db, req, res, '/api/coupon/help');
      return { status, result };
    };
    await testCase({ submit, emails, requests });
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key,value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

test('coupon trouble with phone reaches owner email and admin queue', () => withEmail(async ({submit,emails,requests}) => {
  const response = await submit({ code:'suissavecinos10', phone:'+34 600 111 222',
    reason:'Лимит купонов исчерпан', locale:'uk' }, 'coupon-help-phone');
  assert.deepEqual([response.status,response.result.accepted,response.result.notified], [202,true,true]);
  assert.equal(requests.length, 1);
  assert.equal(requests[0][1], '');
  assert.equal(requests[0][2], '+34 600 111 222');
  assert.deepEqual(requests[0][5], { code:'SUISSAVECINOS10', reason:'Лимит купонов исчерпан' });
  assert.equal(emails.length, 1);
  assert.equal(emails[0].to[0], 'info@catmandog.es');
  assert.match(emails[0].text, /Телефон: \+34 600 111 222/);
  assert.match(emails[0].text, /SUISSAVECINOS10/);
}));

test('coupon trouble accepts email as alternate contact and rejects missing contact', () => withEmail(async ({submit,emails,requests}) => {
  assert.equal((await submit({ code:'SUISSAVECINOS10', reason:'Не работает', locale:'es' },
    'coupon-help-empty')).status, 400);
  assert.equal(requests.length, 0);
  const response = await submit({ code:'SUISSAVECINOS10', email:'buyer@example.test',
    reason:'Не работает', locale:'es' }, 'coupon-help-email');
  assert.equal(response.status, 202);
  assert.deepEqual(emails.map(mail => mail.to[0]), ['info@catmandog.es','buyer@example.test']);
}));

test('coupon page has distinct Spanish and Ukrainian help and failure copy', () => {
  for (const dictionary of [couponEs,couponUk]) {
    for (const key of ['Введите код или перейдите по ссылке. Можно купить как гость или войти в аккаунт, чтобы сохранить купон.',
      'Промокод принят - скидка 10% и бесплатная доставка будут учтены при оформлении заказа',
      'Лимит купонов исчерпан - свяжитесь с нами, мы дадим вам новый промокод',
      'Не получается использовать промокод?', 'Оставьте телефон или email. Проверим код вручную и свяжемся с вами',
      'Попросить помочь с промокодом', 'Обращение сохранено']) {
      assert.ok(dictionary[key], `Missing translation: ${key}`);
      assert.notEqual(dictionary[key], key);
    }
  }
});
