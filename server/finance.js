const requiredSellerFields = ['legal_name', 'tax_id', 'street_address', 'postal_code', 'city'];

export function financePreview(order, items, profile = {}) {
  const subtotal = items.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0);
  if (!items.length || order.discount_cents > subtotal || subtotal !== order.subtotal_cents ||
    subtotal - order.discount_cents + order.delivery_cents !== order.total_cents)
    throw new Error('Суммы заказа не совпадают с сохранёнными позициями');
  let allocatedDiscount = 0;
  const lines = items.map((item, index) => {
    const beforeDiscountCents = item.unit_price_cents * item.quantity;
    const discountCents = index === items.length - 1 ? order.discount_cents - allocatedDiscount :
      Math.min(order.discount_cents - allocatedDiscount,
        Math.round(order.discount_cents * beforeDiscountCents / (subtotal || 1)));
    allocatedDiscount += discountCents;
    const grossCents = beforeDiscountCents - discountCents;
    const rate = item.tax_rate_bps;
    const netCents = rate === null || rate === undefined ? null :
      Math.round(grossCents * 10000 / (10000 + rate));
    return { variantId: item.variant_id, name: item.name, variantLabel: item.variant_label,
      quantity: item.quantity, unitPriceCents: item.unit_price_cents,
      beforeDiscountCents, discountCents, grossCents, taxRateBps: rate,
      netCents, taxCents: netCents === null ? null : grossCents - netCents };
  });
  const deliveryRate = order.delivery_tax_rate_bps;
  const deliveryNet = !order.delivery_cents ? 0 : deliveryRate === null || deliveryRate === undefined ? null :
    Math.round(order.delivery_cents * 10000 / (10000 + deliveryRate));
  const missingSellerFields = requiredSellerFields.filter(field => !String(profile[field] || '').trim());
  const missingTaxVariants = lines.filter(line => line.taxCents === null).map(line => line.variantId);
  const missingDeliveryTax = order.delivery_cents > 0 && deliveryNet === null;
  const taxComplete = !missingTaxVariants.length && !missingDeliveryTax;
  return { orderNumber: order.number, paymentStatus: order.payment_status,
    subtotalCents: order.subtotal_cents, discountCents: order.discount_cents,
    deliveryCents: order.delivery_cents, totalCents: order.total_cents,
    lines, delivery: { grossCents: order.delivery_cents, taxRateBps: deliveryRate,
      netCents: deliveryNet, taxCents: deliveryNet === null ? null : order.delivery_cents - deliveryNet },
    netTotalCents: taxComplete ? lines.reduce((sum, line) => sum + line.netCents, deliveryNet) : null,
    taxTotalCents: taxComplete ? lines.reduce((sum, line) => sum + line.taxCents,
      order.delivery_cents - deliveryNet) : null,
    missingSellerFields, missingTaxVariants, missingDeliveryTax,
    taxComplete, documentIssuanceEnabled: false };
}
