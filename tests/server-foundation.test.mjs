import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogRows, importCatalog, catalogSnapshot } from '../server/catalog.js';
import { priceQuote, validateAddress, validateDelivery } from '../server/pricing.js';
import { hashPassword, verifyPassword, sessionCookie } from '../server/auth.js';
import { applyServerPrices, applyServerCatalog } from '../server-prices.js';
import { canBuy, catalogPrice } from '../variants.js';
import { handleApi } from '../server/api.js';
import { retiredProductIds } from '../catalog-policy.js';
import { catalogEditorialContent } from '../catalog-editorial-content.js';
import { editorialEs, editorialUk } from '../locales/editorial-translations.js';

test('verified editorial copy is distinct and translated for each curated product', () => {
  const entries = Object.entries(catalogEditorialContent);
  assert.equal(entries.length, 81);
  assert.equal(new Set(entries.map(([,copy]) => copy.description)).size, entries.length);
  for (const [id, copy] of entries) {
    assert.ok(id.startsWith('cmd-source-') || id.startsWith('leonardo-') || id.startsWith('acana-') || id.startsWith('orijen-') || id.startsWith('dog-') || id.startsWith('rc-') || id.startsWith('churu-dog-') || id.startsWith('tc-'));
    assert.ok(copy.source.startsWith('https://'));
    assert.ok(copy.description.length > 100);
    assert.ok(copy.details.length >= 3);
    for (const source of [copy.description, ...copy.details]) {
      assert.ok(editorialEs[source], `missing Spanish copy: ${source}`);
      assert.ok(editorialUk[source], `missing Ukrainian copy: ${source}`);
    }
    assert.doesNotMatch(`${copy.description} ${copy.details.join(' ')}`,
      /Свежая вода|Норму кормления|Фасовку выберите/i);
  }
});

test('catalog schema migrates existing availability constraint for pending supplier stock', () => {
  const schema = readFileSync(new URL('../server/schema.sql', import.meta.url), 'utf8');
  assert.match(schema, /DROP CONSTRAINT IF EXISTS catalog_variants_availability_check/);
  assert.match(schema, /ADD CONSTRAINT catalog_variants_availability_check\s+CHECK \(availability IN \('on_hand', 'source_on_demand', 'pending', 'unavailable'\)\)/);
});

