import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogProducts } from '../data.js';
import { homePromotions, homeShortcutLanding, homeShortcutProducts } from '../home-shortcuts.js';

const helpers = {
  crumbs: () => '', card: product => `<article data-product="${product.id}"></article>`,
  icon: () => '<svg></svg>', escape: value => String(value)
};

test('selections show real available catalog products in each language', () => {
  for (const pet of ['cat', 'dog']) {
    const products = homeShortcutProducts(catalogProducts, pet);
    assert.ok(products.length > 0);
    assert.ok(products.every(product => product.pet === pet));
    if (pet === 'dog') assert.equal(products.length, 40);
  }
  for (const [language, title, href] of [
    ['ru', 'Подборка для собак', '#/picks/cat'],
    ['es', 'Selección para perros', '/selecciones/gatos'],
    ['uk', 'Добірка для собак', '#/picks/cat']
  ]) {
    const html = homeShortcutLanding(catalogProducts, 'dog', { ...helpers, language });
    assert.ok(html.includes(`<h1>${title}</h1>`));
    assert.ok(html.includes(`href="${href}"`));
    assert.match(html, /acana-grass-fed-lamb-11-4kg/u);
    assert.match(html, /cat-pick-pairs-grid/u);
    assert.match(html, /cat-pick-filters/u);
    assert.match(html, /cat-pick-more/u);
  }
});

test('homepage promotions show the holiday teaser and lead to Cat’s Atelier', () => {
  for (const [language, title] of [
    ['ru', 'Новогодний домик для кота'],
    ['es', 'Casita navideña para tu gato'],
    ['uk', 'Новорічний будиночок для кота'],
  ]) {
    const html = homePromotions(helpers.icon, language);
    assert.ok(html.includes(title));
    assert.match(html, /href="\/catalogo\?q=Cat%E2%80%99s%20Atelier"/u);
    assert.doesNotMatch(html, /href="[^"]*(?:selecciones|picks|gift)/u);
  }
});
