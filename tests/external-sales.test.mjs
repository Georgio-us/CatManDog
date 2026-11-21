import test from 'node:test';
import assert from 'node:assert/strict';
import { listExternalSales } from '../server/external-sales.js';

test('external sale keeps card payment, product costs and linked stock movements together', async () => {
  const common = {
    id: 'sale-1', reference: 'neighbor-pouches-2026-11-21', sale_date: '2026-11-21',
    customer_note: 'Соседка', payment_channel: 'privatbank_ua', payment_status: 'paid',
    paid_on: '2026-11-21', gross_cents: 2800, product_cost_cents: 2279,
    gift_cost_cents: 46, documentation_status: 'pending', note: '', created_at: '2026-11-21'
  };
  const db = { query: async () => ({ rows: [
    { ...common, variant_id: 'royalcanin-93e8aeca-85g', quantity: 10,
      unit_price_cents: 149, item_cost_cents: 1253, stock_movement_id: 'movement-1',
      product_name: 'Royal Canin Kitten' },
    { ...common, variant_id: 'leonardo-wet-pure-chicken-85g', quantity: 10,
      unit_price_cents: 131, item_cost_cents: 1026, stock_movement_id: 'movement-2',
      product_name: 'Leonardo Pure Chicken' }
  ] }) };
  const [sale] = await listExternalSales(db);
  assert.equal(sale.paymentStatus, 'paid');
  assert.equal(sale.paymentChannel, 'privatbank_ua');
  assert.equal(sale.grossCents, 2800);
  assert.equal(sale.marginCents, 475);
  assert.equal(sale.documentationStatus, 'pending');
  assert.deepEqual(sale.items.map(item => item.stockMovementId), ['movement-1', 'movement-2']);
});
