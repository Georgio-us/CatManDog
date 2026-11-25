import test from 'node:test';
import assert from 'node:assert/strict';
import { stripePaymentFee, stripeSessionIntent } from '../server/stripe-fees.js';

test('Stripe fee is read from the matching charge balance transaction', async () => {
  const previous = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = 'sk_test_example';
  const paths = [];
  const fetcher = async url => {
    paths.push(url);
    const object = url.includes('/payment_intents/')
      ? { id: 'pi_123', status: 'succeeded', currency: 'eur', amount_received: 3735,
        latest_charge: 'ch_123' }
      : url.includes('/charges/')
        ? { id: 'ch_123', payment_intent: 'pi_123', paid: true,
          currency: 'eur', amount_captured: 3735, balance_transaction: 'txn_123' }
        : { id: 'txn_123', source: 'ch_123', currency: 'eur', amount: 3735,
          fee: 105, net: 3630 };
    return { ok: true, json: async () => object };
  };
  try {
    assert.deepEqual(await stripePaymentFee('pi_123', 3735, fetcher),
      { feeCents: 105, transactionId: 'txn_123' });
    assert.equal(paths.length, 3);
    assert.equal(await stripePaymentFee('pi_123', 4000, fetcher), null);
  } finally {
    if (previous === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previous;
  }
});

test('older paid Checkout Session supplies a missing payment intent safely', async () => {
  const previous = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = 'sk_test_example';
  const fetcher = async () => ({ ok: true, json: async () => ({
    id: 'cs_test_123', payment_status: 'paid', currency: 'eur',
    amount_total: 3735, payment_intent: 'pi_123'
  }) });
  try {
    assert.equal(await stripeSessionIntent('cs_test_123', 3735, fetcher), 'pi_123');
    assert.equal(await stripeSessionIntent('cs_test_123', 4000, fetcher), null);
  } finally {
    if (previous === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previous;
  }
});