test('catalog import keeps variant identity and source prices separate from purchase prices', () => {
  const rows = catalogRows();
  assert.ok(rows.length > 500);
  assert.equal(new Set(rows.map(row => row.variant.id)).size, rows.length);
  assert.ok(rows.some(row => row.variant.id === 'rc-sterilised-2000g'));
  assert.ok(rows.every(row => row.variant.sourcePriceCents === null || row.variant.sourcePriceCents > 0));
  assert.ok(rows.every(row => !Number.isFinite(row.variant.source.purchasePrice) ||
    Math.round(row.variant.source.purchasePrice * 100) !== row.variant.sourcePriceCents));
  assert.ok(rows.every(row => !retiredProductIds.has(row.product.id)));
});
test('confirmed-demand formats use exact SKUs and local studio images', () => {
  const rows = catalogRows();
  for (const [id, ean, image] of [
    ['royal-canin-chihuahua-adult-3kg', '3182550747820', 'royal-canin-chihuahua-adult-3kg.webp'],
    ['royal-canin-gastrointestinal-kitten-dry-2kg', '3182550906258', 'royal-canin-gastrointestinal-kitten-2kg.webp'],
    ['acana-grass-fed-lamb-11-4kg', '064992570125', 'acana-grass-fed-lamb-11-4kg.webp']
  ]) {
    const row = rows.find(item => item.variant.id === id);
    assert.ok(row, id);
    assert.equal(row.variant.source.ean, ean);
    assert.ok((row.variant.imagePath || row.product.imagePath).endsWith(image));
    assert.equal(row.variant.source.purchasePrice, undefined);
  }
});
test('full catalog import archives retired rows once and preserves edited products', async () => {
  const queries = [];
  const db = { connect: async () => ({
    query: async (sql, params) => { queries.push([sql, params]); return { rows: [] }; },
    release() {}
  }) };
  await importCatalog(db);
  assert.ok(queries.every(([sql]) => !sql.startsWith('DELETE FROM catalog_')));
  assert.ok(queries.filter(([sql]) => sql.startsWith('INSERT INTO catalog_products'))
    .every(([sql]) => sql.includes('ON CONFLICT(id) DO NOTHING')));
  assert.ok(queries.filter(([sql]) => sql.startsWith('INSERT INTO catalog_variants'))
    .every(([sql]) => sql.includes('ON CONFLICT(id) DO NOTHING')));
  const imported = queries.filter(([sql]) => sql.startsWith('INSERT INTO catalog_variants'));
  for (const [brand, expected] of [['Heybo Pet','preorder'],['Advance','unavailable'],
    ['Hill’s','unavailable']]) {
    const example = catalogRows().find(row => row.product.brand === brand);
    assert.ok(example, `${brand} is present in the catalog`);
    assert.equal(imported.find(([, params]) => params?.[0] === example.variant.id)?.[1][9], expected);
  }
  assert.ok(queries.some(([sql]) => sql.includes("initial_brand_sale_status_2026_11_06")));
  const yaguRetailBackfill = queries.find(([sql, params]) =>
    sql.startsWith('UPDATE catalog_variants SET source_price_cents=$2') && params?.[0] === 'yagu-1128036');
  assert.equal(yaguRetailBackfill?.[1][1], 3826);
  assert.match(yaguRetailBackfill?.[0] || '', /source_price_cents IS NULL AND price_override_cents IS NULL/);
  assert.match(yaguRetailBackfill?.[0] || '', /price_confirmed=false/);
  const retired = queries.find(([sql, params]) => sql.startsWith('UPDATE catalog_products SET active=false') &&
    params?.[0]?.includes('kong-scrunchie'));
  assert.ok(retired[1][0].includes('kong-scrunchie') && retired[1][0].includes('trixie-balcony-chair'));
  assert.equal(queries.at(-1)[0], 'COMMIT');
});

test('public catalog keeps the sale status separate from payment readiness', async () => {
  let query, parameters;
  const db = { async query(sql, params) {
    if (sql.includes('FROM supplier_catalog_matches')) return { rows: [] };
    query = sql; parameters = params;
    return { rows: [{ variant_id:'cmd-sku-new',product_id:'cmd-new',name:'Новый товар',
      source_price_cents:null,price_override_cents:1299,price_confirmed:true,
      source_orderable:true,availability:'source_on_demand',sale_status:'available',stock_quantity:null }] };
  } };
  const rows = await catalogSnapshot(db);
  assert.match(query, /p\.active=true AND v\.active=true/);
  assert.doesNotMatch(query, /p\.id = ANY/);
  assert.equal(parameters, undefined);
  assert.equal(rows[0].sale_price_cents, 1299);
  assert.equal(rows[0].sale_status, 'available');
  assert.equal(rows[0].orderable, true);
  assert.equal(rows[0].sourcing_availability, 'unavailable');
});

test('supplier availability is calculated for every active catalog SKU', async () => {
    const db = { async query(sql) {
      if (sql.includes('FROM supplier_catalog_matches')) return { rows: [
        { variant_id:'selected',source_count:1,selected_units:2 },
        { variant_id:'supplier',source_count:1,selected_units:0 }
      ] };
      return { rows: ['selected','supplier','unlinked'].map(variant_id => ({
        variant_id,product_id:variant_id,name:variant_id,
        source_price_cents:null,price_override_cents:null,price_confirmed:false,
        source_orderable:false,availability:variant_id === 'unlinked' ? 'pending' : 'source_on_demand',stock_quantity:null
      })) };
    } };
    const rows = await catalogSnapshot(db);
    assert.deepEqual(rows.map(row => row.sourcing_availability),
      ['source_on_demand','source_on_demand','unavailable']);
    assert.deepEqual(rows.map(row => row.selected_supplier_units), [2,0,0]);
    assert.ok(rows.every(row => row.orderable === false));
});

