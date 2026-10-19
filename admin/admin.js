let token = '';
let tab = 'orders';
const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const euros = cents => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cents / 100);
async function api(path, method = 'GET', body) {
  const response = await fetch(path, { method, headers: {
    Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type':'application/json' } : {})
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Запрос не выполнен');
  return result;
}
function message(value) { $('admin-message').textContent = value; }
function orderCard(order) {
  const address = order.delivery_address || {};
  const delivery = order.delivery_preference || {};
  return `<article class="admin-card"><div class="admin-variant-top"><h2>${escape(order.number)}</h2><strong>${euros(order.total_cents)}</strong></div>
    <div class="admin-grid"><div><strong>Покупатель</strong>${escape(order.customer_name)}<br>${escape(order.email)}<br>${escape(order.phone)}</div>
    <div><strong>Адрес</strong>${escape(address.street)}, ${escape(address.building)}<br>${escape(address.postcode)} València<br>${escape(address.apartment || '')}<br>${escape(address.note || '')}</div>
    <div><strong>Время</strong>${delivery.mode === 'soon' ? 'Как можно скорее' : `${escape(delivery.date)} ${escape(delivery.time)}`}<br>
      <span class="admin-muted">Не забронировано, адрес не проверен</span></div>
    <div><strong>Оплата</strong>${escape(order.payment_status)}</div></div>
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
async function load() {
  message('Загружаю данные');
  try {
    const result = await api(tab === 'orders' ? '/api/admin/orders' : '/api/admin/variants');
    $('admin-content').innerHTML = tab === 'orders'
      ? result.orders.length ? result.orders.map(orderCard).join('') : '<p>Заказов пока нет</p>'
      : result.variants.map(variantCard).join('');
    message(tab === 'orders' ? `Заказов: ${result.orders.length}` : `Вариантов: ${result.variants.length}`);
  } catch (error) { message(error.message); }
}
$('token-form').addEventListener('submit', async event => {
  event.preventDefault();
  token = $('admin-token').value.trim();
  try {
    await api('/api/admin/orders');
    $('admin-token').value = '';
    $('admin-login').hidden = true;
    $('admin-panel').hidden = false;
    load();
  } catch (error) { $('login-error').textContent = error.message; token = ''; }
});
$('admin-lock').addEventListener('click', () => {
  token = ''; $('admin-panel').hidden = true; $('admin-login').hidden = false;
  $('admin-content').innerHTML = '';
});
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
  tab = button.dataset.tab;
  document.querySelectorAll('[data-tab]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  load();
}));
$('admin-content').addEventListener('submit', async event => {
  const form = event.target.closest('form');
  if (!form) return;
  event.preventDefault();
  const values = new FormData(form);
  try {
    if (form.dataset.orderId) await api(`/api/admin/orders/${encodeURIComponent(form.dataset.orderId)}/status`, 'PATCH',
      { status: values.get('status'), note: values.get('note') });
    else await api(`/api/admin/variants/${encodeURIComponent(form.dataset.variantId)}`, 'PATCH', {
      priceCents: values.get('priceCents') === '' ? null : Number(values.get('priceCents')),
      purchasePriceCents: values.get('purchasePriceCents') === '' ? null : Number(values.get('purchasePriceCents')),
      availability: values.get('availability'),
      stockQuantity: values.get('stockQuantity') === '' ? null : Number(values.get('stockQuantity')),
      priceConfirmed: values.has('priceConfirmed')
    });
    await load();
    message('Сохранено');
  } catch (error) { message(error.message); }
});
