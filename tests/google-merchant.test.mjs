import test from 'node:test';
import assert from 'node:assert/strict';
import { seoDocument, serveMerchantFeed } from '../server/seo.js';
import { seoProductForId } from '../seo-products.js';

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
