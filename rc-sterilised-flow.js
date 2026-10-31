import { checkoutTotals } from './checkout-model.js';

const ROOT = '/rc-order';
const PRODUCT_LINK = '#/product/rc-sterilised?availabilityPreview=1';
const STORAGE_KEY = 'catmandog-rc-order-v1';
const purchasable = new Set(['rc-sterilised-400g', 'rc-sterilised-2000g', 'rc-sterilised-4000g']);
const sourceVariant = 'rc-sterilised-4000g';
const requestedVariant = 'rc-sterilised-10000g';

const copy = {
  ru: {
    steps: ['Корзина', 'Доставка', 'Оплата', 'Готово'], back: 'К товару',
    basket: 'Ваш заказ', basketLead: 'Проверьте фасовку и количество перед оформлением',
    empty: 'В корзине пока пусто', choose: 'Выбрать фасовку', quantity: 'Количество',
    remove: 'Удалить', goods: 'Товары', delivery: 'Доставка по Валенсии', free: 'Бесплатно',
    total: 'Итого с IVA', deliveryFree: 'Бесплатная доставка от 49 €',
    inStock: 'В наличии', source: 'Под заказ · 24-48 ч',
    sourceNotice: 'Эту фасовку привезём от поставщика. Ориентир доставки - 24-48 часов после подтверждения наличия.',
    stockNotice: 'Фасовка есть в наличии. Время доставки согласуем после оформления.',
    checkout: 'Перейти к оформлению', details: 'Контакты и доставка',
    detailsLead: 'Оставьте контакты и адрес в Валенсии. После заказа мы свяжемся с вами и подтвердим время доставки.',
    contacts: 'Контактные данные', name: 'Имя', phone: 'Телефон', email: 'Email',
    contactLanguage: 'Язык для связи', address: 'Адрес доставки', postcode: 'Почтовый индекс',
    city: 'Город', street: 'Улица', building: 'Дом', apartment: 'Квартира, этаж, дверь',
    courierNote: 'Комментарий курьеру', preferredTime: 'Удобное время', today: 'Сегодня',
    tomorrow: 'Завтра', slot: 'Интервал', slotMorning: '10:00-14:00',
    slotAfternoon: '14:00-18:00', slotEvening: '18:00-22:00',
    slotNotice: 'Укажите предпочтение. Точное время подтвердим после заказа.',
    sourceTiming: 'Согласуем доставку после подтверждения товара у поставщика',
    toPayment: 'Продолжить к оплате', payment: 'Проверка и оплата',
    paymentLead: 'Проверьте товары, адрес и способ оплаты перед подтверждением',
    paymentMethod: 'Способ оплаты', card: 'Банковская карта', cardCaption: 'Оплата после подтверждения заказа',
    contactSummary: 'Получатель', addressSummary: 'Адрес', timeSummary: 'Доставка',
    missing: 'Не указано', edit: 'Изменить данные', pay: 'Оплатить',
    complete: 'Заказ принят', completeLead: 'Мы свяжемся с вами, чтобы подтвердить детали доставки',
    completeSource: 'Фасовку под заказ сначала подтвердим у поставщика, затем согласуем доставку.',
    continueShopping: 'Продолжить покупки', newOrder: 'Оформить ещё один вариант',
    request: 'Поможем найти', requestLead: 'Проверим, можно ли привезти эту фасовку, и сообщим срок и стоимость. Оставьте контакты - мы свяжемся с вами, как только получим ответ.',
    requestContacts: 'Ваши контактные данные', requestComment: 'Что важно для вас',
    sendRequest: 'Отправить запрос', requested: 'Запрос получен',
    requestedLead: 'Мы проверим наличие этой фасовки и свяжемся с вами.',
    iva: 'Цены включают IVA'
  },
  es: {
    steps: ['Cesta', 'Entrega', 'Pago', 'Listo'], back: 'Volver al producto',
    basket: 'Tu pedido', basketLead: 'Comprueba el formato y la cantidad antes de continuar',
    empty: 'Tu cesta está vacía', choose: 'Elegir formato', quantity: 'Cantidad',
    remove: 'Eliminar', goods: 'Productos', delivery: 'Entrega en València', free: 'Gratis',
    total: 'Total con IVA', deliveryFree: 'Envío gratis a partir de 49 €',
    inStock: 'Disponible', source: 'Por encargo · 24-48 h',
    sourceNotice: 'Pediremos este formato al proveedor. Plazo orientativo: 24-48 horas tras confirmar su disponibilidad.',
    stockNotice: 'Tenemos este formato. Acordaremos la hora de entrega después del pedido.',
    checkout: 'Continuar con el pedido', details: 'Contacto y entrega',
    detailsLead: 'Indica tus datos y una dirección en València. Nos pondremos en contacto para confirmar la entrega.',
    contacts: 'Datos de contacto', name: 'Nombre', phone: 'Teléfono', email: 'Email',
    contactLanguage: 'Idioma de contacto', address: 'Dirección de entrega', postcode: 'Código postal',
    city: 'Ciudad', street: 'Calle', building: 'Número', apartment: 'Piso, puerta',
    courierNote: 'Indicaciones para la entrega', preferredTime: 'Horario preferido', today: 'Hoy',
    tomorrow: 'Mañana', slot: 'Franja horaria', slotMorning: '10:00-14:00',
    slotAfternoon: '14:00-18:00', slotEvening: '18:00-22:00',
    slotNotice: 'Indica tu preferencia. Confirmaremos la hora después del pedido.',
    sourceTiming: 'Acordaremos la entrega cuando el proveedor confirme la disponibilidad',
    toPayment: 'Continuar al pago', payment: 'Revisión y pago',
    paymentLead: 'Revisa los productos, la dirección y el método de pago antes de confirmar',
    paymentMethod: 'Método de pago', card: 'Tarjeta bancaria', cardCaption: 'Pago después de confirmar el pedido',
    contactSummary: 'Destinatario', addressSummary: 'Dirección', timeSummary: 'Entrega',
    missing: 'Sin indicar', edit: 'Modificar datos', pay: 'Pagar',
    complete: 'Pedido recibido', completeLead: 'Nos pondremos en contacto para confirmar los detalles de la entrega',
    completeSource: 'Primero confirmaremos el formato con el proveedor y después acordaremos la entrega.',
    continueShopping: 'Seguir comprando', newOrder: 'Elegir otro formato',
    request: 'Te ayudamos a encontrar', requestLead: 'Comprobaremos si podemos conseguir este formato y te diremos el plazo y el precio. Déjanos tus datos y nos pondremos en contacto cuando tengamos una respuesta.',
    requestContacts: 'Tus datos de contacto', requestComment: '¿Qué necesitas?',
    sendRequest: 'Enviar solicitud', requested: 'Solicitud recibida',
    requestedLead: 'Comprobaremos la disponibilidad de este formato y nos pondremos en contacto.',
    iva: 'Los precios incluyen IVA'
  }
};

