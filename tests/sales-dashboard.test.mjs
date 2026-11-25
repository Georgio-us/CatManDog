import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSalesDashboard } from '../server/sales-dashboard.js';

test('dashboard combines four paid purchases and subtracts packaging and gifts once', () => {
  const orders = [{ id: 'anton', number: 'CMD-10004', customer_name: 'Антон',
    payment_status: 'paid', status: 'received', is_test: false,
    total_cents: 3735, merchandiseGrossCents: 3336, delivery_cents: 399,
    purchaseTotalCents: 2819,
    packagingCostCents: 198, giftCostCents: 148, stripe_fee_cents: 115,
    items: [] },
  { id: 'test', is_test: true, payment_status: 'paid', status: 'received',
    total_cents: 99999, items: [] }];
  const external = [
    { id: 'neighbor', paymentStatus: 'paid', grossCents: 2800,
      productCostCents: 2279, giftCostCents: 46,
      giftDescription: 'Отдельный тюбик Churu', packagingCostCents: 198,
      marginCents: 277, customerNote: 'Соседка', items: [] },
    { id: 'uniko', paymentStatus: 'paid', grossCents: 1100,
      productCostCents: 568, giftCostCents: 46,
      giftDescription: 'Отдельный тюбик Churu', packagingCostCents: 142,
      marginCents: 344, customerNote: 'Лолита', items: [] },
    { id: 'duvo', paymentStatus: 'paid', grossCents: 1500,
      productCostCents: 938, giftCostCents: 0, packagingCostCents: 137,
      marginCents: 425, customerNote: 'Славик', extraReceivedCents: 15,
      paymentChannel: 'uah_card_transfer', items: [] }
  ];
  const result = buildSalesDashboard(orders, external,
    { site_count: 1, external_count: 3, site_gross_cents: 3735,
      external_gross_cents: 5400 });
  assert.equal(result.totals.purchases, 4);
  assert.equal(result.totals.receivedCents, 9135);
  assert.equal(result.totals.calculatedSpreadCents, 1616);
  assert.equal(result.totals.cashResultCents, 1501);
  assert.equal(result.totals.deliveryRevenueCents, 399);
  assert.equal(result.totals.fulfillmentToConfirm, 1);
  assert.equal(result.totals.unknownBuyerPurchases, 1);
  assert.equal(result.sales.length, 4);
  assert.deepEqual(result.sales.filter(sale => ['neighbor','uniko'].includes(sale.id))
    .map(sale => sale.giftItems[0].name),
  ['Отдельный тюбик Churu','Отдельный тюбик Churu']);
});

test('dashboard does not invent an aggregate margin when costs or sales are missing', () => {
  const result = buildSalesDashboard([{
    id: 'paid', payment_status: 'paid', status: 'delivered', is_test: false,
    total_cents: 1000, merchandiseGrossCents: 1000,
    purchaseTotalCents: null, items: []
  }], [], { site_count: 1, external_count: 0,
    site_gross_cents: 1000, external_gross_cents: 0 });
  assert.equal(result.totals.calculatedSpreadCents, null);
});
