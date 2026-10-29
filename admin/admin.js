let tab = 'overview';
let auditRows = [];
let suppliers = [];
let brandData = null;
let supplierCatalogSources = [];
let supplierCatalogData = null;
let brandName = '';
let brandDirectorySearch = '';
let brandProductSearch = '';
let brandView = 'site';
let brandSearch = '';
let brandLine = '';
let brandSelected = '';
let brandVisibleCount = 50;
let brandMobileOpen = false;
let brandMatchEditing = false;
let googleBusy = false;
let activeRole = null;
let auditFilters = { search: '', filter: 'all', pet: 'all' };
let purchaseSupplierId = '';
let purchaseCandidates = [];
let purchaseDraftItems = [];
let productRows = [];
let productSearch = '';
let productCategory = 'all';
let productBrand = 'all';
let productPet = 'all';
let productVisibleCount = 40;
let catalogView = 'products';
let openedProductId = '';
let variantRows = [];
let variantSearch = '';
let customerSearch = '';
let customerPage = 0;
let customerLoadSerial = 0;
let customerSearchTimer;
let requestSearch = '';
let requestStatus = 'all';
let requestPage = 0;
let requestSearchTimer;
const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const euros = cents => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cents / 100);
const countNoun = (count, one, few, many) => {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return many;
  const last = count % 10;
  return last === 1 ? one : last >= 2 && last <= 4 ? few : many;
};
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
    <div><strong>Оплата и склад</strong>${escape(order.payment_status)}<br>${(order.items || []).some(item => item.sourceMode === 'on_hand')
      ? escape(({ reserved:'Товар зарезервирован',released:'Резерв снят',consumed:'Выдан со склада',legacy:'Старый учёт' })[order.stock_state] || '')
      : 'Товар под заказ'}</div></div>
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
    <p class="admin-muted">Зарезервировано: ${variant.reserved_quantity || 0} · Доступно:
      ${variant.stock_quantity === null ? 'не указано' : Math.max(0, variant.stock_quantity - (variant.reserved_quantity || 0))}</p>
    <form data-variant-id="${escape(variant.variant_id)}"><label>Цена продажи, центы<input type="number" name="priceCents" min="1" value="${variant.price_override_cents ?? ''}" placeholder="Исходная: ${variant.source_price_cents ?? '-'}"></label>
    <label>Закупка, центы<input type="number" name="purchasePriceCents" min="0" value="${variant.purchase_price_cents ?? ''}"></label>
    <label>Доступность<select name="availability">${['source_on_demand','on_hand','unavailable'].map(mode =>
      `<option value="${mode}" ${mode === variant.availability ? 'selected' : ''}>${({source_on_demand:'Покупаем под заказ',on_hand:'У нас на складе',unavailable:'Недоступен'})[mode]}</option>`).join('')}</select></label>
    <label>Фактически на складе<input type="number" name="stockQuantity" min="0" value="${variant.stock_quantity ?? ''}"></label>
    <label>Порог закупки, шт<input type="number" name="reorderPoint" min="0" max="99998" required value="${variant.reorder_point ?? 2}"></label>
    <label>Целевой запас, шт<input type="number" name="targetStock" min="1" max="99999" required value="${variant.target_stock ?? 6}"></label>
    <label>IVA товара, %<input type="number" name="taxRatePercent" min="0" max="100" step="0.01" value="${variant.tax_rate_bps === null || variant.tax_rate_bps === undefined ? '' : variant.tax_rate_bps / 100}" placeholder="После проверки"></label>
    <label>Причина изменения остатка<input name="stockNote" maxlength="300" class="wide-input" placeholder="Например, инвентаризация"></label>
    <label><input type="checkbox" name="priceConfirmed" ${variant.price_confirmed ? 'checked' : ''}> Цена подтверждена</label>
    <button>Сохранить</button></form></article>`;
}
const productCategories = ['Корм','Лакомства','Наполнитель','Лотки','Лотки и гигиена','Игрушки и аксессуары',
  'Миски и поилки','Переноски','Окна и балконы','Уход','Подарочные наборы'];
function productFields(product = {}) {
  const options = (items, selected) => items.map(([value, label]) =>
    `<option value="${escape(value)}" ${selected === value ? 'selected' : ''}>${escape(label)}</option>`).join('');
  return `<label>Название<input name="name" required maxlength="160" value="${escape(product.name || '')}"></label>
    <label>Бренд<input name="brand" required maxlength="100" value="${escape(product.brand || '')}"></label>
    <label>Категория<select name="category">${options(productCategories.map(item => [item,item]), product.category || 'Корм')}</select></label>
    <label>Для кого<select name="pet">${options([['cat','Кошки'],['dog','Собаки'],['both','Оба']], product.pet || 'cat')}</select></label>
    <label>Тип корма<select name="foodType">${options([['','Не указан'],['dry','Сухой'],['wet','Влажный']], product.food_type || '')}</select></label>
    <label class="catalog-wide">Фото в R2<input name="imagePath" maxlength="500" value="${escape(product.image_path || '')}" placeholder="https://img.catmandog.es/..."></label>
    <label class="catalog-wide">Описание<textarea name="description" maxlength="3000">${escape(product.description || '')}</textarea></label>
    <label class="catalog-wide">Детали - по одной на строку<textarea name="details" rows="3">${escape((product.details || []).join('\n'))}</textarea></label>`;
}
const productGroup = product => product.category === 'Корм'
  ? product.food_type === 'dry' ? 'Сухой корм' : product.food_type === 'wet' ? 'Влажный корм' : 'Корм'
  : product.category;
const productPetLabel = pet => pet === 'cat' ? 'Кошки' : pet === 'dog' ? 'Собаки' : 'Кошки и собаки';
const productImage = product => product.image_path || product.variants.find(variant => variant.imagePath)?.imagePath || '';
const productMedia = product => productImage(product)
  ? `<img src="${escape(productImage(product))}" alt="" loading="lazy">`
  : '<span class="product-no-image">Фото не добавлено</span>';
const catalogBrandCount = () => new Set(productRows.map(item => item.brand).filter(Boolean)).size;
const catalogSkuCount = () => productRows.reduce((sum, item) => sum + item.variants.length, 0);
function productCard(product) {
  return `<article class="catalog-tile">
    <button type="button" class="catalog-tile-open" data-product-open="${escape(product.id)}" aria-label="Открыть ${escape(product.name)}">
      <span class="catalog-tile-media">${productMedia(product)}</span>
      <span class="catalog-tile-body"><span class="catalog-tile-brand">${escape(product.brand || 'Без бренда')} · ${escape(productPetLabel(product.pet))}</span>
        <strong>${escape(product.name)}</strong><span class="catalog-tile-meta">${escape(productGroup(product))} · ${product.variants.length} SKU</span>
        <span class="catalog-tile-state">${product.active ? 'На сайте' : 'Скрыт'}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></span></span>
    </button></article>`;
}
function renderProductDetail() {
  const product = productRows.find(item => item.id === openedProductId);
  if (!product) { openedProductId = ''; renderProducts(); return; }
  const variants = product.variants.map(variant => {
    const live = variantRows.find(item => item.variant_id === variant.id);
    const sale = live?.price_override_cents ?? live?.source_price_cents;
    return `<details class="catalog-sku"><summary><span><strong>${escape(variant.label)}</strong><small>${escape(variant.id)}</small></span>
      <span>${sale ? euros(sale) : 'Цена не указана'}<small>${variant.priceConfirmed ? 'Цена подтверждена' : 'Цена не подтверждена'}</small></span>
      <span>${live?.stock_quantity === null || live?.stock_quantity === undefined ? 'Остаток не указан' : `На складе ${live.stock_quantity}`}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
      <div class="catalog-sku-body"><form data-variant-metadata="${escape(variant.id)}" class="catalog-variant-form">
        <label>Фасовка или вариант<input name="label" required maxlength="100" value="${escape(variant.label)}"></label>
        <label class="catalog-variant-wide">Фото варианта в R2<input name="imagePath" maxlength="500" value="${escape(variant.imagePath || '')}" placeholder="Если пусто - фото товара"></label>
        <label class="catalog-variant-wide">Описание варианта<textarea name="description" maxlength="3000" rows="2">${escape(variant.description || '')}</textarea></label>
        <label class="catalog-variant-wide">Детали варианта - по одной на строку<textarea name="details" rows="2">${escape((variant.details || []).join('\n'))}</textarea></label>
        <label class="catalog-check"><input type="checkbox" name="active" ${variant.active ? 'checked' : ''}> На сайте</label>
        <button type="submit">Сохранить SKU</button></form>
        ${live ? variantCard(live) : '<p>Цена и остаток пока не загружены</p>'}
        <button type="button" data-audit-variant="${escape(variant.id)}">Проверить данные этого SKU</button></div></details>`;
  }).join('');
  $('admin-content').innerHTML = `<section class="product-workspace product-detail">
    <nav class="catalog-breadcrumb" aria-label="Путь в каталоге"><button type="button" data-product-back>Продукция</button><span>/</span>
      <button type="button" data-product-brand="${escape(product.brand)}">${escape(product.brand || 'Без бренда')}</button><span>/</span>
      <button type="button" data-product-category="${escape(productGroup(product))}">${escape(productGroup(product))}</button><span>/</span><span>${escape(product.name)}</span></nav>
    <div class="product-detail-head"><div class="product-detail-media">${productMedia(product)}</div><div><span class="catalog-eyebrow">${escape(productPetLabel(product.pet))} · ${escape(productGroup(product))}</span>
      <h2>${escape(product.name)}</h2><p>${product.variants.length} SKU · ${product.active ? 'На сайте' : 'Скрыт'}</p>
      <div class="product-detail-actions"><button type="button" data-product-price-list="${escape(product.brand)}">Прайс бренда</button>
        <button type="button" data-go-tab="suppliers">Поставщики</button></div></div></div>
    <section class="product-detail-section"><h3>Варианты, цены и остатки</h3><p>Откройте фасовку, чтобы изменить цену, остаток или описание конкретного SKU</p>
      <div class="catalog-sku-list">${variants}</div><details class="catalog-create"><summary>Добавить SKU <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
      <form data-product-variant="${escape(product.id)}" class="catalog-variant-form"><label>Новый вариант<input name="label" required maxlength="100" placeholder="Например, 2 кг"></label><button type="submit">Добавить SKU</button></form></details></section>
    <details class="product-detail-section product-editor"><summary>Редактировать товар <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
      <form data-product-id="${escape(product.id)}" class="catalog-product-form">${productFields(product)}
        <label class="catalog-check"><input type="checkbox" name="active" ${product.active ? 'checked' : ''}> Показывать на сайте</label>
        <button type="submit">Сохранить товар</button></form></details></section>`;
}
function renderProductList() {
  const target = $('catalog-product-list');
  if (!target) return;
  const needle = productSearch.trim().toLocaleLowerCase('ru');
  if (catalogView === 'brands') {
    const brands = brandDirectoryRows().filter(item => item.name.toLocaleLowerCase('ru').includes(needle));
    target.className = 'catalog-brand-grid';
    target.innerHTML = brands.map(row => `<button type="button" class="catalog-brand-tile" data-catalog-brand-open="${escape(row.name)}">
      <strong>${escape(row.name)}</strong><span>${row.products ? `${row.products} ${countNoun(row.products,'товар','товара','товаров')} · ${row.skus} SKU` : 'Товаров на сайте пока нет'}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>`).join('') || '<p>Бренды не найдены</p>';
    $('catalog-product-count').textContent = `${brands.length} брендов`;
    $('catalog-product-more').hidden = true;
    $('catalog-product-all').hidden = true;
    return;
  }
  const matching = productRows.filter(item => (!needle || `${item.name} ${item.brand} ${item.category} ${item.id} ${item.variants.map(v => `${v.label} ${v.id}`).join(' ')}`.toLocaleLowerCase('ru').includes(needle)) &&
    (productCategory === 'all' || productGroup(item) === productCategory || productCategory === 'Корм' && item.category === 'Корм') &&
    (productBrand === 'all' || item.brand === productBrand) &&
    (productPet === 'all' || item.pet === productPet || item.pet === 'both'));
  target.className = 'catalog-product-grid';
  target.innerHTML = matching.slice(0, productVisibleCount).map(productCard).join('') || '<p>Товары не найдены</p>';
  $('catalog-product-count').textContent = `Показано ${Math.min(matching.length, productVisibleCount)} из ${matching.length}`;
  $('catalog-product-more').hidden = matching.length <= productVisibleCount;
  $('catalog-product-all').hidden = matching.length <= productVisibleCount;
}
function renderProducts() {
  if (openedProductId) { renderProductDetail(); return; }
  const categories = [...new Set([...productRows.map(productGroup), ...(productRows.some(item => item.category === 'Корм') ? ['Корм'] : [])])].sort((a,b) => a.localeCompare(b,'ru'));
  const brands = [...new Set(productRows.map(item => item.brand).filter(Boolean))].sort((a,b) => a.localeCompare(b,'ru'));
  $('admin-content').innerHTML = `<section class="product-workspace"><nav class="catalog-breadcrumb" aria-label="Путь в каталоге">Продукция${productBrand !== 'all' ? ` <span>/</span> ${escape(productBrand)}` : ''}</nav>
    <div class="catalog-heading"><div><h2>Продукция</h2><p>${productRows.length} товаров · ${catalogBrandCount()} брендов с товарами · ${catalogSkuCount()} SKU</p></div>
      <details class="catalog-create"><summary>Добавить товар <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
      <form data-product-create class="catalog-product-form">${productFields()}<label>Первый вариант<input name="variantLabel" required maxlength="100" placeholder="Например, 1 шт"></label>
      <button type="submit">Создать черновик</button></form></details></div>
    <div class="catalog-view-switch" role="group" aria-label="Вид каталога"><button type="button" data-catalog-view="products" aria-pressed="${catalogView === 'products'}">Товары</button>
      <button type="button" data-catalog-view="brands" aria-pressed="${catalogView === 'brands'}">Бренды</button></div>
    <div class="catalog-filters"><label>Поиск<input id="catalog-product-search" type="search" value="${escape(productSearch)}" placeholder="Название, бренд или артикул"></label>
      ${catalogView === 'products' ? `<label>Категория<select id="catalog-category"><option value="all">Все категории</option>${categories.map(item => `<option value="${escape(item)}" ${item === productCategory ? 'selected' : ''}>${escape(item)}</option>`).join('')}</select></label>
      <label>Бренд<select id="catalog-brand"><option value="all">Все бренды</option>${brands.map(item => `<option value="${escape(item)}" ${item === productBrand ? 'selected' : ''}>${escape(item)}</option>`).join('')}</select></label>
      <label>Питомец<select id="catalog-pet"><option value="all">Кошки и собаки</option><option value="cat" ${productPet === 'cat' ? 'selected' : ''}>Кошки</option><option value="dog" ${productPet === 'dog' ? 'selected' : ''}>Собаки</option><option value="both" ${productPet === 'both' ? 'selected' : ''}>Для обоих</option></select></label>` : ''}</div>
    ${catalogView === 'products' ? `<div class="catalog-category-tabs" role="group" aria-label="Категории товаров"><button type="button" data-catalog-category="all" aria-pressed="${productCategory === 'all'}">Все товары</button>${categories.map(item => `<button type="button" data-catalog-category="${escape(item)}" aria-pressed="${productCategory === item}">${escape(item)}</button>`).join('')}</div>` : ''}
    <div class="catalog-result-head"><span id="catalog-product-count"></span>${productBrand !== 'all' && catalogView === 'products' ? `<button type="button" data-product-price-list="${escape(productBrand)}">Открыть прайс бренда</button>` : ''}</div>
    <div id="catalog-product-list"></div><div class="catalog-load-actions"><button type="button" id="catalog-product-more">Показать ещё 40</button><button type="button" id="catalog-product-all">Показать все</button></div></section>`;
  renderProductList();
}
function catalogPayload(values) {
  return { name: values.get('name'), brand: values.get('brand'), category: values.get('category'),
    pet: values.get('pet'), foodType: values.get('foodType'), imagePath: values.get('imagePath'),
    description: values.get('description'), details: String(values.get('details') || '').split('\n').map(item => item.trim()).filter(Boolean) };
}
function renderVariantList() {
  const target = $('admin-variant-list');
  if (!target) return;
  const needle = variantSearch.toLocaleLowerCase('ru');
  const matching = variantRows.filter(item => `${item.name} ${item.brand} ${item.label} ${item.variant_id}`.toLocaleLowerCase('ru').includes(needle));
  target.innerHTML = matching.slice(0, 40).map(variantCard).join('') || '<p>SKU не найдены</p>';
  $('admin-variant-count').textContent = `Найдено: ${matching.length}${matching.length > 40 ? ' · показаны первые 40' : ''}`;
}
function renderVariants() {
  $('admin-content').innerHTML = `<div class="audit-toolbar"><label>Найти SKU<input id="admin-variant-search" value="${escape(variantSearch)}" placeholder="Товар, бренд или артикул"></label><span id="admin-variant-count"></span></div><div id="admin-variant-list"></div>`;
  renderVariantList();
}
const shortDate = value => value ? new Date(value).toLocaleDateString('ru-RU') : 'Нет';
function customerCard(customer) {
  const methods = [customer.has_password && 'Почта', customer.google_linked && 'Google'].filter(Boolean).join(' + ') || 'Не указан';
  return `<article class="admin-card customer-card"><details data-customer-id="${escape(customer.id)}"><summary>
    <div><strong>${escape(customer.name || customer.email)}</strong><small>${escape(customer.email)}${customer.contact_phone ? ` · ${escape(customer.contact_phone)}` : ''}</small></div>
    <div><strong>${customer.pet_count}</strong><small>Питомцев</small></div>
    <div><strong>${customer.order_count}</strong><small>Заказов</small></div>
    <div><strong>${euros(customer.paid_total_cents)}</strong><small>Оплачено</small></div>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
    <p class="admin-muted">Вход: ${escape(methods)} · Email ${customer.email_verified_at ? 'подтверждён' : 'не подтверждён'} · Аккаунт с ${escape(shortDate(customer.created_at))}</p>
    <div class="customer-detail" aria-live="polite"></div></details></article>`;
}
async function loadCustomers() {
  const serial = ++customerLoadSerial;
  if (!$('customer-list')) $('admin-content').innerHTML = `<div class="audit-toolbar customer-toolbar">
    <label>Найти покупателя<input id="customer-search" value="${escape(customerSearch)}" placeholder="Имя, email или телефон" autocomplete="off"></label>
    <span id="customer-count"></span></div><div id="customer-list"></div><div id="customer-pages" class="customer-pages"></div>`;
  $('customer-count').textContent = 'Загружаю';
  const params = new URLSearchParams({ q: customerSearch, page: String(customerPage) });
  const data = await api(`/api/admin/customers?${params}`);
  if (serial !== customerLoadSerial || tab !== 'customers') return;
  $('customer-list').innerHTML = data.customers.length ? data.customers.map(customerCard).join('')
    : '<p class="admin-muted">Покупатели не найдены</p>';
  $('customer-count').textContent = `Показано: ${data.customers.length}`;
  $('customer-pages').innerHTML = `<button type="button" data-customer-page="${customerPage - 1}" ${customerPage === 0 ? 'disabled' : ''}>Назад</button>
    <span>Страница ${customerPage + 1}</span>
    <button type="button" data-customer-page="${customerPage + 1}" ${data.hasMore ? '' : 'disabled'}>Дальше</button>`;
  message('Покупатели и их заказы');
}
async function loadCustomerDetail(details) {
  const host = details.querySelector('.customer-detail');
  if (!host || host.dataset.loaded) return;
  host.textContent = 'Загружаю историю';
  try {
    const data = await api(`/api/admin/customers/${encodeURIComponent(details.dataset.customerId)}`);
    if (!details.isConnected) return;
    host.innerHTML = `<div class="customer-detail-grid"><section><h3>Питомцы</h3>
      ${data.pets.length ? `<ul>${data.pets.map(pet => `<li>${escape(pet.name)} · ${pet.species === 'dog' ? 'собака' : 'кошка'}</li>`).join('')}</ul>` : '<p>Питомцы не добавлены</p>'}</section>
      <section><h3>Заказы аккаунта</h3>${data.orders.length ? `<ul>${data.orders.map(order => `<li><strong>${escape(order.number)}</strong> · ${escape(shortDate(order.created_at))} · ${euros(order.total_cents)}
        <small>${escape(({received:'Получен',packing:'Собираем',delivering:'Везём',delivered:'Доставлен',cancelled:'Отменён'})[order.status] || order.status)} · ${escape(order.payment_status === 'paid' ? 'Оплачен' : 'Не оплачен')}</small></li>`).join('')}</ul>` : '<p>Заказов пока нет</p>'}</section></div>`;
    host.dataset.loaded = 'true';
  } catch (error) { host.textContent = error.message; }
}
function auditRow(row) {
  const sale = row.price_override_cents ?? row.source_price_cents;
  const cost = row.purchase_price_cents ?? row.supplier_cost_cents;
  const needs = [!row.price_confirmed && 'Цена', cost === null && 'Закупка',
    row.tax_rate_bps === null && 'IVA',
    !row.supplier_name && 'Поставщик'].filter(Boolean).join(', ');
  return `<article class="audit-row" data-search="${escape([row.name,row.brand,row.label,row.variant_id,row.supplier_name].join(' ').toLowerCase())}"
    data-issues="${escape(needs.toLowerCase())}" data-pet="${escape(row.pet)}">
    <div class="audit-identity"><strong>${escape(row.name)}</strong><small>${escape(row.brand || '')} · ${escape(row.label)} · ${escape(row.variant_id)}</small>
      <small>На складе: ${row.stock_quantity ?? 'не указано'} · Резерв: ${row.reserved_quantity || 0}</small></div>
    <div><small>Продажа</small><strong>${sale ? euros(sale) : 'Нет цены'}</strong></div>
    <div><small>Закупка</small><strong>${cost === null ? 'Не указана' : euros(cost)}</strong></div>
    <div><small>Поставщик</small><strong>${escape(row.supplier_name || 'Не выбран')}</strong></div>
    <div><small>IVA</small><strong>${row.tax_rate_bps === null ? 'Не указана' : `${row.tax_rate_bps / 100}%`}</strong></div>
    <div><small>Ревизия</small><strong class="${needs ? 'audit-warning' : 'audit-ready'}">${escape(needs || 'Данные заполнены')}</strong></div>
    <details class="audit-details"><summary>Проверить SKU</summary>
      <form data-review-id="${escape(row.variant_id)}" class="audit-edit"><label>Приоритет SKU
        <input type="number" name="priority" min="0" max="999" value="${row.display_priority ?? 0}"></label>
        <label>Заметка по SKU<input name="note" maxlength="500" value="${escape(row.review_note || '')}" placeholder="Что нужно проверить"></label>
        <button type="submit">Сохранить ревизию</button></form>
      <details data-offers-id="${escape(row.variant_id)}"><summary>Предложения поставщиков</summary><div class="offer-content">Загружаю</div></details>
      <details data-stock-id="${escape(row.variant_id)}"><summary>Приёмка и история остатков</summary><div class="stock-content">Загружаю</div></details>
    </details></article>`;
}
function renderAudit() {
  const missingPrice = auditRows.filter(row => !row.price_confirmed).length;
  const missingCost = auditRows.filter(row => row.purchase_price_cents === null && row.supplier_cost_cents === null).length;
  const missingSupplier = auditRows.filter(row => !row.supplier_name).length;
  const missingTax = auditRows.filter(row => row.tax_rate_bps === null).length;
  $('admin-content').innerHTML = `<div class="audit-intro"><h2>Проверка данных товаров</h2><p>Это список конкретных фасовок, где нужно подтвердить цену продажи, закупку, ставку IVA или поставщика. Приоритет и заметка помогают отметить, что проверять первым. Предложение поставщика заполняйте только по полученному прайсу или договору.</p></div><div class="audit-overview"><div><strong>${auditRows.length}</strong><span>SKU в каталоге</span></div>
    <div><strong>${missingPrice}</strong><span>Цен проверить</span></div><div><strong>${missingCost}</strong><span>Без закупочной цены</span></div>
    <div><strong>${missingSupplier}</strong><span>Без поставщика</span></div>
    <div><strong>${missingTax}</strong><span>Без ставки IVA</span></div></div>
    <div class="audit-toolbar"><label>Поиск SKU<input id="audit-search" type="search" placeholder="Название, бренд или артикул"></label>
      <label>Показать<select id="audit-filter"><option value="all">Все варианты</option><option value="price">Цена не подтверждена</option>
        <option value="cost">Нет закупочной цены</option><option value="supplier">Нет поставщика</option>
        <option value="tax">Нет ставки IVA</option></select></label>
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
      (filter === 'supplier' && !row.supplier_name) ||
      (filter === 'tax' && row.tax_rate_bps === null));
    element.hidden = !visible;
    if (visible) count++;
  });
  $('audit-visible').textContent = `Показано: ${count}`;
}
const supplierStages = { lead:'Контакт не установлен', contacted:'Запрос отправлен',
  onboarding:'Оформление доступа', catalog:'Каталог или прайс получен',
  ready:'Готов к закупке', paused:'На паузе' };
