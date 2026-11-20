import test from 'node:test';
import assert from 'node:assert/strict';

for (const language of ['ru', 'uk', 'es']) {
  globalThis.localStorage = { getItem: () => language };
  globalThis.location = { pathname: '/revista', search: '' };
  const current = await import(`../locale.js?route-preference-${language}`);
  test(`${language} remains selected on direct SEO links`, () => {
    assert.equal(current.locale(), language);
    const localized = language !== 'es';
    assert.equal(current.localizedSeoRoute('/revista'), localized ? '/#/journal' : null);
    assert.equal(current.localizedSeoRoute('/revista/play'), localized ? '/#/journal/play' : null);
    assert.equal(current.localizedSeoRoute('/selecciones/perros'), localized ? '/#/picks/dog' : null);
    assert.equal(current.localizedSeoRoute('/catalogo/gatos/pienso-seco', '?utm_source=instagram'),
      localized ? '/?utm_source=instagram#/catalog?pet=cat&group=dry-food' : null);
    assert.equal(current.localizedSeoRoute('/recogida'), null);
    if (language === 'es') {
      assert.equal(current.localizedSeoRoute('/revista', '', 'uk'), '/#/journal');
      assert.equal(current.translate('Самовывоз'), 'Recogida');
      assert.equal(current.translate('Добавить товары'), 'Añadir productos');
      assert.equal(current.translate('Без промокода'), 'Quitar código promocional');
      assert.equal(current.translate('Промокод SUISSAVECINOS10'), 'Código promocional SUISSAVECINOS10');
    }
    if (language === 'uk') {
      assert.equal(current.translate('Без промокода'), 'Без промокоду');
      assert.equal(current.translate('Промокод SUISSAVECINOS10'), 'Промокод SUISSAVECINOS10');
    }
  });
}
