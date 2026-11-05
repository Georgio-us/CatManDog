import test from 'node:test';
import assert from 'node:assert/strict';
import { es } from '../locales/es.js';
import { uk } from '../locales/uk.js';
import { ukExtra } from '../locales/uk-extra.js';
import { ukProductNames } from '../locales/uk-product-names.js';
import { ukDetails } from '../locales/uk-details.js';
import { esDetails } from '../locales/details-es.js';
import { catalogProducts } from '../data.js';
import { articlesUk } from '../journal-content-uk.js';

const saved = new Map([['catmandog-language', 'uk']]);
globalThis.localStorage = {
  getItem: key => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, value),
  removeItem: key => saved.delete(key)
};
globalThis.location = { pathname: '/', search: '', reload() {} };
const ukrainian = await import('../locale.js?uk-public-test');

test('Ukrainian is a public language and translates the shopping flow', () => {
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
    ['Демонстрационная цена', 'Демонстраційна ціна'],
    ['Оплата подтверждена', 'Оплату підтверджено'],
    ['Кремовые лакомства', 'Кремові ласощі']
  ]) assert.equal(ukrainian.translate(source), expected, source);
});

test('Ukrainian copy covers every storefront key in the Spanish dictionary', () => {
  const missing = Object.keys(es).filter(key => !(key in uk) && !(key in ukExtra));
  assert.deepEqual(missing, []);
});

test('Catalog names and journal pages have Ukrainian copy', () => {
  const productNames = [...new Set(catalogProducts.map(product => product.name).filter(name => /[А-Яа-яЁё]/u.test(name)))];
  assert.deepEqual(productNames.filter(name => !(name in ukProductNames)), []);
  assert.deepEqual(articlesUk.map(article => article.id), ['home', 'play', 'travel']);
  for (const article of articlesUk) assert.ok(article.sections.every(section => section.paragraphs.length));
  assert.equal(ukrainian.translate('Выбрать набор: Набор «В гости с подарком»'), 'Вибрати набір: Набір «У гості з подарунком»');
});

test('Catalog descriptions and details do not fall back to Russian or Spanish', () => {
  assert.deepEqual(Object.keys(esDetails).filter(source => !(source in ukDetails)), []);
  const descriptions = [...new Set(catalogProducts.map(product => product.description).filter(Boolean))];
  const untranslated = descriptions.filter(source => {
    const output = ukrainian.translate(source);
    return /[ыэёъЫЭЁЪ]/u.test(output) || /\b(?:для кошек|для собак с|влажный корм|сухой корм|полнорационный корм)\b/iu.test(output);
  });
  assert.deepEqual(untranslated, []);
  assert.equal(ukrainian.translate('Влажный корм NutriPlus с ягнёнком для собак'), 'Вологий корм NutriPlus із ягням для собак');
});

test('Selecting a language saves the public preference', () => {
  ukrainian.setLocale('ru');
  assert.equal(saved.get('catmandog-language'), 'ru');
  ukrainian.setLocale('uk');
  assert.equal(saved.get('catmandog-language'), 'uk');
});