test('a selected basket remains source on demand until physical receipt', async () => {
  const oldOrders = process.env.ORDERS_ENABLED;
  const oldPayments = process.env.PAYMENTS_ENABLED;
  const db = { async query(sql) {
    if (sql.includes('FROM supplier_catalog_matches')) return { rows: [
      { variant_id: 'selected', source_count: 1, selected_units: 12 }
    ] };
    return { rows: [{ variant_id: 'selected', product_id: 'food', name: 'Корм',
      source_price_cents: 2000, price_override_cents: null, price_confirmed: true,
      source_orderable: true, availability: 'source_on_demand', stock_quantity: 0 }] };
  } };
  try {
    delete process.env.ORDERS_ENABLED;
    delete process.env.PAYMENTS_ENABLED;
    const preview = (await catalogSnapshot(db))[0];
    assert.equal(preview.sourcing_availability, 'source_on_demand');
    assert.equal(preview.orderable, true);
    process.env.ORDERS_ENABLED = 'true';
    process.env.PAYMENTS_ENABLED = 'true';
    const live = (await catalogSnapshot(db))[0];
    assert.equal(live.sourcing_availability, 'source_on_demand');
  } finally {
    if (oldOrders === undefined) delete process.env.ORDERS_ENABLED;
    else process.env.ORDERS_ENABLED = oldOrders;
    if (oldPayments === undefined) delete process.env.PAYMENTS_ENABLED;
    else process.env.PAYMENTS_ENABLED = oldPayments;
  }
});

const variant = { variant_id:'rc-sterilised-2kg', product_id:'rc-sterilised', name:'Royal Canin Sterilised 37',
  label:'2 кг', source_price_cents:2909, price_override_cents:null, price_confirmed:true,
  source_orderable:true, availability:'on_hand', stock_quantity:2 };
const lines = [{ productId:'rc-sterilised', variantId:'rc-sterilised-2kg', qty:2, price:1 }];

test('server ignores browser price and totals exact variant, discount and delivery in cents', () => {
  const quote = priceQuote(lines, [variant], { code:'WELCOME10',percent_off:10,free_delivery:false });
  assert.equal(quote.subtotalCents, 5818);
  assert.equal(quote.discountCents, 582);
  assert.equal(quote.deliveryCents, 0);
  assert.equal(quote.totalCents, 5236);
  assert.equal(quote.items[0].unitPriceCents, 2909);
  assert.equal(quote.orderable, true);
});

test('sale status controls checkout while physical stock remains separate', () => {
  const available = priceQuote([{ ...lines[0], qty: 3 }],
    [{ ...variant, sale_status:'available', stock_quantity: 0, supplier_matched:false }]);
  assert.equal(available.orderable, true);
  assert.equal(available.items[0].sourceMode, 'open_order');
  const preorder = priceQuote(lines,
    [{ ...variant, sale_status:'preorder', availability:'unavailable', stock_quantity: 0 }]);
  assert.equal(preorder.orderable, true);
  assert.equal(preorder.items[0].sourceMode, 'source_on_demand');
  assert.equal(priceQuote(lines, [{ ...variant, sale_status:'unavailable' }]).orderable, false);
  assert.equal(priceQuote(lines, [{ ...variant, sale_status:'available', price_confirmed:false }]).orderable, false);
});

test('server blocks unconfirmed, unavailable and overdrawn variants', () => {
  assert.equal(priceQuote(lines, [{ ...variant, price_confirmed:false }]).orderable, false);
  assert.equal(priceQuote(lines, [{ ...variant, availability:'unavailable' }]).orderable, false);
  assert.equal(priceQuote(lines, [{ ...variant, supplier_matched:false }]).orderable, false);
  assert.equal(priceQuote(lines, [{ ...variant, sourcing_availability:'unavailable' }]).orderable, false);
  assert.equal(priceQuote(lines, [{ ...variant, stock_quantity:1 }]).orderable, false);
  assert.throws(() => priceQuote([{ ...lines[0], variantId:'other' }], [variant]));
});

