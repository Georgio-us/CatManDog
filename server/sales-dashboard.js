import { loadAdminOrders } from './order-operations.js';
import { listExternalSales } from './external-sales.js';
import { syncMissingStripeFees } from './stripe-fees.js';

const money = value => Number(value || 0);

export function buildSalesDashboard(orders, externalSales, totals, personalExpenses = []) {
  const site = orders.filter(order => !order.is_test && order.payment_status === 'paid' &&
    order.status !== 'cancelled');
  const outside = externalSales.filter(sale => sale.paymentStatus === 'paid');
  const sales = [
    ...site.map(order => ({
      kind: 'site', id: order.id, reference: order.number,
      customer: order.customer_name || 'Покупатель не указан',
      date: order.paid_at || order.created_at, grossCents: money(order.total_cents),
      merchandiseCents: money(order.merchandiseGrossCents),
      discountCents: money(order.discount_cents),
      deliveryRevenueCents: money(order.delivery_cents),
      stripeFeeCents: Number.isInteger(order.stripe_fee_cents) ? order.stripe_fee_cents : null,
      productCostCents: order.purchaseTotalCents,
      packagingCostCents: money(order.packagingCostCents),
      giftCostCents: money(order.giftCostCents),
      deliveryCostCents: money(order.deliveryCostCents),
      otherCostCents: money(order.otherCostCents),
      cashExpenses: order.cashExpenses || [],
      spreadCents: order.purchaseTotalCents === null ? null :
        money(order.total_cents) - money(order.purchaseTotalCents) -
        money(order.packagingCostCents) - money(order.giftCostCents) -
        money(order.deliveryCostCents) - money(order.otherCostCents),
      status: order.status, paymentChannel: 'Stripe',
      packagingItems: order.packagingItems || [], giftItems: order.giftItems || [],
      items: (order.items || []).map(item => ({ name: item.name,
        variant: item.variantLabel, quantity: item.qty,
        unitPriceCents: item.unitPriceCents, imagePath: item.imagePath || '' }))
    })),
    ...outside.map(sale => ({
      kind: 'external', id: sale.id, reference: sale.reference,
      customer: sale.customerNote || 'Покупатель не указан', date: sale.saleDate,
      grossCents: money(sale.grossCents),
      merchandiseCents: money(sale.grossCents) - money(sale.extraReceivedCents),
      discountCents: 0, deliveryRevenueCents: 0,
      stripeFeeCents: 0,
      extraReceivedCents: money(sale.extraReceivedCents),
      productCostCents: money(sale.productCostCents),
      packagingCostCents: money(sale.packagingCostCents),
      giftCostCents: money(sale.giftCostCents),
      deliveryCostCents: money(sale.deliveryCostCents),
      otherCostCents: money(sale.otherCostCents),
      cashExpenses: sale.cashExpenses || [],
      spreadCents: money(sale.marginCents), status: 'handed_over',
      paymentChannel: sale.paymentChannel,
      dateBasis: sale.dateBasis || 'sale',
      packagingItems: sale.packagingItems || [],
      giftItems: sale.giftCostCents ? [{ name: 'Подарок к покупке', quantity: 1 }] : [],
      items: (sale.items || []).map(item => ({ name: item.name, variant: '',
        quantity: item.quantity, unitPriceCents: item.unitPriceCents,
        imagePath: item.imagePath || '' }))
    }))
  ].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const expectedCount = money(totals.site_count) + money(totals.external_count);
  const costCoverageComplete = sales.length === expectedCount &&
    sales.every(sale => sale.spreadCents !== null);
  const feeCoverageComplete = costCoverageComplete &&
    sales.every(sale => sale.stripeFeeCents !== null);
  return {
    totals: {
      purchases: expectedCount,
      sitePurchases: money(totals.site_count),
      externalPurchases: money(totals.external_count),
      receivedCents: money(totals.site_gross_cents) + money(totals.external_gross_cents),
      deliveryRevenueCents: costCoverageComplete ? sales.reduce((sum, sale) =>
        sum + sale.deliveryRevenueCents, 0) : null,
      discountCents: costCoverageComplete ? sales.reduce((sum, sale) =>
        sum + sale.discountCents, 0) : null,
      productCostCents: costCoverageComplete ? sales.reduce((sum, sale) =>
        sum + sale.productCostCents, 0) : null,
      packagingCostCents: costCoverageComplete ? sales.reduce((sum, sale) =>
        sum + sale.packagingCostCents, 0) : null,
      giftCostCents: costCoverageComplete ? sales.reduce((sum, sale) =>
        sum + sale.giftCostCents, 0) : null,
      deliveryCostCents: costCoverageComplete ? sales.reduce((sum, sale) =>
        sum + sale.deliveryCostCents, 0) : null,
      otherCostCents: costCoverageComplete ? sales.reduce((sum, sale) =>
        sum + sale.otherCostCents, 0) : null,
      stripeFeeCents: feeCoverageComplete ? sales.reduce((sum, sale) =>
        sum + sale.stripeFeeCents, 0) : null,
      merchandiseCents: costCoverageComplete ? sales.reduce((sum, sale) =>
        sum + sale.merchandiseCents, 0) : null,
      calculatedSpreadCents: costCoverageComplete ? sales.reduce((sum, sale) =>
        sum + sale.spreadCents, 0) : null,
      cashResultCents: feeCoverageComplete ? sales.reduce((sum, sale) =>
        sum + sale.spreadCents - sale.stripeFeeCents, 0) : null,
      fulfillmentToConfirm: site.filter(order =>
        ['received', 'packing', 'delivering'].includes(order.status)).length,
      knownBuyers: new Set(sales.map(sale => sale.customer)
        .filter(name => !['Покупатель не указан','Соседка'].includes(name))).size,
      unknownBuyerPurchases: sales.filter(sale =>
        ['Покупатель не указан','Соседка'].includes(sale.customer)).length,
      missingPaymentChannel: outside.filter(sale =>
        sale.paymentChannel === 'not_recorded').length,
      externalDocumentsPending: outside.filter(sale =>
        sale.documentationStatus === 'pending').length,
      personalExpenseCents: personalExpenses.reduce((sum, item) =>
        sum + money(item.total_cost_cents), 0)
    }, sales, personalExpenses: personalExpenses.map(item => ({
      name: item.item_name, quantity: item.quantity,
      costCents: item.total_cost_cents, date: item.expense_date
    }))
  };
}

export async function loadSalesDashboard(db) {
  await syncMissingStripeFees(db);
  const [orders, externalSales, totals, personal] = await Promise.all([
    loadAdminOrders(db), listExternalSales(db),
    db.query(`SELECT
      (SELECT count(*)::integer FROM orders WHERE is_test=false AND
        payment_status='paid' AND status!='cancelled') AS site_count,
      (SELECT coalesce(sum(total_cents),0)::bigint FROM orders WHERE is_test=false AND
        payment_status='paid' AND status!='cancelled') AS site_gross_cents,
      (SELECT count(*)::integer FROM external_sales WHERE payment_status='paid') AS external_count,
      (SELECT coalesce(sum(gross_cents),0)::bigint FROM external_sales
        WHERE payment_status='paid') AS external_gross_cents`),
    db.query(`SELECT item_name,quantity,total_cost_cents,expense_date
      FROM owner_expenses WHERE category='personal'
      ORDER BY expense_date DESC,created_at DESC`)
  ]);
  return buildSalesDashboard(orders, externalSales, totals.rows[0], personal.rows);
}
