import test from 'node:test';
import assert from 'node:assert/strict';
import { atelierSelection, atelierShelfId, atelierOptionsMarkup, atelierHasOptions, atelierDefaults } from '../atelier-configuration.js';
import { productGallery } from '../product-gallery.js';
import { priceQuote } from '../server/pricing.js';
import { catsAtelierProducts } from '../cats-atelier-products.js';

const selection = { fabric:'41', wood:'57' };
const product = {
  id: atelierShelfId,
  image: { src:'https://img.catmandog.es/main.webp', alt:'Полка' },
  gallery: [{ src:'https://img.catmandog.es/detail.webp', alt:'Крепление', caption:{ru:'Крючок',es:'Gancho'} }]
};
const imageBlock = image => `<img src="${image.src}">`;

test('gallery renders a primary image and selectable, localized secondary images', () => {
  const html = productGallery(product, imageBlock, value => value, 'es');
  assert.match(html, /data-gallery-main/);
  assert.match(html, /data-gallery-index="1"/);
  assert.match(html, /data-gallery-caption="Gancho"/);
});

test('Flat 75 cm page keeps the studio cover and seven supplier specification photos', () => {
  const shelf = catsAtelierProducts.find(item => item.id === atelierShelfId);
  assert.match(shelf.image.src, /SH-W-F75-G-studio-v6\.webp$/);
  assert.equal(shelf.gallery.length, 7);
  assert.deepEqual(shelf.gallery.map(image => Number(image.originalSrc.match(/\/(\d+)-thickbox_default\//)?.[1])),
    [557, 286, 287, 288, 290, 291, 645]);
  const html = productGallery(shelf, imageBlock, value => value, 'es');
  assert.match(html, /data-gallery-index="7"/);
  assert.match(html, /data-gallery-reference="true"/);
  assert.match(html, /data-gallery-caption="Paleta del tejido DOT"/);
});

test('all Cat’s Atelier models retain a studio cover and localized supplier detail gallery', () => {
  assert.equal(catsAtelierProducts.length, 39);
  for (const item of catsAtelierProducts) {
    assert.match(item.image.src, /^https:\/\/img\.catmandog\.es\/assets\/cats-atelier\//);
    assert.ok(item.gallery?.length >= 1, `No detail photos: ${item.manufacturerSku}`);
    const seen = new Set();
    for (const image of item.gallery) {
      assert.match(image.src, /^https:\/\/img\.catmandog\.es\/assets\/cats-atelier\//);
      assert.match(image.originalSrc, /^https:\/\/catsatelier\.com\/\d+-thickbox_default\//);
      assert.ok(!seen.has(image.originalSrc), `Duplicate photo: ${item.manufacturerSku}`);
      seen.add(image.originalSrc);
      for (const language of ['ru','es','uk']) {
        assert.ok(image.alt[language], `Missing ${language} alt: ${item.manufacturerSku}`);
        assert.ok(image.caption[language], `Missing ${language} caption: ${item.manufacturerSku}`);
      }
    }
    const html = productGallery(item, imageBlock, value => value, 'uk');
    assert.match(html, new RegExp(`data-gallery-index="${item.gallery.length}"`));
  }
});

test('supplier-specific options are exact and carry through the priced quote', () => {
  const parsed = atelierSelection(atelierShelfId, selection);
  assert.equal(parsed.label, 'DOT Beige · White');
  assert.match(atelierOptionsMarkup(atelierShelfId, selection, 'ru', value => value), /data-atelier-option="wood"/);
  const variant = { variant_id:atelierShelfId, product_id:atelierShelfId, name:'Оконная полка', label:'1 шт',
    sale_price_cents:15500, price_accepted:true, sale_status:'preorder', availability:'source_on_demand' };
  const line = options => ({ productId:atelierShelfId, variantId:atelierShelfId, qty:1, configuration:options });
  const quote = priceQuote([line(selection), line({ fabric:'42', wood:'62' })], [variant]);
  assert.equal(quote.items.length, 2);
  assert.equal(quote.items[0].variantLabel, '1 шт · DOT Beige · White');
  assert.deepEqual(quote.items[0].configuration, selection);
  assert.throws(() => priceQuote([line({ fabric:'999', wood:'57' })], [variant]), /Выберите цвет тканевого чехла/);
  assert.throws(() => priceQuote([{ productId:atelierShelfId, variantId:atelierShelfId, qty:1 }], [variant]), /Выберите все варианты/);
});

test('every supplier option group appears on the matching model and validates at checkout', () => {
  const configured = catsAtelierProducts.filter(item => atelierHasOptions(item.id));
  assert.equal(configured.length, 38);
  for (const item of configured) {
    const defaults = atelierDefaults(item.id);
    const selection = atelierSelection(item.id, defaults);
    assert.ok(selection.label);
    assert.deepEqual(selection.options, defaults);
    const markup = atelierOptionsMarkup(item.id, defaults, 'es', value => value);
    for (const key of Object.keys(defaults)) assert.match(markup, new RegExp(`data-atelier-option="${key}"`));
    assert.throws(() => atelierSelection(item.id, null), /Выберите все варианты/);
    const quote = priceQuote([{ productId:item.id, variantId:item.id, qty:1, configuration:defaults }],
      [{ variant_id:item.id, product_id:item.id, name:item.name, label:'1 шт', sale_price_cents:Math.round(item.price*100),
        price_accepted:true, sale_status:'preorder', availability:'source_on_demand' }]);
    assert.deepEqual(quote.items[0].configuration, defaults);
  }
  assert.equal(atelierHasOptions('cats-atelier-rd-st'), false);
});
