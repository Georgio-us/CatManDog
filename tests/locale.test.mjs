import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => 'es' };

const { translate } = await import('../locale.js');
const { provisionalPriceBlock, retailResearchBlock } = await import('../retail-research.js');
const { catalogProducts, products } = await import('../data.js');
const { articlesEs } = await import('../journal-content-es.js');

test('Spanish catalogue copy covers product names, descriptions and variants', () => {
  for (const product of [...catalogProducts, ...products]) {
    const fields = [product.name, product.description, product.tag, product.weight,
      ...(product.variants || []).flatMap(variant => [variant.name, variant.description, variant.label])];
    for (const value of fields.filter(Boolean)) {
      assert.doesNotMatch(translate(value), /[А-Яа-яЁё]/u, `${product.id}: ${value}`);
    }
  }
});

test('Spanish articles are complete editorial texts', () => {
  assert.equal(articlesEs.length, 3);
  for (const article of articlesEs) {
    assert.ok(article.wordCount >= 500, `${article.id}: ${article.wordCount} words`);
    assert.doesNotMatch(JSON.stringify(article), /[А-Яа-яЁё]/u);
  }
});

test('dynamic shopping labels translate the product name', () => {
  assert.equal(translate('Открыть товар: Набор «В гости с подарком»'),
    'Ver producto: Caja «Una visita con regalo»');
  assert.equal(translate('Мышка Cotton · 5,50 €'), 'Ratón Cotton · 5,50 €');
});

test('Spanish storefront has no Russian copy in surfaced catalogue and service labels', () => {
  const labels = [
    'Наполнители', 'Посмотреть ещё', 'Содержание статьи', 'Войти или зарегистрироваться',
    'Расчётный ориентир с IVA', 'Ориентир по аналогу с IVA',
    'Цены с IVA, доставка отдельно · Для сравнения с ценой товара выше',
    'Карточка поставщика - Piensos Marí', 'Источник фото - Kiwoko',
    'Влажный корм к этому рациону', 'Ещё сухой корм этого бренда',
    'Лакомство для вашего питомца', 'Миска для кормления',
    'Для вопросов о заказе подготовлена форма поддержки. Запрос на возврат можно начать через отдельную форму. После проверки обращение можно отправить команде',
    'MP Bergamo · Чёрный · 950 мл - Белый · 950 мл · 2 formatos',
    'Yagu · T2 · шея 25-27 см - T4 · cuello 35-37 cm · 3 formatos'
  ];
  for (const label of labels) assert.doesNotMatch(translate(label), /[А-Яа-яЁё]/u, label);
});

test('Spanish price research explains every provisional pricing note', () => {
  globalThis.location = { hostname: 'localhost' };
  const helpers = { escape: String, money: value => `${value.toFixed(2)} €` };
  for (const product of catalogProducts) {
    for (const variant of product.variants?.length ? product.variants : [product]) {
      for (const value of [variant.pricingBasis?.group, variant.pricingBasis?.note].filter(Boolean)) {
        assert.doesNotMatch(translate(value), /[А-Яа-яЁё]/u, `${variant.id}: ${value}`);
      }
      for (const html of [provisionalPriceBlock(variant, helpers), retailResearchBlock(variant, helpers)]) {
        assert.doesNotMatch(html, /[А-Яа-яЁё]/u, variant.id);
      }
    }
  }
});
