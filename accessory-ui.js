import { hasVariants, resolveVariant, storefrontPrice, canBuy } from './variants.js?v=sale-price-policy-20261109';
import { customerFacts, orderedVariants } from './product-content.js?v=pack-weight-20261128';
import { catalogEditorialChuruCat } from './catalog-editorial-churu-cat.js';
import { seoWave2Copy, seoWave2VisibleCopy } from './seo-wave2-copy.js?v=seo-wave2-visible-20261125';
import { productGallery } from './product-gallery.js?v=atelier-hidden-studio-20261128';
import { atelierHasOptions, atelierOptionsMarkup } from './atelier-configuration.js?v=atelier-click-colors-20261121';
import { atelierDescriptionMarkup } from './atelier-description.js';
import { productDeliveryKind, deliveryTiming } from './delivery-timing.js?v=delivery-regions-20261122';

export function customerDetails(details, translate, escape, category) {
  const useful = customerFacts(details);
  if (!useful.length) return '';
  return `<details class="customer-product-details"><summary>${category === 'Корм' ? 'О корме' : 'О товаре'}<span class="customer-details-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span></summary><ul>${useful.map(detail => `<li>${escape(translate(detail))}</li>`).join('')}</ul></details>`;
}

const availabilityCopy = {
  ru: {
    available: ['Доступно к заказу', 'По Валенсии доставим за 24-48 часов, по материку - за 2-4, на острова - за 2-10 рабочих дней.'],
    pending: ['Наличие уточняется', 'Наличие этой фасовки уточняем. Пока её нельзя оформить.'],
    on_hand: ['В наличии', 'По Валенсии доставим за 24-48 часов, по материку - за 2-4, на острова - за 2-10 рабочих дней. Стоимость покажем при оформлении.'],
    source_on_demand: ['Под заказ', 'Эту фасовку закажем у поставщика. Срок зависит от поставки и адреса; уточним его после проверки заказа.'],
    unavailable: ['Пока недоступно', 'Оставьте запрос, и мы сообщим, когда сможем предложить этот вариант.'],
    add: 'Добавить в корзину', order: 'Заказать с доставкой', request:'Сообщить о поступлении', pricePending:'Цена уточняется', delivery:'Валенсия: 24-48 часов · материк: 2-4 рабочих дня'
  },
  es: {
    available: ['Disponible para pedir', 'Entrega en València en 24-48 horas y en la península en 2-4 días y en las islas en 2-10 días laborables.'],
    pending: ['Disponibilidad pendiente', 'Estamos comprobando la disponibilidad de este formato. Todavía no se puede pedir.'],
    on_hand: ['Disponible', 'Entrega en València en 24-48 horas y en la península en 2-4 días y en las islas en 2-10 días laborables. Verás el coste al finalizar el pedido.'],
    source_on_demand: ['Por encargo', 'Pediremos este formato al proveedor. El plazo depende del suministro y de la dirección; lo confirmaremos tras revisar el pedido.'],
    unavailable: ['No disponible ahora', 'Déjanos una solicitud y te avisaremos cuando podamos ofrecer este formato.'],
    add: 'Añadir a la cesta', order: 'Pedir con entrega', request:'Avisadme cuando esté disponible', pricePending:'Precio pendiente de confirmar', delivery:'València: 24-48 horas · península: 2-4 días · islas: 2-10 días'
  },
  uk: {
    available: ['Доступно для замовлення', 'Доставка у Валенсії за 24-48 годин, материком - за 2-4, на острови - за 2-10 робочих днів.'],
    pending: ['Наявність уточнюється', 'Наявність цього формату уточнюємо. Поки його не можна замовити.'],
    on_hand: ['У наявності', 'Доставка у Валенсії за 24-48 годин, материком - за 2-4, на острови - за 2-10 робочих днів. Вартість покажемо під час оформлення.'],
    source_on_demand: ['Під замовлення', 'Замовимо цей формат у постачальника. Строк залежить від постачання й адреси; уточнимо його після перевірки замовлення.'],
    unavailable: ['Поки недоступно', 'Залиште запит, і ми повідомимо, коли зможемо запропонувати цей варіант.'],
    add: 'Додати до кошика', order: 'Замовити з доставкою', request:'Повідомити про надходження', pricePending:'Ціна уточнюється', delivery:'Валенсія: 24-48 годин · материк: 2-4 робочі дні'
  }
};

