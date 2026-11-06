import { hasVariants, resolveVariant, storefrontPrice, canBuy } from './variants.js?v=delivery-status-3';

function customerDetails(details, translate, escape, category, icon) {
  const useful = (details || []).filter(detail => {
    const text = String(detail).trim();
    return text && !/^Упаковка\s*:/iu.test(text) &&
      !/^Для (кошек|собак)$/iu.test(text) &&
      !/^Используйте по инструкции на упаковке производителя$/iu.test(text);
  });
  if (!useful.length) return '';
  return `<details class="customer-product-details"><summary>${category === 'Корм' ? 'О корме' : 'О товаре'}<span class="customer-details-chevron">${icon('arrow')}</span></summary><ul>${useful.map(detail => `<li>${escape(translate(detail))}</li>`).join('')}</ul></details>`;
}

const availabilityCopy = {
  ru: {
    available: ['Доступно к заказу', 'Выберите этот вариант и укажите удобное время при оформлении. Детали доставки подтвердим после заказа.'],
    pending: ['Наличие уточняется', 'Наличие этой фасовки уточняем. Пока её нельзя оформить.'],
    on_hand: ['В наличии', 'Товар есть у нас. Способ и стоимость доставки вы увидите при оформлении заказа.'],
    source_on_demand: ['Под заказ', 'Эту фасовку закажем у поставщика. Срок доставки уточним до оплаты.'],
    unavailable: ['Пока недоступно', 'Оставьте запрос, и мы сообщим, когда сможем предложить этот вариант.'],
    add: 'Добавить в корзину', order: 'Заказать с доставкой', request:'Сообщить о поступлении'
  },
  es: {
    available: ['Disponible para pedir', 'Elige este formato e indica cuándo te viene bien recibirlo. Confirmaremos los detalles de entrega después del pedido.'],
    pending: ['Disponibilidad pendiente', 'Estamos comprobando la disponibilidad de este formato. Todavía no se puede pedir.'],
    on_hand: ['Disponible', 'Tenemos este formato. Verás las opciones y el coste de entrega al realizar el pedido.'],
    source_on_demand: ['Por encargo', 'Pediremos este formato al proveedor. Confirmaremos el plazo de entrega antes del pago.'],
    unavailable: ['No disponible ahora', 'Déjanos una solicitud y te avisaremos cuando podamos ofrecer este formato.'],
    add: 'Añadir a la cesta', order: 'Pedir con entrega', request:'Avisadme cuando esté disponible'
  },
  uk: {
    available: ['Доступно для замовлення', 'Виберіть цей варіант і зручний час під час оформлення. Деталі доставки підтвердимо після замовлення.'],
    pending: ['Наявність уточнюється', 'Наявність цього формату уточнюємо. Поки його не можна замовити.'],
    on_hand: ['У наявності', 'Товар є в нас. Спосіб і вартість доставки ви побачите під час оформлення замовлення.'],
    source_on_demand: ['Під замовлення', 'Замовимо цей формат у постачальника. Строк доставки уточнимо до оплати.'],
    unavailable: ['Поки недоступно', 'Залиште запит, і ми повідомимо, коли зможемо запропонувати цей варіант.'],
    add: 'Додати до кошика', order: 'Замовити з доставкою', request:'Повідомити про надходження'
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
    translate = value => value, variantId, quantity = 1, language = 'ru' } = helpers;
  const p = resolveVariant(product, variantId);
  if (!p) return '';
  const price = storefrontPrice(p);
  const specialAvailability = Boolean(p.saleStatus || p.serverSourcingAvailability);
  const t = availabilityCopy[language] || availabilityCopy.ru;
  const state = customerAvailability(p);
  const allowed = canBuy(p) && state !== 'pending' && state !== 'unavailable';
  const requestable = p.saleStatus === 'unavailable';
  const displayPrice = price === null ? 'Цена уточняется' : money(price);
  const variants = hasVariants(product) && product.variants.length > 1;
  const label = product.optionLabel || p.optionLabel || 'Вариант';
  const optionMarkup = specialAvailability && variants
    ? product.variants.map(v => {
      const optionState = customerAvailability(v);
      return `<button type="button" class="size availability-option ${v.id===p.id?'active':''} ${optionState==='unavailable'?'availability-option-unavailable':''}" data-variant="${escape(v.id)}" aria-pressed="${v.id===p.id}"><strong>${escape(translate(v.label))}</strong><small>${escape(t[optionState][0])}</small></button>`;
    }).join('')
    : variants ? product.variants.map(v=>`<button class="size ${v.id===p.id?'active':''}" data-variant="${escape(v.id)}" aria-pressed="${v.id===p.id}">${escape(translate(v.label))}</button>`).join('')
      : (p.sizes || []).map(s=>`<span class="size active">${escape(s)}</span>`).join('');
  const selectedAvailability = specialAvailability
    ? `<div class="availability-selected availability-selected-${state}" role="status"><strong>${escape(t[state][0])}</strong><p>${escape(t[state][1])}</p></div>` : '';
  const buyable = specialAvailability ? allowed : canBuy(p) && state !== 'unavailable';
  const action = requestable ? t.request : specialAvailability ? (['on_hand','available'].includes(state) ? t.add : state === 'source_on_demand' ? t.order : t[state][0]) : (buyable ? 'Добавить в корзину' : 'Вариант недоступен');
  const priceNote = price === null ? '' : `<p class="retail-note">Цена с IVA${p.packageWeightKg ? ` · ${money(price / p.packageWeightKg)} / кг` : ''}${specialAvailability ? '' : `<br>${escape(buyable ? 'Доступно к заказу' : t[state][0])}`}</p>`;
  return `<div class="page">${crumbs(product.name)}<div class="detail-grid">${imageBlock(p.image,'detail-image')}<div class="detail-copy"><span class="eyebrow">${escape(p.line || p.brand || '')}</span><h1>${escape(p.name || product.name)}</h1>${variants?`<p class="variant-current">${escape(label)}: ${escape(translate(p.label))}</p>`:''}<span class="detail-price-label">${variants?'Цена выбранного варианта':'Цена товара'}</span><div class="detail-price">${displayPrice}</div>${priceNote}<p>${escape(translate(p.description || ''))}</p><span class="size-label">${escape(label)}</span><div class="size-options variant-options ${specialAvailability?'availability-options':''}" aria-label="${escape(label)}">${optionMarkup}</div>${selectedAvailability}<div class="buy-row">${buyable?`<div class="quantity"><button data-detail-qty="-1" aria-label="Уменьшить количество">${icon('minus')}</button><span id="detail-qty">${quantity}</span><button data-detail-qty="1" aria-label="Увеличить количество">${icon('plus')}</button></div>`:''}<button class="button" ${buyable?`data-buy="${escape(product.id)}"`:requestable?`data-request-availability="${escape(p.id)}"`:'disabled'}>${escape(action)} ${buyable?icon(state === 'source_on_demand' && specialAvailability ? 'arrow' : 'bag'):requestable?icon('arrow'):''}</button><button class="icon-button favorite-detail ${favorites.includes(product.id)?'selected':''}" data-favorite="${escape(product.id)}" aria-label="В избранное" aria-pressed="${favorites.includes(product.id)}">${icon('heart')}</button></div>${customerDetails(p.details, translate, escape, p.category, icon)}</div></div></div>${goodTogether(product)}`;

}
