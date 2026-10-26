import { retailObservations } from './retail-observations.js';
import { isDemoPrice } from './variants.js';
import { locale, translate } from './locale.js';

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
  const spanish = locale() === 'es';
  const recommended = sku.retailPrice?.type === 'recommended' && research.offers.length === 1 && research.offers[0].retailer === sku.retailPrice.sourceName;
  const taxNote = research.offers.every(offer => offer.taxIncluded === true)
    ? (spanish ? 'Precios con IVA' : 'Цены с IVA')
    : (spanish ? 'Precios de otras tiendas' : 'Цены из розничных источников');
  const deliveryNote = research.offers.every(offer => offer.shippingIncluded === false)
    ? (spanish ? 'envío no incluido' : 'доставка отдельно')
    : (spanish ? 'las condiciones de envío dependen de cada tienda' : 'условия доставки зависят от магазина');
  const title = recommended ? (spanish ? 'PVP del fabricante' : 'PVP производителя')
    : (spanish ? 'Precios observados en otras tiendas' : 'Цены в изученных магазинах');
  const note = recommended
    ? (spanish
      ? `${sku.retailPrice.taxIncluded === true ? 'PVP del fabricante con IVA' : 'PVP del fabricante, IVA pendiente de confirmar'} · Todavía no hemos consultado los precios de otras tiendas`
      : `${sku.retailPrice.taxIncluded === true ? 'PVP производителя с IVA' : 'PVP производителя, НДС уточняется'} · Цена конкурентов пока не изучена`)
    : `${taxNote}, ${deliveryNote} · ${spanish ? 'Para comparar con el precio indicado arriba' : 'Для сравнения с ценой товара выше'}`;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const sourceLink = offer => offer.url.startsWith('research/supplier-files/') && !local
    ? `<span>${escape(translate(offer.retailer))}</span>`
    : `<a class="text-link" href="${escape(offer.url)}" target="_blank" rel="noopener noreferrer">${escape(translate(offer.retailer))}</a>`;
  return `<section class="retail-research" aria-label="${title}"><h2>${title}</h2><p class="retail-research-range">${retailRangeText(research, money)}</p><p class="retail-research-note">${note}</p><ul>${research.offers.map(offer => {
    const checked = offer.checkedAt?.slice(0, 10);
    const checkedLabel = checked ? spanish
      ? `Consultado el ${Number(checked.slice(8, 10))}/${Number(checked.slice(5, 7))}/${checked.slice(0, 4)}`
      : `Проверено ${checked}` : '';
    return `<li>${sourceLink(offer)}<span>${money(offer.amount)}</span>${offer.availability === 'out_of_stock' ? `<small>${spanish ? 'Agotado cuando se consultó' : 'Нет в наличии на момент проверки'}</small>` : ''}${checkedLabel ? `<small>${checkedLabel}</small>` : ''}</li>`;
  }).join('')}</ul></section>`;
}

export function provisionalPriceLabel(sku) {
  const kind = sku?.pricingBasis?.kind;
  const spanish = locale() === 'es';
  if (kind === 'supplier_quote_candidate') return spanish ? 'Precio calculado con IVA' : 'Расчётная цена с IVA';
  if (kind === 'scaled_pack') return spanish ? 'Precio orientativo calculado con IVA' : 'Расчётный ориентир с IVA';
  if (kind?.startsWith('analogue_')) return spanish ? 'Precio orientativo de productos similares con IVA' : 'Ориентир по аналогу с IVA';
  return null;
}

