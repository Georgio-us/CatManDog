import { retailObservations } from './retail-observations.js';
import { isDemoPrice } from './variants.js';

const retailerTaxPolicies = {
  kiwoko: 'https://www.kiwoko.com/condiciones-de-uso.html',
  tiendanimal: 'https://www.tiendanimal.es/condiciones-marketplace.html',
  miscota: 'https://www.miscota.es/condiciones-de-contratacion',
  zooplus: 'https://support.zooplus.es/es/support/solutions/articles/76000047878-precios-y-gastos-de-env%C3%ADo',
};

export function retailResearch(sku) {
  if (!sku || isDemoPrice(sku)) return null;
  const byRetailer = new Map((retailObservations[sku.id] || []).map(offer => [offer.retailer.toLocaleLowerCase(), offer]));
  for (const offer of sku.retailOffers || []) byRetailer.set(offer.retailer.toLocaleLowerCase(), offer);
  const offers = [...byRetailer.values()];
  const selected = sku.retailPrice;
  if (Number.isFinite(selected?.amount) && selected.amount > 0 && selected.sourceName && selected.sourceUrl &&
      !offers.some(offer => offer.retailer.toLocaleLowerCase() === selected.sourceName.toLocaleLowerCase())) {
    const taxPolicyUrl = retailerTaxPolicies[selected.sourceName.toLocaleLowerCase()];
    offers.push({ retailer: selected.sourceName, amount: selected.amount, url: selected.sourceUrl,
      checkedAt: selected.checkedAt, taxIncluded: selected.taxIncluded ?? (taxPolicyUrl ? true : null),
      taxPolicyUrl: selected.taxIncluded == null ? taxPolicyUrl : undefined,
      shippingIncluded: selected.shippingIncluded, availability: selected.availability });
  }
  if (!offers.length) return null;
  offers.sort((a, b) => a.amount - b.amount || a.retailer.localeCompare(b.retailer));
  return { offers, min: offers[0].amount, max: offers.at(-1).amount };
}

export function productRetailResearch(product) {
  const variants = product?.variants?.length ? product.variants : [product];
  const researched = variants.map(retailResearch).filter(Boolean);
  if (!researched.length) return null;
  return {
    min: Math.min(...researched.map(item => item.min)),
    max: Math.max(...researched.map(item => item.max)),
    pricedVariants: researched.length,
    variantCount: variants.length,
  };
}

export function productDisplayedPriceSummary(product) {
  const variants = product?.variants?.length ? product.variants : [product];
  const values = variants.flatMap(variant => {
    const retail = retailResearch(variant);
    if (retail) return [retail.min, retail.max];
    return Number.isFinite(variant?.pricingBasis?.amount) ? [variant.pricingBasis.amount] : [];
  });
  if (!values.length) return null;
  return {
    min: Math.min(...values), max: Math.max(...values),
    pricedVariants: variants.filter(variant => retailResearch(variant) || variant.pricingBasis).length,
    estimatedVariants: variants.filter(variant => variant.pricingBasis?.kind !== 'exact_retail' && variant.pricingBasis).length,
    variantCount: variants.length,
  };
}

export function retailRangeText(research, money) {
  return research.min === research.max ? money(research.min) : `${money(research.min)} - ${money(research.max)}`;
}