function supplierFields(supplier = {}) {
  const selected = (name, value) => name === (value || '') ? 'selected' : '';
  return `<label>Название<input name="name" required minlength="2" maxlength="120" value="${escape(supplier.name || '')}"></label>
    <label>Тип канала<select name="kind"><option value="distributor" ${selected('distributor',supplier.kind)}>Дистрибьютор или B2B-канал</option>
      <option value="brand" ${selected('brand',supplier.kind)}>Прямой контакт бренда</option></select></label>
    <label>Этап<select name="stage">${Object.entries(supplierStages).map(([value,label]) =>
      `<option value="${value}" ${selected(value,supplier.stage)}>${label}</option>`).join('')}</select></label>
    <label>Контакт<input name="contactName" maxlength="120" value="${escape(supplier.contact_name || '')}"></label>
    <label>Email<input type="email" name="email" value="${escape(supplier.email || '')}"></label>
    <label>Телефон<input type="tel" name="phone" maxlength="60" value="${escape(supplier.phone || '')}"></label>
    <label>Сайт<input type="url" name="website" value="${escape(supplier.website || '')}"></label>
    <label>Срок доставки, дней<input type="number" min="0" max="365" name="leadDays" value="${supplier.lead_days ?? ''}"></label>
    <label class="supplier-wide">Условия<textarea name="terms" maxlength="1000" rows="2">${escape(supplier.terms || '')}</textarea></label>
    <label class="supplier-wide">Текущий статус и следующий шаг<textarea name="notes" maxlength="1500" rows="2">${escape(supplier.notes || '')}</textarea></label>
    <label class="supplier-check supplier-wide"><input type="checkbox" name="active" ${supplier.active ? 'checked' : ''}>
      Доступен для закупки - условия и точные цены проверены</label>`;
}
function supplierCard(supplier) {
  return `<article class="admin-card supplier-card" data-supplier-search="${escape(`${supplier.name} ${supplier.contact_name} ${supplier.email} ${supplier.notes} ${supplierStages[supplier.stage] || ''}`.toLowerCase())}">
    <details><summary><span class="supplier-card-title"><strong>${escape(supplier.name)}</strong>
      <small>${supplier.kind === 'brand' ? 'Бренд' : 'Дистрибьютор'} · ${escape(supplierStages[supplier.stage] || supplierStages.lead)}</small></span>
      ${supplier.offer_count ? `<span class="supplier-card-count">${supplier.offer_count} предложений</span>` : ''}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
      <div class="supplier-card-body">${supplier.contact_name ? `<p>Контакт: ${escape(supplier.contact_name)}</p>` : ''}
      ${supplier.email ? `<p>Email: <a href="mailto:${escape(supplier.email)}">${escape(supplier.email)}</a></p>` : ''}
      ${supplier.phone ? `<p>Телефон: ${escape(supplier.phone)}</p>` : ''}
      ${supplier.notes ? `<p>${escape(supplier.notes)}</p>` : ''}
      <form data-supplier-id="${escape(supplier.id)}" class="supplier-form">${supplierFields(supplier)}
        <button type="submit">Сохранить изменения</button></form></div></details></article>`;
}
function renderSuppliers() {
  $('admin-content').innerHTML = `<section class="supplier-overview"><div><h2>Поставщики и контакты брендов</h2>
    <p>${suppliers.length} контактов · ${suppliers.filter(item => item.active).length} доступны для закупки</p></div>
    <input id="supplier-search" type="search" aria-label="Поиск поставщика" placeholder="Поиск по названию, контакту или статусу"></section>
    <details class="admin-card supplier-create" ${suppliers.length ? '' : 'open'}><summary>Добавить поставщика
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
      <form data-new-supplier class="supplier-form">${supplierFields()}
        <button type="submit">Добавить поставщика</button></form></details>
    <div class="supplier-list">${suppliers.map(supplierCard).join('')}</div>`;
}
const brandMoney = cents => cents === null || cents === undefined ? '-' : euros(cents);
function brandRows() {
  if (!brandData) return [];
  const sources = new Map(brandData.items.map(item => [item.id, item]));
  const rows = brandView === 'site'
    ? brandData.siteVariants.map(variant => ({ key: `v:${variant.variant_id}`,
      variant, item: sources.get(variant.item_id) || null }))
    : brandData.items.filter(item => brandView !== 'unmatched' || !item.variant_id)
      .map(item => ({ key: `s:${item.id}`, item,
        variant: brandData.siteVariants.find(variant => variant.variant_id === item.variant_id) || null }));
  const needle = brandSearch.toLocaleLowerCase('ru');
  return rows.filter(({ item, variant }) =>
    (!brandLine || item?.line === brandLine) &&
    `${item?.name || ''} ${item?.article || ''} ${item?.ean || ''} ${variant?.name || ''} ${variant?.variant_id || ''}`
      .toLocaleLowerCase('ru').includes(needle));
}
function brandStock(variant) {
  if (!variant) return '-';
  if (variant.availability === 'unavailable') return 'Недоступен';
  if (variant.availability !== 'on_hand') return 'Под заказ';
  if (variant.stock_quantity === null) return 'Не указано';
  return `${Math.max(0, variant.stock_quantity - (variant.reserved_quantity || 0))} доступно`;
}
function brandSitePrice(variant) {
  if (!variant) return '-';
  const amount = brandMoney(variant.price_override_cents ?? variant.source_price_cents);
  return variant.price_confirmed ? amount : amount === '-' ? 'Цена не указана' : `${amount} · ориентир`;
}
function brandMatchOptions(item) {
  const words = value => new Set(String(value || '').toLocaleLowerCase('ru')
    .split(/[^\p{L}\p{N}]+/u).filter(word => word.length > 2 && word !== 'leonardo'));
  const sourceWords = words(item.name);
  const weight = value => String(value || '').toLowerCase().replace(/\s/g, '').replace('кг', 'kg').replace('гр', 'g').replace('г', 'g');
  const ranked = brandData.siteVariants.filter(site => !site.item_id || site.variant_id === item.variant_id).map(site => {
    const shared = [...words(site.name)].filter(word => sourceWords.has(word)).length;
    return { site, score: shared * 2 + (weight(site.label) === weight(item.weight) ? 6 : 0) };
  }).sort((a, b) => b.score - a.score || a.site.name.localeCompare(b.site.name));
  const likely = ranked.filter(row => row.score >= 6).slice(0, 8);
  const likelyIds = new Set(likely.map(row => row.site.variant_id));
  const option = site => `<option value="${escape(site.variant_id)}" ${site.variant_id === item.variant_id ? 'selected' : ''}>${escape(`${site.name} · ${site.label}`)}</option>`;
  return `<option value="">Не сопоставлен</option>
    ${likely.length ? `<optgroup label="Похожие по названию и фасовке">${likely.map(row => option(row.site)).join('')}</optgroup>` : ''}
    <optgroup label="Все остальные SKU">${ranked.filter(row => !likelyIds.has(row.site.variant_id)).map(row => option(row.site)).join('')}</optgroup>`;
}
function brandRow({ key, item, variant }) {
  const active = variant && variant.product_active && variant.variant_active;
  const state = variant ? active ? 'На сайте' : 'Скрыт' : 'Нет связи с сайтом';
  return `<button type="button" class="brand-row" data-brand-key="${escape(key)}"
    aria-pressed="${String(brandSelected === key)}">
    <span class="brand-identity"><strong>${escape(item?.name || variant.name)}</strong>
      <small>${escape(item ? `${item.article} · ${item.line}` : `${variant.variant_id} · Без связи с прайсом`)}</small></span>
    <span>${escape(item?.weight || variant?.label || '-')}</span>
    <span>${brandMoney(item?.shop_price_cents)}</span>
    <span>${brandMoney(item?.minimum_price_cents)}</span>
    <span>${escape(brandSitePrice(variant))}</span>
    <span>${escape(brandStock(variant))}</span>
    <span class="brand-state ${active ? 'is-live' : ''}">${escape(state)}</span>
  </button>`;
}
function renderBrandInspector() {
  const host = $('brand-inspector');
  if (!host) return;
  host.classList.toggle('is-open', brandMobileOpen);
  const selected = brandRows().find(row => row.key === brandSelected);
  if (!selected) { host.innerHTML = '<p class="admin-muted">Выберите строку, чтобы увидеть детали</p>'; return; }
  const { item, variant } = selected;
  const source = brandData.source;
  host.innerHTML = `<button type="button" class="brand-inspector-close" data-brand-close aria-label="Закрыть детали">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19"/></svg></button>
    <div class="brand-inspector-head"><div><span class="admin-muted">${item ? 'Позиция прайса' : 'Товар сайта'}</span>
    <h2>${escape(item?.name || variant.name)}</h2><p>${escape(item?.weight || variant?.label || '')}</p></div></div>
    <div class="brand-facts">
      <div><span>Артикул поставщика</span><strong>${escape(item?.article || '-')}</strong></div>
      <div><span>EAN</span><strong>${escape(item?.ean || 'Не указан')}</strong></div>
      ${item && variant ? `<div><span>Сопоставление</span><strong>${item.match_method === 'ean' ? 'По EAN' : 'Предварительно по каталогу'}</strong></div>` : ''}
      <div><span>Tienda</span><strong>${brandMoney(item?.shop_price_cents)}</strong></div>
      <div><span>Рекомендованная PVP с IVA</span><strong>${brandMoney(item?.recommended_price_cents)}</strong></div>
      <div><span>Минимальная PVP с IVA</span><strong>${brandMoney(item?.minimum_price_cents)}</strong></div>
      <div><span>Цена на сайте</span><strong>${escape(brandSitePrice(variant))}</strong></div>
      <div><span>Наличие</span><strong>${escape(brandStock(variant))}</strong></div>
      <div><span>Продано, шт</span><strong>${variant ? variant.sold_quantity ?? 0 : '-'}</strong></div>
      <div><span>Заказов покупателей</span><strong>${variant ? variant.customer_order_count ?? 0 : '-'}</strong></div>
      <div><span>Заказано у поставщиков, шт</span><strong>${variant ? variant.ordered_quantity ?? 0 : '-'}</strong></div>
      <div><span>Получено по закупкам, шт</span><strong>${variant ? variant.purchased_quantity ?? 0 : '-'}</strong></div>
      <div><span>Заявок поставщикам</span><strong>${variant ? variant.purchase_order_count ?? 0 : '-'}</strong></div>
    </div>
    ${item ? `<p class="brand-source">Источник: ${escape(source.source_file)}, строка ${item.source_row}
      <br>Tienda указана в прайсе без явной пометки об IVA - это ещё не подтверждённая закупочная цена</p>` :
      '<p class="brand-source">Для этого SKU пока нет подтверждённой связи со строкой прайса</p>'}
    ${item && variant?.price_confirmed && (variant.price_override_cents ?? variant.source_price_cents) ?
      `<div class="brand-discount"><label>Проверить скидку, %<input id="brand-discount" type="number" min="0" max="70" step="1" value="0"></label>
        <p id="brand-discount-result">Цена после скидки: ${escape(brandSitePrice(variant))}</p>
        <small>Предпросмотр не меняет цену на сайте и исходный прайс</small></div>` : ''}
    ${item ? `<div class="brand-link-state"><strong>${variant ? 'Связано с товаром сайта' : 'Этой позиции пока нет на сайте'}</strong>
      <p>${variant ? escape(`${variant.name} · ${variant.label}`) : 'Позиция есть в прайсе поставщика. Для публикации нужна отдельная карточка товара'}</p>
      ${variant || brandData.siteVariants.some(site => !site.item_id)
        ? `<button type="button" data-brand-edit>${variant ? 'Исправить сопоставление' : 'Найти существующий товар'}</button>` : ''}</div>` : ''}
    ${variant ? `<div class="brand-actions"><button type="button" data-brand-product="${escape(variant.product_id)}">Открыть товар</button>
      <button type="button" data-brand-variant="${escape(variant.variant_id)}">Цена и остаток</button></div>` : ''}
    ${item && brandMatchEditing ? `<form data-brand-match="${escape(item.article)}" class="brand-match-form">
      <label>Товар и фасовка на сайте<select name="variantId">${brandMatchOptions(item)}</select></label>
      <button type="submit">${variant ? 'Сохранить исправление' : 'Связать с товаром'}</button></form>` : ''}
    ${item && !item.variant_id ? '<button type="button" class="brand-draft" data-brand-draft="' + escape(item.article) + '">Создать скрытый черновик</button>' : ''}`;
}
function renderBrandRows() {
  const rows = brandRows();
  if (!rows.some(row => row.key === brandSelected)) brandSelected = rows[0]?.key || '';
  $('brand-list').innerHTML = rows.slice(0, brandVisibleCount).map(brandRow).join('') ||
    '<p class="brand-empty">По выбранным условиям ничего не найдено</p>';
  $('brand-count').textContent = `Показано ${Math.min(rows.length, brandVisibleCount)} из ${rows.length}`;
  $('brand-more').hidden = rows.length <= brandVisibleCount;
  renderBrandInspector();
}
function brandDirectoryRows() {
  const brands = new Map();
  for (const product of productRows) {
    const name = String(product.brand || '').trim();
    if (!name) continue;
    const entry = brands.get(name) || { name, products: 0, skus: 0, published: 0 };
    entry.products++;
    entry.skus += product.variants.length;
    if (product.active) entry.published++;
    brands.set(name, entry);
  }
  for (const source of supplierCatalogSources) if (!brands.has(source.brand)) brands.set(source.brand,
    { name: source.brand, products: 0, skus: 0, published: 0 });
  if (!brands.has('Edgard & Cooper')) brands.set('Edgard & Cooper',
    { name: 'Edgard & Cooper', products: 0, skus: 0, published: 0 });
  return [...brands.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}
function renderBrandDirectory() {
  const rows = brandDirectoryRows();
  $('admin-content').innerHTML = `<section class="brand-workspace brand-directory">
    <div class="brand-heading"><div><p class="brand-path">Продукция / Бренды</p><h2>Бренды</h2>
      <p>Выберите бренд, чтобы посмотреть его товары и SKU</p></div>
      <span class="brand-total">${rows.length} брендов</span></div>
    <div class="brand-directory-toolbar"><label>Найти бренд<input id="brand-directory-search" type="search"
      value="${escape(brandDirectorySearch)}" placeholder="Название бренда"></label></div>
    <div class="brand-directory-list">${rows.map(row => `<button type="button" class="brand-directory-row"
      data-brand-open="${escape(row.name)}" data-search="${escape(row.name.toLocaleLowerCase('ru'))}">
      <span><strong>${escape(row.name)}</strong><small>${row.products ? `${row.products} ${countNoun(row.products,'товар','товара','товаров')} · ${row.skus} SKU` : 'Товаров на сайте пока нет'}</small></span>
      <span class="brand-directory-status">${supplierCatalogSources.some(source => source.brand === row.name) ||
        row.name === 'Leonardo' && brandData?.items.length ? 'Прайс в панели' : 'Прайс не загружен в панель'}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
    </button>`).join('')}</div></section>`;
  filterBrandDirectory();
}
function filterBrandDirectory() {
  const needle = brandDirectorySearch.trim().toLocaleLowerCase('ru');
  document.querySelectorAll('.brand-directory-row').forEach(row => {
    row.hidden = !row.dataset.search.includes(needle);
  });
}
function renderCatalogBrandRows() {
  const needle = brandProductSearch.trim().toLocaleLowerCase('ru');
  const rows = variantRows.filter(row => row.brand === brandName &&
    `${row.name} ${row.label} ${row.variant_id}`.toLocaleLowerCase('ru').includes(needle));
  $('brand-catalog-count').textContent = `${rows.length} SKU${rows.length > brandVisibleCount ? ` · показаны первые ${brandVisibleCount}` : ''}`;
  $('brand-catalog-list').innerHTML = rows.slice(0, brandVisibleCount).map(row => `<article class="brand-catalog-row">
    <div><strong>${escape(row.name)}</strong><small>${escape(row.label)} · ${escape(row.category)} · ${escape(row.pet === 'dog' ? 'Собака' : row.pet === 'cat' ? 'Кошка' : 'Кошка и собака')}</small></div>
    <div><strong>${row.sale_price_cents ? euros(row.sale_price_cents) : 'Цена не указана'}</strong>
      <small>${row.price_confirmed ? 'Цена продажи подтверждена' : 'Цена продажи - ориентир'}</small></div>
    <div><span>${escape(({on_hand:'На складе',source_on_demand:'Под заказ',unavailable:'Недоступен'})[row.availability] || row.availability)}</span>
      <button type="button" data-brand-variant="${escape(row.variant_id)}">Цена и остаток</button></div>
  </article>`).join('') || '<p class="brand-empty">Товары этого бренда пока не найдены</p>';
  $('brand-catalog-more').hidden = rows.length <= brandVisibleCount;
  renderSupplierCatalogRows();
}
function supplierPriceLabel(source, item) {
  if (item.raw_prices?.kind === 'supplier_quote_tiered_iva') return 'Котировка до 5 шт, с IVA';
  if (item.raw_prices?.kind === 'recommended_retail_spain') return 'Закупочная цена не указана';
  if (item.raw_prices?.kind === 'recommended_shop_ex_iva')
    return item.raw_prices.recommendedShopCaseCents ? 'Рекомендовано магазину за коробку без IVA' : 'Рекомендовано магазину без IVA';
  if (item.raw_prices?.kind === 'purchase_price_per_product_ex_iva') return 'Покупка за штуку без IVA';
  if (source?.shop_price_tax_basis === 'excludes_iva') return 'Тариф магазину без IVA';
  return 'Tienda, IVA не уточнён';
}
function renderSupplierCatalogRows() {
  const host = $('supplier-catalog-list');
  if (!host) return;
  const source = supplierCatalogData?.source;
  const items = supplierCatalogData?.items || [];
  const needle = brandProductSearch.trim().toLocaleLowerCase('ru');
  const filtered = items.filter(item =>
    `${item.name} ${item.article} ${item.ean} ${item.line} ${item.weight}`.toLocaleLowerCase('ru').includes(needle));
  host.innerHTML = filtered.slice(0, brandVisibleCount).map(item => `<article class="supplier-price-row">
    <div><strong>${escape(item.name)}</strong><small>${escape(item.article)} · ${escape(item.line)} · ${escape(item.weight)}</small>
      <small>EAN ${escape(item.ean || 'не указан')} · строка ${item.source_row}</small></div>
    <div><strong>${brandMoney(item.shop_price_cents ?? item.raw_prices?.recommendedShopCaseCents)}</strong>
      <small>${supplierPriceLabel(source, item)}</small></div>
    <div><strong>${brandMoney(item.recommended_price_cents)}</strong><small>Рекомендованная PVP с IVA</small></div>
    <div><strong>${item.variant_id ? 'Совпадение по EAN' : 'Нет связи с SKU'}</strong>
      <small>${escape(item.site_name ? `${item.site_name} · ${item.site_label}` : 'Цена на сайте не меняется')}</small>
      ${item.raw_prices?.kind === 'supplier_quote_tiered_iva' ? `<small>От 5 шт: ${brandMoney(item.raw_prices.priceAtLeast5Cents)} с IVA · срок котировки не подтверждён</small>` : ''}</div>
  </article>`).join('') || '<p class="brand-empty">Позиций по запросу нет</p>';
  $('supplier-catalog-count').textContent = `Показано ${Math.min(filtered.length, brandVisibleCount)} из ${filtered.length}`;
  $('supplier-catalog-more').hidden = filtered.length <= brandVisibleCount;
}
function renderCatalogBrand() {
  const products = productRows.filter(product => product.brand === brandName);
  const skuCount = products.reduce((sum, product) => sum + product.variants.length, 0);
  const sources = supplierCatalogSources.filter(source => source.brand === brandName);
  const source = supplierCatalogData?.source;
  $('admin-content').innerHTML = `<section class="brand-workspace brand-catalog">
    <div class="brand-heading"><div><nav class="brand-breadcrumb" aria-label="Путь в каталоге"><button type="button" class="brand-back" data-brand-home>Продукция</button><span>/</span><button type="button" class="brand-back" data-brand-home>Бренды</button><span>/</span><span>${escape(brandName)}</span></nav>
      <h2>${escape(brandName)}</h2><p>${products.length} ${countNoun(products.length,'товар','товара','товаров')} · ${skuCount} SKU в каталоге</p></div>
      <div class="brand-heading-actions"><label class="brand-upload">Загрузить прайс JSON<input id="supplier-catalog-upload" type="file" accept=".json,application/json"></label>
        <button type="button" id="supplier-catalog-paste-toggle">Вставить JSON</button>
        <button type="button" data-go-tab="suppliers">Поставщики и контакты</button></div></div>
    <div class="brand-paste" id="supplier-catalog-paste-panel" hidden>
      <label for="supplier-catalog-paste-json">Содержимое прайса JSON</label>
      <textarea id="supplier-catalog-paste-json" spellcheck="false" placeholder="Вставьте содержимое подготовленного файла"></textarea>
      <button type="button" id="supplier-catalog-paste-submit">Загрузить прайс</button></div>
    <p class="brand-price-notice">${sources.length ? brandName === 'Heybo Pet'
      ? `Котировка ${escape(source?.source_file || sources[0].source_file)} сохранена для сравнения. Поставщик на паузе; срок действия цен и соответствие моделей товарам сайта не подтверждены`
      : `Прайс ${escape(source?.source_file || sources[0].source_file)} сохранён отдельно от цен на сайте. Совпадения по EAN требуют проверки фасовки перед закупкой. Наличие поставщика не подтверждено`
      : 'Прайс поставщика пока не загружен в панель; закупочную цену и наличие нужно проверять отдельно'}</p>
    ${sources.length ? `<div class="supplier-catalog-heading"><div><h3>Прайс поставщика</h3><p>${sources.reduce((total, row) => total + row.item_count, 0)} позиций в ${sources.length} ${countNoun(sources.length,'файле','файлах','файлах')}</p></div>
      <label>Источник<select id="supplier-catalog-source">${sources.map(row => `<option value="${escape(row.id)}" ${source?.id === row.id ? 'selected' : ''}>${escape(row.source_file)} · ${row.item_count} позиций</option>`).join('')}</select></label></div>
      <div id="supplier-catalog-list"></div><div class="brand-footer"><span id="supplier-catalog-count"></span>
        <button type="button" id="supplier-catalog-more">Показать ещё</button></div>` : ''}
    <div class="supplier-catalog-heading"><div><h3>Товары на сайте</h3><p>Цены продажи и остатки ведутся отдельно</p></div></div>
    <div class="brand-directory-toolbar"><label>Найти товар или SKU<input id="brand-product-search" type="search"
      value="${escape(brandProductSearch)}" placeholder="Название, фасовка или артикул"></label>
      <span id="brand-catalog-count"></span></div>
    <div id="brand-catalog-list"></div><div class="brand-footer"><span></span>
      <button type="button" id="brand-catalog-more">Показать ещё</button></div></section>`;
  renderCatalogBrandRows();
}
function renderBrands() {
  if (!brandName) { renderBrandDirectory(); return; }
  if (brandName !== 'Leonardo') { renderCatalogBrand(); return; }
  const { source, items, siteVariants } = brandData;
  const linked = items.filter(item => item.variant_id).length;
  const exact = items.filter(item => item.match_method === 'ean').length;
  const lines = [...new Set(items.map(item => item.line).filter(Boolean))];
  $('admin-content').innerHTML = `<section class="brand-workspace"><div class="brand-heading">
    <div><nav class="brand-breadcrumb" aria-label="Путь в каталоге"><button type="button" class="brand-back" data-brand-home>Продукция</button><span>/</span><button type="button" class="brand-back" data-brand-home>Бренды</button><span>/</span><span>Leonardo</span></nav><h2>Leonardo</h2>
      <p>Поставщик ${escape(source.supplier_name)} · ${source.price_date ? `прайс от ${escape(shortDate(source.price_date))}` : 'прайс ещё не загружен'}</p></div>
    <div class="brand-heading-actions"><label class="brand-upload">Загрузить прайс JSON<input id="brand-upload" type="file" accept=".json,application/json"></label>
      <button type="button" id="brand-paste-toggle" aria-expanded="false">Вставить JSON</button>
      <button type="button" data-go-tab="suppliers">Поставщики</button></div></div>
    <div class="brand-paste" id="brand-paste-panel" hidden><label for="brand-paste-json">Содержимое прайса JSON</label>
      <textarea id="brand-paste-json" spellcheck="false" placeholder="Вставьте содержимое файла JSON"></textarea>
      <button type="button" id="brand-paste-submit">Загрузить прайс</button></div>
    <p class="brand-price-notice">Прайс поставщика помогает сверить позиции и рассчитать цену. Он не подтверждает цену продажи CatManDog, закупочную скидку или наличие. По EAN точно совпали ${exact} SKU; остальные ${linked - exact} ${countNoun(linked - exact,'связь','связи','связей')} требуют проверки.</p>
    <div class="brand-summary"><div><strong>${items.length}</strong><span>Строк в прайсе</span></div>
      <div><strong>${siteVariants.length}</strong><span>SKU Leonardo на сайте и в черновиках</span></div>
      <div><strong>${exact}</strong><span>Совпадения по EAN</span></div>
      <div><strong>${linked - exact}</strong><span>Предварительные связи</span></div>
      <div><strong>${items.length - linked}</strong><span>Позиций прайса без SKU на сайте</span></div></div>
    <div class="brand-main"><div class="brand-left">
      <div class="brand-tabs" role="group" aria-label="Каталог Leonardo">
        <button type="button" data-brand-view="site" aria-pressed="${brandView === 'site'}">На сайте</button>
        <button type="button" data-brand-view="catalog" aria-pressed="${brandView === 'catalog'}">Весь прайс</button>
        <button type="button" data-brand-view="unmatched" aria-pressed="${brandView === 'unmatched'}">Без связи</button></div>
      <div class="brand-filters"><label>Поиск<input id="brand-search" value="${escape(brandSearch)}" placeholder="Название, EAN или артикул"></label>
        <label>Линейка<select id="brand-line"><option value="">Все линейки</option>
          ${lines.map(line => `<option value="${escape(line)}" ${brandLine === line ? 'selected' : ''}>${escape(line)}</option>`).join('')}</select></label></div>
      <div class="brand-table"><div class="brand-table-head"><span>Товар</span><span>Фасовка</span><span>Tienda</span>
        <span>Мин. PVP</span><span>На сайте</span><span>Наличие</span><span>Статус</span></div>
        <div id="brand-list"></div></div><div class="brand-footer"><span id="brand-count"></span>
        <button type="button" id="brand-more">Показать ещё</button></div></div>
      <aside class="brand-inspector" id="brand-inspector" aria-live="polite"></aside></div></section>`;
  renderBrandRows();
}
function renderReplenishment(variants) {
  $('admin-content').innerHTML = `<section class="admin-card"><h2>Товары к закупке</h2>
    <p class="admin-muted">Каждый SKU попадает сюда при достижении своего порога с учётом резерва. Количество рассчитано до целевого запаса и минимальной партии поставщика. Заказ поставщику автоматически не отправляется</p></section>
    ${variants.length ? `<div class="replenishment-list">${variants.map(row => `<article class="admin-card replenishment-row">
      <div><h2>${escape(row.name)}</h2><p class="admin-muted">${escape(row.brand || '')} · ${escape(row.label)} · ${escape(row.variant_id)}</p></div>
      <div><strong>${row.available_quantity} доступно</strong><small>На складе ${row.stock_quantity ?? 0} · Резерв ${row.reserved_quantity} · Порог ${row.reorder_point}</small>
      <small>Цель ${row.target_stock} · Уже заказано ${row.incoming_quantity} · ${row.suggested_quantity ? `В заявку ${row.suggested_quantity} шт` : 'Новая заявка не нужна'}</small></div>
      <div><strong>${escape(row.supplier_name || 'Поставщик не выбран')}</strong><small>${row.cost_cents === null ? 'Закупочная цена не указана' : euros(row.cost_cents) + (row.vat_included ? ' с IVA' : ' без IVA')}${row.minimum_quantity ? ` · минимум ${row.minimum_quantity} шт` : ''}${row.lead_days !== null ? ` · ${row.lead_days} дн` : ''}</small></div>
      <div class="replenishment-actions"><button type="button" data-audit-variant="${escape(row.variant_id)}">Открыть SKU</button>
        ${row.suggested_quantity > 0 && row.supplier_id && row.cost_cents !== null ? `<button type="button" data-plan-variant="${escape(row.variant_id)}"
          data-plan-supplier="${escape(row.supplier_id)}" data-plan-quantity="${row.suggested_quantity}">В заявку</button>` : ''}</div>
    </article>`).join('')}</div>` : '<p class="admin-card">Сейчас нет товаров с малым остатком</p>'}`;
}
function purchaseStatusLabel(status) {
  return ({ draft:'Черновик',ordered:'Заказано',partially_received:'Частично получено',
    received:'Получено',cancelled:'Закрыто' })[status] || status;
}
function renderPurchaseDraft() {
  const host = $('purchase-draft-items');
  if (!host) return;
  host.innerHTML = purchaseDraftItems.length ? purchaseDraftItems.map(item => {
    const candidate = purchaseCandidates.find(row => row.variant_id === item.variantId);
    if (!candidate) return '';
    return `<div class="purchase-draft-row"><div><strong>${escape(candidate.name)}</strong>
      <small>${escape(candidate.label)} · ${escape(candidate.variant_id)} · ${euros(candidate.cost_cents)} за шт</small></div>
      <label>Количество<input type="number" min="${candidate.minimum_quantity}" max="99999" required
        value="${item.quantity}" data-purchase-qty="${escape(item.variantId)}"></label>
      <button type="button" data-purchase-remove="${escape(item.variantId)}">Убрать</button></div>`;
  }).join('') : '<p class="admin-muted">Добавьте товары из предложений выбранного поставщика</p>';
  $('purchase-create-button').disabled = purchaseDraftItems.length === 0;
}
function renderPurchaseCandidates() {
  const select = $('purchase-candidate');
  if (!select) return;
  select.innerHTML = `<option value="">Выберите SKU</option>${purchaseCandidates.map(item =>
    `<option value="${escape(item.variant_id)}">${escape(item.name)} · ${escape(item.label)} · ${euros(item.cost_cents)} · минимум ${item.minimum_quantity} шт</option>`).join('')}`;
  $('purchase-add-button').disabled = !purchaseCandidates.length;
  renderPurchaseDraft();
}
function purchaseOrderCard(order) {
  const open = ['ordered','partially_received'].includes(order.status);
  const total = order.items.reduce((sum, item) => sum + item.orderedQuantity * item.unitCostCents, 0);
  const remaining = order.items.reduce((sum, item) => sum + item.orderedQuantity - item.receivedQuantity, 0);
  return `<article class="admin-card purchase-order-card"><div class="admin-variant-top"><div><h2>${escape(order.number)}</h2>
    <p class="admin-muted">${escape(order.supplier_name)} · ${purchaseStatusLabel(order.status)} · ${escape(new Date(order.created_at).toLocaleDateString('ru-RU'))}</p></div>
    <strong>Ориентир: ${euros(total)}${order.items.some(item => !item.vatIncluded) ? ' · есть цены без IVA' : ' с IVA'}</strong></div>
    ${order.expected_date ? `<p>Ожидаемая дата: ${escape(String(order.expected_date).slice(0,10))}</p>` : ''}
    ${order.note ? `<p>${escape(order.note)}</p>` : ''}
    <div class="purchase-order-lines">${order.items.map(item => `<div class="purchase-order-line"><div>
      <strong>${escape(item.name)}</strong><small>${escape(item.label)} · ${escape(item.variantId)}</small>
      <small>${euros(item.unitCostCents)} за шт · ${item.vatIncluded ? 'с IVA' : 'без IVA'}</small></div>
      <span>${item.receivedQuantity} из ${item.orderedQuantity} получено</span>
      ${open && item.receivedQuantity < item.orderedQuantity ? `<form data-purchase-receipt="${escape(order.id)}" class="purchase-receipt-form">
        <input type="hidden" name="itemId" value="${escape(item.id)}">
        <input type="hidden" name="idempotencyKey" value="${crypto.randomUUID()}">
        <label>Пришло, шт<input type="number" name="quantity" min="1" max="${item.orderedQuantity - item.receivedQuantity}" required></label>
        <label>Примечание<input name="note" maxlength="300" placeholder="При необходимости"></label>
        <button type="submit">Принять на склад</button></form>` : ''}</div>`).join('')}</div>
    <div class="purchase-order-footer"><span>Осталось получить: ${remaining} шт</span>
      ${order.status === 'draft' ? `<button type="button" data-purchase-status="ordered" data-purchase-id="${escape(order.id)}">Отметить как заказано</button>` : ''}
      ${['draft','ordered','partially_received'].includes(order.status) ? `<button type="button" data-purchase-status="cancelled"
        data-purchase-id="${escape(order.id)}">Закрыть остаток заявки</button>` : ''}</div></article>`;
}
function renderPurchases(orders) {
  $('admin-content').innerHTML = `<section class="admin-card"><h2>Новая заявка поставщику</h2>
    <p class="admin-muted">Заявка сохраняется здесь. Отправку поставщику и подтверждение заказа отмечайте вручную</p>
    <form data-purchase-create class="purchase-create-form">
      <label>Поставщик<select name="supplierId" id="purchase-supplier" required><option value="">Выберите поставщика</option>
        ${suppliers.filter(item => item.active).map(item => `<option value="${escape(item.id)}" ${item.id === purchaseSupplierId ? 'selected' : ''}>${escape(item.name)}</option>`).join('')}</select></label>
      <div class="purchase-pick"><label>Товар<select id="purchase-candidate"><option value="">Выберите поставщика</option></select></label>
        <button type="button" id="purchase-add-button" data-purchase-add disabled>Добавить SKU</button></div>
      <div id="purchase-draft-items" class="purchase-draft-items"></div>
      <label>Ожидаемая дата<input type="date" name="expectedDate"></label>
      <label class="purchase-note">Примечание<input name="note" maxlength="500" placeholder="Условия или номер заказа у поставщика"></label>
      <input type="hidden" name="idempotencyKey" value="${crypto.randomUUID()}">
      <button type="submit" id="purchase-create-button" disabled>Сохранить черновик</button></form></section>
    <section><h2>Заявки</h2>${orders.length ? orders.map(purchaseOrderCard).join('') : '<p class="admin-card">Заявок пока нет</p>'}</section>`;
  renderPurchaseCandidates();
}
async function loadPurchaseCandidates() {
  const selectedSupplier = purchaseSupplierId;
  purchaseCandidates = [];
  renderPurchaseCandidates();
  const variants = selectedSupplier ? (await api(`/api/admin/purchase-order-candidates?supplierId=${encodeURIComponent(selectedSupplier)}`)).variants : [];
  if (selectedSupplier !== purchaseSupplierId) return;
  purchaseCandidates = variants;
  purchaseDraftItems = purchaseDraftItems.filter(item => variants.some(row => row.variant_id === item.variantId));
  renderPurchaseCandidates();
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
async function loadStock(details) {
  const variantId = details.dataset.stockId;
  const host = details.querySelector('.stock-content');
  const names = { receipt:'Приёмка', adjustment:'Инвентаризация', order_reserved:'Резерв заказа',
    order_released:'Снятие резерва', order_fulfilled:'Доставлен заказ',
    legacy_order_cancelled:'Отмена старого заказа' };
  try {
    const { movements } = await api(`/api/admin/inventory-movements?variantId=${encodeURIComponent(variantId)}`);
    host.innerHTML = `<form data-receipt-variant="${escape(variantId)}" class="offer-form">
      <input type="hidden" name="idempotencyKey" value="${crypto.randomUUID()}">
      <label>Количество, шт<input type="number" name="quantity" min="1" max="99999" required></label>
      <label>Поставщик<select name="supplierId"><option value="">Без поставщика</option>
        ${suppliers.filter(item => item.active).map(item =>
          `<option value="${escape(item.id)}">${escape(item.name)}</option>`).join('')}</select></label>
      <label>Цена закупки за шт, €<input type="number" name="costEuros" min="0" step="0.01"></label>
      <label>Примечание<input name="note" maxlength="300" placeholder="Поставка или источник"></label>
      <button type="submit">Записать приёмку</button></form>
      <p class="admin-muted">Если поставщик не выбран, добавьте примечание</p>
      ${movements.length ? `<ol class="movement-list">${movements.map(item => `<li>
        <strong>${escape(names[item.reason] || item.reason)}</strong>
        <span>${item.delta_on_hand > 0 ? '+' : ''}${item.delta_on_hand} на складе ·
          ${item.delta_reserved > 0 ? '+' : ''}${item.delta_reserved} резерв ·
          ${escape(new Date(item.created_at).toLocaleString('ru-RU'))}</span>
        <small>${escape([item.supplier_name,item.purchase_order_number,item.order_number,item.note].filter(Boolean).join(' · '))}</small>
      </li>`).join('')}</ol>` : '<p>Движений пока нет</p>'}`;
  } catch (error) { host.textContent = error.message; }
}
function requestCard(request) {
  const statusLabel = {new:'Новое',in_progress:'В работе',resolved:'Закрыто'}[request.status] || 'Новое';
  const date = new Date(request.created_at).toLocaleString('ru-RU', {dateStyle:'short',timeStyle:'short'});
  return `<article class="request-item"><details><summary><span class="request-kind">${request.kind === 'return' ? 'Возврат' : 'Поддержка'}</span>
    <span class="request-identity"><strong>${escape(request.email)}</strong><small>${escape(request.message)}</small></span>
    <span class="request-status request-status-${escape(request.status)}">${statusLabel}</span><time>${escape(date)}</time>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
    <div class="request-detail"><div class="request-facts"><span>Заказ: ${escape(request.order_number || 'Не указан')}</span><span>Язык: ${request.locale === 'es' ? 'испанский' : 'русский'}</span>
      ${request.product_id ? `<span>Товар: ${escape(request.product_id)}${request.variant_id ? ` · ${escape(request.variant_id)}` : ''}${request.quantity ? ` · ${request.quantity} шт` : ''}</span>` : ''}</div>
      <p>${escape(request.message)}</p>${request.last_reply_at ? `<div class="request-last-reply"><strong>Последний ответ · ${escape(new Date(request.last_reply_at).toLocaleString('ru-RU'))}</strong><p>${escape(request.last_reply_message || '')}</p></div>` : ''}
      <form data-reply-id="${escape(request.id)}" class="admin-reply-form"><label>Ответ покупателю<textarea name="message" rows="4" minlength="2" maxlength="4000" required placeholder="${request.locale === 'es' ? 'Напишите ответ покупателю на испанском' : 'Напишите ответ покупателю на русском'}"></textarea></label><button type="submit">Отправить ответ</button></form>
      <form data-request-id="${escape(request.id)}" class="request-status-form"><label>Статус<select name="status">${['new','in_progress','resolved'].map(status =>
        `<option value="${status}" ${status === request.status ? 'selected' : ''}>${({new:'Новое',in_progress:'В работе',resolved:'Закрыто'})[status]}</option>`).join('')}</select></label><button>Сохранить статус</button></form></div></details></article>`;
}
async function loadRequests() {
  const params = new URLSearchParams({page:String(requestPage)});
  if (requestSearch.trim()) params.set('q', requestSearch.trim());
  if (requestStatus !== 'all') params.set('status', requestStatus);
  const result = await api(`/api/admin/service-requests?${params}`);
  $('admin-content').innerHTML = `<section class="request-workspace"><div class="request-heading"><h2>Обращения</h2><p>Вопросы покупателей и возвраты</p></div>
    <div class="request-toolbar"><label>Поиск<input id="request-search" type="search" value="${escape(requestSearch)}" placeholder="Email, заказ или текст обращения"></label>
    <label>Статус<select id="request-status"><option value="all">Все статусы</option>${[['new','Новые'],['in_progress','В работе'],['resolved','Закрытые']].map(([value,label]) => `<option value="${value}" ${requestStatus === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>
    <p class="request-count">${result.requests.length ? `Показано ${requestPage * 25 + 1}-${requestPage * 25 + result.requests.length}` : 'Обращений не найдено'}</p>
    <div class="request-list">${result.requests.map(requestCard).join('')}</div>
    <div class="request-pages"><button type="button" id="request-prev" ${requestPage === 0 ? 'disabled' : ''}>Назад</button><span>Страница ${requestPage + 1}</span><button type="button" id="request-next" ${result.hasMore ? '' : 'disabled'}>Дальше</button></div></section>`;
  message('');
}
const sellerFieldLabels = { legal_name:'Имя или название', tax_id:'NIF',
  street_address:'Адрес', postal_code:'Почтовый индекс', city:'Город' };
function renderFinance(data) {
  const profile = data.profile || {};
  const totals = data.totals || {};
  const missingProfile = Object.entries(sellerFieldLabels).filter(([key]) => !profile[key]).map(([, label]) => label);
  $('admin-content').innerHTML = `<section class="admin-card"><h2>Финансы</h2>
    <p class="admin-muted">Это внутренний учёт заказов. Он не выпускает фактуры и не отправляет данные в налоговую службу</p>
    <div class="finance-totals"><div><strong>${euros(totals.paid_total_cents || 0)}</strong><span>Оплачено · ${totals.paid_orders || 0} заказов</span></div>
    <div><strong>${totals.awaiting_orders || 0}</strong><span>Ожидают оплаты</span></div>
    <div><strong>${totals.refunded_orders || 0}</strong><span>Возвращены</span></div></div></section>
    <section class="admin-card"><h2>Что нужно заполнить</h2>
      <p>${missingProfile.length ? `Реквизиты: ${escape(missingProfile.join(', '))}` : 'Основные реквизиты заполнены'}</p>
      <p>Ставки IVA SKU: ${data.taxCoverage?.missing_sku_rates ?? 0} из ${data.taxCoverage?.active_skus ?? 0} без проверки${profile.delivery_tax_rate_bps === null || profile.delivery_tax_rate_bps === undefined ? ' · ставка доставки не указана' : ''}</p>
      <p class="admin-muted">После заполнения данных потребуется подключить соответствующий требованиям способ выпуска фактур</p></section>
    <section class="admin-card"><h2>Ваши фискальные данные</h2>
    <p class="admin-muted">Это данные владельца CatManDog для будущих счетов и внутреннего учёта. Здесь должны быть ваши имя, NIF и адрес как autónomo. Эта форма пока не выпускает счета. Публичные контакты магазина указаны отдельно в <a href="/legal.html" target="_blank" rel="noopener noreferrer">юридической информации</a>.</p>
    <form data-finance-settings class="finance-settings">
      <label>Имя или юридическое название<input name="legalName" maxlength="160" value="${escape(profile.legal_name)}"></label>
      <label>NIF<input name="taxId" maxlength="40" value="${escape(profile.tax_id)}"></label>
      <label>Адрес<input name="streetAddress" maxlength="200" value="${escape(profile.street_address)}"></label>
      <label>Почтовый индекс<input name="postalCode" maxlength="20" value="${escape(profile.postal_code)}"></label>
      <label>Город<input name="city" maxlength="100" value="${escape(profile.city)}"></label>
      <label>Провинция<input name="province" maxlength="100" value="${escape(profile.province)}"></label>
      <label>Email<input name="contactEmail" type="email" maxlength="160" value="${escape(profile.contact_email)}"></label>
      <label>IVA доставки, %<input name="deliveryTaxPercent" type="number" min="0" max="100" step="0.01" value="${profile.delivery_tax_rate_bps === null || profile.delivery_tax_rate_bps === undefined ? '' : profile.delivery_tax_rate_bps / 100}" placeholder="После проверки"></label>
      <button type="submit">Сохранить данные</button></form>
    <p class="admin-muted">Ставка доставки применяется только к будущим заказам. Ставки товаров задаются в разделе «Цены и остатки» для каждого SKU</p></section>
    <section><h2>Расчёты заказов</h2><p class="admin-muted">В расчёте используются ставки IVA, сохранённые в момент заказа. Изменение ставки SKU не переписывает старый заказ</p>
    ${data.orders.length ? `<div class="finance-orders">${data.orders.map(order => `<article class="admin-card finance-order">
      <div><strong>${escape(order.number)}</strong><small>${escape(order.customer_name)} · ${escape(shortDate(order.created_at))}</small></div>
      <div><strong>${euros(order.total_cents)}</strong><small>${escape(order.payment_status === 'paid' ? 'Оплачен' : 'Не оплачен')} · ${order.lines_without_tax || order.delivery_tax_missing ? 'Ставки не заполнены' : 'Ставки сохранены'}</small></div>
      <button type="button" data-finance-order="${escape(order.id)}">Проверить расчёт</button>
      <div class="finance-preview" id="finance-preview-${escape(order.id)}" hidden></div></article>`).join('')}</div>` : '<p class="admin-card">Заказов пока нет</p>'}</section>`;
}
async function loadFinancePreview(button) {
  const host = document.getElementById(`finance-preview-${button.dataset.financeOrder}`);
  if (!host) return;
  if (!host.hidden) { host.hidden = true; return; }
  host.hidden = false;
  host.textContent = 'Загружаю расчёт';
  try {
    const { preview } = await api(`/api/admin/finance/orders/${encodeURIComponent(button.dataset.financeOrder)}`);
    const missing = [
      ...preview.missingSellerFields.map(field => sellerFieldLabels[field] || field),
      ...preview.missingTaxVariants.map(id => `IVA для ${id}`),
      ...(preview.missingDeliveryTax ? ['IVA доставки'] : [])
    ];
    host.innerHTML = `<p><strong>Внутренний расчёт ${escape(preview.orderNumber)}</strong></p>
      <ul>${preview.lines.map(line => `<li>${escape(line.name)} · ${escape(line.variantLabel)} · ${line.quantity} шт
        <span>${euros(line.grossCents)}${line.taxCents === null ? ' · IVA не указана' : ` · IVA ${line.taxRateBps / 100}%: ${euros(line.taxCents)}`}</span></li>`).join('')}</ul>
      <p>Скидка: ${euros(preview.discountCents)} · Доставка: ${euros(preview.deliveryCents)} · Итого: <strong>${euros(preview.totalCents)}</strong></p>
      ${preview.taxComplete ? `<p>Основа: ${euros(preview.netTotalCents)} · IVA: ${euros(preview.taxTotalCents)}</p>` : ''}
      <p class="admin-muted">${missing.length ? `Для будущего оформления нужно заполнить: ${escape(missing.join(', '))}` : 'Расчёт заполнен, выпуск фактуры пока не подключён'}</p>`;
  } catch (error) { host.textContent = error.message; }
}
function renderOverview(data) {
  const { catalog, orders, requests, topPaidSkus, purchases, coverage = [], customers = {} } = data;
  $('admin-content').innerHTML = `<div class="audit-overview overview-grid">
    <div><strong>${catalog.total}</strong><span>SKU в каталоге</span></div>
    <div><strong>${catalog.unconfirmed_prices}</strong><span>Цен проверить</span></div>
    <div><strong>${catalog.missing_costs}</strong><span>Без закупочной цены</span></div>
    <div><strong>${catalog.missing_tax_rates}</strong><span>Без ставки IVA</span></div>
    <div><strong>${catalog.missing_suppliers}</strong><span>Без основного поставщика</span></div>
    <div><strong>${catalog.low_stock}</strong><span>Мало товара на складе</span></div>
    <div><strong>${purchases.open_purchase_orders}</strong><span>Заявок поставщикам в работе</span></div>
    <div><strong>${orders.open_orders}</strong><span>Заказов в работе</span></div>
    <div><strong>${customers.registered ?? 0}</strong><span>Аккаунтов покупателей</span></div>
    <div><strong>${requests.new_requests}</strong><span>Новых обращений</span></div>
    <div><strong>${euros(orders.paid_total_30d)}</strong><span>Оплачено за 30 дней · ${orders.paid_orders_30d} заказов</span></div>
  </div><section class="admin-card"><h2>Что проверить сейчас</h2>
    <div class="overview-actions"><button type="button" data-go-tab="audit">Проверить данные SKU</button>
    <button type="button" data-go-tab="products">Открыть продукцию</button>
    <button type="button" data-go-tab="replenishment">Товары к закупке</button>
    <button type="button" data-go-tab="purchases">Открыть закупки</button>
    <button type="button" data-go-tab="orders">Открыть заказы</button>
    <button type="button" data-go-tab="customers">Открыть покупателей</button>
    <button type="button" data-go-tab="finance">Финансы и реквизиты</button>
    <button type="button" data-go-tab="requests">Открыть обращения</button></div></section>
    <section class="admin-card"><h2>Ассортимент по категориям</h2>
      <div class="coverage-list">${coverage.map(item => `<button type="button" data-coverage-category="${escape(item.category)}" data-coverage-pet="${escape(item.pet)}"><strong>${escape(item.pet === 'cat' ? 'Кошки' : item.pet === 'dog' ? 'Собаки' : 'Оба')} · ${escape(item.category)}</strong>
        <span>${item.products} товаров · ${item.variants} SKU</span>
        <small>${item.unconfirmed_prices} цен проверить · ${item.missing_suppliers} без поставщика</small></button>`).join('') || '<p class="admin-muted">Действующих товаров пока нет</p>'}</div></section>
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
    if (tab === 'products') {
      const [products, variants, catalogs] = await Promise.all([
        api('/api/admin/products'), api('/api/admin/variants'), api('/api/admin/supplier-catalogs')]);
      productRows = products.products;
      variantRows = variants.variants;
      supplierCatalogSources = catalogs.sources;
      renderProducts();
      message('');
      return;
    }
    if (tab === 'brands') {
      const [products, variants, leonardo, catalogs] = await Promise.all([
        api('/api/admin/products'), api('/api/admin/variants'), api('/api/admin/brands/leonardo'),
        api('/api/admin/supplier-catalogs')]);
      productRows = products.products;
      variantRows = variants.variants;
      brandData = leonardo;
      supplierCatalogSources = catalogs.sources;
      supplierCatalogData = null;
      renderBrands();
      message('');
      return;
    }
    if (tab === 'customers') {
      await loadCustomers();
      return;
    }
    if (tab === 'finance') {
      renderFinance(await api('/api/admin/finance'));
      message('Финансовая сводка');
      return;
    }
    if (tab === 'suppliers') {
      suppliers = (await api('/api/admin/suppliers')).suppliers;
      renderSuppliers();
      message(`Поставщиков: ${suppliers.length}`);
      return;
    }
    if (tab === 'replenishment') {
      const { variants } = await api('/api/admin/replenishment');
      renderReplenishment(variants);
      message(`К закупке: ${variants.length}`);
      return;
    }
    if (tab === 'purchases') {
      const [purchaseData, supplierData] = await Promise.all([
        api('/api/admin/purchase-orders'), api('/api/admin/suppliers')]);
      suppliers = supplierData.suppliers;
      renderPurchases(purchaseData.orders);
      await loadPurchaseCandidates();
      message(`Заявок: ${purchaseData.orders.length}`);
      return;
    }
    if (tab === 'requests') { await loadRequests(); return; }
    const path = { orders:'/api/admin/orders', variants:'/api/admin/variants' }[tab];
    const result = await api(path);
    if (tab === 'variants') {
      variantRows = result.variants;
      renderVariants();
      message(`Вариантов: ${variantRows.length}`);
      return;
    }
    $('admin-content').innerHTML = result.orders.length ? result.orders.map(orderCard).join('') : '<p>Заказов пока нет</p>';
    message(`Заказов: ${result.orders.length}`);
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
  if (tab === 'brands') brandName = '';
  if (tab === 'products') openedProductId = '';
  document.querySelectorAll('[data-tab]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  load();
}));
$('admin-content').addEventListener('input', event => {
  if (event.target.id === 'brand-directory-search') {
    brandDirectorySearch = event.target.value;
    filterBrandDirectory();
    return;
  }
  if (event.target.id === 'brand-product-search') {
    brandProductSearch = event.target.value;
    brandVisibleCount = 50;
    renderCatalogBrandRows();
    return;
  }
  if (event.target.id === 'supplier-search') {
    const needle = event.target.value.trim().toLowerCase();
    document.querySelectorAll('.supplier-card').forEach(card => {
      card.hidden = !card.dataset.supplierSearch.includes(needle);
    });
    return;
  }
  if (event.target.id === 'brand-discount') {
    const selected = brandRows().find(row => row.key === brandSelected);
    const price = selected?.variant?.price_override_cents ?? selected?.variant?.source_price_cents;
    const percent = Number(event.target.value);
    const output = $('brand-discount-result');
    if (!output || !Number.isInteger(percent) || percent < 0 || percent > 70 || !price) return;
    const discounted = Math.round(price * (100 - percent) / 100);
    output.textContent = `Цена после скидки: ${euros(discounted)}` +
      (selected.item.minimum_price_cents !== null && discounted < selected.item.minimum_price_cents
        ? ' · ниже минимума в прайсе' : '');
    return;
  }
  if (event.target.id === 'brand-search') {
    brandSearch = event.target.value;
    brandVisibleCount = 50;
    renderBrandRows();
  }
  if (event.target.id === 'catalog-product-search') {
    productSearch = event.target.value;
    productVisibleCount = 40;
    renderProductList();
  }
  if (event.target.id === 'admin-variant-search') {
    variantSearch = event.target.value;
    renderVariantList();
  }
  if (event.target.id === 'customer-search') {
    customerSearch = event.target.value.trim();
    customerPage = 0;
    clearTimeout(customerSearchTimer);
    customerSearchTimer = setTimeout(() => loadCustomers().catch(error => message(error.message)), 300);
  }
  if (event.target.id === 'request-search') {
    requestSearch = event.target.value;
    requestPage = 0;
    clearTimeout(requestSearchTimer);
    requestSearchTimer = setTimeout(() => loadRequests().catch(error => message(error.message)), 300);
  }
  if (['audit-search','audit-filter','audit-pet'].includes(event.target.id)) filterAudit();
  if (event.target.matches('[data-purchase-qty]')) {
    const item = purchaseDraftItems.find(row => row.variantId === event.target.dataset.purchaseQty);
    if (item) item.quantity = Number(event.target.value);
  }
});
async function importBrandSnapshot(snapshot) {
  const result = await api('/api/admin/brands/leonardo/import', 'POST', snapshot);
  brandData = await api('/api/admin/brands/leonardo');
  brandView = 'catalog';
  brandSelected = '';
  renderBrands();
  const newLinks = (result.autoMatched || 0) + (result.catalogMatched || 0);
  message(result.alreadyImported
    ? `Прайс уже загружен, сейчас сопоставлено ещё ${newLinks} позиций`
    : `Загружено ${result.imported} строк, сопоставлено ${newLinks} позиций`);
}
async function importGenericSupplierCatalog(snapshot) {
  if (snapshot.brand !== brandName) throw new Error('Бренд в файле не совпадает с открытым брендом');
  const result = await api('/api/admin/supplier-catalogs/import', 'POST', snapshot);
  supplierCatalogSources = (await api('/api/admin/supplier-catalogs')).sources;
  supplierCatalogData = await api(`/api/admin/supplier-catalogs/${encodeURIComponent(snapshot.id)}`);
  brandVisibleCount = 50;
  renderBrands();
  message(result.alreadyImported ? 'Этот прайс уже был загружен' : `Загружено ${result.imported} позиций`);
}
$('admin-content').addEventListener('change', async event => {
  if (event.target.id === 'request-status') {
    requestStatus = event.target.value;
    requestPage = 0;
    loadRequests().catch(error => message(error.message));
    return;
  }
  if (event.target.id === 'catalog-category') {
    productCategory = event.target.value;
    productVisibleCount = 40;
    renderProducts();
    return;
  }
  if (event.target.id === 'catalog-brand') {
    productBrand = event.target.value;
    productVisibleCount = 40;
    renderProducts();
    return;
  }
  if (event.target.id === 'catalog-pet') {
    productPet = event.target.value;
    productVisibleCount = 40;
    renderProductList();
    return;
  }
  if (event.target.id === 'supplier-catalog-upload') {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1500000) throw new Error('Файл прайса слишком большой');
      const snapshot = JSON.parse(await file.text());
      await importGenericSupplierCatalog(snapshot);
    } catch (error) { message(error.message); event.target.value = ''; }
    return;
  }
  if (event.target.id === 'supplier-catalog-source') {
    try {
      supplierCatalogData = await api(`/api/admin/supplier-catalogs/${encodeURIComponent(event.target.value)}`);
      brandVisibleCount = 50;
      renderBrands();
    } catch (error) { message(error.message); }
    return;
  }
  if (event.target.id === 'brand-upload') {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1500000) throw new Error('Файл прайса слишком большой');
      const snapshot = JSON.parse(await file.text());
      await importBrandSnapshot(snapshot);
    } catch (error) { message(error.message); event.target.value = ''; }
    return;
  }
  if (event.target.id === 'brand-line') {
    brandLine = event.target.value;
    brandVisibleCount = 50;
    renderBrandRows();
  }
  if (['audit-filter','audit-pet'].includes(event.target.id)) filterAudit();
  if (event.target.id === 'purchase-supplier') {
    purchaseSupplierId = event.target.value;
    purchaseDraftItems = [];
    try { await loadPurchaseCandidates(); }
    catch (error) { message(error.message); }
  }
});
$('admin-content').addEventListener('click', async event => {
  if (event.target.id === 'request-prev' || event.target.id === 'request-next') {
    requestPage = Math.max(0, requestPage + (event.target.id === 'request-next' ? 1 : -1));
    loadRequests().catch(error => message(error.message));
    return;
  }
  const productOpen = event.target.closest('[data-product-open]');
  if (productOpen) {
    openedProductId = productOpen.dataset.productOpen;
    renderProducts();
    window.scrollTo(0, 0);
    return;
  }
  if (event.target.closest('[data-product-back]')) {
    openedProductId = '';
    renderProducts();
    return;
  }
  const productCategoryButton = event.target.closest('[data-product-category]');
  if (productCategoryButton) {
    openedProductId = '';
    productCategory = productCategoryButton.dataset.productCategory;
    productBrand = 'all';
    renderProducts();
    return;
  }
  const productBrandButton = event.target.closest('[data-product-brand], [data-catalog-brand-open]');
  if (productBrandButton) {
    productBrand = productBrandButton.dataset.productBrand || productBrandButton.dataset.catalogBrandOpen;
    productCategory = 'all';
    productSearch = '';
    productVisibleCount = 40;
    catalogView = 'products';
    openedProductId = '';
    renderProducts();
    return;
  }
  const catalogViewButton = event.target.closest('[data-catalog-view]');
  if (catalogViewButton) {
    catalogView = catalogViewButton.dataset.catalogView;
    productSearch = '';
    productVisibleCount = 40;
    renderProducts();
    return;
  }
  const categoryButton = event.target.closest('[data-catalog-category]');
  if (categoryButton) {
    productCategory = categoryButton.dataset.catalogCategory;
    productVisibleCount = 40;
    renderProducts();
    return;
  }
  if (event.target.closest('#catalog-product-more')) {
    productVisibleCount += 40;
    renderProductList();
    return;
  }
  if (event.target.closest('#catalog-product-all')) {
    productVisibleCount = productRows.length;
    renderProductList();
    return;
  }
  const productPriceList = event.target.closest('[data-product-price-list]');
  if (productPriceList) {
    brandName = productPriceList.dataset.productPriceList;
    tab = 'brands';
    document.querySelectorAll('[data-tab]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.tab === 'products')));
    await load();
    return;
  }
  const coverageButton = event.target.closest('[data-coverage-category]');
  if (coverageButton) {
    tab = 'products';
    catalogView = 'products';
    productCategory = coverageButton.dataset.coverageCategory;
    productPet = coverageButton.dataset.coveragePet || 'all';
    productBrand = 'all';
    openedProductId = '';
    productSearch = '';
    productVisibleCount = 40;
    document.querySelectorAll('[data-tab]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.tab === tab)));
    await load();
    return;
  }
  if (event.target.id === 'supplier-catalog-paste-toggle') {
    const panel = $('supplier-catalog-paste-panel');
    panel.hidden = !panel.hidden;
    if (!panel.hidden) $('supplier-catalog-paste-json').focus();
    return;
  }
  if (event.target.id === 'supplier-catalog-paste-submit') {
    const button = event.target;
    button.disabled = true;
    try { await importGenericSupplierCatalog(JSON.parse($('supplier-catalog-paste-json').value)); }
    catch (error) { message(error.message); button.disabled = false; }
    return;
  }
  if (event.target.closest('[data-brand-home]')) {
    brandName = '';
    brandProductSearch = '';
    tab = 'products';
    catalogView = 'brands';
    openedProductId = '';
    document.querySelectorAll('[data-tab]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.tab === tab)));
    renderProducts();
    return;
  }
  const brandOpen = event.target.closest('[data-brand-open]');
  if (brandOpen) {
    brandName = brandOpen.dataset.brandOpen;
    brandProductSearch = '';
    brandVisibleCount = 50;
    const firstSource = supplierCatalogSources.find(source => source.brand === brandName);
    supplierCatalogData = null;
    if (firstSource && brandName !== 'Leonardo') {
      try { supplierCatalogData = await api(`/api/admin/supplier-catalogs/${encodeURIComponent(firstSource.id)}`); }
      catch (error) { message(error.message); }
    }
    renderBrands();
    return;
  }
  if (event.target.id === 'supplier-catalog-more') {
    brandVisibleCount += 50;
    renderSupplierCatalogRows();
    return;
  }
  if (event.target.closest('#brand-catalog-more')) {
    brandVisibleCount += 50;
    renderCatalogBrandRows();
    return;
  }
  if (event.target.id === 'brand-paste-toggle') {
    const panel = $('brand-paste-panel');
    panel.hidden = !panel.hidden;
    event.target.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) $('brand-paste-json').focus();
    return;
  }
  if (event.target.id === 'brand-paste-submit') {
    const input = $('brand-paste-json');
    const raw = input.value.trim();
    if (!raw) { message('Вставьте содержимое файла JSON'); return; }
    if (raw.length > 1500000) { message('Прайс слишком большой'); return; }
    event.target.disabled = true;
    try { await importBrandSnapshot(JSON.parse(raw)); }
    catch (error) { message(error.message); event.target.disabled = false; }
    return;
  }
  const brandViewButton = event.target.closest('[data-brand-view]');
  if (brandViewButton) {
    brandView = brandViewButton.dataset.brandView;
    brandVisibleCount = 50;
    document.querySelectorAll('[data-brand-view]').forEach(button =>
      button.setAttribute('aria-pressed', String(button === brandViewButton)));
    renderBrandRows();
    return;
  }
  const brandRowButton = event.target.closest('[data-brand-key]');
  if (brandRowButton) {
    brandSelected = brandRowButton.dataset.brandKey;
    brandMatchEditing = false;
    brandMobileOpen = true;
    renderBrandRows();
    return;
  }
  if (event.target.closest('[data-brand-edit]')) {
    brandMatchEditing = !brandMatchEditing;
    renderBrandInspector();
    return;
  }
  if (event.target.closest('[data-brand-close]')) {
    brandMobileOpen = false;
    renderBrandInspector();
    return;
  }
  if (event.target.closest('#brand-more')) { brandVisibleCount += 50; renderBrandRows(); return; }
  const brandProduct = event.target.closest('[data-brand-product]');
  if (brandProduct) {
    productSearch = brandProduct.dataset.brandProduct;
    openedProductId = brandProduct.dataset.brandProduct;
    tab = 'products';
    document.querySelectorAll('[data-tab]').forEach(item =>
      item.setAttribute('aria-pressed', String(item.dataset.tab === tab)));
    await load();
    return;
  }
  const brandVariant = event.target.closest('[data-brand-variant]');
  if (brandVariant) {
    variantSearch = brandVariant.dataset.brandVariant;
    tab = 'variants';
    document.querySelectorAll('[data-tab]').forEach(item =>
      item.setAttribute('aria-pressed', String(item.dataset.tab === tab)));
    await load();
    return;
  }
  const brandDraft = event.target.closest('[data-brand-draft]');
  if (brandDraft) {
    brandDraft.disabled = true;
    try {
      const sourceId = brandData.source.id;
      const created = await api(`/api/admin/brands/leonardo/items/${brandDraft.dataset.brandDraft}/draft`, 'POST');
      brandData = await api('/api/admin/brands/leonardo');
      brandView = 'catalog';
      brandSelected = `s:${sourceId}:${brandDraft.dataset.brandDraft}`;
      renderBrands();
      message(`Скрытый черновик создан: ${created.variantId}`);
    } catch (error) { brandDraft.disabled = false; message(error.message); }
    return;
  }
  const financeButton = event.target.closest('[data-finance-order]');
  if (financeButton) { await loadFinancePreview(financeButton); return; }
  const pageButton = event.target.closest('[data-customer-page]');
  if (pageButton && !pageButton.disabled) {
    customerPage = Number(pageButton.dataset.customerPage);
    await loadCustomers().catch(error => message(error.message));
    return;
  }
  const customerSummary = event.target.closest('details[data-customer-id] > summary');
  if (customerSummary) {
    const details = customerSummary.parentElement;
    if (!details.open) loadCustomerDetail(details);
    return;
  }
  const plan = event.target.closest('[data-plan-variant]');
  if (plan) {
    purchaseSupplierId = plan.dataset.planSupplier;
    purchaseDraftItems = [{ variantId: plan.dataset.planVariant,
      quantity: Number(plan.dataset.planQuantity) }];
    tab = 'purchases';
    document.querySelectorAll('[data-tab]').forEach(item =>
      item.setAttribute('aria-pressed', String(item.dataset.tab === tab)));
    await load();
    return;
  }
  if (event.target.closest('[data-purchase-add]')) {
    const variantId = $('purchase-candidate')?.value;
    const candidate = purchaseCandidates.find(row => row.variant_id === variantId);
    if (candidate && !purchaseDraftItems.some(item => item.variantId === variantId)) {
      purchaseDraftItems.push({ variantId, quantity: candidate.minimum_quantity });
      renderPurchaseDraft();
    }
    return;
  }
  const remove = event.target.closest('[data-purchase-remove]');
  if (remove) {
    purchaseDraftItems = purchaseDraftItems.filter(item => item.variantId !== remove.dataset.purchaseRemove);
    renderPurchaseDraft();
    return;
  }
  const purchaseStatus = event.target.closest('[data-purchase-status]');
  if (purchaseStatus) {
    purchaseStatus.disabled = true;
    try {
      await api(`/api/admin/purchase-orders/${encodeURIComponent(purchaseStatus.dataset.purchaseId)}/status`, 'PATCH',
        { status: purchaseStatus.dataset.purchaseStatus });
      await load();
      message('Статус заявки сохранён');
    } catch (error) { purchaseStatus.disabled = false; message(error.message); }
    return;
  }
  const selectedVariant = event.target.closest('[data-audit-variant]');
  if (selectedVariant) {
    auditFilters = { search: selectedVariant.dataset.auditVariant.toLowerCase(), filter: 'all', pet: 'all' };
    tab = 'audit';
    document.querySelectorAll('[data-tab]').forEach(item =>
      item.setAttribute('aria-pressed', String(item.dataset.tab === tab)));
    load();
    return;
  }
  const editVariant = event.target.closest('[data-edit-variant]');
  if (editVariant) {
    variantSearch = editVariant.dataset.editVariant;
    tab = 'variants';
    document.querySelectorAll('[data-tab]').forEach(item =>
      item.setAttribute('aria-pressed', String(item.dataset.tab === tab)));
    await load();
    return;
  }
  const shortcut = event.target.closest('[data-go-tab]');
  if (shortcut) {
    tab = shortcut.dataset.goTab;
    if (tab === 'brands') brandName = '';
    document.querySelectorAll('[data-tab]').forEach(item =>
      item.setAttribute('aria-pressed', String(item.dataset.tab === tab)));
    load();
    return;
  }
  const summary = event.target.closest('details[data-offers-id] > summary');
  if (summary) {
    const details = summary.parentElement;
    if (!details.open) loadOffers(details);
    return;
  }
  const stockSummary = event.target.closest('details[data-stock-id] > summary');
  if (stockSummary) {
    const details = stockSummary.parentElement;
    if (!details.open) loadStock(details);
  }
});
$('admin-content').addEventListener('submit', async event => {
  const form = event.target.closest('form');
  if (!form) return;
  event.preventDefault();
  const values = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"], button:not([type])');
  if (submitButton) submitButton.disabled = true;
  try {
    if (form.hasAttribute('data-brand-match')) {
      await api(`/api/admin/brands/leonardo/items/${form.dataset.brandMatch}/match`, 'PUT',
        { variantId: values.get('variantId') });
      brandData = await api('/api/admin/brands/leonardo');
      brandMatchEditing = false;
      renderBrands();
      message('Сопоставление товара обновлено');
      return;
    }
    if (form.hasAttribute('data-purchase-create')) {
      const items = [...form.querySelectorAll('[data-purchase-qty]')].map(input => ({
        variantId: input.dataset.purchaseQty, quantity: Number(input.value) }));
      if (!items.length) throw new Error('Добавьте товары в заявку');
      await api('/api/admin/purchase-orders', 'POST', { supplierId: values.get('supplierId'),
        expectedDate: values.get('expectedDate'), note: values.get('note'),
        idempotencyKey: values.get('idempotencyKey'), items });
      purchaseDraftItems = [];
    }
    else if (form.dataset.purchaseReceipt) await api(`/api/admin/purchase-orders/${encodeURIComponent(form.dataset.purchaseReceipt)}/receipts`, 'POST', {
      itemId: values.get('itemId'), quantity: Number(values.get('quantity')),
      note: values.get('note'), idempotencyKey: values.get('idempotencyKey') });
    else if (form.hasAttribute('data-product-create')) {
      const created = await api('/api/admin/products', 'POST', { ...catalogPayload(values), variantLabel: values.get('variantLabel') });
      openedProductId = created.id;
      productSearch = created.id;
    }
    else if (form.dataset.productId) {
      await api(`/api/admin/products/${encodeURIComponent(form.dataset.productId)}`, 'PATCH',
        { ...catalogPayload(values), active: values.has('active') });
      openedProductId = form.dataset.productId;
    }
    else if (form.dataset.productVariant) {
      await api(`/api/admin/products/${encodeURIComponent(form.dataset.productVariant)}/variants`, 'POST',
        { label: values.get('label') });
      openedProductId = form.dataset.productVariant;
    }
    else if (form.dataset.variantMetadata) {
      await api(`/api/admin/variants/${encodeURIComponent(form.dataset.variantMetadata)}/metadata`, 'PATCH',
        { label: values.get('label'), active: values.has('active'), imagePath: values.get('imagePath'),
          description: values.get('description'), details: String(values.get('details') || '').split('\n').map(item => item.trim()).filter(Boolean) });
      openedProductId = productRows.find(product => product.variants.some(variant => variant.id === form.dataset.variantMetadata))?.id || '';
    }
    else if (form.dataset.reviewId) await api(`/api/admin/variants/${encodeURIComponent(form.dataset.reviewId)}/review`, 'PATCH',
      { priority: Number(values.get('priority')), note: values.get('note') });
    else if (form.hasAttribute('data-finance-settings')) await api('/api/admin/finance/settings', 'PATCH', {
      legalName: values.get('legalName'), taxId: values.get('taxId'),
      streetAddress: values.get('streetAddress'), postalCode: values.get('postalCode'),
      city: values.get('city'), province: values.get('province'), contactEmail: values.get('contactEmail'),
      deliveryTaxRateBps: values.get('deliveryTaxPercent') === '' ? null :
        Math.round(Number(values.get('deliveryTaxPercent')) * 100) });
    else if (form.hasAttribute('data-new-supplier')) await api('/api/admin/suppliers', 'POST', {
      name: values.get('name'), kind: values.get('kind'), stage: values.get('stage'),
      contactName: values.get('contactName'), email: values.get('email'), phone: values.get('phone'),
      website: values.get('website'), terms: values.get('terms'), notes: values.get('notes'),
      leadDays: values.get('leadDays'), active: values.has('active') });
    else if (form.dataset.supplierId) await api(`/api/admin/suppliers/${encodeURIComponent(form.dataset.supplierId)}`, 'PATCH', {
      name: values.get('name'), contactName: values.get('contactName'), email: values.get('email'),
      phone: values.get('phone'), kind: values.get('kind'), stage: values.get('stage'),
      website: values.get('website'), terms: values.get('terms'), notes: values.get('notes'),
      leadDays: values.get('leadDays'), active: values.has('active') });
    else if (form.dataset.offerVariant) {
      const price = String(values.get('costEuros') || '').trim();
      await api('/api/admin/supplier-offers', 'PUT', { variantId: form.dataset.offerVariant,
        supplierId: values.get('supplierId'), costCents: price === '' ? null : Math.round(Number(price) * 100),
        minimumQuantity: Number(values.get('minimumQuantity')), sourceUrl: values.get('sourceUrl'),
        note: values.get('note'), vatIncluded: values.has('vatIncluded'), preferred: values.has('preferred') });
    }
    else if (form.dataset.receiptVariant) {
      const price = String(values.get('costEuros') || '').trim();
      await api('/api/admin/inventory-receipts', 'POST', { variantId: form.dataset.receiptVariant,
        supplierId: values.get('supplierId'), quantity: Number(values.get('quantity')),
        unitCostCents: price === '' ? null : Math.round(Number(price) * 100),
        note: values.get('note'), idempotencyKey: values.get('idempotencyKey') });
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
      reorderPoint: Number(values.get('reorderPoint')),
      targetStock: Number(values.get('targetStock')),
      taxRateBps: values.get('taxRatePercent') === '' ? null :
        Math.round(Number(values.get('taxRatePercent')) * 100),
      stockNote: values.get('stockNote'),
      priceConfirmed: values.has('priceConfirmed')
    });
    await load();
    message(form.dataset.replyId ? 'Ответ отправлен' : 'Сохранено');
  } catch (error) { message(error.message); if (submitButton) submitButton.disabled = false; }
});