test('public quote never uses a draft sale price before confirmation', () => {
  const quote = priceQuote([{ ...lines[0], qty: 1 }], [
    { ...variant, price_confirmed: false, price_override_cents: 9900 }
  ]);
  assert.equal(quote.items[0].unitPriceCents, 2909);
  assert.equal(quote.orderable, false);
});

test('basic address fields and desired delivery time are checked before geocoding', () => {
  const address = { city:'València', postcode:'46001', street:'Carrer de la Pau', building:'12' };
  assert.equal(validateAddress(address), null);
  assert.ok(validateAddress({ ...address, city:'' }));
  assert.ok(validateAddress({ ...address, postcode:'28001' }));
  const future = new Date('2026-10-19T08:00:00Z');
  assert.equal(validateDelivery({ mode:'scheduled', date:'2026-10-20', time:'18:00' }, future), null);
  assert.ok(validateDelivery({ mode:'scheduled', date:'2026-10-20', time:'99:00' }, future));
  assert.equal(priceQuote([{ ...lines[0], qty:1 }], [variant]).addressVerification, 'manual_required');
  assert.equal(validateDelivery({ mode:'slot', date:'2026-10-20', window:'14-18' }, future), null);
  assert.ok(validateDelivery({ mode:'slot', date:'2026-10-19', window:'10-14' }, future));
  assert.equal(validateDelivery({ mode:'preorder' }, future), null);
});

test('password hashes are salted and session cookies remain HttpOnly', async () => {
  const one = await hashPassword('long example password');
  const two = await hashPassword('long example password');
  assert.notEqual(one, two);
  assert.equal(await verifyPassword('long example password', one), true);
  assert.equal(await verifyPassword('wrong password', one), false);
  assert.match(sessionCookie('abc', true), /HttpOnly; SameSite=Lax/);
  assert.match(sessionCookie('abc', true), /Secure/);
});

test('only confirmed server prices replace storefront retail estimates', () => {
  const products = [{ id:'food',variants:[{ id:'food-1',price:9.9,priceStatus:'retail' },
    { id:'food-2',price:6.5,priceStatus:'retail' }] }];
  const changed = applyServerPrices(products, [
    { variant_id:'food-1',product_id:'food',price_confirmed:true,priceCents:1199,
      source_orderable:true,availability:'on_hand',stock_quantity:2 },
    { variant_id:'food-2',product_id:'food',price_confirmed:false,priceCents:100,
      source_orderable:true,availability:'on_hand',stock_quantity:0 }
  ]);
  assert.equal(changed, 1);
  assert.equal(products[0].variants[0].price, 11.99);
  assert.equal(products[0].variants[0].serverPriceConfirmed, true);
  assert.equal(products[0].variants[1].price, 6.5);
});

test('database catalog controls published products and keeps reference prices separate from confirmed sale prices', () => {
  const products = [{ id:'old',name:'Old',catalogHidden:false },
    { id:'gift',name:'Gift',gift:'personal' },
    { id:'food',name:'Before',variants:[{ id:'food-1',label:'old',price:9.9 }] }];
  const catalogProducts = [...products];
  assert.equal(applyServerCatalog(products, catalogProducts, [
    { variant_id:'food-1',product_id:'food',name:'After',brand:'Royal Canin',category:'Корм',
      pet:'cat',image_path:'https://img.catmandog.es/assets/food.webp',description:'Описание',
      details:['Состав'],food_type:'dry',variant_image_path:'https://img.catmandog.es/assets/food-2kg.webp',
      variant_description:'Описание фасовки',variant_details:['2 кг'],
      label:'2 кг',price_confirmed:false,priceCents:null,referencePriceCents:2999,
      availability:'source_on_demand',stock_quantity:null },
    { variant_id:'new-1',product_id:'new',name:'New',brand:'CatManDog',category:'Лакомства',
      pet:'dog',image_path:'https://img.catmandog.es/assets/new.webp',description:'Новый товар',
      details:[],food_type:null,label:'1 шт',price_confirmed:true,priceCents:1299,
      availability:'source_on_demand',stock_quantity:null,display_priority:10 }
  ]), true);
  assert.deepEqual(products.map(product => product.id), ['gift','food','new']);
  assert.deepEqual(catalogProducts.map(product => product.id), ['new','gift','food']);
  assert.equal(products[1].name, 'After');
  assert.equal(products[1].variants[0].label, '2 кг');
  assert.equal(products[1].variants[0].description, 'Описание фасовки');
  assert.equal(products[1].variants[0].image.src, 'https://img.catmandog.es/assets/food-2kg.webp');
  assert.equal(products[1].variants[0].priceStatus, 'temporary');
  assert.equal(products[1].variants[0].price, 29.99);
  assert.equal(products[1].variants[0].serverPriceConfirmed, false);
  assert.equal(products[2].variants[0].price, 12.99);
});

