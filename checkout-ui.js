import { checkoutTotals, availableDeliverySlots, FREE_DELIVERY_FROM, DELIVERY_FEE, validateCheckout } from './checkout-model.js?v=shipping-policy-1';
import { locale } from './locale.js?v=delivery-status-1';

export function createCheckoutUI({ escape: e, icon, money, imageBlock, getItems, isReady, getPromo, applyPromo,
  refreshPromo = async () => {}, findOrder, productLabel, getCheckoutContext = () => ({}), render, onPaid }) {
  let formValues = {};
  let promoError = '';
  let preview = null;
  let servicePreview = null;
  let supportEnabled = false;
  let paymentsEnabled = false;
  let paymentError = '';
  let paymentReturn = null;
  let serviceError = '';
  let remainingAfterPayment = false;
  let shippingQuote = null;

  async function initialize() {
    try {
      const response = await fetch('/api/config', { credentials: 'same-origin' });
      if (!response.ok) return;
      const config = await response.json();
      supportEnabled = config.supportEnabled === true;
      paymentsEnabled = config.paymentsEnabled === true && config.ordersEnabled === true;
      if (/^#\/(support|returns|checkout)/.test(location.hash)) render();
    } catch { /* The local file preview has no API */ }
  }

  const cartSignature = items => JSON.stringify(items.map(item => [item.productId, item.variantId, item.qty, item.price]));
  const field = (name, fallback = '') => e(formValues[name] ?? fallback);
  const checked = name => formValues[name] ? 'checked' : '';
  const purchaseTermsLink = () => locale() === 'es'
    ? '<a class="text-link" href="/purchase-terms-es.html">Condiciones de compra y devoluciones</a>'
    : locale() === 'uk'
      ? '<a class="text-link" href="/purchase-terms-uk.html">Умови купівлі та повернення</a>'
    : '<a class="text-link" href="/purchase-terms.html">Условия покупки и возврата</a>';
  const progress = step => `<ol class="rc-flow-progress" aria-label="Этапы заказа">${['Корзина','Доставка','Оплата','Готово'].map((label, index) => `<li class="${index === step ? 'current' : index < step ? 'done' : ''}"><span>${index + 1}</span>${label}</li>`).join('')}</ol>`;
  function deliveryStep(context) {
    if (formValues.deliveryRegion === 'national') return `<section class="checkout-section"><div class="checkout-section-head"><span>03</span><div><h2>Доставка по материковой Испании</h2><p>До 49 € - 9,99 €, от 49 € - 3,99 €, от 99 € - бесплатно</p></div></div><input type="hidden" name="deliveryMode" value="national"><p class="checkout-help">Срок и точную дату сообщим после передачи посылки перевозчику</p></section>`;
    if (context.hasSupplier) return `<section class="checkout-section"><div class="checkout-section-head"><span>03</span><div><h2>Доставка товара под заказ</h2><p>Ориентир - 24-48 часов. Когда товар будет готов, подтвердим время доставки</p></div></div><input type="hidden" name="deliveryMode" value="preorder"><p class="checkout-help">${context.group === 'all' ? 'Если в заказе есть обычные товары, привезём всё вместе после поступления товара под заказ' : 'Эту доставку оформляем отдельно'}</p></section>`;
    const slots = availableDeliverySlots(new Date(), 3);
    const selected = slots.some(slot => `${slot.date}|${slot.window}` === formValues.deliverySlot)
      ? formValues.deliverySlot : slots[0] && `${slots[0].date}|${slots[0].window}`;
    return `<section class="checkout-section"><div class="checkout-section-head"><span>03</span><div><h2>Удобное время доставки</h2><p>Выберите день и один из трёх интервалов. Точное время подтвердим после заказа</p></div></div><input type="hidden" name="deliveryMode" value="slot"><div class="checkout-delivery-options">${slots.map(slot => `<label class="checkout-choice"><input type="radio" name="deliverySlot" value="${slot.date}|${slot.window}" ${selected === `${slot.date}|${slot.window}` ? 'checked' : ''} required><span><strong>${slot.day === 0 ? 'Сегодня' : slot.day === 1 ? 'Завтра' : slot.date} · ${slot.label}</strong><small>${slot.date}</small></span></label>`).join('')}</div></section>`;
  }
  const itemsList = items => `<div class="checkout-items rc-flow-summary-list">${items.map(item => `<div class="checkout-item rc-flow-summary-item">${imageBlock(item.image)}<div><strong>${e(item.name)}</strong><small>${e(item.variant || '1 шт')} · ${item.qty} шт × ${money(item.price)}</small>${item.fulfillment ? `<small>${item.fulfillment === 'supplier' ? 'Под заказ · 24-48 часов' : item.fulfillment === 'stock' ? 'Обычная доставка' : 'Недоступно'}</small>` : ''}</div><strong>${money(item.price * item.qty)}</strong></div>`).join('')}</div>`;
  const summary = (items, promo, national = null) => {
    const pendingNational = formValues.deliveryRegion === 'national' && !national;
    const totals = checkoutTotals(items, promo, national?.deliveryCents ?? null);
    return `<aside class="checkout-summary rc-flow-summary"><h2>Ваш заказ</h2>${itemsList(items)}<div class="summary-line rc-flow-total-line"><span>Товары</span><strong>${money(totals.subtotal)}</strong></div>${totals.discount ? `<div class="summary-line rc-flow-total-line"><span>Промокод ${e(promo.code || '')}</span><strong>−${money(totals.discount)}</strong></div>` : ''}<div class="summary-line rc-flow-total-line"><span>${pendingNational || national ? 'Доставка по материковой Испании' : 'Доставка по Валенсии'}</span><strong>${pendingNational ? 'После проверки' : totals.freeDelivery ? 'Бесплатно' : money(totals.delivery)}</strong></div><div class="summary-line total rc-flow-total-line rc-flow-total"><span>${pendingNational || national ? 'Итого к оплате' : 'Итого с IVA'}</span><strong>${pendingNational ? 'После проверки' : money(totals.total)}</strong></div><p class="checkout-caption">${pendingNational ? 'Доставка по материковой Испании: до 49 € - 9,99 €, от 49 € - 3,99 €, от 99 € - бесплатно. Проверьте адрес и стоимость доставки перед оплатой.' : national ? 'Стоимость доставки рассчитана по сумме товаров после скидки. Срок сообщим после передачи посылки перевозчику.' : `Бесплатная доставка от ${money(FREE_DELIVERY_FROM)} после скидки или по купону на доставку. Ниже порога - ${money(DELIVERY_FEE)}.`}</p></aside>`;
  };

  function page() {
    const items = getItems();
    if (!items.length) return `<div class="page checkout-page"><h1>Оформление заказа</h1><p>Корзина пуста</p><a class="button" href="#/catalog">Выбрать товары ${icon('arrow')}</a></div>`;
    if (!isReady()) return `<div class="page checkout-page"><h1>Проверьте варианты в корзине</h1><p>Для оформления каждому товару нужна конкретная фасовка и цена</p><a class="button" href="#/cart">Вернуться в корзину ${icon('arrow')}</a></div>`;
    const context = getCheckoutContext();
    const promo = getPromo();
    return `<div class="page checkout-page rc-flow-page live-order-page"><div class="checkout-head"><a class="text-link" href="#/cart">${icon('arrow')} Вернуться в корзину</a><span>${formValues.deliveryRegion === 'national' ? 'Доставка по материковой Испании' : 'Доставка по городу Валенсия'}</span></div>${progress(1)}<div class="rc-flow-heading"><h1>${context.group === 'stock' ? 'Доставка доступных товаров' : 'Оформление заказа'}</h1><p>${context.group === 'stock' ? 'Это первый из двух заказов. Товары под заказ останутся в корзине для отдельного оформления' : context.hasSupplier ? 'Товары под заказ доставим после поступления. Срок согласуем отдельно перед приёмом оплаты' : 'Укажите, куда привезти покупки. Перед оплатой покажем все данные ещё раз'}</p></div><div class="checkout-layout rc-flow-layout"><form id="checkout-form" class="checkout-form" data-checkout-form><section class="checkout-section"><div class="checkout-section-head"><span>01</span><div><h2>Как с вами связаться</h2><p>${paymentsEnabled ? 'Email нужен для связи по заказу; статус оплаты появится в кабинете' : 'Подтверждение заказа придёт на email после подключения отправки уведомлений'}</p></div></div><div class="checkout-fields"><label>Имя и фамилия<input name="name" required autocomplete="name" maxlength="100" value="${field('name')}" placeholder="Как к вам обращаться"></label><label>Email<input type="email" name="email" required autocomplete="email" maxlength="160" value="${field('email')}" placeholder="name@example.com"></label><label>Телефон<input type="tel" name="phone" required autocomplete="tel" minlength="6" maxlength="24" value="${field('phone')}" placeholder="+34 600 000 000"></label><label class="checkout-check"><input type="checkbox" name="whatsapp" ${checked('whatsapp')}><span>Можно связаться со мной в WhatsApp по этому номеру</span></label></div></section><section class="checkout-section"><div class="checkout-section-head"><span>02</span><div><h2>Куда доставить</h2><p>Выберите местную доставку или отправку перевозчиком по Испании</p></div></div><div class="checkout-delivery-options"><label class="checkout-choice"><input type="radio" name="deliveryRegion" value="local" ${formValues.deliveryRegion !== 'national' ? 'checked' : ''}><span><strong>Валенсия</strong><small>Доставка лично в выбранный интервал</small></span></label><label class="checkout-choice"><input type="radio" name="deliveryRegion" value="national" ${formValues.deliveryRegion === 'national' ? 'checked' : ''}><span><strong>Материковая Испания</strong><small>Отправка перевозчиком</small></span></label></div><div class="checkout-fields"><label>Город<input name="city" value="${field('city', formValues.deliveryRegion === 'national' ? '' : 'València')}" ${formValues.deliveryRegion === 'national' ? '' : 'readonly'} required autocomplete="address-level2"></label><label>Почтовый индекс<input name="postcode" required inputmode="numeric" pattern="[0-9]{5}" maxlength="5" autocomplete="postal-code" value="${field('postcode')}" placeholder="46001"></label><label class="checkout-wide">Улица<input name="street" required autocomplete="address-line1" maxlength="120" value="${field('street')}" placeholder="Название улицы"></label><label>Номер дома<input name="building" required maxlength="16" value="${field('building')}" placeholder="12"></label><label>Квартира, этаж, дверь <small>Если есть</small><input name="apartment" autocomplete="address-line2" maxlength="80" value="${field('apartment')}" placeholder="2 этаж, дверь 4"></label><label class="checkout-wide">Комментарий для доставки <small>Необязательно</small><textarea name="note" rows="2" maxlength="300" placeholder="Код домофона или удобный вход">${field('note')}</textarea></label></div><p class="checkout-help">${formValues.deliveryRegion === 'national' ? 'Доставка: 9,99 € до 49 €, 3,99 € от 49 €, бесплатно от 99 €' : paymentsEnabled ? 'Проверьте адрес: доставку по Валенсии подтвердим после оформления' : 'Адрес пока не проверяется по карте. Точную зону доставки подтвердим после подключения сервера.'}</p></section>${deliveryStep(context)}<section class="checkout-section"><div class="checkout-section-head"><span>04</span><div><h2>Скидка и оплата</h2><p>${paymentsEnabled ? 'После проверки заказа перейдёте на защищённую страницу Stripe' : 'Онлайн-оплата появится после подключения Stripe'}</p></div></div><div class="checkout-promo"><label>Промокод<input name="promoCode" value="${field('promoCode', promo?.code || '')}" maxlength="40" placeholder="Введите код"></label><button type="button" class="button outline" data-checkout-promo>Применить</button></div>${promoError ? `<p class="checkout-error" role="alert">${e(promoError)}</p>` : ''}<div class="checkout-payment">${icon('shield')} <span>${paymentsEnabled ? 'Оплата картой через Stripe. Данные карты вводятся только на защищённой странице Stripe' : 'Карта онлайн - подключим перед приёмом заказов. Данные карты здесь не вводятся.'}</span></div></section><p class="checkout-help">${purchaseTermsLink()}</p><p class="checkout-error" data-checkout-error role="alert"></p><button class="button checkout-next" type="submit">Проверить данные ${icon('arrow')}</button><p class="checkout-help">${paymentsEnabled ? 'На следующем шаге проверьте заказ и перейдите к оплате' : 'На следующем шаге проверьте данные. Оплата станет доступна после включения приёма заказов.'}</p></form>${summary(items, promo)}</div><div class="checkout-after"><a href="#/support">Нужна помощь с заказом ${icon('arrow')}</a><a href="#/returns">Как оформить возврат ${icon('arrow')}</a></div></div>`;
  }

  function previewPage() {
    const items = getItems();
    if (!isReady() || !preview || preview.signature !== cartSignature(items)) return `<div class="page checkout-page"><h1>Проверьте корзину ещё раз</h1><p>Состав заказа изменился или данные оформления не сохранились после обновления страницы</p><a class="button" href="#/checkout">К оформлению ${icon('arrow')}</a></div>`;
    const { values, promo } = preview;
    const context = getCheckoutContext();
    if (values.deliveryMode === 'slot' && validateCheckout(values))
      return `<div class="page checkout-page"><h1>Интервал больше недоступен</h1><p>Выберите другой день и время доставки</p><a class="button" href="#/checkout">Изменить доставку ${icon('arrow')}</a></div>`;
    const paymentAvailable = paymentsEnabled && context.pricesConfirmed !== false &&
      (values.deliveryMode !== 'national' || shippingQuote?.nationalCheckoutEnabled === true);
    const address = `${values.street}, ${values.building}${values.apartment ? ', ' + values.apartment : ''}, ${values.postcode} ${values.city}`;
    const when = values.deliveryMode === 'national' ? 'Отправка перевозчиком, срок уточним после оформления' : values.deliveryMode === 'preorder' ? 'Ориентир 24-48 часов' : values.deliveryMode === 'slot' ? `${values.deliverySlot?.replace('|', ', ')} по Валенсии` : values.deliveryMode === 'soon' ? 'Сегодня, как можно скорее' : `${values.deliveryDate}, ${values.deliveryTime}`;
    const states = paymentAvailable ? `<section class="checkout-state-examples"><h2>Оплата картой</h2><p>Сначала проверим цену и наличие, затем откроем защищённую страницу Stripe</p>${paymentError ? `<p class="checkout-error" role="alert">${e(paymentError)}</p>` : ''}<p class="checkout-help">${purchaseTermsLink()}</p><button type="button" class="button" data-checkout-pay>Перейти к оплате ${icon('arrow')}</button></section>` : `<section class="checkout-state-examples"><h2>Оплата картой</h2><p>${context.pricesConfirmed === false ? 'Часть цен пока ориентировочная. Доставка и сумма показаны для проверки, оплату откроем после подтверждения цен. Заказ пока не создан' : values.deliveryMode === 'national' && !shippingQuote?.nationalCheckoutEnabled ? 'Стоимость доставки рассчитана для проверки. Оплату отправки по Испании включим после проверки упаковки и тарифов' : 'Приём заказов пока закрыт. Товары и контактные данные не отправлены'}</p><button type="button" class="button" disabled>Перейти к оплате ${icon('arrow')}</button></section>`;
    return `<div class="page checkout-page rc-flow-page live-order-page">${progress(2)}<div class="rc-flow-heading"><h1>Всё верно?</h1><p>Проверьте данные и итоговую сумму перед оплатой</p></div><div class="checkout-layout rc-flow-layout"><div class="checkout-preview"><section class="checkout-section"><h2>Доставка</h2><dl><div><dt>Получатель</dt><dd>${e(values.name)}</dd></div><div><dt>Адрес</dt><dd>${e(address)}</dd></div><div><dt>Когда удобно</dt><dd>${e(when)}</dd></div><div><dt>Телефон</dt><dd>${e(values.phone)}${values.whatsapp ? ' · WhatsApp' : ''}</dd></div><div><dt>Email</dt><dd>${e(values.email)}</dd></div>${values.note ? `<div><dt>Комментарий</dt><dd>${e(values.note)}</dd></div>` : ''}</dl></section><div class="checkout-preview-notice">${icon('shield')} <div><strong>Заказ пока не создан</strong><p>${paymentAvailable ? 'После нажатия кнопки оплаты проверим корзину и откроем Stripe. Заказ начнём выполнять после подтверждения платежа.' : 'Заказ пока не создан. Товары и контактные данные не отправлены.'}</p></div></div><a class="button outline" href="#/checkout">Изменить данные ${icon('arrow')}</a>${states}</div>${summary(items, promo, values.deliveryMode === 'national' ? shippingQuote : null)}</div></div>`;
  }

  function resultPage(kind, params = new URLSearchParams()) {
    if (params.has('session_id'))
      return liveResultPage(kind, params);
    return `<div class="page checkout-page"><h1>Заказ не найден</h1><p>Вернитесь к оформлению, чтобы проверить товары и данные доставки</p><a class="button" href="#/cart">В корзину ${icon('arrow')}</a></div>`;
  }

  function servicePage(kind, params = new URLSearchParams()) {
    const returning = kind === 'return';
    const title = returning ? 'Запрос на возврат' : 'Помощь с заказом';
    const orderNumber = params.get('order') || '';
    const accountOrder = findOrder?.(orderNumber) || null;
    const linkedOrder = accountOrder;
    const selectedProduct = params.get('product') || '';
    const saved = servicePreview?.kind === kind && servicePreview.routeOrderNumber === orderNumber;
    const draftValues = saved ? servicePreview.values : {};
    const emailPrefill = draftValues.email || '';
    const back = accountOrder ? `#/account/orders/${encodeURIComponent(accountOrder.id)}` : '#/info/delivery';
    const choices = linkedOrder?.items.map(item => {
      const key = `${item.productId}|${item.variantId || ''}`;
      const label = productLabel?.(item) || item.name || 'Товар';
      return `<option value="${e(label)}" data-product-id="${e(item.productId)}" data-variant-id="${e(item.variantId || '')}" data-qty="${item.qty}" ${selectedProduct === key || (!selectedProduct && draftValues.product === label) ? 'selected' : ''}>${e(label)}</option>`;
    }).join('') || '';
    const selectArrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    const productField = linkedOrder
      ? `<label class="checkout-wide">${returning ? 'Товар (при наличии)' : 'Товар (если вопрос о товаре)'}<span class="service-select"><select name="product"><option value="">${returning ? 'Выберите товар из заказа (при наличии)' : 'Весь заказ'}</option>${choices}</select>${selectArrow}</span></label>`
      : `<label class="checkout-wide">${returning ? 'Товар (при наличии)' : 'Товар (если вопрос о товаре)'}<input name="product" maxlength="120" value="${e(draftValues.product || '')}" placeholder="Название товара и фасовка"></label>`;
    const selectedQuantity = linkedOrder?.items.find(item => `${item.productId}|${item.variantId || ''}` === selectedProduct ||
      (draftValues.product && productLabel?.(item) === draftValues.product))?.qty || 99;
    const quantityField = returning ? `<label>Количество<input type="number" name="quantity" min="1" max="${selectedQuantity}" value="${e(Math.min(Number(draftValues.quantity) || 1, selectedQuantity))}" required></label>` : '';
    const topicField = returning ? '' : `<label class="checkout-wide">Тема<span class="service-select"><select name="topic">${['Вопрос о заказе', 'Доставка', 'Товар', 'Другое'].map(value => `<option value="${e(value)}" ${draftValues.topic === value ? 'selected' : ''}>${value}</option>`).join('')}</select>${selectArrow}</span></label>`;
    const sent = saved && servicePreview.sent === true;
    const demoNumber = saved && /^DEMO-/.test(servicePreview.values.orderNumber || '');
    const draft = saved ? `<div class="checkout-preview-notice service-draft" id="service-preview" role="status">${icon(sent ? 'check' : 'shield')} <div><strong>${sent ? 'Обращение отправлено' : 'Проверьте обращение'}</strong><p>${sent ? 'Мы сохранили обращение и ответим на указанный email' : supportEnabled ? demoNumber ? 'Демозаказ служит примером. Для настоящего обращения откройте форму без демонстрационного номера.' : 'Проверьте данные и отправьте обращение.' : 'Это черновик. Сообщение не отправлено.'}</p>${supportEnabled && demoNumber ? `<a class="text-link" href="#/${returning ? 'returns' : 'support'}">Открыть новую форму</a>` : ''}<dl><div><dt>Заказ</dt><dd>${e(servicePreview.values.orderNumber || 'Не указан')}</dd></div><div><dt>Email</dt><dd>${e(servicePreview.values.email)}</dd></div><div><dt>Товар</dt><dd>${e(servicePreview.values.product || 'Весь заказ')}</dd></div>${returning ? `<div><dt>Количество</dt><dd>${e(servicePreview.values.quantity)}</dd></div>` : ''}${!returning ? `<div><dt>Тема</dt><dd>${e(servicePreview.values.topic)}</dd></div>` : ''}<div><dt>Сообщение</dt><dd>${e(servicePreview.values.message)}</dd></div></dl>${serviceError ? `<p class="checkout-error" role="alert">${e(serviceError)}</p>` : ''}${supportEnabled && !sent && !demoNumber ? `<button type="button" class="button" data-service-send>Отправить обращение ${icon('arrow')}</button>` : ''}</div></div>` : '';
    const formNote = supportEnabled
      ? 'Сначала проверьте обращение, затем отправьте его.'
      : 'Это предварительный просмотр. Сообщение не отправляется и не сохраняется.';
    return `<div class="page checkout-page service-page">
      <a class="text-link" href="${back}">${icon('arrow')} ${linkedOrder ? 'К заказу' : 'Доставка и возврат'}</a>
      <span class="checkout-eyebrow">Мы рядом</span><h1>${title}</h1>
      <p class="checkout-lead">${returning ? 'Сообщите, от какого товара вы отказываетесь. Объяснять причину не нужно' : 'Опишите вопрос, чтобы мы могли найти ваш заказ и помочь'}</p>
      <div class="service-layout"><form class="checkout-form checkout-section" data-service-form="${kind}">
        <div class="checkout-fields">
          <label>Номер заказа (при наличии)<input name="orderNumber" ${linkedOrder ? 'readonly' : ''} maxlength="40" value="${e(orderNumber || draftValues.orderNumber || '')}" placeholder="CMD-0000"></label>
          <label>Email для ответа<input type="email" name="email" required autocomplete="email" maxlength="160" value="${e(emailPrefill)}" placeholder="name@example.com"></label>
          ${productField}${quantityField}${topicField}
          <label class="checkout-wide">${returning ? 'Сообщение о возврате' : 'Ваш вопрос'}<textarea name="message" required minlength="10" maxlength="1200" rows="5" placeholder="Расскажите подробнее">${e(draftValues.message || (returning ? (locale() === 'es' ? 'Comunico mi decisión de desistir de la compra a distancia' : 'Сообщаю об отказе от дистанционной покупки') : ''))}</textarea></label>
        </div>
        <div class="service-form-footer"><p>${formNote}</p><button class="button" type="submit">Проверить обращение ${icon('arrow')}</button></div>
      </form><aside class="checkout-summary"><h2>Что будет дальше</h2><p>${supportEnabled ? 'После отправки обращение попадёт к команде. Для ответа используем указанный email.' : 'После подключения поддержки обращения будут привязаны к заказу. Мы покажем статус и способ связи с командой.'}</p><a class="text-link" href="${back}">${linkedOrder ? 'Вернуться к заказу' : 'Доставка и возврат'}</a></aside></div>${draft}</div>`;
  }

  function remember(form) {
    const values = Object.fromEntries(new FormData(form).entries());
    values.whatsapp = new FormData(form).has('whatsapp');
    formValues = values;
    return values;
  }

  async function startPayment(button) {
    if (!paymentsEnabled || getCheckoutContext().pricesConfirmed === false ||
        !preview || preview.signature !== cartSignature(getItems())) return;
    button.disabled = true;
    paymentError = '';
    const items = getItems();
    const { values, promo } = preview;
    try {
      const deliveryError = validateCheckout(values);
      if (deliveryError) throw new Error(deliveryError);
      const request = (path, body) => fetch(path, { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const lines = items.map(item => ({ productId: item.productId, variantId: item.variantId, qty: item.qty }));
      const quoteResponse = await request('/api/checkout/quote', { items: lines,
        promoCode: promo?.code || '', email: values.email, phone: values.phone,
        address: { postcode: values.postcode }, delivery: { mode: values.deliveryMode } });
      const quote = await quoteResponse.json().catch(() => ({}));
      if (!quoteResponse.ok || !quote.orderable) throw new Error(quote.error || 'Проверьте цену и наличие товаров');
      const shownTotal = Math.round(checkoutTotals(items, promo,
        values.deliveryMode === 'national' ? shippingQuote?.deliveryCents : null).total * 100);
      if (quote.totalCents !== shownTotal) {
        await refreshPromo().catch(() => {});
        preview.promo = getPromo();
        if (quote.totalCents === Math.round(checkoutTotals(items, preview.promo,
          values.deliveryMode === 'national' ? shippingQuote?.deliveryCents : null).total * 100))
          throw new Error('Скидка обновлена. Проверьте итог и нажмите оплату ещё раз');
        throw new Error(`Итоговая цена изменилась: ${money(quote.totalCents / 100)}. Обновите корзину перед оплатой`);
      }
      const signature = JSON.stringify([preview.signature, values, promo?.code || '']);
      let saved;
      try { saved = JSON.parse(sessionStorage.getItem('catmandog-payment-attempt') || 'null'); } catch { /* Invalid draft */ }
      const key = saved?.signature === signature ? saved.key : crypto.randomUUID();
      sessionStorage.setItem('catmandog-payment-attempt', JSON.stringify({ key, signature,
        cartSignature: preview.signature }));
      const payload = { items: lines, promoCode: promo?.code || '', idempotencyKey: key, locale: locale(),
        name: values.name, email: values.email, phone: values.phone, whatsapp: values.whatsapp,
        address: { city: values.city, postcode: values.postcode, street: values.street,
          building: values.building, apartment: values.apartment, note: values.note },
        delivery: values.deliveryMode === 'national' ? { mode: 'national' }
          : values.deliveryMode === 'preorder' ? { mode: 'preorder' }
          : values.deliveryMode === 'slot' ? { mode: 'slot', date: values.deliverySlot.split('|')[0], window: values.deliverySlot.split('|')[1] }
          : values.deliveryMode === 'soon' ? { mode: 'soon' }
          : { mode: 'scheduled', date: values.deliveryDate, time: values.deliveryTime } };
      const response = await request('/api/checkout/start', payload);
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !/^https:\/\/checkout\.stripe\.com\//.test(result.url || ''))
        throw new Error(result.error || 'Не удалось открыть безопасную оплату');
      location.assign(result.url);
    } catch (error) {
      await refreshPromo().catch(() => {});
      if (preview) preview.promo = getPromo();
      paymentError = error.message;
      button.disabled = false;
      render();
    }
  }

  async function loadPaymentReturn(sessionId) {
    try {
      const response = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`,
        { credentials: 'same-origin' });
      const result = await response.json().catch(() => ({}));
      paymentReturn = { sessionId, ...(response.ok ? result : { error: result.error || 'Заказ пока не найден' }) };
      if (result.paymentStatus === 'paid') {
        try {
          const saved = JSON.parse(sessionStorage.getItem('catmandog-payment-attempt') || 'null');
          if (saved?.cartSignature === cartSignature(getItems())) remainingAfterPayment = onPaid?.(getItems()) === true;
          sessionStorage.removeItem('catmandog-payment-attempt');
        } catch { /* Local storage can be unavailable */ }
      }
    } catch { paymentReturn = { sessionId, error: 'Не удалось проверить оплату' }; }
    render();
  }

  function liveResultPage(kind, params) {
    if (kind === 'failed') return `<div class="page checkout-page checkout-result"><h1>Вы вернулись с оплаты</h1><p class="checkout-lead">Платёж не подтверждён. Товары остались в корзине. Вы можете вернуться к оформлению</p><a class="button" href="#/checkout">Вернуться к оформлению ${icon('arrow')}</a></div>`;
    const sessionId = params.get('session_id') || '';
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId))
      return `<div class="page checkout-page"><h1>Статус оплаты</h1><p>Не удалось определить платёж</p><a class="button" href="#/account/orders">Мои заказы ${icon('arrow')}</a></div>`;
    if (paymentReturn?.sessionId !== sessionId) {
      void loadPaymentReturn(sessionId);
      return `<div class="page checkout-page"><h1>Проверяем оплату</h1><p>Подождите, пока банк подтвердит платёж</p></div>`;
    }
    const state = paymentReturn;
    const paid = state.paymentStatus === 'paid';
    return `<div class="page checkout-page checkout-result"><h1>${paid ? 'Оплата подтверждена' : 'Проверяем оплату'}</h1>
      <p class="checkout-lead">${paid ? 'Заказ передан в работу' : state.error || 'Подтверждение от платёжной системы ещё не поступило'}</p>
      ${state.number ? `<div class="checkout-preview-notice">${icon('shield')}<div><strong>Заказ ${e(state.number)}</strong><p>Сумма ${money(state.totalCents / 100)}</p></div></div>` : ''}
      <div class="checkout-result-actions"><a class="button outline" href="#/account/orders">Мои заказы ${icon('arrow')}</a>
      ${paid ? remainingAfterPayment ? '<a class="button" href="#/cart">Оформить оставшиеся товары</a>' : '<a class="text-link" href="#/catalog">Продолжить покупки</a>' : '<button type="button" class="button" data-payment-refresh>Проверить ещё раз</button>'}</div></div>`;
  }

  async function sendService(button) {
    if (!supportEnabled || !servicePreview || servicePreview.sent || /^DEMO-/.test(servicePreview.values.orderNumber || '')) return;
    button.disabled = true;
    serviceError = '';
    try {
      const response = await fetch('/api/service-requests', { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(servicePreview.payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.accepted) throw new Error(result.error || 'Не удалось отправить обращение');
      servicePreview.sent = true;
      servicePreview.id = result.id;
    } catch (error) { serviceError = error.message; }
    render();
    document.getElementById('service-preview')?.scrollIntoView({ block: 'start' });
  }

  async function click(button) {
    if (button.hasAttribute('data-checkout-pay')) { void startPayment(button); return; }
    if (button.hasAttribute('data-payment-refresh')) {
      const sessionId = new URLSearchParams((location.hash || '').split('?')[1] || '').get('session_id');
      if (sessionId) void loadPaymentReturn(sessionId);
      return;
    }
    if (button.hasAttribute('data-service-send')) { void sendService(button); return; }
    if (!button.hasAttribute('data-checkout-promo')) return;
    const form = button.closest('form');
    const values = remember(form);
    try { await applyPromo(String(values.promoCode || '')); formValues.promoCode = getPromo()?.code || ''; promoError = ''; }
    catch (error) { promoError = error.message; }
    render();
  }

  function change(target) {
    if (target.name === 'product' && target.closest('[data-service-form="return"]')) {
      const quantity = target.form.elements.quantity;
      quantity.max = target.selectedOptions[0]?.dataset.qty || 99;
      if (Number(quantity.value) > Number(quantity.max)) quantity.value = quantity.max;
      return;
    }
    if (target.name === 'deliveryRegion') {
      remember(target.form);
      formValues.city = target.value === 'national' ? '' : 'València';
      shippingQuote = null;
      render();
      return;
    }
    if (target.name !== 'deliveryMode') return;
    const form = target.closest('form');
    const scheduled = target.value === 'scheduled';
    const fields = form.querySelector('.checkout-schedule');
    fields.hidden = !scheduled;
    fields.querySelectorAll('input').forEach(input => { input.required = scheduled; });
  }

  function submit(form) {
    if (form.matches('[data-checkout-form]')) {
      const values = remember(form);
      const error = validateCheckout(values);
      if (error) { form.querySelector('[data-checkout-error]').textContent = error; return; }
      const items = getItems();
      if (!items.length || !isReady()) { form.querySelector('[data-checkout-error]').textContent = 'Проверьте товары и варианты в корзине'; return; }
      if (values.deliveryMode === 'national') {
        form.querySelector('[data-checkout-error]').textContent = 'Рассчитываем доставку по Испании';
        const lines = items.map(item => ({ productId: item.productId, variantId: item.variantId, qty: item.qty }));
        void fetch('/api/checkout/shipping-quote', { method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: lines, postcode: values.postcode,
            promoCode: getPromo()?.code || '', email: values.email, phone: values.phone }) })
          .then(async response => {
            if (!response.ok) throw new Error('Не удалось рассчитать доставку');
            const result = await response.json();
            if (!result.available) throw new Error('Для этой корзины доставка по Испании пока недоступна');
            shippingQuote = result;
            preview = { values, promo: getPromo(), signature: cartSignature(items) };
            location.hash = '/checkout/preview';
          }).catch(error => { form.querySelector('[data-checkout-error]').textContent = error.message; });
        return;
      }
      shippingQuote = null;
      preview = { values, promo: getPromo(), signature: cartSignature(items) };
      location.hash = '/checkout/preview';
      return;
    }
    if (form.matches('[data-service-form]')) {
      const values = Object.fromEntries(new FormData(form).entries());
      const selected = form.elements.product?.selectedOptions?.[0];
      const quantity = form.dataset.serviceForm === 'return' ? Number(values.quantity) : null;
      const context = [values.topic, values.product && `Товар: ${values.product}`].filter(Boolean).join(' | ');
      const message = `${context ? context + '\n' : ''}${values.message}`.slice(0, 1200);
      serviceError = '';
      servicePreview = { kind: form.dataset.serviceForm,
        routeOrderNumber: new URLSearchParams((globalThis.location?.hash || '').split('?')[1] || '').get('order') || '',
        values, sent: false,
        payload: { kind: form.dataset.serviceForm, locale: locale(), orderNumber: values.orderNumber,
          email: values.email, productId: selected?.dataset.productId || null,
          variantId: selected?.dataset.variantId || null, quantity, message } };
      render();
      document.getElementById('service-preview')?.scrollIntoView({ block: 'start' });
    }
  }

  function invalidateService() {
    if (!servicePreview) return;
    servicePreview = null;
    document.getElementById('service-preview')?.remove();
  }

  return { page, previewPage, resultPage, servicePage, click, change, submit,
    initialize, invalidateService, isSupportEnabled: () => supportEnabled };
}
