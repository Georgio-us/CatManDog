import { hasSupplierTerms, supplierTermsDetail } from './supplier-terms.js';
import { hasVariants, resolveVariant, storefrontPrice, isDemoPrice, canBuy } from './variants.js';
import { retailResearch, retailResearchBlock, provisionalPriceBlock, provisionalPriceLabel } from './retail-research.js?v=es-locale-4';

const availabilityCopy = {
  ru: {
    pending: ['Наличие уточняется', 'Наличие и цену этой фасовки уточняем. Пока её нельзя оформить.'],
    on_hand: ['В наличии', 'Товар есть у нас. При оформлении можно будет выбрать удобный интервал доставки по Валенсии. Точное время мы подтвердим после заказа.'],
    source_on_demand: ['Под заказ', 'Эту фасовку закажем у поставщика. Срок доставки уточним до оплаты.'],
    unavailable: ['Нет в наличии', 'Эту фасовку сейчас заказать нельзя. Выберите другой вес.'],
    add: 'Добавить в корзину', order: 'Заказать с доставкой'
  },
  es: {
    pending: ['Disponibilidad pendiente', 'Estamos comprobando la disponibilidad y el precio de este formato. Todavía no se puede pedir.'],
    on_hand: ['Disponible', 'Tenemos este formato. Al realizar el pedido podrás indicar la franja de entrega que prefieras en València. Confirmaremos la hora después.'],
    source_on_demand: ['Por encargo', 'Pediremos este formato al proveedor. Confirmaremos el plazo de entrega antes del pago.'],
    unavailable: ['Agotado', 'Este formato no se puede pedir ahora. Elige otro peso.'],
    add: 'Añadir a la cesta', order: 'Pedir con entrega'
  }
};

function customerAvailability(variant) {
  const raw = variant.serverAvailabilityStatus || variant.availabilityStatus;
  if (raw === 'unavailable' || ['out-of-stock', 'outOfStock', 'discontinued'].includes(raw)) return 'unavailable';
  if (variant.serverPriceConfirmed === false) return 'pending';
  if (raw === 'on_hand') return variant.serverAvailableForCart === false ? 'unavailable' : 'on_hand';
  if (raw === 'source_on_demand' && variant.serverSourceOrderable !== false) return 'source_on_demand';
  return 'pending';
}

