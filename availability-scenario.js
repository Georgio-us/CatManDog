// Product-specific delivery flow for Sterilised 37. It does not alter catalog stock records.
const scenario = {
  'rc-sterilised-400g': 'on_hand',
  'rc-sterilised-2000g': 'on_hand',
  'rc-sterilised-4000g': 'supplier_48h',
  'rc-sterilised-10000g': 'unavailable'
};

const copy = {
  ru: {
    price: 'Цена выбранной фасовки',
    pricePending: 'Цена уточняется',
    pack: 'Фасовка',
    stock: 'В наличии',
    supplier: 'Под заказ',
    supplierOption: 'Под заказ · 24-48 ч',
    unavailable: 'Нет в наличии',
    stockDetail: 'Товар есть у нас. При оформлении можно будет выбрать удобный интервал доставки по Валенсии. Точное время мы подтвердим после заказа.',
    supplierDetail: 'Эту фасовку привезём от поставщика. Ориентир доставки - 24-48 часов после подтверждения наличия. Срок будет виден ещё раз в корзине и перед оплатой.',
    unavailableDetail: 'Эту фасовку сейчас заказать нельзя. Выберите другой вес.',
    requestDetail: 'Этой фасовки сейчас нет. Отправьте запрос - мы проверим, можем ли найти её, и сообщим цену и срок.',
    add: 'Добавить в корзину',
    order: 'Заказать с доставкой',
    request: 'Помочь найти 10 кг',
    checkoutUnavailable: 'Оформление заказа пока недоступно'
  },
  es: {
    price: 'Precio del formato elegido',
    pricePending: 'Precio pendiente de confirmar',
    pack: 'Formato',
    stock: 'Disponible',
    supplier: 'Por encargo',
    supplierOption: 'Por encargo · 24-48 h',
    unavailable: 'Agotado',
    stockDetail: 'Tenemos este formato. Al realizar el pedido podrás indicar la franja de entrega que prefieras en València. Confirmaremos la hora después.',
    supplierDetail: 'Pediremos este formato al proveedor. Plazo orientativo de entrega: 24-48 horas tras confirmar su disponibilidad. Volverás a ver el plazo en la cesta y antes de pagar.',
    unavailableDetail: 'Este formato no se puede pedir ahora. Elige otro peso.',
    requestDetail: 'Este formato no está disponible ahora. Envíanos una solicitud y comprobaremos si podemos conseguirlo, a qué precio y en qué plazo.',
    add: 'Añadir a la cesta',
    order: 'Pedir con entrega',
    request: 'Ayúdame a encontrar 10 kg',
    checkoutUnavailable: 'Los pedidos aún no están disponibles'
  }
};

export function availabilityScenario(product, selectedId, language = 'es') {
  if (product?.id !== 'rc-sterilised') return null;
  const selected = product.variants?.find(variant => variant.id === selectedId);
  if (!selected || !(selected.id in scenario)) return null;
  const strings = copy[language === 'ru' ? 'ru' : 'es'];
  const status = scenario[selected.id];
  const order = Object.keys(scenario);
  return { strings, selected, status, variants: product.variants
    .filter(variant => order.includes(variant.id))
    .sort((left, right) => order.indexOf(left.id) - order.indexOf(right.id))
    .map(variant => ({ id: variant.id, label: variant.label, status: scenario[variant.id] })) };
}

export function availabilityScenarioDetail(product, helpers) {
  const { crumbs, imageBlock, escape, icon, favorites, money, goodTogether = () => '', variantId, quantity = 1, language = 'es', flowEnabled = false } = helpers;
  const view = availabilityScenario(product, variantId, language);
  if (!view) return '';
  const { strings: t, selected, status, variants } = view;
  const statusLabel = value => ({ on_hand: t.stock, supplier_48h: t.supplier, unavailable: t.unavailable })[value];
  const optionLabel = value => value === 'supplier_48h' ? t.supplierOption : statusLabel(value);
  const description = status === 'unavailable' && flowEnabled ? t.requestDetail : ({ on_hand: t.stockDetail, supplier_48h: t.supplierDetail,
    unavailable: t.unavailableDetail })[status];
  const action = status === 'on_hand' ? t.add : status === 'supplier_48h' ? t.order : flowEnabled ? t.request : t.unavailable;
  const actionAttribute = flowEnabled ? status === 'unavailable' ? `data-rc-flow-request="${escape(selected.id)}"` : `data-rc-flow-add="${escape(selected.id)}"` : status === 'unavailable' ? 'disabled' : `data-preview-action="${escape(status)}"`;
  return `<div class="page availability-scenario-page">${crumbs(product.name)}
    <div class="detail-grid">${imageBlock(selected.image || product.image, 'detail-image')}
      <div class="detail-copy"><span class="eyebrow">${escape(product.brand)}</span><h1>${escape(product.name)}</h1>
        <p class="variant-current">${escape(t.pack)}: ${escape(selected.label)}</p>
        <span class="detail-price-label">${escape(t.price)}</span><div class="detail-price">${Number.isFinite(selected.price) && selected.price > 0 ? money(selected.price) : escape(t.pricePending)}</div>
        <p>${escape(selected.description || product.description || '')}</p>
        <span class="size-label">${escape(t.pack)}</span>
        <div class="size-options variant-options availability-options" aria-label="${escape(t.pack)}">${variants.map(variant =>
          `<button type="button" class="size availability-option ${variant.id === selected.id ? 'active' : ''} ${variant.status === 'unavailable' ? 'availability-option-unavailable' : ''}" data-variant="${escape(variant.id)}" aria-pressed="${variant.id === selected.id}"><strong>${escape(variant.label)}</strong><small>${escape(optionLabel(variant.status))}</small></button>`).join('')}</div>
        <div class="availability-selected availability-selected-${status}" role="status"><strong>${escape(statusLabel(status))}</strong><p>${escape(description)}</p></div>
        <div class="buy-row">${status !== 'unavailable' ? `<div class="quantity"><button type="button" data-detail-qty="-1" aria-label="Уменьшить количество">${icon('minus')}</button><span id="detail-qty">${quantity}</span><button type="button" data-detail-qty="1" aria-label="Увеличить количество">${icon('plus')}</button></div>` : ''}
          <button type="button" class="button" ${actionAttribute}>${escape(action)} ${status === 'unavailable' && !flowEnabled ? '' : icon(status === 'on_hand' ? 'bag' : 'arrow')}</button>
          <button type="button" class="icon-button favorite-detail ${favorites.includes(product.id) ? 'selected' : ''}" data-favorite="${escape(product.id)}" aria-label="В избранное" aria-pressed="${favorites.includes(product.id)}">${icon('heart')}</button></div>
        <p class="availability-preview-feedback" data-preview-feedback role="status" hidden></p>
        <details open><summary>${language === 'es' ? 'Sobre este alimento' : 'О корме'}</summary><ul>${(selected.details || product.details || []).map(detail => `<li>${escape(detail)}</li>`).join('')}</ul></details>
      </div></div></div>${goodTogether(product)}`;
}

export function availabilityScenarioFeedback(language = 'es') {
  const t = copy[language === 'ru' ? 'ru' : 'es'];
  return t.checkoutUnavailable;
}
