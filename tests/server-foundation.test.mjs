import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogRows } from '../server/catalog.js';
import { priceQuote, validateAddress, validateDelivery } from '../server/pricing.js';
import { hashPassword, verifyPassword, sessionCookie } from '../server/auth.js';
import { applyServerPrices } from '../server-prices.js';

test('catalog import keeps variant identity and source prices separate from purchase prices', () => {
  const rows = catalogRows();
  assert.ok(rows.length > 500);
  assert.equal(new Set(rows.map(row => row.variant.id)).size, rows.length);
  assert.ok(rows.some(row => row.variant.id === 'rc-sterilised-2000g'));
  assert.ok(rows.every(row => row.variant.sourcePriceCents === null || row.variant.sourcePriceCents > 0));
  assert.ok(rows.every(row => row.variant.source.purchasePrice === null || row.variant.source.purchasePrice === undefined));
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

test('server blocks unconfirmed, unavailable and overdrawn variants', () => {
  assert.equal(priceQuote(lines, [{ ...variant, price_confirmed:false }]).orderable, false);
  assert.equal(priceQuote(lines, [{ ...variant, availability:'unavailable' }]).orderable, false);
  assert.equal(priceQuote(lines, [{ ...variant, stock_quantity:1 }]).orderable, false);
  assert.throws(() => priceQuote([{ ...lines[0], variantId:'other' }], [variant]));
});

test('address and desired delivery time remain marked for manual verification', () => {
  const address = { city:'València', postcode:'46001', street:'Carrer de la Pau', building:'12' };
  assert.equal(validateAddress(address), null);
  assert.ok(validateAddress({ ...address, city:'Paterna' }));
  assert.ok(validateAddress({ ...address, postcode:'28001' }));
  const future = new Date('2026-10-19T08:00:00Z');
  assert.equal(validateDelivery({ mode:'scheduled', date:'2026-10-20', time:'18:00' }, future), null);
  assert.ok(validateDelivery({ mode:'scheduled', date:'2026-10-20', time:'99:00' }, future));
  assert.equal(priceQuote([{ ...lines[0], qty:1 }], [variant]).addressVerification, 'manual_required');
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
