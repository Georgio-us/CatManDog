import { products } from '../data.js';
import { snapshots } from '../variants.js';

// Research is part of the versioned catalog. Older database rows can predate
// that research, while owner edits in the database always take precedence.
const researched = new Map(products.flatMap(product => snapshots(product)
  .map(variant => [variant.id, variant])));
const cents = value => Number.isFinite(value) ? Math.round(value * 100) : null;

export function salePriceDecision(row) {
  const priceCents = row.price_override_cents ?? row.source_price_cents;
  if (!Number.isInteger(priceCents) || priceCents <= 0)
    return { priceCents: null, accepted: false, basis: 'missing', review: 'Нет розничной цены' };
  if (row.price_confirmed === true)
    return { priceCents, accepted: true, basis: 'owner', review: null };
  if (row.price_override_cents !== null && row.price_override_cents !== undefined)
    return { priceCents: row.source_price_cents ?? null, accepted: false,
      basis: 'unapproved_override', review: 'Изменение цены не утверждено' };

  const source = researched.get(row.variant_id) || row.price_source || row.source || {};
  const retail = source.retailPrice;
  const basis = source.pricingBasis;
  if (basis?.kind === 'supplier_quote_candidate')
    return { priceCents, accepted: false, basis: basis.kind,
      review: 'Соответствие модели в предложении поставщика не подтверждено' };
  if (basis?.checkedAt && cents(basis.amount) === priceCents) {
    if (basis.kind === 'exact_retail' && basis.offers?.some(offer => offer.url))
      return { priceCents, accepted: true, basis: 'exact_retail', review: null };
    if (basis.kind === 'analogue_median' && basis.sampleSize >= 2 && basis.exampleUrl)
      return { priceCents, accepted: true, basis: 'calculated_analogue',
        review: 'Цена рассчитана по аналогам; проверить при следующем обновлении' };
    if (basis.kind === 'analogue_single' && basis.exampleUrl)
      return { priceCents, accepted: true, basis: 'calculated_analogue',
        review: 'Цена рассчитана по одному аналогу; проверить при следующем обновлении' };
    if (basis.kind === 'scaled_pack' && basis.sourceUrl && basis.sourcePackGrams > 0)
      return { priceCents, accepted: true, basis: 'calculated_pack',
        review: 'Цена рассчитана по другой фасовке; проверить при следующем обновлении' };
  }
  if (retail?.sourceUrl && retail.checkedAt && cents(retail.amount) === priceCents &&
      (!basis || basis.kind === 'exact_retail'))
    return { priceCents, accepted: true, basis: 'exact_retail', review: null };
  return { priceCents, accepted: false, basis: basis?.kind || 'unsupported',
    review: basis?.kind === 'supplier_quote_candidate'
      ? 'Соответствие модели в предложении поставщика не подтверждено'
      : 'Нет проверяемого основания для розничной цены' };
}