test('database image conversion keeps studio presentation only for the same asset', () => {
  const products = [{ id: 'food', image: {
    src: 'https://img.catmandog.es/assets/food/editorial/food-v1.png', presentation: 'editorial'
  }, variants: [{ id: 'food-small', image: {
    src: 'https://img.catmandog.es/assets/food/editorial/food-small-v1.png', presentation: 'editorial'
  } }, { id: 'food-large', image: {
    src: 'https://img.catmandog.es/assets/food/editorial/food-large-v1.png', presentation: 'editorial'
  } }] }];
  const catalogProducts = [...products];
  const base = { product_id: 'food', name: 'Food', brand: 'Brand', category: 'Корм', pet: 'cat',
    image_path: 'https://img.catmandog.es/assets/food/editorial/food-v1.webp',
    price_confirmed: false, referencePriceCents: 649, availability: 'pending' };
  applyServerCatalog(products, catalogProducts, [
    { ...base, variant_id: 'food-small', label: '400 г',
      variant_image_path: 'https://img.catmandog.es/assets/food/editorial/food-small-v1.webp' },
    { ...base, variant_id: 'food-large', label: '2 кг',
      variant_image_path: 'https://img.catmandog.es/assets/food/replacement-large.webp' }
  ]);
  assert.equal(products[0].image.presentation, 'editorial');
  assert.equal(products[0].variants[0].image.presentation, 'editorial');
  assert.equal(products[0].variants[0].image.src,
    'https://img.catmandog.es/assets/food/editorial/food-small-v1.webp');
  assert.equal(products[0].variants[1].image.presentation, undefined);
});

test('database image conversion recognizes newly published studio assets', () => {
  const products = [{ id: 'churu', variants: [{ id: 'churu-box' }] }];
  const catalogProducts = [...products];
  applyServerCatalog(products, catalogProducts, [{
    product_id: 'churu', variant_id: 'churu-box', name: 'Churu', brand: 'Churu',
    category: 'Лакомства', pet: 'cat', label: '20 тюбиков',
    image_path: 'https://img.catmandog.es/assets/launch-studio-2026-11-04/churu-salmon-pollo-20x14g.webp',
    variant_image_path: 'https://img.catmandog.es/assets/launch-studio-2026-11-04/churu-salmon-pollo-20x14g.webp',
    price_confirmed: true, priceCents: 1449, availability: 'source_on_demand'
  }]);
  assert.equal(products[0].image.presentation, 'editorial');
  assert.equal(products[0].variants[0].image.presentation, 'editorial');
});

test('storefront disables cart actions for reserved stock and supplier-disabled variants', () => {
  const products = [];
  const catalogProducts = [];
  applyServerCatalog(products, catalogProducts, [
    { variant_id:'reserved',product_id:'food',name:'Food',brand:'Brand',category:'Корм',pet:'cat',
      label:'1 кг',price_confirmed:true,priceCents:1299,source_orderable:true,
      availability:'on_hand',sourcingAvailability:'on_hand',availableForCart:false },
    { variant_id:'disabled',product_id:'treat',name:'Treat',brand:'Brand',category:'Лакомства',pet:'cat',
      label:'1 шт',price_confirmed:true,priceCents:299,source_orderable:false,
      availability:'source_on_demand',availableForCart:false }
  ]);
  assert.equal(canBuy(products[0].variants[0]), false);
  assert.equal(canBuy(products[1].variants[0]), false);
});

