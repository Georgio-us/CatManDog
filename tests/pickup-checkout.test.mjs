import test from 'node:test';
import assert from 'node:assert/strict';
import { priceQuote } from '../server/pricing.js';
import { pickupBasketPage } from '../pickup-flow.js';
import { createStripeCheckout } from '../server/stripe.js';

const product = { id:'litter', name:'Arena Uniko', variants:[{ id:'litter-6l', label:'6 l',
  price:10.99, pickupAvailable:true, saleStatus:'available' }] };
const cart = [{ productId:'litter', variantId:'litter-6l', size:'6 l', qty:2 }];
const render = language => pickupBasketPage({cart,products:[product],language,
  money:value => `${value.toFixed(2)} €`,escape:value => String(value),icon:name => `<svg data-icon="${name}"></svg>`,
  promo:{percent:10} });

test('express pickup asks only for contact and shows zero pickup fee in three languages', () => {
  for (const [language,title,free] of [
    ['es','Cesta para recogida','Gratis'],['ru','Корзина самовывоза','Бесплатно'],
    ['uk','Кошик самовивозу','Безкоштовно']]) {
    const html = render(language);
    assert.match(html,new RegExp(title));
    assert.match(html,new RegExp(free));
    assert.match(html,/name="phone"/);
    assert.match(html,/name="email"/);
    assert.doesNotMatch(html,/name="street"|name="postcode"|name="deliveryDate"/);
    assert.match(html,/19\.78 €/);
  }
});

test('pickup quote can sell only enough on-hand units and charges no shipping', () => {
  const variant = { variant_id:'litter-6l',product_id:'litter',name:'Arena Uniko',label:'6 l',
    sale_status:'available',availability:'on_hand',stock_quantity:2,reserved_quantity:0,
    committed_quantity:0,price_accepted:true,sale_price_cents:1099 };
  const ready = priceQuote([{productId:'litter',variantId:'litter-6l',qty:2}],[variant],
    {percent_off:10,free_delivery:true,code:'TEST'},0);
  assert.equal(ready.items[0].sourceMode,'on_hand');
  assert.equal(ready.deliveryCents,0);
  assert.equal(ready.totalCents,1978);
  const unavailable = priceQuote([{productId:'litter',variantId:'litter-6l',qty:2}],
    [{...variant,reserved_quantity:1}],null,0);
  assert.equal(unavailable.items[0].sourceMode,'open_order');
});

test('Stripe redirects pickup to its own confirmation and basket', async () => {
  const names = ['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','PUBLIC_BASE_URL'];
  const old = Object.fromEntries(names.map(name => [name,process.env[name]]));
  Object.assign(process.env,{STRIPE_SECRET_KEY:'sk_test_example',STRIPE_WEBHOOK_SECRET:'whsec_example',
    PUBLIC_BASE_URL:'https://catmandog.es'});
  try {
    let params;
    await createStripeCheckout({id:'pickup-test',number:'CMD-1',email:'buyer@example.com',
      subtotal_cents:1099,discount_cents:0,delivery_cents:0,delivery_mode:'pickup',
      total_cents:1099,items:[{name:'Arena Uniko',variantLabel:'6 l',qty:1,lineCents:1099}]},'es',
    async (_url,options) => { params = new URLSearchParams(options.body);
      return {ok:true,async json(){return {id:'cs_test_123',url:'https://checkout.stripe.com/c/pay/cs_test_123',
        amount_total:1099,currency:'eur'};}}; });
    assert.match(params.get('success_url'),/#\/pickup-confirmation\?session_id=\{CHECKOUT_SESSION_ID\}/);
    assert.match(params.get('cancel_url'),/#\/pickup-cart\?payment=cancelled/);
    assert.equal(params.has('line_items[1][price_data][unit_amount]'),false);
  } finally {
    for (const name of names) {
      if (old[name] === undefined) delete process.env[name]; else process.env[name]=old[name];
    }
  }
});
