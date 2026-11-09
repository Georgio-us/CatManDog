import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckoutUI } from '../checkout-ui.js';

test('a buyer can skip a saved coupon without removing it from the account', () => {
  const original = globalThis.FormData;
  globalThis.FormData = class {
    constructor(form) { this.values = form.values; }
    entries() { return Object.entries(this.values)[Symbol.iterator](); }
    has(name) { return Object.hasOwn(this.values,name); }
  };
  try {
    const coupon = { code:'CMD10-SAVED', percent:10 };
    const ui = createCheckoutUI({ escape:String, icon:()=>'', money:value=>`${value.toFixed(2)} €`,
      imageBlock:()=>'', getItems:()=>[{ productId:'food', variantId:'food-1',
        name:'Корм', variant:'2 кг', qty:1, price:50 }], isReady:()=>true,
      getPromo:()=>coupon, applyPromo:()=>{}, render:()=>{} });
    assert.match(ui.page(),/Промокод CMD10-SAVED/);
    assert.match(ui.page(),/48\.99 €/);
    const form = { values:{ promoCode:coupon.code } };
    ui.click({ hasAttribute:name=>name==='data-checkout-promo-remove', closest:()=>form });
    assert.doesNotMatch(ui.page(),/Промокод CMD10-SAVED/);
    assert.match(ui.page(),/50\.00 €/);
    assert.equal(coupon.code,'CMD10-SAVED');
  } finally { globalThis.FormData=original; }
});
