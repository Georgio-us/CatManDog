import test from 'node:test';
import assert from 'node:assert/strict';

test('coupon API errors stay in the selected language and hide database details', async () => {
  globalThis.localStorage = { getItem: () => 'es' };
  const { createAccountApi } = await import('../account-api.js?localized-errors-test');
  const response = (status, error) => ({ ok: false, status,
    json: async () => ({ error }) });
  const unavailable = createAccountApi(async () => response(503, 'База данных ещё не подключена'));
  await assert.rejects(unavailable.activateCoupon('SUISSAVECINOS10'), error =>
    error.status === 503 && error.message === 'El servicio no está disponible ahora. Inténtalo de nuevo más tarde.');

  const invalid = createAccountApi(async () => response(400, 'Промокод недействителен'));
  await assert.rejects(invalid.activateCoupon('BAD'), error =>
    error.status === 400 && error.message === 'Este código promocional no es válido');

  const unknown = createAccountApi(async () => response(400, 'Новая ошибка без перевода'));
  await assert.rejects(unknown.activateCoupon('BAD'), error =>
    error.status === 400 && error.message === 'No se ha podido completar la solicitud. Inténtalo de nuevo.');
});

test('temporary service message is translated for Ukrainian and retained for Russian', async () => {
  globalThis.localStorage = { getItem: () => 'uk' };
  const ukrainian = await import('../locale.js?localized-error-uk');
  assert.equal(ukrainian.translate('Сервис временно недоступен. Попробуйте ещё раз позже'),
    'Сервіс тимчасово недоступний. Спробуйте ще раз пізніше.');
  globalThis.localStorage = { getItem: () => 'ru' };
  const russian = await import('../locale.js?localized-error-ru');
  assert.equal(russian.translate('Сервис временно недоступен. Попробуйте ещё раз позже'),
    'Сервис временно недоступен. Попробуйте ещё раз позже');
});