export function retailResearchBlock(sku, { escape, money }) {
  const research = retailResearch(sku);
  if (!research) return '';
  const recommended = sku.retailPrice?.type === 'recommended' && research.offers.length === 1 && research.offers[0].retailer === sku.retailPrice.sourceName;
  const taxNote = research.offers.every(offer => offer.taxIncluded === true) ? 'Цены с IVA' : 'Цены из розничных источников';
  const deliveryNote = research.offers.every(offer => offer.shippingIncluded === false) ? 'доставка отдельно' : 'условия доставки зависят от магазина';
  const title = recommended ? 'PVP производителя' : 'Цены в изученных магазинах';
  const note = recommended ? `${sku.retailPrice.taxIncluded === true ? 'PVP производителя с IVA' : 'PVP производителя, НДС уточняется'} · Цена конкурентов пока не изучена` : `${taxNote}, ${deliveryNote} · Для сравнения с ценой товара выше`;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const sourceLink = offer => offer.url.startsWith('research/supplier-files/') && !local
    ? `<span>${escape(offer.retailer)}</span>`
    : `<a class="text-link" href="${escape(offer.url)}" target="_blank" rel="noopener noreferrer">${escape(offer.retailer)}</a>`;
  return `<section class="retail-research" aria-label="${title}"><h2>${title}</h2><p class="retail-research-range">${retailRangeText(research, money)}</p><p class="retail-research-note">${note}</p><ul>${research.offers.map(offer => `<li>${sourceLink(offer)}<span>${money(offer.amount)}</span>${offer.availability === 'out_of_stock' ? '<small>Нет в наличии на момент проверки</small>' : ''}${offer.checkedAt ? `<small>Проверено ${escape(offer.checkedAt.slice(0, 10))}</small>` : ''}</li>`).join('')}</ul></section>`;
}

export function provisionalPriceLabel(sku) {
  const kind = sku?.pricingBasis?.kind;
  if (kind === 'supplier_quote_candidate') return 'Расчётная цена с IVA';
  if (kind === 'scaled_pack') return 'Расчётный ориентир с IVA';
  if (kind?.startsWith('analogue_')) return 'Ориентир по аналогу с IVA';
  return null;
}

export function provisionalPriceBlock(sku, { escape, money }) {
  const basis = sku?.pricingBasis;
  if (!basis || basis.kind === 'exact_retail') return '';
  if (basis.kind === 'supplier_quote_candidate') {
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    const source = local ? `<a class="text-link" href="${escape(encodeURI(basis.sourceFile))}" target="_blank" rel="noopener noreferrer">Котировка Heybo Pet от 14 октября 2026</a>` : 'Котировка Heybo Pet от 14 октября 2026';
    return `<section class="retail-research" aria-label="Расчёт цены"><h2>Расчёт цены</h2><p class="retail-research-range">${money(basis.amount)}</p><p class="retail-research-note">Котировка поставщика ${money(basis.quoteUnitEUR)} за штуку при заказе от ${basis.minimumOrderUnits} шт × ${basis.multiplier} - цена для покупателя с IVA</p><p>Розничная цена конкурентов пока не найдена</p><p>${escape(basis.note)} - ${escape(basis.supplierModel)} / ${escape(basis.catalogModel)}</p><p>${source}</p></section>`;
  }
  if (basis.kind === 'scaled_pack') {
    return `<section class="retail-research" aria-label="Расчёт розничного ориентира"><h2>Расчётный розничный ориентир</h2><p class="retail-research-range">${money(basis.amount)}</p><p class="retail-research-note">Цена ${basis.sourcePackGrams} г - ${money(basis.sourceAmountEUR)}, расчёт для ${basis.catalogPackGrams} г с коэффициентом ${String(basis.multiplier).replace('.', ',')} - с IVA</p><p>${escape(basis.note)}</p><p><a class="text-link" href="${escape(basis.sourceUrl)}" target="_blank" rel="noopener noreferrer">Источник - ${escape(basis.sourceRetailer)}</a></p></section>`;
  }
  return `<section class="retail-research" aria-label="Розничный ориентир по аналогам"><h2>Ориентир по аналогам</h2><p class="retail-research-range">${money(basis.amount)}</p><p class="retail-research-note">${basis.sampleSize > 1 ? `Медиана ${basis.sampleSize} сопоставимых предложений` : 'Цена сопоставимого товара'} - ориентир с IVA для расчёта, розничная цена этого варианта пока не подтверждена</p>${basis.analogueMinEUR != null ? `<p>Диапазон аналогов - ${money(basis.analogueMinEUR)} - ${money(basis.analogueMaxEUR)}</p>` : ''}<p>${escape(basis.group)} - ${escape(basis.note)}</p><p><a class="text-link" href="${escape(basis.exampleUrl)}" target="_blank" rel="noopener noreferrer">Пример - ${escape(basis.exampleRetailer)}, ${money(basis.examplePriceEUR)}</a></p></section>`;
}