export function provisionalPriceBlock(sku, { escape, money }) {
  const basis = sku?.pricingBasis;
  if (!basis || basis.kind === 'exact_retail') return '';
  const spanish = locale() === 'es';
  if (basis.kind === 'supplier_quote_candidate') {
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    const sourceText = spanish ? 'Presupuesto de Heybo Pet del 14 de octubre de 2026' : 'Котировка Heybo Pet от 14 октября 2026';
    const source = local ? `<a class="text-link" href="${escape(encodeURI(basis.sourceFile))}" target="_blank" rel="noopener noreferrer">${sourceText}</a>` : sourceText;
    const quoteNote = spanish
      ? `Presupuesto del proveedor: ${money(basis.quoteUnitEUR)} por unidad, pedido mínimo de ${basis.minimumOrderUnits} uds. × ${basis.multiplier} - precio calculado para el cliente con IVA`
      : `Котировка поставщика ${money(basis.quoteUnitEUR)} за штуку при заказе от ${basis.minimumOrderUnits} шт × ${basis.multiplier} - цена для покупателя с IVA`;
    const heading = spanish ? 'Cálculo del precio' : 'Расчёт цены';
    return `<section class="retail-research" aria-label="${heading}"><h2>${heading}</h2><p class="retail-research-range">${money(basis.amount)}</p><p class="retail-research-note">${quoteNote}</p><p>${spanish ? 'Todavía no hemos encontrado precios de venta comparables' : 'Розничная цена конкурентов пока не найдена'}</p><p>${escape(translate(basis.note))} - ${escape(basis.supplierModel)} / ${escape(basis.catalogModel)}</p><p>${source}</p></section>`;
  }
  if (basis.kind === 'scaled_pack') {
    const heading = spanish ? 'Cálculo del precio orientativo de venta' : 'Расчёт розничного ориентира';
    const note = spanish
      ? `Precio de ${basis.sourcePackGrams} g: ${money(basis.sourceAmountEUR)}; cálculo para ${basis.catalogPackGrams} g con un coeficiente de ${String(basis.multiplier).replace('.', ',')} e IVA incluido`
      : `Цена ${basis.sourcePackGrams} г - ${money(basis.sourceAmountEUR)}, расчёт для ${basis.catalogPackGrams} г с коэффициентом ${String(basis.multiplier).replace('.', ',')} - с IVA`;
    return `<section class="retail-research" aria-label="${heading}"><h2>${spanish ? 'Precio orientativo de venta calculado' : 'Расчётный розничный ориентир'}</h2><p class="retail-research-range">${money(basis.amount)}</p><p class="retail-research-note">${note}</p><p>${escape(translate(basis.note))}</p><p><a class="text-link" href="${escape(basis.sourceUrl)}" target="_blank" rel="noopener noreferrer">${spanish ? 'Fuente' : 'Источник'} - ${escape(basis.sourceRetailer)}</a></p></section>`;
  }
  const heading = spanish ? 'Precio orientativo de productos similares' : 'Розничный ориентир по аналогам';
  const note = spanish
    ? `${basis.sampleSize > 1 ? `Mediana de ${basis.sampleSize} ofertas comparables` : 'Precio de un producto comparable'} - referencia con IVA para el cálculo; el precio de venta de este formato todavía no está confirmado`
    : `${basis.sampleSize > 1 ? `Медиана ${basis.sampleSize} сопоставимых предложений` : 'Цена сопоставимого товара'} - ориентир с IVA для расчёта, розничная цена этого варианта пока не подтверждена`;
  return `<section class="retail-research" aria-label="${heading}"><h2>${spanish ? 'Referencia de productos similares' : 'Ориентир по аналогам'}</h2><p class="retail-research-range">${money(basis.amount)}</p><p class="retail-research-note">${note}</p>${basis.analogueMinEUR != null ? `<p>${spanish ? 'Rango de precios comparables' : 'Диапазон аналогов'} - ${money(basis.analogueMinEUR)} - ${money(basis.analogueMaxEUR)}</p>` : ''}<p>${escape(translate(basis.group))} - ${escape(translate(basis.note))}</p><p><a class="text-link" href="${escape(basis.exampleUrl)}" target="_blank" rel="noopener noreferrer">${spanish ? 'Ejemplo' : 'Пример'} - ${escape(basis.exampleRetailer)}, ${money(basis.examplePriceEUR)}</a></p></section>`;
}