function readCart() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved.filter(item => purchasable.has(item?.variantId) && Number.isInteger(item.qty) && item.qty > 0)
      .map(item => ({ variantId: item.variantId, qty: Math.min(99, item.qty) }));
  } catch { return []; }
}

export function createRoyalCaninFlow({ products, escape, icon, money, imageBlock, locale, render }) {
  let cart = readCart();
  let form = { day: 'today', slot: '14-18', contactLanguage: locale() === 'es' ? 'es' : 'ru' };
  let request = {};
  let finished = false;
  let requestFinished = false;
  const t = () => copy[locale() === 'es' ? 'es' : 'ru'];
  const product = () => products.find(item => item.id === 'rc-sterilised');
  const variant = id => product()?.variants?.find(item => item.id === id);
  const items = () => cart.map(item => ({ ...item, sku: variant(item.variantId) })).filter(item => item.sku);
  const hasSource = () => cart.some(item => item.variantId === sourceVariant);
  const totals = () => checkoutTotals(items().map(item => ({ qty: item.qty, price: Number(item.sku.price) || 0 })));
  const persist = () => { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { /* Private browsing */ } };
  const go = step => { location.hash = `${ROOT}/${step}`; render(); };
  const safe = value => escape(value || '');

  function progress(current) {
    const labels = t().steps;
    return `<ol class="rc-flow-progress" aria-label="${safe(t().details)}">${labels.map((label, index) =>
      `<li class="${index === current ? 'current' : index < current ? 'done' : ''}"><span>${index + 1}</span>${safe(label)}</li>`).join('')}</ol>`;
  }

  function summary() {
    const s = t();
    const total = totals();
    return `<aside class="rc-flow-summary"><h2>${safe(s.basket)}</h2>${items().map(item =>
      `<div class="rc-flow-summary-item">${imageBlock(item.sku.image || product().image)}<div><strong>${safe(product().name)}</strong><small>${safe(item.sku.label)} · ${item.qty} × ${money(item.sku.price)}</small></div><strong>${money(item.sku.price * item.qty)}</strong></div>`).join('')}
      <div class="rc-flow-total-line"><span>${safe(s.goods)}</span><strong>${money(total.subtotal)}</strong></div>
      <div class="rc-flow-total-line"><span>${safe(s.delivery)}</span><strong>${total.freeDelivery ? safe(s.free) : money(total.delivery)}</strong></div>
      <div class="rc-flow-total-line rc-flow-total"><span>${safe(s.total)}</span><strong>${money(total.total)}</strong></div>
      <p>${safe(s.iva)} · ${safe(s.deliveryFree)}</p></aside>`;
  }

  function shell(step, heading, lead, body, showSummary = true, showProgress = true) {
    return `<div class="page rc-flow-page" data-rc-flow><a class="rc-flow-back" href="${PRODUCT_LINK}">${icon('arrow')}${safe(t().back)}</a>
      ${showProgress ? progress(step) : ''}<div class="rc-flow-heading"><h1>${safe(heading)}</h1><p>${safe(lead)}</p></div>
      <div class="rc-flow-layout"><div class="rc-flow-main">${body}</div>${showSummary ? summary() : ''}</div></div>`;
  }

  function basketPage() {
    const s = t();
    if (!items().length) return shell(0, s.empty, '', `<a class="button" href="${PRODUCT_LINK}">${safe(s.choose)} ${icon('arrow')}</a>`, false);
    const rows = items().map(item => `<div class="rc-flow-basket-item">${imageBlock(item.sku.image || product().image)}
      <div><strong>${safe(product().name)}</strong><span>${safe(item.sku.label)}</span><small>${safe(item.variantId === sourceVariant ? s.source : s.inStock)}</small>
        <div class="rc-flow-quantity" aria-label="${safe(s.quantity)}"><button type="button" data-rc-qty="-1" data-rc-variant="${safe(item.variantId)}" aria-label="${safe(s.quantity)} -">${icon('minus')}</button><span>${item.qty}</span><button type="button" data-rc-qty="1" data-rc-variant="${safe(item.variantId)}" aria-label="${safe(s.quantity)} +">${icon('plus')}</button></div>
        <button class="rc-flow-remove" type="button" data-rc-remove="${safe(item.variantId)}">${safe(s.remove)}</button></div>
      <strong>${money(item.sku.price * item.qty)}</strong></div>`).join('');
    const notice = hasSource() ? s.sourceNotice : s.stockNotice;
    return shell(0, s.basket, s.basketLead, `<div class="rc-flow-panel">${rows}</div><p class="rc-flow-notice">${icon('truck')}${safe(notice)}</p>
      <div class="rc-flow-actions"><button class="button" type="button" data-rc-next="delivery">${safe(s.checkout)} ${icon('arrow')}</button><a class="button outline" href="${PRODUCT_LINK}">${safe(s.choose)}</a></div>`);
  }

  function input(name, label, type = 'text', extra = '') {
    return `<label>${safe(label)}<input data-rc-field="${name}" type="${type}" value="${safe(form[name])}" ${extra}></label>`;
  }

  function deliveryPage() {
    if (!items().length) return basketPage();
    const s = t();
    const languages = [['es','Español'],['ru','Русский'],['en','English'],['uk','Українська']];
    const slots = [['10-14',s.slotMorning],['14-18',s.slotAfternoon],['18-22',s.slotEvening]];
    const timing = hasSource()
      ? `<div class="rc-flow-notice">${icon('truck')}${safe(s.sourceTiming)}<br>${safe(s.sourceNotice)}</div>`
      : `<div class="rc-flow-radio-row"><label><input type="radio" name="rc-day" data-rc-field="day" value="today" ${form.day === 'today' ? 'checked' : ''}>${safe(s.today)}</label><label><input type="radio" name="rc-day" data-rc-field="day" value="tomorrow" ${form.day === 'tomorrow' ? 'checked' : ''}>${safe(s.tomorrow)}</label></div>
        <label class="rc-flow-select">${safe(s.slot)}<select data-rc-field="slot">${slots.map(([value,label]) => `<option value="${value}" ${form.slot === value ? 'selected' : ''}>${safe(label)}</option>`).join('')}</select></label><p class="rc-flow-help">${safe(s.slotNotice)}</p>`;
    return shell(1, s.details, s.detailsLead, `<section class="rc-flow-panel"><h2>${safe(s.contacts)}</h2><div class="rc-flow-fields">${input('name',s.name,'text','autocomplete="name"')}${input('phone',s.phone,'tel','autocomplete="tel"')}${input('email',s.email,'email','autocomplete="email"')}
      <label>${safe(s.contactLanguage)}<select data-rc-field="contactLanguage">${languages.map(([value,label]) => `<option value="${value}" ${form.contactLanguage === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div></section>
      <section class="rc-flow-panel"><h2>${safe(s.address)}</h2><div class="rc-flow-fields">${input('postcode',s.postcode,'text','inputmode="numeric" autocomplete="postal-code" maxlength="5"')}
      <label>${safe(s.city)}<input value="València" readonly></label>${input('street',s.street,'text','autocomplete="address-line1"')}${input('building',s.building)}${input('apartment',s.apartment)}
      <label class="rc-flow-wide">${safe(s.courierNote)}<textarea data-rc-field="courierNote">${safe(form.courierNote)}</textarea></label></div></section>
      <section class="rc-flow-panel"><h2>${safe(s.preferredTime)}</h2>${timing}</section>
      <div class="rc-flow-actions"><button class="button" type="button" data-rc-next="payment">${safe(s.toPayment)} ${icon('arrow')}</button><a class="button outline" href="#${ROOT}/basket">${safe(s.steps[0])}</a></div>`);
  }

  function paymentPage() {
    if (!items().length) return basketPage();
    const s = t();
    const contact = [form.name, form.phone, form.email].filter(Boolean).join(' · ') || s.missing;
    const address = [form.street, form.building, form.apartment, form.postcode].some(Boolean)
      ? [form.street, form.building, form.apartment, form.postcode, 'València'].filter(Boolean).join(', ') : s.missing;
    const slotLabel = ({ '10-14': s.slotMorning, '14-18': s.slotAfternoon, '18-22': s.slotEvening })[form.slot] || s.slotAfternoon;
    const when = hasSource() ? s.sourceTiming : `${form.day === 'tomorrow' ? s.tomorrow : s.today}, ${slotLabel}`;
    return shell(2, s.payment, s.paymentLead, `<section class="rc-flow-panel"><h2>${safe(s.details)}</h2>
      <dl class="rc-flow-review"><div><dt>${safe(s.contactSummary)}</dt><dd>${safe(contact)}</dd></div><div><dt>${safe(s.addressSummary)}</dt><dd>${safe(address || s.missing)}</dd></div><div><dt>${safe(s.timeSummary)}</dt><dd>${safe(when)}</dd></div></dl>
      <a class="rc-flow-edit" href="#${ROOT}/delivery">${safe(s.edit)} ${icon('arrow')}</a></section>
      <section class="rc-flow-panel"><h2>${safe(s.paymentMethod)}</h2><div class="rc-flow-method">${icon('shield')}<span><strong>${safe(s.card)}</strong><small>${safe(s.cardCaption)}</small></span></div></section>
      <div class="rc-flow-actions"><button class="button" type="button" data-rc-pay>${safe(s.pay)} ${money(totals().total)} ${icon('arrow')}</button></div>`);
  }

  function completePage() {
    if (!finished) return paymentPage();
    const s = t();
    return shell(3, s.complete, s.completeLead, `<div class="rc-flow-complete-mark">${icon('check')}</div><p class="rc-flow-notice">${icon('truck')}${safe(hasSource() ? s.completeSource : s.stockNotice)}</p>
      <div class="rc-flow-actions"><button class="button" type="button" data-rc-new-order>${safe(s.newOrder)} ${icon('arrow')}</button><a class="button outline" href="#/catalog">${safe(s.continueShopping)}</a></div>`);
  }

  function requestPage(done = false) {
    const s = t();
    const sku = variant(requestedVariant);
    if (done && requestFinished) return shell(3, s.requested, s.requestedLead,
      `<div class="rc-flow-complete-mark">${icon('check')}</div><a class="button" href="${PRODUCT_LINK}">${safe(s.back)} ${icon('arrow')}</a>`, false, false);
    return shell(0, `${s.request} ${product()?.name} · ${sku?.label || (locale() === 'es' ? '10 kg' : '10 кг')}`, s.requestLead, `<div class="rc-flow-request-product">${imageBlock(sku?.image || product()?.image)}<div><strong>${safe(product()?.name)}</strong><span>${safe(sku?.label || '10 кг')}</span></div></div>
      <section class="rc-flow-panel"><h2>${safe(s.requestContacts)}</h2><div class="rc-flow-fields">
      <label>${safe(s.name)}<input data-rc-request-field="name" value="${safe(request.name)}" autocomplete="name"></label>
      <label>${safe(s.phone)}<input data-rc-request-field="phone" type="tel" value="${safe(request.phone)}" autocomplete="tel"></label>
      <label>${safe(s.email)}<input data-rc-request-field="email" type="email" value="${safe(request.email)}" autocomplete="email"></label>
      <label class="rc-flow-wide">${safe(s.requestComment)}<textarea data-rc-request-field="comment">${safe(request.comment)}</textarea></label></div></section>
      <div class="rc-flow-actions"><button class="button" type="button" data-rc-request-send>${safe(s.sendRequest)} ${icon('arrow')}</button></div>`, false, false);
  }

  function page(path) {
    if (!path.startsWith(ROOT + '/')) return '';
    if (!product()) return '';
    if (path === `${ROOT}/request`) return requestPage();
    if (path === `${ROOT}/requested`) return requestPage(true);
    if (path === `${ROOT}/basket`) return basketPage();
    if (path === `${ROOT}/delivery`) return deliveryPage();
    if (path === `${ROOT}/payment`) return paymentPage();
    if (path === `${ROOT}/complete`) return completePage();
    return basketPage();
  }

  function click(button, quantity = 1) {
    if (button.hasAttribute('data-rc-flow-add')) {
      const id = button.dataset.rcFlowAdd;
      if (!purchasable.has(id)) return true;
      const existing = cart.find(item => item.variantId === id);
      if (existing) existing.qty = Math.min(99, existing.qty + quantity);
      else cart.push({ variantId: id, qty: Math.min(99, Math.max(1, quantity)) });
      persist(); finished = false; go('basket'); return true;
    }
    if (button.hasAttribute('data-rc-flow-request')) { requestFinished = false; go('request'); return true; }
    if (button.hasAttribute('data-rc-new-order')) { cart = []; persist(); finished = false; location.hash = PRODUCT_LINK.slice(1); render(); return true; }
    if (button.hasAttribute('data-rc-qty')) {
      const item = cart.find(entry => entry.variantId === button.dataset.rcVariant);
      if (item) item.qty = Math.min(99, Math.max(1, item.qty + Number(button.dataset.rcQty)));
      persist(); render(); return true;
    }
    if (button.hasAttribute('data-rc-remove')) { cart = cart.filter(item => item.variantId !== button.dataset.rcRemove); persist(); render(); return true; }
    if (button.hasAttribute('data-rc-next')) { go(button.dataset.rcNext); return true; }
    if (button.hasAttribute('data-rc-pay')) { finished = true; go('complete'); return true; }
    if (button.hasAttribute('data-rc-request-send')) { requestFinished = true; go('requested'); return true; }
    return false;
  }

  function update(target) {
    if (target.hasAttribute('data-rc-field')) {
      if (target.type !== 'radio' || target.checked) form[target.dataset.rcField] = target.value;
      return true;
    }
    if (target.hasAttribute('data-rc-request-field')) { request[target.dataset.rcRequestField] = target.value; return true; }
    return false;
  }

  return { page, click, update, handles: path => path.startsWith(ROOT + '/') };
}