export function accessoryDetail(product, helpers) {
  const { crumbs, imageBlock, escape, icon, favorites, goodTogether, money, variantId, quantity = 1, language = 'ru' } = helpers;
  const p = resolveVariant(product, variantId);
  if (!p) return '';
  const price = storefrontPrice(p);
  const specialAvailability = product.id === 'rc-sterilised';
  const t = availabilityCopy[language === 'es' ? 'es' : 'ru'];
  const state = customerAvailability(p);
  const allowed = canBuy(p) && p.serverPriceConfirmed !== false && state !== 'pending' && state !== 'unavailable';
  const demo = isDemoPrice(p) || (specialAvailability && p.serverPriceConfirmed === false);
  const research = retailResearch(p);
  const displayPrice = demo ? money(7.77) : money(price);
  const variants = hasVariants(product) && product.variants.length > 1;
  const sku = p.manufacturerSku || p.model || (hasSupplierTerms(product) ? null : p.supplier?.sku);
  const label = product.optionLabel || p.optionLabel || 'Вариант';
  const source = (title,name,url) => url?.startsWith('research/supplier-files/') && !['localhost','127.0.0.1','[::1]'].includes(location.hostname) ? `<p>${escape(title)} - ${escape(name || '')}</p>` : url ? `<p><a class="text-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(title)} - ${escape(name || '')}</a></p>` : '';
  const sourcingReview = hasSupplierTerms(product);
  const availability = { pending:'Наличие уточняется', on_hand:'На складе', source_on_demand:'Под заказ', available:'Наличие указано в каталоге источника', 'in-stock':'Наличие указано в каталоге источника', unavailable:'Этот вариант сейчас недоступен', 'out-of-stock':'Этот вариант сейчас недоступен', outOfStock:'Этот вариант сейчас недоступен', discontinued:'Этот вариант снят с продажи' }[p.availabilityStatus] || 'Наличие уточняется';
  const optionMarkup = specialAvailability && variants
    ? product.variants.map(v => {
      const optionState = customerAvailability(v);
      return `<button type="button" class="size availability-option ${v.id===p.id?'active':''} ${optionState==='unavailable'?'availability-option-unavailable':''}" data-variant="${escape(v.id)}" aria-pressed="${v.id===p.id}"><strong>${escape(v.label)}</strong><small>${escape(t[optionState][0])}</small></button>`;
    }).join('')
    : variants ? product.variants.map(v=>`<button class="size ${v.id===p.id?'active':''}" data-variant="${escape(v.id)}" aria-pressed="${v.id===p.id}">${escape(v.label)}</button>`).join('')
      : (p.sizes || []).map(s=>`<span class="size active">${escape(s)}</span>`).join('');
  const selectedAvailability = specialAvailability
    ? `<div class="availability-selected availability-selected-${state}" role="status"><strong>${escape(t[state][0])}</strong><p>${escape(t[state][1])}</p></div>` : '';
  const buyable = specialAvailability ? allowed : canBuy(p);
  const action = specialAvailability ? (state === 'on_hand' ? t.add : state === 'source_on_demand' ? t.order : t[state][0]) : (buyable ? 'Добавить в корзину' : 'Вариант недоступен');
  return `<div class="page">${crumbs(product.name)}<div class="detail-grid">${imageBlock(p.image,'detail-image')}<div class="detail-copy"><span class="eyebrow">${escape(p.line || p.brand || '')}</span><h1>${escape(p.name || product.name)}</h1>${variants?`<p class="variant-current">${escape(label)}: ${escape(p.label)}</p>`:''}<span class="detail-price-label">${variants?'Цена выбранного варианта':'Цена товара'}</span><div class="detail-price">${displayPrice}</div><p class="retail-note">${demo?'Демонстрационная цена':p.serverPriceConfirmed?'Цена с IVA':research?(p.retailPrice?.type==='recommended'?'Рекомендованная розничная цена':'Розничный ориентир'):provisionalPriceLabel(p)|| (p.retailPrice?.type==='recommended'?'Рекомендованная розничная цена':'Временная розничная цена')}${!research&&!demo&&p.packageWeightKg?` · ${money(price/p.packageWeightKg)} / кг`:''}${specialAvailability?'':`<br>${escape(availability)}`}</p><p>${escape(p.description || '')}</p><span class="size-label">${escape(label)}</span><div class="size-options variant-options ${specialAvailability?'availability-options':''}" aria-label="${escape(label)}">${optionMarkup}</div>${selectedAvailability}<div class="buy-row">${buyable?`<div class="quantity"><button data-detail-qty="-1" aria-label="Уменьшить количество">${icon('minus')}</button><span id="detail-qty">${quantity}</span><button data-detail-qty="1" aria-label="Увеличить количество">${icon('plus')}</button></div>`:''}<button class="button" ${buyable?`data-buy="${escape(product.id)}"`:'disabled'}>${escape(action)} ${buyable?icon(state === 'source_on_demand' && specialAvailability ? 'arrow' : 'bag'):''}</button><button class="icon-button favorite-detail ${favorites.includes(product.id)?'selected':''}" data-favorite="${escape(product.id)}" aria-label="В избранное" aria-pressed="${favorites.includes(product.id)}">${icon('heart')}</button></div>${retailResearchBlock(p,{escape,money})}${provisionalPriceBlock(p,{escape,money})}<details open><summary>${p.category==='Корм'?'О корме':'О товаре'}</summary><ul>${(p.details || []).map(d=>`<li>${escape(d)}</li>`).join('')}</ul></details><details open><summary>Информация о товаре</summary><p>Бренд: ${escape(p.brand || '')}${sku?`<br>Артикул: ${escape(sku)}`:''}${!sourcingReview&&p.supplier?.sku&&p.supplier.sku!==sku?`<br>Артикул поставщика: ${escape(p.supplier.sku)}`:''}${p.ean?`<br>EAN: ${escape(p.ean)}`:''}${p.weight?`<br>Упаковка: ${escape(p.weight)}`:''}<br>${escape(availability)}</p>${sourcingReview?'':source('Карточка поставщика',p.supplier?.name,p.supplier?.url)+(p.productSource?.url===p.supplier?.url?'':source(['supplier','retailer'].includes(p.productSource?.kind)?'Источник товара':'Описание производителя',p.productSource?.name,p.productSource?.url))+source(p.image?.generated?'Исходное фото':'Источник фото',p.imageSource?.name,p.imageSource?.pageUrl)}${research||p.pricingBasis?'':source(demo?'Источник информации о цене':p.retailPrice?.type==='recommended'?'Рекомендованная розничная цена':'Розничный ориентир',p.retailPrice?.sourceName,p.retailPrice?.sourceUrl)}</details>${supplierTermsDetail(product,p,{escape,money})}</div></div></div>${goodTogether(product)}`;
}
