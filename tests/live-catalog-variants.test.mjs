import test from 'node:test';
import assert from 'node:assert/strict';
import { applyServerCatalog } from '../server-prices.js';
import { orderedVariants } from '../product-content.js';
import { normalizeCart, cartSku, storefrontPrice, canBuy } from '../variants.js';
import { accessoryDetail } from '../accessory-ui.js';
import { availabilityRequestPage } from '../availability-request-ui.js';

test('server catalog gives newly imported food a sorted selector and exact basket price', () => {
  const products = [];
  const visible = [];
  const variants = [
    ['food-large', '10 кг', '10', 5990],
    ['food-small', '300 г', '0.3', 495],
    ['food-middle', '1,8 кг', '1.8', 2070]
  ].map(([variant_id, label, package_weight_kg, priceCents]) => ({
    product_id: 'food', variant_id, name: 'Корм с птицей', brand: 'Brand',
    category: 'Корм', pet: 'cat', food_type: 'dry', label, package_weight_kg,
    description: 'Описание этого корма', details: ['С птицей'],
    variant_description: 'Описание этого корма', variant_details: ['С птицей'],
    availability: 'source_on_demand', sale_status: 'available',
    source_orderable: true, availableForCart: true, price_accepted: true, priceCents
  }));
  assert.equal(applyServerCatalog(products, visible, variants), true);
  assert.deepEqual(orderedVariants(products[0]).map(item => item.label),
    ['300 г', '1,8 кг', '10 кг']);
  assert.equal(products[0].defaultVariantId, 'food-small');
  const cart = normalizeCart([{ productId: 'food', variantId: 'food-small', qty: 1 }], products);
  const sku = cartSku(cart[0], products);
  assert.equal(storefrontPrice(sku), 4.95);
  assert.equal(canBuy(sku), true);
});

test('server-unavailable legacy single SKU opens a request instead of a purchase', () => {
  const legacy = { id:'birthday-bandana', name:'Бандана Birthday Star', price:8.9,
    priceStatus:'confirmed', image:37, sizes:['XS','S'], category:'Аксессуары' };
  const products = [legacy];
  const visible = [legacy];
  applyServerCatalog(products, visible, [{
    product_id:'birthday-bandana', variant_id:'birthday-bandana',
    name:legacy.name, category:legacy.category, pet:'cat', label:'1 шт',
    image_path:null, description:'Праздничная бандана',
    details:[], availability:'source_on_demand', saleStatus:'unavailable',
    source_orderable:true, availableForCart:false, price_confirmed:false,
    price_accepted:false, referencePriceCents:890
  }]);
  assert.equal(products[0].isReal, true);
  assert.equal(products[0].image, 37);
  assert.equal(canBuy(products[0]), false);
  const html = accessoryDetail(products[0], { crumbs:()=>'', imageBlock:()=>'',
    escape:value=>value, icon:()=>'', favorites:[], goodTogether:()=>'',
    money:value=>`${value} €`, language:'ru' });
  assert.match(html, /data-request-availability="birthday-bandana"/);
  assert.doesNotMatch(html, /data-buy=/);
  const request = availabilityRequestPage(products[0], products[0], {
    escape:value=>value, icon:()=>'', language:'ru'
  });
  assert.match(request, /role="dialog" aria-modal="true"/);
  assert.match(request, /name="email"/);
  assert.match(request, /name="phone"/);
  assert.match(request, /<select name="size" required>/);
  assert.match(request, /<option value="XS"/);
  assert.match(request, /<option value="S"/);
});
