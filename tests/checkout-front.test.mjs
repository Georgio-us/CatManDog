import test from 'node:test';
import assert from 'node:assert/strict';

import { checkoutTotals, deliveryTiming, validateCheckout } from '../checkout-model.js';
import { createCheckoutUI } from '../checkout-ui.js';

test('delivery fee follows the discounted total and free delivery coupon', () => {
  assert.equal(checkoutTotals([{ price: 48.99, qty: 1 }]).delivery, 3.99);
  assert.equal(checkoutTotals([{ price: 49, qty: 1 }]).delivery, 0);
  assert.equal(checkoutTotals([{ price: 50, qty: 1 }], { code: 'WELCOME10', percent: 10 }).total, 48.99);
  assert.equal(checkoutTotals([{ price: 10, qty: 1 }], { freeShipping: true }).delivery, 0);
  assert.deepEqual(checkoutTotals([{ price: 36.31, qty: 2 }]).total, 72.62);
});

test('Valencia delivery timing has a two-hour lead and crosses midnight', () => {
  const afternoon = deliveryTiming(new Date('2026-10-19T13:00:00Z'));
  assert.deepEqual(afternoon, { today: '2026-10-19', date: '2026-10-19', time: '17:00', todayAvailable: true });
  const late = deliveryTiming(new Date('2026-10-19T21:30:00Z'));
  assert.deepEqual(late, { today: '2026-10-19', date: '2026-10-20', time: '02:00', todayAvailable: false });
});

test('checkout requires a complete city address and a future requested time', () => {
  const now = new Date('2026-10-19T13:00:00Z');
  const valid = { name: 'Антон', email: 'anton@example.com', phone: '+34 600 000 000',
    city: 'València', postcode: '46001', street: 'Carrer de la Pau', building: '12', deliveryMode: 'soon' };
  assert.equal(validateCheckout(valid, now), null);
  assert.match(validateCheckout({ ...valid, postcode: '4600' }, now), /пять|пяти/);
  assert.match(validateCheckout({ ...valid, city: 'Paterna' }, now), /Валенсия/);
  assert.match(validateCheckout({ ...valid, deliveryMode: 'scheduled', deliveryDate: '2026-10-19', deliveryTime: '16:00' }, now), /не раньше/);
  assert.equal(validateCheckout({ ...valid, deliveryMode: 'scheduled', deliveryDate: '2026-10-19', deliveryTime: '18:00' }, now), null);
});

test('checkout presents exact variant, shipping and explicit demo state', () => {
  const ui = createCheckoutUI({ escape: String, icon: () => '', money: value => `${value.toFixed(2)} €`,
    imageBlock: () => '', getItems: () => [{ productId: 'rc-sterilised', variantId: 'rc-sterilised-4000g', name: 'Royal Canin Sterilised 37', variant: '4 кг', qty: 2, price: 36.31 }],
    isReady: () => true, getPromo: () => null, applyPromo: () => {}, render: () => {} });
  const html = ui.page();
  assert.match(html, /4 кг · 2 шт × 36\.31 €/);
  assert.match(html, /72\.62 €/);
  assert.match(html, /Бесплатно/);
  assert.match(html, /заказ не будет создан или оплачен/);
  assert.match(ui.servicePage('return'), /не отправляется и не сохраняется/);
});
