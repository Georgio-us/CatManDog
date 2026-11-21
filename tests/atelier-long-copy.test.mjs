import test from 'node:test';
import assert from 'node:assert/strict';
import { catsAtelierProducts } from '../cats-atelier-products.js';
import { atelierDescription, atelierDescriptionMarkup } from '../atelier-description.js';
import { accessoryDetail } from '../accessory-ui.js';
import { atelierDefaults } from '../atelier-configuration.js';

const bySku = sku => catsAtelierProducts.find(product => product.manufacturerSku === sku);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;');

test('all 39 models have distinct, substantive descriptions in three languages', () => {
  assert.equal(new Set(catsAtelierProducts.map(product => product.name)).size, 39);
  for (const product of catsAtelierProducts.filter(item => /-(UL|UR)$/.test(item.manufacturerSku))) {
    assert.match(product.name, /асимметричная/);
    assert.equal(product.image.alt, product.name);
  }
  for (const language of ['ru', 'es', 'uk']) {
    const summaries = new Set();
    for (const product of catsAtelierProducts) {
      const copy = atelierDescription(product, language);
      assert.ok(copy?.summary, product.manufacturerSku);
      assert.ok(copy.paragraphs.join(' ').length > 250, product.manufacturerSku);
      assert.equal(copy.paragraphs.length, 2);
      assert.ok(!summaries.has(copy.summary), product.manufacturerSku);
      assert.doesNotMatch([copy.summary, ...copy.paragraphs].join(' '), /undefined|\{\w+\}/);
      summaries.add(copy.summary);
    }
    assert.equal(summaries.size, 39);
  }
});

test('window mounting uses supplier clarification and avoids copied wrong dimensions', () => {
  const checked = atelierDescription(bySku('SH-M-A60-G'), 'ru');
  assert.match(checked.summary, /60 см/);
  assert.match(checked.paragraphs[1], /рама, которая несёт вес|раму, которая несёт вес/);
  assert.match(checked.paragraphs[1], /Присоски.*лишь стабилизируют/);
  assert.doesNotMatch(checked.paragraphs.join(' '), /75 см|стен.*дюбел/);
  const flat = atelierDescription(bySku('SH-W-F75-G'), 'ru');
  assert.match(flat.summary, /75 см/);
  assert.doesNotMatch(flat.summary, /60 см/);
  const conflictingShape = atelierDescription(bySku('SH-W-F60-G'), 'ru');
  assert.doesNotMatch(conflictingShape.summary, /Flat|Arc/);
});

test('short introduction and expanded copy render in a closed, localized disclosure', () => {
  const product = bySku('SH-M-DA100');
  for (const [language, label] of [['ru', 'Подробнее о товаре'], ['es', 'Más sobre el producto'], ['uk', 'Докладніше про товар']]) {
    const html = atelierDescriptionMarkup(product, language, escape);
    assert.match(html, new RegExp(label));
    assert.match(html, /<details class="atelier-description-more">/);
    assert.doesNotMatch(html, /<details[^>]* open/);
    assert.equal((html.match(/<p(?:\s|>)/g) || []).length, 3);
  }
  const html = accessoryDetail(product, {
    crumbs: () => '', imageBlock: () => '', escape, icon: () => '<svg></svg>',
    favorites: [], goodTogether: () => '', money: value => String(value), language: 'es',
    configuration: atelierDefaults(product.id)
  });
  assert.match(html, /Más sobre el producto/);
  assert.match(html, /El estante de pared Double Arch de 100 cm/);
  assert.equal(atelierDescriptionMarkup({ brand: 'Other' }, 'ru', escape), '');
});