function customerAvailability(variant) {
  if (variant.saleStatus) return variant.saleStatus === 'preorder' ? 'source_on_demand' : variant.saleStatus;
  if (variant.serverSourcingAvailability) return variant.serverSourcingAvailability;
  const raw = variant.serverAvailabilityStatus || variant.availabilityStatus;
  if (raw === 'unavailable' || ['out-of-stock', 'outOfStock', 'discontinued'].includes(raw)) return 'unavailable';
  if (variant.serverPriceConfirmed === false) return 'pending';
  if (raw === 'on_hand') return variant.serverAvailableForCart === false ? 'unavailable' : 'on_hand';
  if (raw === 'source_on_demand' && variant.serverSourceOrderable !== false) return 'source_on_demand';
  return 'pending';
}

export function accessoryDetail(product, helpers) {
  const { crumbs, imageBlock, escape, icon, favorites, goodTogether, money,
    translate = value => value, variantId, quantity = 1, language = 'ru', configuration = { fabric:'41', wood:'57' }, pickupMode = false } = helpers;
  const p = resolveVariant(product, variantId);
  if (!p) return '';
  const price = storefrontPrice(p);
  const specialAvailability = Boolean(p.saleStatus || p.serverSourcingAvailability);
  const t = availabilityCopy[language] || availabilityCopy.ru;
  const pickupText = {
    es:{ready:'Disponible para recoger',missing:'No disponible para recoger',add:'Añadir a la cesta',
      note:'Después del pago acordaremos contigo cuándo recogerlo'},
    ru:{ready:'Доступно к самовывозу',missing:'Недоступно к самовывозу',add:'Добавить в корзину',
      note:'После оплаты согласуем с вами время получения'},
    uk:{ready:'Доступно для самовивозу',missing:'Недоступно для самовивозу',add:'Додати до кошика',
      note:'Після оплати узгодимо з вами час отримання'}
  }[language] || {ready:'Доступно к самовывозу',missing:'Недоступно к самовывозу',add:'Добавить в корзину',note:'После оплаты согласуем время получения'};
  const state = customerAvailability(p);
  const deliveryKind = productDeliveryKind(product, p);
  const timing = deliveryTiming(deliveryKind, language);
  const allowed = canBuy(p) && state !== 'pending' && state !== 'unavailable';
  const requestable = !pickupMode && p.saleStatus === 'unavailable';
  const displayPrice = price === null ? 'Цена уточняется' : money(price);
  const editorial = catalogEditorialChuruCat[product.id];
  const useEditorial = editorial && product.description === editorial.description;
  const wave2 = seoWave2Copy[product.id];
  const displayDescription = wave2
    ? language === 'es' ? wave2.description
      : seoWave2VisibleCopy[product.id]?.[language] || p.description
    : useEditorial ? product.description : p.description;
  const displayDetails = useEditorial
    ? [...new Set([...(p.details || []), ...(product.details || [])])] : p.details;
  const variants = hasVariants(product) && product.variants.length > 1;
  const displayVariants = orderedVariants(product);
  const label = product.optionLabel || p.optionLabel || 'Вариант';
  const optionMarkup = specialAvailability && variants
    ? displayVariants.map(v => {
      const optionState = pickupMode ? (v.pickupAvailable ? 'on_hand' : 'unavailable') : customerAvailability(v);
      return `<button type="button" class="size availability-option ${v.id===p.id?'active':''} ${optionState==='unavailable'?'availability-option-unavailable':''}" data-variant="${escape(v.id)}" aria-pressed="${v.id===p.id}"><strong>${escape(translate(v.label))}</strong><small>${escape(pickupMode ? (v.pickupAvailable ? pickupText.ready : pickupText.missing) : t[optionState][0])}</small></button>`;
    }).join('')
    : variants ? displayVariants.map(v=>`<button class="size ${v.id===p.id?'active':''}" data-variant="${escape(v.id)}" aria-pressed="${v.id===p.id}">${escape(translate(v.label))}</button>`).join('')
      : (p.sizes || []).map(s=>`<span class="size active">${escape(s)}</span>`).join('');
  const selectedAvailability = pickupMode
    ? `<div class="availability-selected availability-selected-${p.pickupAvailable ? 'on_hand' : 'unavailable'}" role="status"><strong>${escape(p.pickupAvailable ? pickupText.ready : pickupText.missing)}</strong>${p.pickupAvailable ? `<p>${escape(pickupText.note)}</p>` : ''}</div>`
    : specialAvailability
      ? `<div class="availability-selected availability-selected-${state}" role="status"><strong>${escape(t[state][0])}</strong><p>${escape(deliveryKind === 'standard' || state === 'unavailable' || state === 'pending' ? t[state][1] : timing)}</p></div>` : '';
  const buyable = pickupMode ? p.pickupAvailable === true && canBuy(p)
    : specialAvailability ? allowed : canBuy(p) && state !== 'unavailable';
  const action = pickupMode ? buyable ? pickupText.add : pickupText.missing
    : requestable ? t.request : !buyable && p.serverPriceConfirmed === false
    ? t.pricePending : specialAvailability ? (['on_hand','available'].includes(state) ? t.add : state === 'source_on_demand' ? t.order : t[state][0]) : (buyable ? 'Добавить в корзину' : 'Вариант недоступен');
  const weightUnit = language === 'es' ? 'kg' : 'кг';
  const priceNote = price === null ? '' : `<p class="retail-note">Цена с IVA${p.packageWeightKg ? ` · ${money(price / p.packageWeightKg)} / ${weightUnit}` : ''}${specialAvailability || pickupMode ? '' : `<br>${escape(buyable ? 'Доступно к заказу' : t[state][0])}`}</p>`;
  return `<div class="page">${crumbs(product.name)}<div class="detail-grid">${productGallery(p, imageBlock, escape, language)}<div class="detail-copy"><span class="eyebrow">${escape(p.line || p.brand || '')}</span><h1>${escape(p.name || product.name)}</h1>${variants?`<p class="variant-current">${escape(label)}: ${escape(translate(p.label))}</p>`:''}<span class="detail-price-label">${variants?'Цена выбранного варианта':'Цена товара'}</span><div class="detail-price">${displayPrice}</div>${priceNote}${atelierDescriptionMarkup(product, language, escape) || `<p>${escape(translate(displayDescription || ''))}</p>`}${atelierHasOptions(product.id)?atelierOptionsMarkup(product.id,configuration,language,escape):`<span class="size-label">${escape(label)}</span><div class="size-options variant-options ${specialAvailability?'availability-options':''}" aria-label="${escape(label)}">${optionMarkup}</div>`}${selectedAvailability}<div class="buy-row">${buyable?`<div class="quantity"><button data-detail-qty="-1" aria-label="Уменьшить количество">${icon('minus')}</button><span id="detail-qty">${quantity}</span><button data-detail-qty="1" aria-label="Увеличить количество">${icon('plus')}</button></div>`:''}<button class="button" ${buyable?`data-buy="${escape(product.id)}"`:requestable?`data-request-availability="${escape(p.id)}"`:'disabled'}>${escape(action)} ${buyable?icon(state === 'source_on_demand' && specialAvailability ? 'arrow' : 'bag'):requestable?icon('arrow'):''}</button><button class="icon-button favorite-detail ${favorites.includes(product.id)?'selected':''}" data-favorite="${escape(product.id)}" aria-label="В избранное" aria-pressed="${favorites.includes(product.id)}">${icon('heart')}</button></div>${buyable?`<div class="detail-service">${icon('check')} ${pickupMode ? escape(pickupText.note) : `${escape(timing)} · <a class="text-link" href="#/info/delivery">${({ru:'подробнее',es:'más información',uk:'докладніше'})[language] || 'подробнее'}</a>`}</div>`:''}${customerDetails(displayDetails, translate, escape, p.category)}</div></div></div>${goodTogether(product)}`;

}
