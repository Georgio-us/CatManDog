import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogProducts } from '../data.js';
import { homeShortcuts, homeShortcutLanding, homeShortcutProducts } from '../home-shortcuts.js';

const helpers = {
  crumbs: () => '', card: product => `<article data-product="${product.id}"></article>`,
  icon: () => '<svg></svg>', escape: value => String(value)
};

test('selections show real available catalog products in each language', () => {
  for (const pet of ['cat', 'dog']) {
    const products = homeShortcutProducts(catalogProducts, pet);
    assert.ok(products.length > 0);
    assert.ok(products.every(product => product.pet === pet));
  }
  const spanishHome = homeShortcuts(catalogProducts, helpers.icon, helpers.escape, 'es');
  assert.match(spanishHome, /href="\/selecciones\/gatos"/u);
  assert.match(spanishHome, /href="\/selecciones\/perros"/u);
  assert.match(spanishHome, /Nuestra selección para gatos/u);
  const ukrainianHome = homeShortcuts(catalogProducts, helpers.icon, helpers.escape, 'uk');
  assert.match(ukrainianHome, /Наш вибір для котів/u);
  assert.match(ukrainianHome, /href="#\/picks\/dog"/u);
  for (const [language, title, href] of [
    ['ru', 'Подборка для собак', '#/picks/cat'],
    ['es', 'Selección para perros', '/selecciones/gatos'],
    ['uk', 'Добірка для собак', '#/picks/cat']
  ]) {
    const html = homeShortcutLanding(catalogProducts, 'dog', { ...helpers, language });
    assert.ok(html.includes(`<h1 class="page-title">${title}</h1>`));
    assert.ok(html.includes(`href="${href}"`));
  }
});
