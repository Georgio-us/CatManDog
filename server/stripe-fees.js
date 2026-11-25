const idPattern = /^(pi|ch|txn)_[A-Za-z0-9]+$/;

async function stripeObject(path, fetcher) {
  const response = await fetcher(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Stripe fee lookup returned ${response.status}`);
  return response.json();
}

export async function stripePaymentFee(intentId, expectedAmountCents, fetcher = fetch) {
  if (!/^((sk|rk)_(live|test)_)/.test(process.env.STRIPE_SECRET_KEY || '') ||
      !idPattern.test(intentId || '') || !intentId.startsWith('pi_')) return null;
  const intent = await stripeObject(`payment_intents/${intentId}`, fetcher);
  if (intent.id !== intentId || intent.status !== 'succeeded' || intent.currency !== 'eur' ||
      Number(intent.amount_received) !== Number(expectedAmountCents) ||
      typeof intent.latest_charge !== 'string' || !idPattern.test(intent.latest_charge))
    return null;
  const charge = await stripeObject(`charges/${intent.latest_charge}`, fetcher);
  if (charge.id !== intent.latest_charge || charge.payment_intent !== intentId ||
      charge.paid !== true || charge.currency !== 'eur' ||
      Number(charge.amount_captured) !== Number(expectedAmountCents) ||
      typeof charge.balance_transaction !== 'string' ||
      !idPattern.test(charge.balance_transaction)) return null;
  const balance = await stripeObject(`balance_transactions/${charge.balance_transaction}`, fetcher);
  if (balance.id !== charge.balance_transaction || balance.source !== charge.id ||
      balance.currency !== 'eur' || !Number.isInteger(balance.fee) || balance.fee < 0 ||
      Number(balance.amount) !== Number(expectedAmountCents) ||
      Number(balance.net) !== Number(balance.amount) - balance.fee) return null;
  return { feeCents: balance.fee, transactionId: balance.id };
}

export async function stripeSessionIntent(sessionId, expectedAmountCents, fetcher = fetch) {
  if (!/^((sk|rk)_(live|test)_)/.test(process.env.STRIPE_SECRET_KEY || '') ||
      !/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId || '')) return null;
  const session = await stripeObject(`checkout/sessions/${sessionId}`, fetcher);
  if (session.id !== sessionId || session.payment_status !== 'paid' ||
      session.currency !== 'eur' || Number(session.amount_total) !==
      Number(expectedAmountCents) || typeof session.payment_intent !== 'string' ||
      !session.payment_intent.startsWith('pi_') ||
      !idPattern.test(session.payment_intent)) return null;
  return session.payment_intent;
}

export async function syncMissingStripeFees(db, fetcher = fetch) {
  if (!/^((sk|rk)_(live|test)_)/.test(process.env.STRIPE_SECRET_KEY || '')) return;
  const { rows } = await db.query(`SELECT id,total_cents,stripe_payment_intent_id,
    stripe_checkout_session_id
    FROM orders WHERE is_test=false AND payment_status='paid' AND status!='cancelled'
      AND stripe_fee_cents IS NULL AND
      (stripe_payment_intent_id IS NOT NULL OR stripe_checkout_session_id IS NOT NULL)
    ORDER BY created_at DESC LIMIT 10`);
  for (const order of rows) {
    try {
      const intentId = order.stripe_payment_intent_id ||
        await stripeSessionIntent(order.stripe_checkout_session_id, order.total_cents, fetcher);
      if (!intentId) continue;
      const fee = await stripePaymentFee(intentId,
        order.total_cents, fetcher);
      if (!fee) continue;
      await db.query(`UPDATE orders SET stripe_fee_cents=$2,stripe_fee_transaction_id=$3,
        stripe_fee_checked_at=now(),stripe_payment_intent_id=coalesce(stripe_payment_intent_id,$4)
        WHERE id=$1 AND stripe_fee_cents IS NULL`,
      [order.id, fee.feeCents, fee.transactionId, intentId]);
    } catch (error) {
      console.warn(`Stripe fee not yet available for ${order.id}: ${error.message}`);
    }
  }
}
