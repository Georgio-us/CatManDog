import test from 'node:test';
import assert from 'node:assert/strict';
import { seoDocument, serveMerchantFeed } from '../server/seo.js';
import { seoProductForId } from '../seo-products.js';
import { stockSeoCopy } from '../stock-seo-copy.js';

const stocked = {
  variant_id: 'tc-4e50c58957-reference-pack', product_id: 'tc-4e50c58957',
  name: 'Churu - тунец', brand: 'Churu', label: '4 тюбика × 14 г',
  image_path: 'https://img.catmandog.es/assets/treats-care/editorial/tc-4e50c58957-v1.webp',
  price_override_cents: 329, source_price_cents: 329, price_confirmed: true,
  sale_status: 'available', availability: 'on_hand', stock_quantity: 5,
  reserved_quantity: 0, committed_quantity: 0
};
const dbWith = rows => ({ query: async sql => ({ rows: sql.includes('FROM catalog_variants v JOIN catalog_products p')
  ? rows : [] }) });
const feedResponse = () => ({ headers: null, body: null,
  writeHead(status, headers) { this.status = status; this.headers = headers; },
  end(body) { this.body = body; } });

test('Merchant feed publishes only released, priced, physically available variants', async () => {
  const response = feedResponse();
  await serveMerchantFeed({ method: 'GET' }, response, '/google-products.xml', dbWith([
    stocked,
    { ...stocked, variant_id: 'out-of-stock', stock_quantity: 0 },
    { ...stocked, variant_id: 'unpriced', price_confirmed: false, price_override_cents: null, source_price_cents: null },
    { ...stocked, variant_id: 'unreleased', product_id: 'not-released' }
  ]));
  assert.equal(response.status, 200);
  assert.equal((response.body.match(/<item>/gu) || []).length, 1);
  assert.match(response.body, /<g:price>3\.29 EUR<\/g:price>/u);
  assert.match(response.body, /<g:availability>in_stock<\/g:availability>/u);
  assert.match(response.body, /<g:gtin>8859387700674<\/g:gtin>/u);
  assert.match(response.body, /Churu - atún - 4 tubos × 14 g/u);
  assert.doesNotMatch(response.body, /[А-Яа-яЁё]/u);
});

test('product structured data matches the selected in-stock variant', async () => {
  const path = seoProductForId(stocked.product_id).path;
  const html = await seoDocument(path, dbWith([stocked]), stocked.variant_id);
  const json = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/u)[1]);
  assert.equal(json['@type'], 'Product');
  assert.equal(json.offers.price, '3.29');
  assert.equal(json.offers.url, `https://catmandog.es${path}?variant=${stocked.variant_id}`);
  assert.match(html, /3\.29 € · Disponible/u);
  const unavailable = await seoDocument(path, dbWith([{ ...stocked, stock_quantity: 0 }]), stocked.variant_id);
  assert.doesNotMatch(unavailable, /application\/ld\+json/u);
});

test('database-only ACANA product has a crawlable Spanish page and exact variant image in the feed', async () => {
  const productId = 'cmd-source-39c2d5db76be47f7';
  const path = seoProductForId(productId).path;
  const base = { ...stocked, product_id: productId, name: 'ACANA Adult Small Breed',
    brand: 'ACANA', image_path: 'https://img.catmandog.es/assets/acana-parent.webp' };
  const rows = [
    { ...base, variant_id: 'acana-small-2kg', label: '2 кг', stock_quantity: 0 },
    { ...base, variant_id: 'acana-small-6kg', label: '6 кг', stock_quantity: 1,
      variant_image_path: 'https://img.catmandog.es/assets/acana-small-6kg.webp' }
  ];
  const html = await seoDocument(path, dbWith(rows), 'acana-small-6kg');
  assert.match(html, /<h1>ACANA Adult Small Breed<\/h1>/u);
  assert.match(html, /<img src="https:\/\/img\.catmandog\.es\/assets\/acana-small-6kg\.webp"/u);
  assert.doesNotMatch(html, /<meta name="robots" content="noindex/u);
  const json = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/u)[1]);
  assert.equal(json.sku, 'acana-small-6kg');
  assert.deepEqual(json.image, ['https://img.catmandog.es/assets/acana-small-6kg.webp']);
  const feed = feedResponse();
  await serveMerchantFeed({ method: 'GET' }, feed, '/google-products.xml', dbWith(rows));
  assert.equal((feed.body.match(/<item>/gu) || []).length, 1);
  assert.match(feed.body, /<link>https:\/\/catmandog\.es\/producto\/acana-adult-small-breed\?variant=acana-small-6kg<\/link>/u);
  assert.match(feed.body, /<g:image_link>https:\/\/img\.catmandog\.es\/assets\/acana-small-6kg\.webp<\/g:image_link>/u);
});

test('newly released stock pages have substantive Spanish names and descriptions', () => {
  assert.equal(Object.keys(stockSeoCopy).length, 39);
  for (const [id, copy] of Object.entries(stockSeoCopy)) {
    assert.equal(seoProductForId(id)?.indexable, true, id);
    assert.ok(copy.name.length > 8, id);
    assert.ok(copy.description.length >= 110, id);
    assert.doesNotMatch(`${copy.name} ${copy.description}`, /[А-Яа-яЁё]/u, id);
  }
});
