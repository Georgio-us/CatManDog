// A private product-page preview. These statuses are examples, not stock records.
const scenario = {
  'rc-sterilised-400g': 'on_hand',
  'rc-sterilised-2000g': 'on_hand',
  'rc-sterilised-4000g': 'supplier_48h',
  'rc-sterilised-10000g': 'unavailable'
};

const copy = {
  ru: {
    preview: 'Предпросмотр наличия и доставки',
    disclaimer: 'Это пример для проверки карточки. Остатки, цены и срок поставщика пока не подтверждены, заказ здесь не создаётся.',
    price: 'Демонстрационная цена',
    pack: 'Фасовка',
    stock: 'В наличии',
    supplier: 'Под заказ',
    supplierOption: 'Под заказ · 24-48 ч',
    unavailable: 'Нет в наличии',
    stockDetail: 'Товар есть у нас. При оформлении можно будет выбрать удобный интервал доставки по Валенсии. Точное время мы подтвердим после заказа.',
    supplierDetail: 'Эту фасовку привезём от поставщика. Ориентир доставки - 24-48 часов после подтверждения наличия. Срок будет виден ещё раз в корзине и перед оплатой.',
    unavailableDetail: 'Эту фасовку сейчас заказать нельзя. Выберите другой вес.',
    add: 'Добавить в корзину',
    order: 'Заказать с доставкой',
    savedStock: 'Для этой фасовки в рабочей версии откроется корзина с доставкой из наличия.',
    savedSupplier: 'Для этой фасовки в рабочей версии откроется корзина со сроком поставки 24-48 часов.',
    onlyPreview: 'Сейчас это просмотр сценария: товар в корзину не добавлен'
  },
  es: {
    preview: 'Vista previa de disponibilidad y entrega',
    disclaimer: 'Este es un ejemplo para revisar la ficha. Aún no se han confirmado las existencias, los precios ni el plazo del proveedor. Aquí no se crea ningún pedido.',
    price: 'Precio de demostración',
    pack: 'Formato',
    stock: 'Disponible',
    supplier: 'Por encargo',
    supplierOption: 'Por encargo · 24-48 h',
    unavailable: 'Agotado',
    stockDetail: 'Tenemos este formato. Al realizar el pedido podrás indicar la franja de entrega que prefieras en València. Confirmaremos la hora después.',
    supplierDetail: 'Pediremos este formato al proveedor. Plazo orientativo de entrega: 24-48 horas tras confirmar su disponibilidad. Volverás a ver el plazo en la cesta y antes de pagar.',
    unavailableDetail: 'Este formato no se puede pedir ahora. Elige otro peso.',
    add: 'Añadir a la cesta',
    order: 'Pedir con entrega',
    savedStock: 'En la versión operativa, este formato abrirá la cesta con entrega desde nuestras existencias.',
    savedSupplier: 'En la versión operativa, este formato abrirá la cesta con un plazo de 24-48 horas.',
    onlyPreview: 'Esta es solo una vista previa: el producto no se ha añadido a la cesta'
  }
};

export function availabilityScenario(product, selectedId, language = 'es') {
  if (product?.id !== 'rc-sterilised') return null;
  const selected = product.variants?.find(variant => variant.id === selectedId);
  if (!selected || !(selected.id in scenario)) return null;
  const strings = copy[language === 'ru' ? 'ru' : 'es'];
  const status = scenario[selected.id];
  return { strings, selected, status, variants: product.variants.map(variant => ({
    id: variant.id, label: variant.label, status: scenario[variant.id] || 'unavailable'
  })) };
}

export function availabilityScenarioDetail(product, helpers) {
  const { crumbs, imageBlock, escape, icon, favorites, money, variantId, quantity = 1, language = 'es' } = helpers;
  const view = availabilityScenario(product, variantId, language);
  if (!view) return '';
  const { strings: t, selected, status, variants } = view;
  const statusLabel = value => ({ on_hand: t.stock, supplier_48h: t.supplier, unavailable: t.unavailable })[value];
  const optionLabel = value => value === 'supplier_48h' ? t.supplierOption : statusLabel(value);
  const description = ({ on_hand: t.stockDetail, supplier_48h: t.supplierDetail,
    unavailable: t.unavailableDetail })[status];
  const action = status === 'on_hand' ? t.add : status === 'supplier_48h' ? t.order : t.unavailable;
  return `<div class="page availability-scenario-page">${crumbs(product.name)}
    <div class="availability-preview-banner" role="note"><strong>${escape(t.preview)}</strong><p>${escape(t.disclaimer)}</p></div>
    <div class="detail-grid">${imageBlock(selected.image || product.image, 'detail-image')}
      <div class="detail-copy"><span class="eyebrow">${escape(product.brand)}</span><h1>${escape(product.name)}</h1>
        <p class="variant-current">${escape(t.pack)}: ${escape(selected.label)}</p>
        <span class="detail-price-label">${escape(t.price)}</span><div class="detail-price">${money(7.77)}</div>
        <span class="size-label">${escape(t.pack)}</span>
        <div class="size-options variant-options availability-options" aria-label="${escape(t.pack)}">${variants.map(variant =>
          `<button type="button" class="size availability-option ${variant.id === selected.id ? 'active' : ''} ${variant.status === 'unavailable' ? 'availability-option-unavailable' : ''}" data-variant="${escape(variant.id)}" aria-pressed="${variant.id === selected.id}"><strong>${escape(variant.label)}</strong><small>${escape(optionLabel(variant.status))}</small></button>`).join('')}</div>
        <div class="availability-selected availability-selected-${status}" role="status"><strong>${escape(statusLabel(status))}</strong><p>${escape(description)}</p></div>
        <div class="buy-row">${status !== 'unavailable' ? `<div class="quantity"><button type="button" data-detail-qty="-1" aria-label="Уменьшить количество">${icon('minus')}</button><span id="detail-qty">${quantity}</span><button type="button" data-detail-qty="1" aria-label="Увеличить количество">${icon('plus')}</button></div>` : ''}
          <button type="button" class="button" ${status === 'unavailable' ? 'disabled' : `data-preview-action="${escape(status)}"`}>${escape(action)} ${status === 'unavailable' ? '' : icon(status === 'on_hand' ? 'bag' : 'arrow')}</button>
          <button type="button" class="icon-button favorite-detail ${favorites.includes(product.id) ? 'selected' : ''}" data-favorite="${escape(product.id)}" aria-label="В избранное" aria-pressed="${favorites.includes(product.id)}">${icon('heart')}</button></div>
        <p class="availability-preview-feedback" data-preview-feedback role="status" hidden></p>
      </div></div></div>`;
}

export function availabilityScenarioFeedback(status, language = 'es') {
  const t = copy[language === 'ru' ? 'ru' : 'es'];
  return `${status === 'supplier_48h' ? t.savedSupplier : t.savedStock} ${t.onlyPreview}`;
}
