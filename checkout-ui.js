import { checkoutTotals, deliveryTiming, FREE_DELIVERY_FROM, DELIVERY_FEE, validateCheckout } from './checkout-model.js';
import { orderProgress } from './order-progress.js';

export function createCheckoutUI({ escape: e, icon, money, imageBlock, getItems, isReady, getPromo, applyPromo, findOrder, productLabel, render }) {
  let formValues = {};
  let promoError = '';
  let preview = null;
  let demonstration = null;
  let servicePreview = null;
  let supportEnabled = false;
  let serviceError = '';

  async function initialize() {
    try {
      const response = await fetch('/api/config', { credentials: 'same-origin' });
      if (!response.ok) return;
      supportEnabled = (await response.json()).supportEnabled === true;
      if (supportEnabled && /^#\/(support|returns)/.test(location.hash)) render();
    } catch { /* The local file preview has no API */ }
  }

  const cartSignature = items => JSON.stringify(items.map(item => [item.productId, item.variantId, item.qty, item.price]));
  const field = (name, fallback = '') => e(formValues[name] ?? fallback);
  const checked = name => formValues[name] ? 'checked' : '';
  const itemsList = items => `<div class="checkout-items">${items.map(item => `<div class="checkout-item">${imageBlock(item.image)}<div><strong>${e(item.name)}</strong><small>${e(item.variant || '1 шт')} · ${item.qty} шт × ${money(item.price)}</small></div><strong>${money(item.price * item.qty)}</strong></div>`).join('')}</div>`;
  const summary = (items, promo) => {
    const totals = checkoutTotals(items, promo);
    return `<aside class="checkout-summary"><h2>Ваш заказ</h2>${itemsList(items)}<div class="summary-line"><span>Товары</span><strong>${money(totals.subtotal)}</strong></div>${totals.discount ? `<div class="summary-line"><span>Промокод ${e(promo.code || '')}</span><strong>−${money(totals.discount)}</strong></div>` : ''}<div class="summary-line"><span>Доставка по Валенсии</span><strong>${totals.freeDelivery ? 'Бесплатно' : money(totals.delivery)}</strong></div><div class="summary-line total"><span>Итого с IVA</span><strong>${money(totals.total)}</strong></div><p class="checkout-caption">Бесплатная доставка от ${money(FREE_DELIVERY_FROM)} после скидки или по купону на доставку. Ниже порога - ${money(DELIVERY_FEE)}.</p></aside>`;
  };

  function page() {
    const items = getItems();
    if (!items.length) return `<div class="page checkout-page"><h1>Оформление заказа</h1><p>Корзина пуста</p><a class="button" href="#/catalog">Выбрать товары ${icon('arrow')}</a></div>`;
    if (!isReady()) return `<div class="page checkout-page"><h1>Проверьте варианты в корзине</h1><p>Для оформления каждому товару нужна конкретная фасовка и цена</p><a class="button" href="#/cart">Вернуться в корзину ${icon('arrow')}</a></div>`;
    const timing = deliveryTiming();
    const mode = formValues.deliveryMode || (timing.todayAvailable ? 'soon' : 'scheduled');
    const promo = getPromo();
    return `<div class="page checkout-page"><div class="checkout-head"><a class="text-link" href="#/cart">${icon('arrow')} Вернуться в корзину</a><span>Доставка по городу Валенсия</span></div><h1>Оформление заказа</h1><p class="checkout-lead">Укажите, куда привезти покупки. Перед отправкой заказа мы покажем все данные ещё раз</p><div class="checkout-layout"><form id="checkout-form" class="checkout-form" data-checkout-form><section class="checkout-section"><div class="checkout-section-head"><span>01</span><div><h2>Как с вами связаться</h2><p>Подтверждение заказа придёт на email после подключения отправки уведомлений</p></div></div><div class="checkout-fields"><label>Имя и фамилия<input name="name" required autocomplete="name" maxlength="100" value="${field('name')}" placeholder="Как к вам обращаться"></label><label>Email<input type="email" name="email" required autocomplete="email" maxlength="160" value="${field('email')}" placeholder="name@example.com"></label><label>Телефон<input type="tel" name="phone" required autocomplete="tel" minlength="6" maxlength="24" value="${field('phone')}" placeholder="+34 600 000 000"></label><label class="checkout-check"><input type="checkbox" name="whatsapp" ${checked('whatsapp')}><span>Можно связаться со мной в WhatsApp по этому номеру</span></label></div></section><section class="checkout-section"><div class="checkout-section-head"><span>02</span><div><h2>Куда доставить</h2><p>Пока доставляем лично только по городу Валенсия</p></div></div><div class="checkout-fields"><label>Город<input name="city" value="València" readonly autocomplete="address-level2"></label><label>Почтовый индекс<input name="postcode" required inputmode="numeric" pattern="[0-9]{5}" maxlength="5" autocomplete="postal-code" value="${field('postcode')}" placeholder="46001"></label><label class="checkout-wide">Улица<input name="street" required autocomplete="address-line1" maxlength="120" value="${field('street')}" placeholder="Название улицы"></label><label>Номер дома<input name="building" required maxlength="16" value="${field('building')}" placeholder="12"></label><label>Квартира, этаж, дверь <small>Если есть</small><input name="apartment" autocomplete="address-line2" maxlength="80" value="${field('apartment')}" placeholder="2 этаж, дверь 4"></label><label class="checkout-wide">Комментарий для доставки <small>Необязательно</small><textarea name="note" rows="2" maxlength="300" placeholder="Код домофона или удобный вход">${field('note')}</textarea></label></div><p class="checkout-help">Адрес пока не проверяется по карте. Точную зону доставки подтвердим после подключения сервера.</p></section><section class="checkout-section"><div class="checkout-section-head"><span>03</span><div><h2>Когда удобно получить</h2><p>Время пока ориентировочное и не бронируется</p></div></div><div class="checkout-delivery-options">${timing.todayAvailable ? `<label class="checkout-choice"><input type="radio" name="deliveryMode" value="soon" ${mode === 'soon' ? 'checked' : ''}><span><strong>Сегодня, как можно скорее</strong><small>Ориентир - не раньше ${e(timing.time)} по Валенсии</small></span></label>` : ''}<label class="checkout-choice"><input type="radio" name="deliveryMode" value="scheduled" ${mode === 'scheduled' ? 'checked' : ''}><span><strong>Выбрать дату и время</strong><small>Укажите удобное время, мы подтвердим его отдельно</small></span></label><div class="checkout-schedule" ${mode === 'scheduled' ? '' : 'hidden'}><label>Дата<input type="date" name="deliveryDate" min="${e(timing.date)}" value="${field('deliveryDate', timing.date)}" ${mode === 'scheduled' ? 'required' : ''}></label><label>Желаемое время<input type="time" name="deliveryTime" value="${field('deliveryTime', timing.time)}" ${mode === 'scheduled' ? 'required' : ''}></label></div></div></section><section class="checkout-section"><div class="checkout-section-head"><span>04</span><div><h2>Скидка и оплата</h2><p>Онлайн-оплата появится после подключения Stripe</p></div></div><div class="checkout-promo"><label>Промокод<input name="promoCode" value="${field('promoCode', promo?.code || '')}" maxlength="40" placeholder="Введите код"></label><button type="button" class="button outline" data-checkout-promo>Применить</button></div>${promoError ? `<p class="checkout-error" role="alert">${e(promoError)}</p>` : ''}<div class="checkout-payment">${icon('shield')} <span>Карта онлайн - подключим перед приёмом заказов. Данные карты здесь не вводятся.</span></div></section><p class="checkout-error" data-checkout-error role="alert"></p><button class="button checkout-next" type="submit">Проверить данные ${icon('arrow')}</button><p class="checkout-help">Это прототип оформления. Нажатие покажет предпросмотр - заказ не будет создан или оплачен.</p></form>${summary(items, promo)}</div><div class="checkout-after"><a href="#/support">Нужна помощь с заказом ${icon('arrow')}</a><a href="#/returns">Как оформить возврат ${icon('arrow')}</a></div></div>`;
  }

  function previewPage() {
    const items = getItems();
    if (!isReady() || !preview || preview.signature !== cartSignature(items)) return `<div class="page checkout-page"><h1>Проверьте корзину ещё раз</h1><p>Состав заказа изменился или данные оформления не сохранились после обновления страницы</p><a class="button" href="#/checkout">К оформлению ${icon('arrow')}</a></div>`;
    const { values, promo } = preview;
    const address = `${values.street}, ${values.building}${values.apartment ? ', ' + values.apartment : ''}, ${values.postcode} València`;
    const when = values.deliveryMode === 'soon' ? 'Сегодня, как можно скорее' : `${values.deliveryDate}, ${values.deliveryTime}`;
    const states = `<section class="checkout-state-examples"><h2>Следующий шаг после подключения оплаты</h2><p>Эти экраны можно посмотреть сейчас как образцы интерфейса. Они не создают заказ и не списывают деньги.</p><div><button type="button" class="button" data-checkout-state="accepted">Пример подтверждения ${icon('arrow')}</button><button type="button" class="button outline" data-checkout-state="failed">Пример ошибки оплаты ${icon('arrow')}</button></div></section>`;
    return `<div class="page checkout-page"><span class="checkout-eyebrow">Предпросмотр подтверждения</span><h1>Всё верно?</h1><p class="checkout-lead">Проверьте данные перед настоящим оформлением заказа</p><div class="checkout-layout"><div class="checkout-preview"><section class="checkout-section"><h2>Доставка</h2><dl><div><dt>Получатель</dt><dd>${e(values.name)}</dd></div><div><dt>Адрес</dt><dd>${e(address)}</dd></div><div><dt>Когда удобно</dt><dd>${e(when)}</dd></div><div><dt>Телефон</dt><dd>${e(values.phone)}${values.whatsapp ? ' · WhatsApp' : ''}</dd></div><div><dt>Email</dt><dd>${e(values.email)}</dd></div>${values.note ? `<div><dt>Комментарий</dt><dd>${e(values.note)}</dd></div>` : ''}</dl></section><div class="checkout-preview-notice">${icon('shield')} <div><strong>Заказ пока не создан</strong><p>Оплата, отправка заказа и уведомления ещё не подключены. Эта страница показывает, как будет выглядеть подтверждение, без передачи ваших данных.</p></div></div><a class="button outline" href="#/checkout">Изменить данные ${icon('arrow')}</a>${states}</div>${summary(items, promo)}</div></div>`;
  }

  function resultPage(kind) {
    const items = getItems();
    if (!preview || !demonstration || preview.signature !== cartSignature(items) || !isReady() ||
        (kind === 'failed' ? demonstration.kind !== 'failed' : demonstration.kind !== 'accepted')) {
      return `<div class="page checkout-page"><h1>Сначала проверьте заказ</h1><p>Демонстрационный экран доступен после заполнения формы оформления</p><a class="button" href="#/checkout">К оформлению ${icon('arrow')}</a></div>`;
    }
    const { values, promo } = preview;
    if (kind === 'failed') return `<div class="page checkout-page checkout-result"><span class="checkout-eyebrow">Пример состояния оплаты</span><h1>Оплата не прошла</h1><p class="checkout-lead">Так будет выглядеть экран, если платёж не удастся завершить. Сейчас оплата не подключена и списания не было.</p><div class="checkout-layout"><div><div class="checkout-preview-notice checkout-failed">${icon('shield')}<div><strong>Товары остались в корзине</strong><p>Можно будет повторить оплату или выбрать другой способ, когда мы подключим платёжную систему.</p></div></div><a class="button" href="#/checkout">Вернуться к оформлению ${icon('arrow')}</a><a class="text-link checkout-secondary-link" href="#/support">Помощь с заказом</a></div>${summary(items, promo)}</div></div>`;
    const address = `${values.street}, ${values.building}${values.apartment ? ', ' + values.apartment : ''}, ${values.postcode} València`;
    const when = values.deliveryMode === 'soon' ? 'Сегодня, как можно скорее' : `${values.deliveryDate}, ${values.deliveryTime}`;
    const statusOnly = kind === 'status';
    const supportLink = `#/support?order=${encodeURIComponent(demonstration.number)}`;
    const returnLink = `#/returns?order=${encodeURIComponent(demonstration.number)}`;
    return `<div class="page checkout-page checkout-result"><span class="checkout-eyebrow">${statusOnly ? 'Пример отслеживания' : 'Пример подтверждения'}</span><h1>${statusOnly ? 'Где мой заказ' : 'Заказ принят'}</h1><p class="checkout-lead">${statusOnly ? 'Так будет выглядеть история заказа после подключения сервера' : 'Так будет выглядеть подтверждение после успешной оплаты'}</p><div class="checkout-preview-notice">${icon('shield')}<div><strong>Демонстрационный заказ ${e(demonstration.number)}</strong><p>Этот номер служит только примером. Заказ не отправлен, оплата не проведена и уведомления не отправлялись.</p></div></div><div class="checkout-layout"><div><section class="checkout-section"><h2>Статус заказа</h2>${orderProgress('received', { icon, escape: e })}<p class="checkout-help">Статус показан для примера и не обновляется автоматически</p></section><section class="checkout-section checkout-preview"><h2>Доставка и контакты</h2><dl><div><dt>Получатель</dt><dd>${e(values.name)}</dd></div><div><dt>Адрес</dt><dd>${e(address)}</dd></div><div><dt>Желаемое время</dt><dd>${e(when)}</dd></div><div><dt>Телефон</dt><dd>${e(values.phone)}${values.whatsapp ? ' · WhatsApp' : ''}</dd></div><div><dt>Email</dt><dd>${e(values.email)}</dd></div></dl></section><div class="checkout-result-actions">${statusOnly ? '<a class="text-link" href="#/checkout/confirmation">К подтверждению</a>' : `<a class="button outline" href="#/checkout/status">Посмотреть статус ${icon('arrow')}</a>`}<a class="text-link" href="${supportLink}">Помощь с заказом</a><a class="text-link" href="${returnLink}">Запросить возврат</a><a class="text-link" href="#/catalog">Продолжить покупки</a></div></div>${summary(items, promo)}</div></div>`;
  }

  function servicePage(kind, params = new URLSearchParams()) {
    const returning = kind === 'return';
    const title = returning ? 'Запрос на возврат' : 'Помощь с заказом';
    const orderNumber = params.get('order') || '';
    const accountOrder = findOrder?.(orderNumber) || null;
    const demoOrder = !accountOrder && demonstration?.kind === 'accepted' && demonstration.number === orderNumber &&
      preview?.signature === cartSignature(getItems()) ? { id: null, number: orderNumber, items: getItems() } : null;
    const linkedOrder = accountOrder || demoOrder;
    const selectedProduct = params.get('product') || '';
    const saved = servicePreview?.kind === kind && servicePreview.routeOrderNumber === orderNumber;
    const draftValues = saved ? servicePreview.values : {};
    const emailPrefill = draftValues.email || (demoOrder ? preview.values.email : '');
    const back = accountOrder ? `#/account/orders/${encodeURIComponent(accountOrder.id)}` : demoOrder ? '#/checkout/status' : '#/info/delivery';
    const choices = linkedOrder?.items.map(item => {
      const key = `${item.productId}|${item.variantId || ''}`;
      const label = demoOrder ? `${item.name} · ${item.variant || '1 шт'}` : productLabel?.(item) || item.name || 'Товар';
      return `<option value="${e(label)}" data-product-id="${e(item.productId)}" data-variant-id="${e(item.variantId || '')}" data-qty="${item.qty}" ${selectedProduct === key || (!selectedProduct && draftValues.product === label) ? 'selected' : ''}>${e(label)}</option>`;
    }).join('') || '';
    const selectArrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    const productField = linkedOrder
      ? `<label class="checkout-wide">${returning ? 'Товар' : 'Товар (если вопрос о товаре)'}<span class="service-select"><select name="product" ${returning ? 'required' : ''}><option value="">${returning ? 'Выберите товар из заказа' : 'Весь заказ'}</option>${choices}</select>${selectArrow}</span></label>`
      : `<label class="checkout-wide">${returning ? 'Товар' : 'Товар (если вопрос о товаре)'}<input name="product" ${returning ? 'required' : ''} maxlength="120" value="${e(draftValues.product || '')}" placeholder="Название товара и фасовка"></label>`;
    const selectedQuantity = linkedOrder?.items.find(item => `${item.productId}|${item.variantId || ''}` === selectedProduct ||
      (draftValues.product && (demoOrder ? `${item.name} · ${item.variant || '1 шт'}` : productLabel?.(item)) === draftValues.product))?.qty || 99;
    const quantityField = returning ? `<label>Количество<input type="number" name="quantity" min="1" max="${selectedQuantity}" value="${e(Math.min(Number(draftValues.quantity) || 1, selectedQuantity))}" required></label>` : '';
    const topicField = returning ? '' : `<label class="checkout-wide">Тема<span class="service-select"><select name="topic">${['Вопрос о заказе', 'Доставка', 'Товар', 'Другое'].map(value => `<option ${draftValues.topic === value ? 'selected' : ''}>${value}</option>`).join('')}</select>${selectArrow}</span></label>`;
    const sent = saved && servicePreview.sent === true;
    const demoNumber = saved && /^DEMO-/.test(servicePreview.values.orderNumber || '');
    const draft = saved ? `<div class="checkout-preview-notice service-draft" id="service-preview" role="status">${icon(sent ? 'check' : 'shield')} <div><strong>${sent ? 'Обращение отправлено' : 'Проверьте обращение'}</strong><p>${sent ? 'Мы сохранили обращение и ответим на указанный email' : supportEnabled ? demoNumber ? 'Демозаказ служит примером. Для настоящего обращения откройте форму без демонстрационного номера.' : 'Проверьте данные и отправьте обращение.' : 'Это черновик. Сообщение не отправлено.'}</p>${supportEnabled && demoNumber ? `<a class="text-link" href="#/${returning ? 'returns' : 'support'}">Открыть новую форму</a>` : ''}<dl><div><dt>Заказ</dt><dd>${e(servicePreview.values.orderNumber || 'Не указан')}</dd></div><div><dt>Email</dt><dd>${e(servicePreview.values.email)}</dd></div><div><dt>Товар</dt><dd>${e(servicePreview.values.product || 'Весь заказ')}</dd></div>${returning ? `<div><dt>Количество</dt><dd>${e(servicePreview.values.quantity)}</dd></div>` : ''}${!returning ? `<div><dt>Тема</dt><dd>${e(servicePreview.values.topic)}</dd></div>` : ''}<div><dt>Сообщение</dt><dd>${e(servicePreview.values.message)}</dd></div></dl>${serviceError ? `<p class="checkout-error" role="alert">${e(serviceError)}</p>` : ''}${supportEnabled && !sent && !demoNumber ? `<button type="button" class="button" data-service-send>Отправить обращение ${icon('arrow')}</button>` : ''}</div></div>` : '';
    const formNote = supportEnabled
      ? 'Сначала проверьте обращение, затем отправьте его.'
      : 'Это предварительный просмотр. Сообщение не отправляется и не сохраняется.';
    return `<div class="page checkout-page service-page">
      <a class="text-link" href="${back}">${icon('arrow')} ${linkedOrder ? 'К заказу' : 'Доставка и возврат'}</a>
      <span class="checkout-eyebrow">Мы рядом</span><h1>${title}</h1>
      <p class="checkout-lead">${returning ? 'Расскажите, какой товар хотите вернуть и почему' : 'Опишите вопрос, чтобы мы могли найти ваш заказ и помочь'}</p>
      <div class="service-layout"><form class="checkout-form checkout-section" data-service-form="${kind}">
        <div class="checkout-fields">
          <label>${returning ? 'Номер заказа' : 'Номер заказа (при наличии)'}<input name="orderNumber" ${returning ? 'required' : ''} ${linkedOrder ? 'readonly' : ''} maxlength="40" value="${e(orderNumber || draftValues.orderNumber || '')}" placeholder="CMD-0000"></label>
          <label>Email для ответа<input type="email" name="email" required autocomplete="email" maxlength="160" value="${e(emailPrefill)}" placeholder="name@example.com"></label>
          ${productField}${quantityField}${topicField}
          <label class="checkout-wide">${returning ? 'Причина возврата' : 'Ваш вопрос'}<textarea name="message" required minlength="10" maxlength="1200" rows="5" placeholder="Расскажите подробнее">${e(draftValues.message || '')}</textarea></label>
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

  function click(button) {
    if (button.hasAttribute('data-service-send')) { void sendService(button); return; }
    if (button.hasAttribute('data-checkout-state')) {
      const kind = button.dataset.checkoutState;
      if (!preview || !isReady() || preview.signature !== cartSignature(getItems()) || !['accepted', 'failed'].includes(kind)) return;
      demonstration = { kind, number: `DEMO-${String(Date.now()).slice(-6)}` };
      location.hash = kind === 'accepted' ? '/checkout/confirmation' : '/checkout/payment-error';
      return;
    }
    if (!button.hasAttribute('data-checkout-promo')) return;
    const form = button.closest('form');
    const values = remember(form);
    try { applyPromo(String(values.promoCode || '')); promoError = ''; }
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
        payload: { kind: form.dataset.serviceForm, orderNumber: values.orderNumber,
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
