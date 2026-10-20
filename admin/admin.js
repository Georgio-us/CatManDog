let tab = 'overview';
let auditRows = [];
let suppliers = [];
let googleBusy = false;
let activeRole = null;
let auditFilters = { search: '', filter: 'all', pet: 'all' };
const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const euros = cents => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cents / 100);
async function api(path, method = 'GET', body, accessKey = '') {
  const response = await fetch(path, { method, credentials: 'same-origin', headers: {
    ...(accessKey ? { Authorization: `Bearer ${accessKey}` } : {}),
    ...(body ? { 'Content-Type':'application/json' } : {})
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Запрос не выполнен');
  return result;
}
function message(value) { $('admin-message').textContent = value; }
function openPanel(role) {
  activeRole = role;
  $('admin-login').hidden = true;
  $('admin-panel').hidden = false;
  $('admin-panel-title').textContent = role === 'support' ? 'Обращения покупателей' : 'Управление магазином';
  $('admin-panel-lead').textContent = role === 'support' ? 'Вопросы и возвраты от покупателей' : 'Ревизия каталога, поставщики и заказы';
  document.querySelectorAll('[data-full-admin]').forEach(element => { element.hidden = role !== 'admin'; });
  if (role !== 'admin') tab = 'requests';
  document.querySelectorAll('[data-tab]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.tab === tab)));
  load();
}
async function googleCredential(response) {
  if (googleBusy) return;
  googleBusy = true;
  $('login-error').textContent = '';
  try {
    const key = $('bootstrap-box').hidden ? '' : $('admin-token').value.trim();
    if (!$('bootstrap-box').hidden && !key) throw new Error('Введите ключ первичной настройки');
    const route = key ? '/api/admin/bootstrap' : '/api/admin/login';
    const access = await api(route, 'POST', { credential: response.credential }, key);
    $('admin-token').value = '';
    $('bootstrap-box').hidden = true;
    openPanel(access.role === 'owner' ? 'admin' : access.role);
  } catch (error) { $('login-error').textContent = error.message; }
  finally { googleBusy = false; }
}
async function setupLogin() {
  try {
    const access = await api('/api/admin/access');
    openPanel(access.role);
    return;
  } catch { /* Показываем форму входа */ }
  try {
    const status = await api('/api/admin/setup-status');
    $('bootstrap-box').hidden = !status.needsBootstrap;
    if (!status.googleClientId) throw new Error('Google-вход пока не настроен');
    await new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) return resolve();
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Не удалось загрузить Google-вход'));
      document.head.append(script);
    });
    window.google.accounts.id.initialize({ client_id: status.googleClientId,
      callback: googleCredential, auto_select: false, cancel_on_tap_outside: true });
    $('google-login').replaceChildren();
    window.google.accounts.id.renderButton($('google-login'), { type: 'standard',
      theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with',
      locale: 'ru', width: 300 });
  } catch (error) { $('login-error').textContent = error.message; }
}
function orderCard(order) {
  const address = order.delivery_address || {};
  const delivery = order.delivery_preference || {};
  return `<article class="admin-card"><div class="admin-variant-top"><h2>${escape(order.number)}</h2><strong>${euros(order.total_cents)}</strong></div>
    <div class="admin-grid"><div><strong>Покупатель</strong>${escape(order.customer_name)}<br>${escape(order.email)}<br>${escape(order.phone)}</div>
    <div><strong>Адрес</strong>${escape(address.street)}, ${escape(address.building)}<br>${escape(address.postcode)} València<br>${escape(address.apartment || '')}<br>${escape(address.note || '')}</div>
    <div><strong>Время</strong>${delivery.mode === 'soon' ? 'Как можно скорее' : `${escape(delivery.date)} ${escape(delivery.time)}`}<br>
      <span class="admin-muted">Не забронировано, адрес не проверен</span></div>
    <div><strong>Оплата</strong>${escape(order.payment_status)}</div></div>
    <ul class="admin-items">${(order.items || []).map(item => `<li>${escape(item.name)} · ${escape(item.variantLabel)} - ${item.qty} шт × ${euros(item.unitPriceCents)} · ${item.sourceMode === 'on_hand' ? 'на складе' : 'под заказ'}</li>`).join('')}</ul>
    <form data-order-id="${escape(order.id)}"><label>Статус<select name="status">${['received','packing','delivering','delivered','cancelled'].map(status =>
      `<option value="${status}" ${status === order.status ? 'selected' : ''}>${({received:'Получен',packing:'Собираем',delivering:'Везём',delivered:'Доставлен',cancelled:'Отменён'})[status]}</option>`).join('')}</select></label>
    <label>Заметка<input name="note" maxlength="300" class="wide-input" placeholder="Необязательно"></label><button>Сохранить статус</button></form></article>`;
}
function variantCard(variant) {
  const price = variant.price_override_cents ?? variant.source_price_cents;
  return `<article class="admin-card"><div class="admin-variant-top"><div><h2>${escape(variant.name)}</h2>
    <span class="admin-muted">${escape(variant.label)} · ${escape(variant.variant_id)}</span></div>
    <span>${price ? euros(price) : 'Без цены'}</span></div>
    <form data-variant-id="${escape(variant.variant_id)}"><label>Цена продажи, центы<input type="number" name="priceCents" min="1" value="${variant.price_override_cents ?? ''}" placeholder="Исходная: ${variant.source_price_cents ?? '-'}"></label>
    <label>Закупка, центы<input type="number" name="purchasePriceCents" min="0" value="${variant.purchase_price_cents ?? ''}"></label>
    <label>Доступность<select name="availability">${['source_on_demand','on_hand','unavailable'].map(mode =>
      `<option value="${mode}" ${mode === variant.availability ? 'selected' : ''}>${({source_on_demand:'Покупаем под заказ',on_hand:'У нас на складе',unavailable:'Недоступен'})[mode]}</option>`).join('')}</select></label>
    <label>Остаток<input type="number" name="stockQuantity" min="0" value="${variant.stock_quantity ?? ''}"></label>
    <label><input type="checkbox" name="priceConfirmed" ${variant.price_confirmed ? 'checked' : ''}> Цена подтверждена</label>
    <button>Сохранить</button></form></article>`;
}
function auditRow(row) {
  const sale = row.price_override_cents ?? row.source_price_cents;
  const cost = row.purchase_price_cents ?? row.supplier_cost_cents;
  const needs = [!row.price_confirmed && 'Цена', cost === null && 'Закупка',
    !row.supplier_name && 'Поставщик'].filter(Boolean).join(', ');
  return `<article class="audit-row" data-search="${escape([row.name,row.brand,row.label,row.variant_id,row.supplier_name].join(' ').toLowerCase())}"
    data-issues="${escape(needs.toLowerCase())}" data-pet="${escape(row.pet)}">
    <div class="audit-identity"><strong>${escape(row.name)}</strong><small>${escape(row.brand || '')} · ${escape(row.label)} · ${escape(row.variant_id)}</small></div>
    <div><small>Продажа</small><strong>${sale ? euros(sale) : 'Нет цены'}</strong></div>
    <div><small>Закупка</small><strong>${cost === null ? 'Не указана' : euros(cost)}</strong></div>
    <div><small>Поставщик</small><strong>${escape(row.supplier_name || 'Не выбран')}</strong></div>
    <div><small>Ревизия</small><strong class="${needs ? 'audit-warning' : 'audit-ready'}">${escape(needs || 'Данные заполнены')}</strong></div>
    <details class="audit-details"><summary>Проверить SKU</summary>
      <form data-review-id="${escape(row.variant_id)}" class="audit-edit"><label>Приоритет SKU
        <input type="number" name="priority" min="0" max="999" value="${row.display_priority ?? 0}"></label>
        <label>Заметка по SKU<input name="note" maxlength="500" value="${escape(row.review_note || '')}" placeholder="Что нужно проверить"></label>
        <button type="submit">Сохранить ревизию</button></form>
      <details data-offers-id="${escape(row.variant_id)}"><summary>Предложения поставщиков</summary><div class="offer-content">Загружаю</div></details>
    </details></article>`;
}
function renderAudit() {
  const missingPrice = auditRows.filter(row => !row.price_confirmed).length;
  const missingCost = auditRows.filter(row => row.purchase_price_cents === null && row.supplier_cost_cents === null).length;
  const missingSupplier = auditRows.filter(row => !row.supplier_name).length;
  $('admin-content').innerHTML = `<div class="audit-overview"><div><strong>${auditRows.length}</strong><span>SKU в каталоге</span></div>
    <div><strong>${missingPrice}</strong><span>Цен проверить</span></div><div><strong>${missingCost}</strong><span>Без закупочной цены</span></div>
    <div><strong>${missingSupplier}</strong><span>Без поставщика</span></div></div>
    <div class="audit-toolbar"><label>Поиск SKU<input id="audit-search" type="search" placeholder="Название, бренд или артикул"></label>
      <label>Показать<select id="audit-filter"><option value="all">Все варианты</option><option value="price">Цена не подтверждена</option>
        <option value="cost">Нет закупочной цены</option><option value="supplier">Нет поставщика</option></select></label>
      <label>Питомец<select id="audit-pet"><option value="all">Кошки и собаки</option><option value="cat">Кошки</option><option value="dog">Собаки</option></select></label></div>
    <p id="audit-visible" class="admin-muted"></p><div class="audit-list">${auditRows.map(auditRow).join('')}</div>`;
  $('audit-search').value = auditFilters.search;
  $('audit-filter').value = auditFilters.filter;
  $('audit-pet').value = auditFilters.pet;
  filterAudit();
}
function filterAudit() {
  const query = $('audit-search')?.value.trim().toLowerCase() || '';
  const filter = $('audit-filter')?.value || 'all';
  const pet = $('audit-pet')?.value || 'all';
  auditFilters = { search: $('audit-search')?.value || '', filter, pet };
  let count = 0;
  document.querySelectorAll('.audit-row').forEach((element, index) => {
    const row = auditRows[index];
    const visible = (!query || element.dataset.search.includes(query)) &&
      (pet === 'all' || row.pet === pet) &&
      (filter === 'all' || (filter === 'price' && !row.price_confirmed) ||
      (filter === 'cost' && row.purchase_price_cents === null && row.supplier_cost_cents === null) ||
      (filter === 'supplier' && !row.supplier_name));
    element.hidden = !visible;
    if (visible) count++;
  });
  $('audit-visible').textContent = `Показано: ${count}`;
}
function supplierCard(supplier) {
  return `<article class="admin-card supplier-card"><h2>${escape(supplier.name)}</h2><p class="admin-muted">Предложений: ${supplier.offer_count}</p>
    <form data-supplier-id="${escape(supplier.id)}" class="supplier-form">
      <label>Название<input name="name" required maxlength="120" value="${escape(supplier.name)}"></label>
      <label>Контакт<input name="contactName" maxlength="120" value="${escape(supplier.contact_name)}"></label>
      <label>Email<input type="email" name="email" value="${escape(supplier.email)}"></label>
      <label>Сайт<input type="url" name="website" value="${escape(supplier.website)}"></label>
      <label>Срок, дней<input type="number" min="0" max="365" name="leadDays" value="${supplier.lead_days ?? ''}"></label>
      <label class="supplier-wide">Условия<input name="terms" maxlength="1000" value="${escape(supplier.terms)}"></label>
      <label class="supplier-check"><input type="checkbox" name="active" ${supplier.active ? 'checked' : ''}> Активен</label>
      <button type="submit">Сохранить</button></form></article>`;
}
function renderSuppliers() {
  $('admin-content').innerHTML = `<section class="admin-card"><h2>Новый поставщик</h2><form data-new-supplier>
    <label>Название<input name="name" required minlength="2" maxlength="120"></label>
    <label>Email<input type="email" name="email"></label><label>Срок, дней<input type="number" name="leadDays" min="0" max="365"></label>
    <button type="submit">Добавить поставщика</button></form></section>
    <div class="supplier-list">${suppliers.map(supplierCard).join('')}</div>`;
}
async function loadOffers(details) {
  const variantId = details.dataset.offersId;
  const host = details.querySelector('.offer-content');
  try {
    const { offers } = await api(`/api/admin/supplier-offers?variantId=${encodeURIComponent(variantId)}`);
    host.innerHTML = `${offers.length ? `<ul class="offer-list">${offers.map(offer => `<li>${escape(offer.supplier_name)} -
      ${offer.cost_cents === null ? 'Цена не указана' : euros(offer.cost_cents)}${offer.vat_included ? ' с IVA' : ' без IVA'}
      ${offer.preferred ? '<strong>Основной</strong>' : ''}</li>`).join('')}</ul>` : '<p>Предложений пока нет</p>'}
      <form data-offer-variant="${escape(variantId)}" class="offer-form"><label>Поставщик<select name="supplierId" required>
      <option value="">Выберите поставщика</option>${suppliers.filter(item => item.active).map(item =>
        `<option value="${escape(item.id)}">${escape(item.name)}</option>`).join('')}</select></label>
      <label>Цена закупки, €<input type="number" name="costEuros" min="0" step="0.01" placeholder="Например, 12.50"></label>
      <label>Минимум, шт<input type="number" name="minimumQuantity" min="1" max="99999" value="1"></label>
      <label>Источник<input type="url" name="sourceUrl" placeholder="https://"></label>
      <label>Заметка<input name="note" maxlength="500"></label>
      <label class="supplier-check"><input type="checkbox" name="vatIncluded" checked> Цена с IVA</label>
      <label class="supplier-check"><input type="checkbox" name="preferred"> Основной поставщик</label>
      <button type="submit">Сохранить предложение</button></form>`;
  } catch (error) { host.textContent = error.message; }
}
function requestCard(request) {
  return `<article class="admin-card"><h2>${request.kind === 'return' ? 'Возврат' : 'Поддержка'} ${request.order_number ? '· ' + escape(request.order_number) : ''}</h2>
    <p>${escape(request.email)} · ${escape(request.created_at)}</p>
    ${request.product_id ? `<p>Товар: ${escape(request.product_id)}${request.variant_id ? ' · ' + escape(request.variant_id) : ''}${request.quantity ? ' · ' + request.quantity + ' шт' : ''}</p>` : ''}
    <p>${escape(request.message)}</p>${request.last_reply_at ? `<p class="admin-muted">Последний ответ: ${escape(new Date(request.last_reply_at).toLocaleString('ru-RU'))}</p><p>${escape(request.last_reply_message || '')}</p>` : ''}
    <form data-reply-id="${escape(request.id)}" class="admin-reply-form"><label>Ответ покупателю<textarea name="message" rows="4" minlength="2" maxlength="4000" required placeholder="Напишите ответ на email покупателя"></textarea></label><button type="submit">Отправить ответ</button></form>
    <form data-request-id="${escape(request.id)}"><label>Статус<select name="status">${['new','in_progress','resolved'].map(status =>
      `<option value="${status}" ${status === request.status ? 'selected' : ''}>${({new:'Новое',in_progress:'В работе',resolved:'Закрыто'})[status]}</option>`).join('')}</select></label><button>Сохранить статус</button></form></article>`;
}
function renderOverview(data) {
  const { catalog, orders, requests, topPaidSkus } = data;
  $('admin-content').innerHTML = `<div class="audit-overview overview-grid">
    <div><strong>${catalog.total}</strong><span>SKU в каталоге</span></div>
    <div><strong>${catalog.unconfirmed_prices}</strong><span>Цен проверить</span></div>
    <div><strong>${catalog.missing_costs}</strong><span>Без закупочной цены</span></div>
    <div><strong>${catalog.missing_suppliers}</strong><span>Без основного поставщика</span></div>
    <div><strong>${catalog.low_stock}</strong><span>Мало товара на складе</span></div>
    <div><strong>${orders.open_orders}</strong><span>Заказов в работе</span></div>
    <div><strong>${requests.new_requests}</strong><span>Новых обращений</span></div>
    <div><strong>${euros(orders.paid_total_30d)}</strong><span>Оплачено за 30 дней · ${orders.paid_orders_30d} заказов</span></div>
  </div><section class="admin-card"><h2>Что проверить сейчас</h2>
    <div class="overview-actions"><button type="button" data-go-tab="audit">Открыть ревизию SKU</button>
    <button type="button" data-go-tab="orders">Открыть заказы</button>
    <button type="button" data-go-tab="requests">Открыть обращения</button></div></section>
    <section class="admin-card"><h2>Чаще покупали</h2>
      ${topPaidSkus.length ? `<ol class="overview-top">${topPaidSkus.map(item => `<li>${escape(item.name)}
        <span>${escape(item.variant_id)} · ${item.quantity} шт</span></li>`).join('')}</ol>` :
        '<p class="admin-muted">Оплаченных заказов пока нет</p>'}</section>`;
}
async function load() {
  message('Загружаю данные');
  try {
    if (tab === 'overview') {
      renderOverview(await api('/api/admin/overview'));
      message('Сводка магазина');
      return;
    }
    if (tab === 'audit') {
      const [audit, supplierData] = await Promise.all([api('/api/admin/sku-audit'), api('/api/admin/suppliers')]);
      auditRows = audit.variants;
      suppliers = supplierData.suppliers;
      renderAudit();
      message('Ревизия каталога');
      return;
    }
    if (tab === 'suppliers') {
      suppliers = (await api('/api/admin/suppliers')).suppliers;
      renderSuppliers();
      message(`Поставщиков: ${suppliers.length}`);
      return;
    }
    const path = { orders:'/api/admin/orders', variants:'/api/admin/variants', requests:'/api/admin/service-requests' }[tab];
    const result = await api(path);
    $('admin-content').innerHTML = tab === 'orders'
      ? result.orders.length ? result.orders.map(orderCard).join('') : '<p>Заказов пока нет</p>'
      : tab === 'variants' ? result.variants.map(variantCard).join('')
        : result.requests.length ? result.requests.map(requestCard).join('') : '<p>Обращений пока нет</p>';
    message(tab === 'orders' ? `Заказов: ${result.orders.length}` : tab === 'variants'
      ? `Вариантов: ${result.variants.length}` : `Обращений: ${result.requests.length}`);
  } catch (error) { message(error.message); }
}
$('admin-lock').addEventListener('click', async () => {
  if (activeRole === 'support') { window.location.href = '/'; return; }
  try { await api('/api/admin/logout', 'POST'); } catch { /* Сессия уже могла истечь */ }
  activeRole = null;
  $('admin-panel').hidden = true; $('admin-login').hidden = false;
  $('admin-content').innerHTML = '';
  setupLogin();
});
setupLogin();
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
  tab = button.dataset.tab;
  document.querySelectorAll('[data-tab]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  load();
}));
$('admin-content').addEventListener('input', event => {
  if (['audit-search','audit-filter','audit-pet'].includes(event.target.id)) filterAudit();
});
$('admin-content').addEventListener('change', event => {
  if (['audit-filter','audit-pet'].includes(event.target.id)) filterAudit();
});
$('admin-content').addEventListener('click', event => {
  const shortcut = event.target.closest('[data-go-tab]');
  if (shortcut) {
    tab = shortcut.dataset.goTab;
    document.querySelectorAll('[data-tab]').forEach(item =>
      item.setAttribute('aria-pressed', String(item.dataset.tab === tab)));
    load();
    return;
  }
  const summary = event.target.closest('details[data-offers-id] > summary');
  if (!summary) return;
  const details = summary.parentElement;
  if (!details.open) loadOffers(details);
});
$('admin-content').addEventListener('submit', async event => {
  const form = event.target.closest('form');
  if (!form) return;
  event.preventDefault();
  const values = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"], button:not([type])');
  if (submitButton) submitButton.disabled = true;
  try {
    if (form.dataset.reviewId) await api(`/api/admin/variants/${encodeURIComponent(form.dataset.reviewId)}/review`, 'PATCH',
      { priority: Number(values.get('priority')), note: values.get('note') });
    else if (form.hasAttribute('data-new-supplier')) await api('/api/admin/suppliers', 'POST', {
      name: values.get('name'), email: values.get('email'), leadDays: values.get('leadDays') });
    else if (form.dataset.supplierId) await api(`/api/admin/suppliers/${encodeURIComponent(form.dataset.supplierId)}`, 'PATCH', {
      name: values.get('name'), contactName: values.get('contactName'), email: values.get('email'),
      website: values.get('website'), terms: values.get('terms'), leadDays: values.get('leadDays'), active: values.has('active') });
    else if (form.dataset.offerVariant) {
      const price = String(values.get('costEuros') || '').trim();
      await api('/api/admin/supplier-offers', 'PUT', { variantId: form.dataset.offerVariant,
        supplierId: values.get('supplierId'), costCents: price === '' ? null : Math.round(Number(price) * 100),
        minimumQuantity: Number(values.get('minimumQuantity')), sourceUrl: values.get('sourceUrl'),
        note: values.get('note'), vatIncluded: values.has('vatIncluded'), preferred: values.has('preferred') });
    }
    else if (form.dataset.orderId) await api(`/api/admin/orders/${encodeURIComponent(form.dataset.orderId)}/status`, 'PATCH',
      { status: values.get('status'), note: values.get('note') });
    else if (form.dataset.replyId) await api(`/api/admin/service-requests/${encodeURIComponent(form.dataset.replyId)}/reply`, 'POST',
      { message: values.get('message') });
    else if (form.dataset.requestId) await api(`/api/admin/service-requests/${encodeURIComponent(form.dataset.requestId)}/status`, 'PATCH',
      { status: values.get('status') });
    else await api(`/api/admin/variants/${encodeURIComponent(form.dataset.variantId)}`, 'PATCH', {
      priceCents: values.get('priceCents') === '' ? null : Number(values.get('priceCents')),
      purchasePriceCents: values.get('purchasePriceCents') === '' ? null : Number(values.get('purchasePriceCents')),
      availability: values.get('availability'),
      stockQuantity: values.get('stockQuantity') === '' ? null : Number(values.get('stockQuantity')),
      priceConfirmed: values.has('priceConfirmed')
    });
    await load();
    message(form.dataset.replyId ? 'Ответ отправлен' : 'Сохранено');
  } catch (error) { message(error.message); if (submitButton) submitButton.disabled = false; }
});
