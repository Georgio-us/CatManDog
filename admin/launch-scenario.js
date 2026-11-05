const root = document.getElementById('launch-root');
const state = { step: 0, catalog: [], cart: new Map(), search: '', filter: 'selected',
  grouping: 'together', contact: {}, address: {}, delivery: { day: 'tomorrow', slot: '14:00-18:00' },
  orders: [], history: [], error: '' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = cents => `${(cents / 100).toFixed(2).replace('.', ',')} €`;
const icon = name => {
  const paths = { plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>' };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
};
const byId = () => new Map(state.catalog.map(item => [item.variantId, item]));
const items = () => [...state.cart].map(([id, quantity]) => ({ ...byId().get(id), quantity }))
  .filter(item => item.variantId);
const price = item => item.priceCents * item.quantity;
const deliveryFee = list => list.reduce((sum, item) => sum + price(item), 0) >= 4900 ? 0 : 399;
const todaySlots = () => {
  const parts = date => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map(part => [part.type, part.value]));
  const now = new Date();
  const current = parts(now);
  const earliest = parts(new Date(now.getTime() + 2 * 60 * 60 * 1000));
  if (`${current.year}-${current.month}-${current.day}` !==
      `${earliest.year}-${earliest.month}-${earliest.day}`) return [];
  return ['10:00-14:00','14:00-18:00','18:00-22:00'].filter(slot => slot.slice(0, 5) >= `${earliest.hour}:${earliest.minute}`);
};
const groups = () => {
  const all = items();
  const stock = all.filter(item => item.state === 'on_hand');
  const supplier = all.filter(item => item.state === 'source_on_demand');
  return state.grouping === 'separate' && stock.length && supplier.length ? [stock, supplier] : [all];
};
const total = () => groups().reduce((sum, list) => sum + list.reduce((amount, item) => amount + price(item), 0) + deliveryFee(list), 0);
const status = item => item.state === 'on_hand' ? 'В наличии' :
  item.state === 'source_on_demand' ? 'Под заказ - срок согласуем до оплаты' : 'Недоступен для заказа';
const progress = () => `<ol class="lab-progress">${['Товары','Корзина','Доставка','Оплата','Готово']
  .map((label, index) => `<li class="${index === state.step ? 'current' : index < state.step ? 'done' : ''}">${label}</li>`).join('')}</ol>`;
const shell = (title, lead, body) => `<div class="lab-shell"><p class="lab-path">CatManDog / Проверка покупки</p>
  <h1>${title}</h1><p class="lab-lead">${lead}</p>${progress()}${body}</div>`;
const image = item => item.image ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy">` : '';
const itemLine = item => `<div class="lab-line"><div>${image(item)}</div><div class="lab-line-main"><strong>${esc(item.name)}</strong>
  <small>${esc(item.label)} · ${status(item)}</small><div class="lab-qty"><button type="button" data-qty="${esc(item.variantId)}" data-delta="-1" aria-label="Уменьшить количество">${icon('minus')}</button>
  <span>${item.quantity}</span><button type="button" data-qty="${esc(item.variantId)}" data-delta="1" aria-label="Увеличить количество">${icon('plus')}</button></div></div>
  <span class="lab-line-price">${money(price(item))}</span></div>`;
function renderCatalog() {
  const list = state.catalog.filter(item => state.filter === 'selected' ? item.selectedUnits > 0 :
    state.filter === 'supplier' ? item.state === 'source_on_demand' :
      state.filter === 'unavailable' ? item.state === 'unavailable' : true)
    .filter(item => `${item.name} ${item.brand} ${item.label}`.toLocaleLowerCase('ru').includes(state.search.toLocaleLowerCase('ru')));
  const cards = list.slice(0, 100).map(item => `<article class="lab-card"><div class="lab-card-media">${image(item)}</div>
    <div class="lab-card-body"><small>${esc(item.brand)} · ${esc(item.label)}</small><h2>${esc(item.name)}</h2>
    <span class="lab-status ${item.state === 'unavailable' ? 'off' : ''}">${status(item)}</span>
    <span class="lab-price">${item.priceCents === null ? 'Цена уточняется' : money(item.priceCents)}</span><span class="lab-price-note">${item.priceConfirmed ? '' : item.priceCents === null ? '' : 'Ценовой ориентир'}</span>
    <button type="button" class="lab-button primary" data-add="${esc(item.variantId)}" ${item.state === 'unavailable' || item.priceCents === null ? 'disabled' : ''}>${item.state === 'unavailable' ? 'Недоступен' : 'Добавить в корзину'}</button></div></article>`).join('');
  root.innerHTML = shell('Выберите товары', 'Фасовки из каталога и загруженных прайсов поставщиков',
    `<div class="lab-toolbar"><input id="lab-search" type="search" placeholder="Название, бренд или фасовка" value="${esc(state.search)}" aria-label="Поиск товаров">
    <select id="lab-filter" aria-label="Какие товары показывать"><option value="selected" ${state.filter === 'selected' ? 'selected' : ''}>Выбраны для закупки</option>
    <option value="supplier" ${state.filter === 'supplier' ? 'selected' : ''}>Остальные из прайсов</option>
    <option value="unavailable" ${state.filter === 'unavailable' ? 'selected' : ''}>Без подтверждённого источника</option>
    <option value="all" ${state.filter === 'all' ? 'selected' : ''}>Все товары</option></select></div>
    <p class="lab-count">Найдено ${list.length} SKU${list.length > 100 ? ' · показаны первые 100, уточните поиск' : ''}</p>
    <div class="lab-grid">${cards || '<p>По запросу ничего не найдено</p>'}</div>
    <div class="lab-actions"><button class="lab-button primary" data-next="1" ${state.cart.size ? '' : 'disabled'}>Корзина · ${state.cart.size} SKU ${icon('arrow')}</button></div>
    ${state.history.length ? `<section class="lab-panel lab-history"><h2>Предыдущие тестовые заказы</h2>
      <p class="lab-note">${state.history.length} последних заказов в отдельном реестре</p>
      ${state.history.slice(0, 5).map(order => `<div class="lab-line"><strong>${esc(order.number)}</strong><span>${money(Number(order.total_cents))}</span></div>`).join('')}
      <button type="button" class="lab-button" data-clear-tests>Удалить тестовые заказы</button></section>` : ''}`);
}
function renderCart() {
  const list = items();
  const mixed = list.some(item => item.state === 'on_hand') && list.some(item => item.state === 'source_on_demand');
  root.innerHTML = shell('Ваша корзина', 'Проверьте фасовку, количество и способ доставки',
    `<section class="lab-panel">${list.map(itemLine).join('') || '<p>Корзина пуста</p>'}</section>
    ${mixed ? `<section class="lab-panel"><h2>Как доставить товары</h2><div class="lab-choice">
      <label><input type="radio" name="grouping" value="together" ${state.grouping === 'together' ? 'checked' : ''}><span><strong>Вместе одной доставкой</strong><small>Все товары после поступления позиций под заказ</small></span></label>
      <label><input type="radio" name="grouping" value="separate" ${state.grouping === 'separate' ? 'checked' : ''}><span><strong>Разделить на два заказа</strong><small>Товары в наличии раньше, товары под заказ отдельно · две доставки</small></span></label></div></section>` : ''}
    <section class="lab-panel"><div class="lab-total"><span>Итого с доставкой</span><span>${money(total())}</span></div></section>
    <div class="lab-actions"><button class="lab-button primary" data-next="2" ${list.length ? '' : 'disabled'}>Перейти к оформлению ${icon('arrow')}</button>
    <button class="lab-button" data-next="0">Добавить товары</button></div>`);
}
function renderDelivery() {
  const hasStock = groups().some(list => list.every(item => item.state === 'on_hand'));
  const availableToday = todaySlots();
  if (state.delivery.day === 'today' && !availableToday.length) state.delivery.day = 'tomorrow';
  const slots = state.delivery.day === 'today' ? availableToday : ['10:00-14:00','14:00-18:00','18:00-22:00'];
  if (!slots.includes(state.delivery.slot)) state.delivery.slot = slots[0];
  const field = (name, label, value, type = 'text', autocomplete = '') => `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${autocomplete ? `autocomplete="${autocomplete}"` : ''} required></label>`;
  root.innerHTML = shell('Куда доставить', 'Укажите контакты и адрес в городе Валенсия',
    `<form id="lab-form"><section class="lab-panel"><h2>Контакты</h2><div class="lab-fields">
      ${field('name', 'Имя и фамилия', state.contact.name || '', 'text', 'name')}
      ${field('email', 'Email', state.contact.email || '', 'email', 'email')}
      ${field('phone', 'Телефон', state.contact.phone || '', 'tel', 'tel')}</div></section>
    <section class="lab-panel"><h2>Адрес</h2><div class="lab-fields">
      ${field('postcode', 'Индекс Валенсии', state.address.postcode || '', 'text', 'postal-code')}
      ${field('street', 'Улица', state.address.street || '', 'text', 'address-line1')}
      ${field('building', 'Номер дома', state.address.building || '')}
      <label>Квартира, этаж, дверь<input name="apartment" value="${esc(state.address.apartment || '')}" autocomplete="address-line2"></label></div></section>
    ${hasStock ? `<section class="lab-panel"><h2>Удобное время для товара в наличии</h2><div class="lab-fields">
      <label>День<select name="day">${availableToday.length ? `<option value="today" ${state.delivery.day === 'today' ? 'selected' : ''}>Сегодня</option>` : ''}<option value="tomorrow" ${state.delivery.day === 'tomorrow' ? 'selected' : ''}>Завтра</option></select></label>
      <label>Интервал<select name="slot">${slots.map(slot => `<option value="${slot}" ${state.delivery.slot === slot ? 'selected' : ''}>${slot}</option>`).join('')}</select></label></div>
      <p class="lab-note">Точное время подтвердим после заказа</p></section>` : ''}
    ${items().some(item => item.state === 'source_on_demand') ? '<section class="lab-panel"><h2>Товары под заказ</h2><p>Срок доставки согласуем после подтверждения наличия у поставщика</p></section>' : ''}
    <p class="lab-alert">${esc(state.error)}</p><div class="lab-actions"><button class="lab-button primary" type="submit">Проверить заказ ${icon('arrow')}</button>
      <button class="lab-button" type="button" data-next="1">Корзина</button></div></form>`);
}
function renderPayment() {
  const groupSummary = groups().map((list, index) => {
    const products = list.reduce((sum, item) => sum + price(item), 0);
    const heading = groups().length > 1 ? `Заказ ${index + 1} · ${list[0].state === 'on_hand' ? 'в наличии' : 'под заказ'}` : 'Ваш заказ';
    return `<section class="lab-panel"><h2>${heading}</h2>${list.map(item => `<div class="lab-line"><div class="lab-line-main"><strong>${esc(item.name)}</strong><small>${esc(item.label)} · ${item.quantity} шт · ${status(item)}</small></div><strong>${money(price(item))}</strong></div>`).join('')}
      <p>Товары ${money(products)} · доставка ${deliveryFee(list) ? money(deliveryFee(list)) : 'бесплатно'}</p></section>`;
  }).join('');
  root.innerHTML = shell('Проверьте заказ', 'После проверки перейдите к оплате',
    `${groupSummary}<section class="lab-panel"><h2>Получатель и доставка</h2>
    <p>${esc(state.contact.name)} · ${esc(state.contact.email)} · ${esc(state.contact.phone)}</p>
    <p>${esc(state.address.street)}, ${esc(state.address.building)}, ${esc(state.address.postcode)} València</p>
    ${groups().some(list => list.every(item => item.state === 'on_hand')) ? `<p>Товар в наличии · ${state.delivery.day === 'today' ? 'сегодня' : 'завтра'} · ${esc(state.delivery.slot)}</p>` : ''}
    ${items().some(item => item.state === 'source_on_demand') ? '<p>Товар под заказ · срок согласуем после подтверждения наличия</p>' : ''}
    <div class="lab-total"><span>Итого с IVA</span><span>${money(total())}</span></div></section>
    <div class="lab-demo"><h2>Демонстрация оплаты</h2><p>Карта не запрашивается, деньги не списываются. Кнопка создаст только тестовый заказ в отдельном реестре без изменения реального склада</p></div>
    <p class="lab-alert" role="alert">${esc(state.error)}</p><div class="lab-actions"><button class="lab-button primary" data-place>Демонстрация ${icon('arrow')}</button>
    <button class="lab-button" data-next="2">Изменить данные</button></div>`);
}
function renderDone() {
  root.innerHTML = shell('Заказ принят', 'Результат сохранён для проверки пути покупки',
    `<div class="lab-demo"><h2>Тестовые заказы</h2><p>Оплата не проводилась, товары не резервировались, письма покупателю не отправлялись</p></div>
    ${state.orders.map(order => `<div class="lab-receipt"><strong>${esc(order.number)}</strong>
      <p>Итого ${money(Number(order.total_cents))} · ${order.delivery.type === 'stock' ? 'товары в наличии' : 'товары под заказ'}</p></div>`).join('')}
    <div class="lab-actions"><button class="lab-button primary" data-new>Новый заказ ${icon('arrow')}</button><a class="lab-button" href="/admin">В панель управления</a></div>`);
}
function render() {
  [renderCatalog, renderCart, renderDelivery, renderPayment, renderDone][state.step]();
}
async function load() {
  try {
    const response = await fetch('/api/admin/launch-scenario/catalog', { credentials: 'same-origin' });
    if (!response.ok) throw new Error(response.status === 403 ? 'Войдите в панель владельца, чтобы открыть проверку' : 'Не удалось загрузить каталог');
    const data = await response.json();
    state.catalog = data.variants;
    const historyResponse = await fetch('/api/admin/launch-scenario/orders', { credentials: 'same-origin' });
    if (historyResponse.ok) state.history = (await historyResponse.json()).orders;
    render();
  } catch (error) {
    root.innerHTML = `<div class="lab-shell"><h1>Доступ закрыт</h1><p>${esc(error.message)}</p><a class="lab-button" href="/admin">Войти в панель</a></div>`;
  }
}
root.addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (!['add', 'qty', 'next', 'place', 'new', 'clearTests'].some(key =>
    Object.hasOwn(button.dataset, key))) return;
  if (button.dataset.add) state.cart.set(button.dataset.add, Math.min(99, (state.cart.get(button.dataset.add) || 0) + 1));
  if (button.dataset.qty) {
    const next = (state.cart.get(button.dataset.qty) || 0) + Number(button.dataset.delta);
    if (next > 0) state.cart.set(button.dataset.qty, next); else state.cart.delete(button.dataset.qty);
  }
  if (button.dataset.next) { state.step = Number(button.dataset.next); state.error = ''; window.scrollTo(0, 0); }
  if (button.hasAttribute('data-new')) { state.cart.clear(); state.step = 0; state.error = ''; window.scrollTo(0, 0); }
  if (button.hasAttribute('data-clear-tests')) {
    if (!window.confirm('Удалить только тестовые заказы этого сценария? Реальные заказы и склад останутся без изменений')) return;
    const response = await fetch('/api/admin/launch-scenario/orders', { method: 'DELETE', credentials: 'same-origin' });
    if (!response.ok) { state.error = 'Не удалось удалить тестовые заказы'; return; }
    state.history = [];
  }
  if (button.hasAttribute('data-place')) {
    button.disabled = true;
    try {
      const response = await fetch('/api/admin/launch-scenario/orders', { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items().map(item => ({ variantId: item.variantId, quantity: item.quantity })),
          grouping: state.grouping, contact: state.contact, address: state.address, delivery: state.delivery }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось создать тестовый заказ');
      state.orders = data.orders; state.history.unshift(...data.orders);
      state.step = 4; state.error = ''; window.scrollTo(0, 0);
    } catch (error) { state.error = error.message; }
  }
  render();
});
root.addEventListener('input', event => {
  if (event.target.id !== 'lab-search') return;
  state.search = event.target.value;
  const start = event.target.selectionStart;
  renderCatalog();
  document.getElementById('lab-search').focus();
  document.getElementById('lab-search').setSelectionRange(start, start);
});
root.addEventListener('change', event => {
  if (event.target.id === 'lab-filter') { state.filter = event.target.value; renderCatalog(); }
  if (event.target.name === 'grouping') { state.grouping = event.target.value; renderCart(); }
  if (event.target.name === 'day') {
    const data = Object.fromEntries(new FormData(event.target.form));
    state.contact = { name: data.name, email: data.email, phone: data.phone };
    state.address = { postcode: data.postcode, street: data.street,
      building: data.building, apartment: data.apartment };
    state.delivery.day = event.target.value;
    renderDelivery();
  }
  if (event.target.name === 'slot') state.delivery.slot = event.target.value;
});
root.addEventListener('submit', event => {
  if (event.target.id !== 'lab-form') return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  state.contact = { name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim() };
  state.address = { postcode: data.postcode.trim(), street: data.street.trim(),
    building: data.building.trim(), apartment: data.apartment.trim() };
  state.delivery = { day: data.day || 'tomorrow', slot: data.slot || '14:00-18:00' };
  if (!/^460\d{2}$/.test(state.address.postcode)) { state.error = 'Укажите индекс в городе Валенсия'; renderDelivery(); return; }
  state.error = ''; state.step = 3; window.scrollTo(0, 0); render();
});
void load();
