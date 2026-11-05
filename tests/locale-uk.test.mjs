import test from 'node:test';
import assert from 'node:assert/strict';

const saved = new Map([['catmandog-language', 'ru'], ['catmandog-uk-preview-language', 'uk']]);
globalThis.localStorage = {
  getItem: key => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, value),
  removeItem: key => saved.delete(key)
};
globalThis.location = { pathname: '/', search: '?ukPreview=1' };
const ukrainian = await import('../locale.js?uk-preview-test');

test('Ukrainian preview uses its own locale and translates the shopping flow', () => {
  assert.equal(ukrainian.locale(), 'uk');
  assert.equal(ukrainian.intlLocale(), 'uk-UA');
  for (const [source, expected] of [
    ['Главная', 'Головна'],
    ['Для кошек', 'Для котів'],
    ['Выбрать вариант', 'Вибрати варіант'],
    ['Ваша корзина', 'Ваш кошик'],
    ['Перейти к оформлению', 'Перейти до оформлення'],
    ['Как с вами связаться', 'Як із вами зв’язатися'],
    ['Проверить данные', 'Перевірити дані'],
    ['Помощь с заказом', 'Допомога із замовленням'],
    ['Восстановить пароль', 'Відновити пароль'],
    ['Корзина: 1 товар', 'Кошик: 1 товар'],
    ['Корзина: 2 товара', 'Кошик: 2 товари'],
    ['Корзина: 5 товаров', 'Кошик: 5 товарів'],
    ['Демонстрационная цена', 'Демонстраційна ціна']
  ]) assert.equal(ukrainian.translate(source), expected, source);
});

test('Ukrainian preview stays opt-in and does not replace the public language', async () => {
  globalThis.location = { pathname: '/', search: '' };
  const publicLocale = await import('../locale.js?uk-public-test');
  assert.equal(publicLocale.locale(), 'ru');
});

test('Selecting Ukrainian keeps the public language preference intact', () => {
  globalThis.location = { pathname: '/', search: '?ukPreview=1', reload() {} };
  ukrainian.setLocale('uk');
  assert.equal(saved.get('catmandog-language'), 'ru');
  assert.equal(saved.get('catmandog-uk-preview-language'), 'uk');
  ukrainian.setLocale('es');
  assert.equal(saved.get('catmandog-language'), 'es');
  assert.equal(saved.has('catmandog-uk-preview-language'), false);
});
