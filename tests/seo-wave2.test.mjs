import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../data.js';
import { seoProductForId } from '../seo-products.js';
import { seoWave2Copy, seoWave2VisibleCopy } from '../seo-wave2-copy.js';
import { seoDocument } from '../server/seo.js';
import { accessoryDetail } from '../accessory-ui.js';
import { yaguExpansionEs, yaguExpansionUk } from '../locales/yagu-expansion.js';
import { yaguToyExpansionEs, yaguToyExpansionUk } from '../locales/yagu-toy-expansion.js';
import { esProductText } from '../locales/product-es.js';
import { ukProductCopy } from '../locales/uk-product-copy.js';

test('the second SEO wave has 21 distinct, translated, purchasable families', async () => {
  const entries = Object.entries(seoWave2Copy);
  assert.equal(entries.length, 21);
  const descriptions = new Set();
  for (const [id, copy] of entries) {
    const product = products.find(item => item.id === id);
    const seo = seoProductForId(id);
    assert.ok(product && seo?.indexable, id);
    assert.ok(product.image?.src && product.variants?.length, id);
    assert.ok(product.variants.every(variant => Number(variant.price) > 0), id);
    const es = yaguExpansionEs[product.description] || yaguToyExpansionEs[product.description] || esProductText[product.description];
    const uk = yaguExpansionUk[product.description] || yaguToyExpansionUk[product.description] || ukProductCopy(product.description);
    assert.ok(es && uk, `${id}: missing interface translation`);
    assert.ok(copy.description.length >= 110, `${id}: thin Spanish search description`);
    const visible = seoWave2VisibleCopy[id];
    assert.ok(visible?.ru?.length >= 110 && visible?.uk?.length >= 110, `${id}: thin visible copy`);
    for (const [language, description] of [['ru', visible.ru], ['es', copy.description], ['uk', visible.uk]]) {
      const detail = accessoryDetail(product, {
        crumbs: () => '', imageBlock: () => '', escape: value => String(value),
        icon: () => '<svg></svg>', favorites: [], goodTogether: () => '',
        money: value => `${value} €`, translate: value => value,
        variantId: product.variants[0].id, quantity: 1, language
      });
      assert.ok(detail.includes(description), `${id}: ${language} visible description`);
    }
    assert.doesNotMatch(copy.description + es, /[А-Яа-яЁё]/u, id);
    assert.equal(descriptions.has(copy.description), false, `${id}: duplicate search description`);
    descriptions.add(copy.description);
    const html = await seoDocument(seo.path);
    assert.ok(html.includes(copy.description), id);
    assert.doesNotMatch(html, /<meta name="robots" content="noindex/u, id);
  }
});
