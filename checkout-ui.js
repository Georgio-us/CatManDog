import { checkoutTotals, deliveryTiming, FREE_DELIVERY_FROM, DELIVERY_FEE, validateCheckout } from './checkout-model.js';

export function createCheckoutUI({ escape: e, icon, money, imageBlock, getItems, isReady, getPromo, applyPromo, render }) {
  let formValues = {};
  let promoError = '';
  let preview = null;
  let servicePreview = null;

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
    return `<div class="page checkout-page"><span class="checkout-eyebrow">Предпросмотр подтверждения</span><h1>Всё верно?</h1><p class="checkout-lead">Проверьте данные перед настоящим оформлением заказа</p><div class="checkout-layout"><div class="checkout-preview"><section class="checkout-section"><h2>Доставка</h2><dl><div><dt>Получатель</dt><dd>${e(values.name)}</dd></div><div><dt>Адрес</dt><dd>${e(address)}</dd></div><div><dt>Когда удобно</dt><dd>${e(when)}</dd></div><div><dt>Телефон</dt><dd>${e(values.phone)}${values.whatsapp ? ' · WhatsApp' : ''}</dd></div><div><dt>Email</dt><dd>${e(values.email)}</dd></div>${values.note ? `<div><dt>Комментарий</dt><dd>${e(values.note)}</dd></div>` : ''}</dl></section><div class="checkout-preview-notice">${icon('shield')} <div><strong>Заказ пока не создан</strong><p>Оплата, отправка заказа и уведомления ещё не подключены. Эта страница показывает, как будет выглядеть подтверждение, без передачи ваших данных.</p></div></div><a class="button outline" href="#/checkout">Изменить данные ${icon('arrow')}</a></div>${summary(items, promo)}</div></div>`;
  }

  function servicePage(kind) {
    const returning = kind === 'return';
    const title = returning ? 'Запрос на возврат' : 'Помощь с заказом';
    const saved = servicePreview?.kind === kind;
    return `<div class="page checkout-page service-page"><a class="text-link" href="#/info/delivery">${icon('arrow')} Доставка и возврат</a><span class="checkout-eyebrow">Мы рядом</span><h1>${title}</h1><p class="checkout-lead">${returning ? 'Расскажите, какой товар хотите вернуть и почему' : 'Опишите вопрос, чтобы мы могли найти ваш заказ и помочь'}</p><div class="service-layout"><form class="checkout-form checkout-section" data-service-form="${kind}"><div class="checkout-fields"><label>Номер заказа ${returning ? '' : '<small>Если есть</small>'}<input name="orderNumber" ${returning ? 'required' : ''} maxlength="40" placeholder="CMD-0000"></label><label>Email для ответа<input type="email" name="email" required autocomplete="email" maxlength="160" placeholder="name@example.com"></label>${returning ? '<label class="checkout-wide">Товар<input name="product" required maxlength="120" placeholder="Название товара и фасовка"></label>' : '<label class="checkout-wide">Тема<select name="topic"><option>Вопрос о заказе</option><option>Доставка</option><option>Товар</option><option>Другое</option></select></label>'}<label class="checkout-wide">${returning ? 'Причина возврата' : 'Ваш вопрос'}<textarea name="message" required minlength="10" maxlength="1200" rows="5" placeholder="Расскажите подробнее"></textarea></label><label class="checkout-wide">Фото <small>Если поможет объяснить ситуацию</small><input type="file" name="photo" accept="image/*"></label></div><p class="checkout-help">Форма пока работает как предпросмотр. Сообщение и фото не отправляются и не сохраняются.</p><button class="button" type="submit">Проверить обращение ${icon('arrow')}</button></form><aside class="checkout-summary"><h2>Что будет дальше</h2><p>После подключения поддержки обращения будут привязаны к заказу. Мы покажем статус и способ связи с командой.</p><a class="text-link" href="#/checkout">Вернуться к оформлению</a></aside></div>${saved ? `<div class="checkout-preview-notice service-draft" id="service-preview" role="status">${icon('check')} <div><strong>Черновик обращения готов</strong><p>Он не отправлен. После подключения поддержки здесь появится отправка и номер обращения.</p><dl><div><dt>Заказ</dt><dd>${e(servicePreview.values.orderNumber || 'Не указан')}</dd></div><div><dt>Email</dt><dd>${e(servicePreview.values.email)}</dd></div><div><dt>${returning ? 'Товар' : 'Тема'}</dt><dd>${e(returning ? servicePreview.values.product : servicePreview.values.topic)}</dd></div><div><dt>Сообщение</dt><dd>${e(servicePreview.values.message)}</dd></div>${servicePreview.photoName ? `<div><dt>Выбранное фото</dt><dd>${e(servicePreview.photoName)} - не загружено</dd></div>` : ''}</dl></div></div>` : ''}</div>`;
  }

  function remember(form) {
    const values = Object.fromEntries(new FormData(form).entries());
    values.whatsapp = new FormData(form).has('whatsapp');
    formValues = values;
    return values;
  }

  function click(button) {
    if (!button.hasAttribute('data-checkout-promo')) return;
    const form = button.closest('form');
    const values = remember(form);
    try { applyPromo(String(values.promoCode || '')); promoError = ''; }
    catch (error) { promoError = error.message; }
    render();
  }

  function change(target) {
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
      delete values.photo;
      servicePreview = { kind: form.dataset.serviceForm,
        values, photoName: form.elements.photo?.files?.[0]?.name || '' };
      render();
      document.getElementById('service-preview')?.scrollIntoView({ block: 'start' });
    }
  }

  return { page, previewPage, servicePage, click, change, submit };
}
