import test from 'node:test';
import assert from 'node:assert/strict';
import { productDeliveryKind, cartDeliveryKind, deliveryTiming } from '../delivery-timing.js';
import { deliveryPage } from '../delivery-page.js';

test('HeyboPet stock keeps the normal promise while supplier items do not', () => {
  const product = { id: 'heybopet-hb-pwfs-s30s' };
  assert.equal(productDeliveryKind(product, { serverAvailabilityStatus: 'on_hand' }), 'standard');
  assert.equal(productDeliveryKind(product, { serverAvailabilityStatus: 'source_on_demand' }), 'heybo');
  assert.equal(cartDeliveryKind([{ productId: product.id, fulfillment: 'stock' }]), 'standard');
  assert.equal(cartDeliveryKind([{ productId: product.id, fulfillment: 'supplier' }]), 'heybo');
  assert.equal(cartDeliveryKind([{ productId: product.id, fulfillment: 'stock',
    serverSourcingAvailability: 'source_on_demand' }]), 'heybo');
  assert.equal(cartDeliveryKind([{ productId: product.id, fulfillment: 'supplier' },
    { productId: 'cats-atelier-sh-m-a60-g', fulfillment: 'supplier' }]), 'mixed');
});

test('delivery page explains exceptional lead times in all three languages', () => {
  for (const language of ['ru', 'es', 'uk']) {
    const page = deliveryPage(language);
    assert.match(page, /Cat’s Atelier/);
    assert.match(page, /HeyboPet/);
    assert.match(page, /24-48/);
    assert.match(page, /4-6|4 a 6/);
    assert.doesNotMatch(deliveryTiming('heybo', language), /24-48/);
  }
});
