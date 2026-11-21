import test from 'node:test';
import assert from 'node:assert/strict';
import { priceQuote } from '../server/pricing.js';
import { pickupBasketPage, pickupCheckoutPage } from '../pickup-flow.js';
import { createStripeCheckout } from '../server/stripe.js';
import { accessoryDetail } from '../accessory-ui.js';

const product = { id:'litter', name:'Arena Uniko', variants:[{ id:'litter-6l', label:'6 l',
  price:10.99, pickupAvailable:true, saleStatus:'available' }] };
const cart = [{ productId:'litter', variantId:'litter-6l', size:'6 l', qty:2 }];
const props = language => ({cart,products:[product],language,
  money:value => `${value.toFixed(2)} €`,escape:value => String(value),icon:name => `<svg data-icon="${name}"></svg>`,
  imageBlock:src => `<div class="product-image"><img src="${src || '/test.webp'}"></div>`,
  promo:{percent:10} });

test('pickup reuses the cart cards and checkout sections in three languages', () => {
  for (const [language,title,free] of [
    ['es','Tu cesta','Gratis'],['ru','Ваша корзина','Бесплатно'],
    ['uk','Ваш кошик','Безкоштовно']]) {
    const html = pickupBasketPage(props(language));
    assert.match(html,new RegExp(title));
    assert.match(html,new RegExp(free));
    assert.match(html,/class="rc-flow-basket-item"/);
    assert.match(html,/class="rc-flow-summary"/);
    assert.match(html,/#\/pickup-checkout/);
    assert.match(html,/19\.78 €/);
    const checkout = pickupCheckoutPage(props(language));
    assert.match(checkout,/class="checkout-section"/);
    assert.match(checkout,/name="phone"/);
    assert.match(checkout,/name="email"/);
    assert.doesNotMatch(checkout,/name="street"|name="postcode"|name="deliveryDate"|Stripe/);
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

test('a product opened from pickup keeps pickup actions and marks unavailable variants', () => {
  const detailProduct = {...product,image:'/test.webp',description:'Arena de tofu',details:[],
    variants:[{...product.variants[0],name:'Arena Uniko',image:'/test.webp',sizes:['6 l']},
      {id:'litter-18l',label:'18 l',name:'Arena Uniko',image:'/test.webp',price:19.99,
        pickupAvailable:false,saleStatus:'available',sizes:['18 l']}],defaultVariantId:'litter-6l'};
  const html = accessoryDetail(detailProduct,{crumbs:()=>'',imageBlock:()=>'',escape:String,
    icon:()=>'',favorites:[],goodTogether:()=>'',money:value=>`${value} €`,translate:value=>value,
    variantId:'litter-6l',quantity:1,language:'es',pickupMode:true});
  assert.match(html,/Añadir a la cesta/);
  assert.doesNotMatch(html,/Añadir para recoger/);
  assert.match(html,/No disponible para recoger/);
  assert.doesNotMatch(html,/Entrega en 24-48 horas|Pedir con entrega/);
  for (const [language,label] of [['ru','Добавить в корзину'],['uk','Додати до кошика']]) {
    const localized = accessoryDetail(detailProduct,{crumbs:()=>'',imageBlock:()=>'',escape:String,
      icon:()=>'',favorites:[],goodTogether:()=>'',money:value=>`${value} €`,translate:value=>value,
      variantId:'litter-6l',quantity:1,language,pickupMode:true});
    assert.match(localized,new RegExp(label));
  }
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
