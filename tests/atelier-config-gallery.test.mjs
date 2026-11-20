import test from 'node:test';
import assert from 'node:assert/strict';
import { atelierSelection, atelierShelfId, atelierOptionsMarkup } from '../atelier-configuration.js';
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
  assert.throws(() => priceQuote([line({ fabric:'999', wood:'57' })], [variant]), /Выберите ткань/);
  assert.throws(() => priceQuote([{ productId:atelierShelfId, variantId:atelierShelfId, qty:1 }], [variant]), /Выберите ткань/);
});