test('explicit sale status overrides stock and sourcing but keeps the retail price requirement', () => {
  const products = [];
  const catalogProducts = [];
  applyServerCatalog(products, catalogProducts, [
    { variant_id:'open',product_id:'food',name:'Food',brand:'Brand',category:'Корм',pet:'cat',
      label:'1 кг',price_confirmed:true,priceCents:1299,source_orderable:false,
      availability:'unavailable',sourcingAvailability:'unavailable',availableForCart:true,
      saleStatus:'available' },
    { variant_id:'closed',product_id:'treat',name:'Treat',brand:'Brand',category:'Лакомства',pet:'cat',
      label:'1 шт',price_confirmed:true,priceCents:299,source_orderable:true,
      availability:'on_hand',sourcingAvailability:'on_hand',availableForCart:false,
      saleStatus:'unavailable' }
  ]);
  assert.equal(canBuy(products[0].variants[0]), true);
  assert.equal(canBuy(products[1].variants[0]), false);
  assert.equal(catalogPrice(products[1]).amount, 2.99);
});

test('selected supplier preview remains addable while unsourced SKU is blocked', () => {
  const products = [];
  const catalogProducts = [];
  applyServerCatalog(products, catalogProducts, [
    { variant_id:'selected',product_id:'food',name:'Food',brand:'Brand',category:'Корм',pet:'cat',
      label:'1 кг',price_confirmed:false,referencePriceCents:1299,source_orderable:true,
      availability:'source_on_demand',sourcingAvailability:'on_hand',availableForCart:true },
    { variant_id:'unsourced',product_id:'other',name:'Other',brand:'Brand',category:'Корм',pet:'cat',
      label:'1 кг',price_confirmed:false,referencePriceCents:1299,source_orderable:true,
      availability:'source_on_demand',sourcingAvailability:'unavailable',availableForCart:false }
  ]);
  assert.equal(canBuy(products[0].variants[0]), true);
  assert.equal(canBuy(products[1].variants[0]), false);
});

test('unauthorized admin request returns 403 without an unhandled rejection', async () => {
  const req = { method:'GET', headers:{}, socket:{remoteAddress:'127.0.0.1'} };
  let status, body;
  const res = { writeHead(code) { status = code; }, end(value) { body = JSON.parse(value); } };
  await handleApi({}, req, res, '/api/admin/orders');
  assert.equal(status, 403);
  assert.equal(body.error, 'Доступ закрыт');
});

test('checkout stays closed without Stripe keys even if both order flags are enabled', async () => {
  const previousOrders = process.env.ORDERS_ENABLED;
  const previousPayments = process.env.PAYMENTS_ENABLED;
  const previousStripeKey = process.env.STRIPE_SECRET_KEY;
  const previousWebhookKey = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.ORDERS_ENABLED = 'true';
  process.env.PAYMENTS_ENABLED = 'true';
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  try {
    const db = { async query() { throw new Error('Database should not be used for checkout'); } };
    const config = { status: null, body: null };
    const res = { writeHead(status) { config.status = status; }, end(body) { config.body = JSON.parse(body); } };
    await handleApi(db, { method: 'GET', headers: {}, socket: { remoteAddress: 'test-payment-gate' } },
      res, '/api/config');
    assert.equal(config.body.ordersEnabled, false);
    assert.equal(config.body.paymentsEnabled, false);
    const order = { status: null, body: null };
    const orderRes = { writeHead(status) { order.status = status; }, end(body) { order.body = JSON.parse(body); } };
    await handleApi(db, { method: 'POST', headers: {}, socket: { remoteAddress: 'test-payment-gate' },
      async *[Symbol.asyncIterator]() { yield '{}'; } }, orderRes, '/api/checkout/start');
    assert.equal(order.status, 503);
  } finally {
    if (previousOrders === undefined) delete process.env.ORDERS_ENABLED;
    else process.env.ORDERS_ENABLED = previousOrders;
    if (previousPayments === undefined) delete process.env.PAYMENTS_ENABLED;
    else process.env.PAYMENTS_ENABLED = previousPayments;
    if (previousStripeKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previousStripeKey;
    if (previousWebhookKey === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previousWebhookKey;
  }
});
