import { createAccountStore } from './account-store.js?v=2';
import { accountTools } from './useful.js?v=2';
const store = createAccountStore(localStorage);

const preferenceOptions = ['Сухой корм', 'Влажный корм', 'Без зерна', 'Стерилизован', 'Чувствительное пищеварение', 'Игрушки с кошачьей мятой'];
const sections = [['', 'Мой кабинет', 'paw'], ['orders', 'Мои заказы', 'bag'], ['supplies', 'Мои запасы', 'calendar'], ['perks', 'Подарки и бонусы', 'gift'], ['care', 'Мои инструменты', 'map'], ['profile', 'Мой профиль', 'cat'], ['human', 'Мой человек', 'heart']];
const statuses = { packing: 'Собираем коробку', received: 'Демозаказ сохранён', delivered: 'Коробка доставлена' };
const dateLabel = value => new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' }).format(new Date(value + 'T12:00:00'));
const ageLabel = pet => {
  if (!pet.birthday) return pet.age || 'Возраст пока не указан';
  const birthday = new Date(pet.birthday + 'T12:00:00');
  const now = new Date();
  const months = (now.getFullYear() - birthday.getFullYear()) * 12 + now.getMonth() - birthday.getMonth() - (now.getDate() < birthday.getDate() ? 1 : 0);
  if (months < 12) return `${Math.max(0, months)} мес`;
  const years = Math.floor(months / 12);
  const ending = new Intl.PluralRules('ru').select(years);
  return `${years} ${ending === 'one' ? 'год' : ending === 'few' ? 'года' : 'лет'}`;
};
export function createAccountUI(helpers) {
  const { escape: e, icon, money, products, imageBlock, render, notify, getCart, repeatOrder } = helpers;
  function navigate(path) { if (location.hash === '#' + path) render(); else location.hash = path; }
  const petIcon = pet => `<span class="pet-avatar pet-avatar-${pet?.color || 'sage'}">${icon(pet?.species === 'dog' ? 'paw' : 'cat')}</span>`;
  const productFor = item => {
    const p = products.find(p => p.id === item.productId);
    return item.variantId ? p?.variants?.find(v => v.id === item.variantId) || p : p;
  };
  const formError = form => form.querySelector('[data-account-error]');
  const pageNote = () => `<p class="pet-local-note">${icon('shield')}${store.mode() === 'demo' ? 'Пример кабинета - заказы и данные демонстрационные' : 'Прототип - данные сохранены только в этом браузере'}</p>`;
  const emptyPanel = (title, text, action = 'Выбрать товары', href = '#/catalog?pet=cat') => `<div class="pet-empty">${icon('paw')}<h3>${title}</h3><p>${text}</p><a class="button outline" href="${href}">${action}</a></div>`;
  function petFields(pet = {}) {
    const today = new Date().toISOString().slice(0, 10);
    return `<div class="pet-form-grid"><label class="pet-field">Имя питомца<input name="name" value="${e(pet.name || '')}" required maxlength="40" placeholder="Например, Барсик" autocomplete="off"></label><label class="pet-field">Кто живёт с вами<select name="species"><option value="cat" ${pet.species !== 'dog' ? 'selected' : ''}>Кошка или кот</option><option value="dog" ${pet.species === 'dog' ? 'selected' : ''}>Собака</option></select></label><label class="pet-field">День рождения <span>Если знаете</span><input type="date" name="birthday" max="${today}" value="${e(pet.birthday || '')}"></label><label class="pet-field">Примерный возраст <span>Если дата неизвестна</span><select name="age"><option value="">Выбрать</option>${['До года', '1-3 года', '4-7 лет', '8 лет и старше'].map(v => `<option ${pet.age === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label class="pet-field pet-field-wide">Порода <span>Необязательно</span><input name="breed" value="${e(pet.breed || '')}" maxlength="80" placeholder="Любимая домашняя кошка"></label></div><fieldset class="pet-preferences"><legend>Что подходит и нравится</legend><p>Поможет собирать более подходящие подборки</p><div>${preferenceOptions.map(v => `<label><input type="checkbox" name="preferences" value="${e(v)}" ${(pet.preferences || []).includes(v) ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></fieldset><label class="pet-field">Ещё кое-что обо мне <span>Необязательно</span><textarea name="notes" maxlength="400" rows="3" placeholder="Любимые игры, привычки и маленькие особенности">${e(pet.notes || '')}</textarea></label>`;
  }
  function onboarding(params) {
    const adding = params.get('add') === '1';
    return `<div class="page pet-onboarding">${pageNote()}<div class="pet-onboarding-grid"><div><span class="pet-eyebrow">У каждого хвоста - свой кабинет</span><h1>Давайте знакомиться<br>Как тебя зовут?</h1><p class="pet-intro-copy">Твои коробки, привычки и маленькие радости - в одном месте А твой человек поможет всё заполнить</p><form class="pet-panel pet-onboarding-form" data-account-form="join">${petFields()}${!adding ? '<label class="pet-field">Как зовут твоего человека <span>Необязательно</span><input name="humanName" maxlength="80" autocomplete="given-name" placeholder="Можно просто имя"></label>' : ''}<input type="hidden" name="ref" value="${e(params.get('ref') || '')}"><p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit">${adding ? 'Добавить питомца' : 'Создать мой кабинет'} ${icon('arrow')}</button><p class="pet-form-hint">Без пароля на этапе прототипа Профиль сохранится на этом устройстве</p></form>${!adding && store.mode() === 'personal' && store.activePet() ? '<a class="text-link pet-demo-link" href="#/account">Открыть мой кабинет</a><br>' : ''}${!adding ? '<button class="text-link pet-demo-link" data-account-demo>Сначала посмотреть кабинет Лео</button>' : '<a class="text-link pet-demo-link" href="#/account">Вернуться в кабинет</a>'}</div><aside class="pet-onboarding-story"><img src="assets/hero-happy.png" alt="Кот и собака отдыхают дома"><div><span class="pet-eyebrow">Хорошо быть собой</span><h2>Здесь всё<br>про тебя</h2><p>Когда заканчивается корм<br>Когда хочется новой игрушки<br>Когда у тебя день рождения</p></div></aside></div></div>`;
  }
  function orderCard(order, compact = false) {
    const total = order.items.reduce((sum, item) => sum + item.price * item.qty, 0) * (1 - (order.discount || 0) / 100);
    return `<article class="pet-order"><div class="pet-order-head"><div><strong>${e(order.number)}</strong><span>${dateLabel(order.date)}</span></div><span class="pet-status ${order.status === 'delivered' ? 'pet-status-delivered' : ''}">${statuses[order.status] || 'Демозаказ'}</span></div><div class="pet-order-products">${order.items.slice(0, compact ? 3 : order.items.length).map(item => { const p = productFor(item); return `<a href="#/product/${e(item.productId)}${item.variantId ? '?variant=' + encodeURIComponent(item.variantId) : ''}" aria-label="${e(p?.name || 'Товар')}">${p ? imageBlock(p.image) : icon('bag')}<span>${e(p?.name || item.name || 'Товар')}<small>${item.qty} шт${item.size && item.size !== '1 шт' ? ' · ' + e(item.size) : ''}</small></span></a>`; }).join('')}</div><div class="pet-order-bottom"><strong>${money(total)}</strong><button class="pet-small-button" data-account-repeat="${e(order.id)}">${icon('refresh')} Повторить заказ</button></div>${order.status !== 'delivered' ? '<p class="pet-caption">Статус показан для демонстрации - реальная отправка пока не подключена</p>' : ''}</article>`;
  }
  function reminderRow(reminder) {
    return `<div class="pet-reminder ${reminder.done ? 'pet-reminder-done' : ''}"><button class="pet-check" data-account-reminder="${e(reminder.id)}" aria-label="${reminder.done ? 'Вернуть в планы' : 'Отметить выполненным'}: ${e(reminder.title)}" aria-pressed="${reminder.done}">${icon(reminder.done ? 'check' : 'calendar')}</button><div><strong>${e(reminder.title)}</strong><span>${dateLabel(reminder.date)}</span></div>${reminder.productId ? `<a class="pet-round-link" href="#/product/${e(reminder.productId)}" aria-label="Посмотреть товар">${icon('arrow')}</a>` : ''}</div>`;
  }
  function dashboard(pet, data) {
    const orders = data.orders.filter(o => o.petId === pet.id);
    const current = orders.find(o => o.status !== 'delivered');
    const reminders = data.reminders.filter(r => r.petId === pet.id && !r.done);
    return `<div class="pet-welcome"><div><span class="pet-eyebrow">Мой маленький мир</span><h1>Привет, ${e(pet.name)}</h1><p>Всё для твоей хорошей жизни с хвостиком</p></div>${petIcon(pet)}</div><div class="pet-stat-grid"><a href="#/account/orders"><span>${icon('bag')} Мои коробки</span><strong>${orders.length}</strong><small>Питомец: ${e(pet.name)}</small></a><a href="#/account/supplies"><span>${icon('calendar')} Мои планы</span><strong>${reminders.length}</strong><small>Покупки, о которых стоит помнить</small></a><a href="#/account/perks"><span>${icon('gift')} Маленький подарок</span><strong>10%</strong><small>Демопромокод WELCOME10</small></a></div><div class="pet-dashboard-grid"><section class="pet-panel"><div class="pet-panel-head"><h2>Моя следующая коробка</h2><a class="text-link" href="#/account/orders">Все заказы</a></div>${current ? orderCard(current, true) : emptyPanel('Здесь будет твоя коробка', 'Сохрани демозаказ из корзины, чтобы увидеть его в кабинете')}</section><section class="pet-panel"><div class="pet-panel-head"><h2>Скоро понадобится</h2><a class="text-link" href="#/account/supplies">Мои запасы</a></div>${reminders.length ? reminders.slice(0, 3).map(reminderRow).join('') : '<p class="pet-muted">Добавь покупку в планы - и она появится здесь</p>'}<a class="pet-inline-link" href="#/account/supplies">${icon('plus')} Запланировать покупку</a></section></div><section class="pet-profile-summary pet-panel">${petIcon(pet)}<div><span class="pet-eyebrow">Пара слов обо мне</span><h2>${e(pet.name)}</h2><p>${e(pet.breed || (pet.species === 'dog' ? 'Любимая собака' : 'Любимая домашняя кошка'))} · ${e(ageLabel(pet))}</p><div class="pet-chips">${(pet.preferences || []).map(v => `<span>${e(v)}</span>`).join('')}</div></div><a class="text-link" href="#/account/profile">Мой профиль</a></section><a class="use-account-preview" href="#/account/care">${icon('compass')}<div><h2>Моя клиника и поездки</h2><p>Сохраняй контакты и собирай планы для жизни вместе</p></div>${icon('arrow')}</a>`;
  }
  function ordersPage(pet, data) {
    const list = data.orders.filter(o => o.petId === pet.id);
    return `<div class="pet-page-head"><span class="pet-eyebrow">Коробки для ${e(pet.name)}</span><h1>Мои заказы</h1><p>Что уже приехало и что мы ещё собираем</p></div>${list.length ? `<div class="pet-order-grid">${list.map(o => orderCard(o)).join('')}</div>` : `<section class="pet-panel">${emptyPanel('Первая коробка ещё впереди', 'Выбери товары и сохрани демозаказ в корзине')}</section>`}`;
  }
  function suppliesPage(pet, data) {
    const list = data.reminders.filter(r => r.petId === pet.id);
    return `<div class="pet-page-head"><span class="pet-eyebrow">Чтобы всё нужное было под лапой</span><h1>Мои запасы</h1><p>Запланированные покупки для ${e(pet.name)} - без автоматических заказов и списаний</p></div><div class="pet-dashboard-grid"><section class="pet-panel"><h2>Мои планы</h2>${list.length ? list.map(reminderRow).join('') : '<p class="pet-muted">Пока ничего не запланировано</p>'}<p class="pet-caption">Напоминания видны в кабинете Отправку в Telegram подключим позже</p></section><form class="pet-panel pet-form" data-account-form="reminder"><h2>Добавить в планы</h2><label class="pet-field">Что понадобится<input name="title" required maxlength="120" placeholder="Например, наполнитель"></label><label class="pet-field">Когда напомнить<input name="date" type="date" required min="${new Date().toISOString().slice(0, 10)}"></label><label class="pet-field">Товар <span>Необязательно</span><select name="productId"><option value="">Выберу позже</option>${products.filter(p => !p.catalogHidden && p.pet !== 'dog').map(p => `<option value="${e(p.id)}">${e(p.name)}</option>`).join('')}</select></label><p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit">Сохранить план ${icon('plus')}</button></form></div>`;
  }
  function perksPage(pet, data) {
    const link = location.href.split('#')[0] + '#/join?ref=' + encodeURIComponent(data.referral);
    return `<div class="pet-page-head"><span class="pet-eyebrow">Поводы порадовать ${e(pet.name)}</span><h1>Подарки и бонусы</h1><p>Маленькие приятности для тебя и твоих друзей</p></div><div class="pet-dashboard-grid"><section class="pet-panel pet-perk"><span class="pet-perk-icon">${icon('gift')}</span><h2>Первый подарок</h2><p>10% на демонстрационный заказ<br>Код <strong>WELCOME10</strong></p><form class="pet-form" data-account-form="promo"><label class="pet-field">Мой промокод<input name="code" required maxlength="40" value="${e(data.promo || '')}" placeholder="WELCOME10" autocapitalize="characters"></label><p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit">Применить промокод</button></form>${data.promo ? `<p class="pet-success">${icon('check')} ${e(data.promo)} активен - скидка 10% в демокорзине</p>` : ''}</section><section class="pet-panel pet-perk"><span class="pet-perk-icon">${icon('paw')}</span><h2>Позови друга</h2><p>Пусть у его хвостика тоже появится свой кабинет</p><label class="pet-field">Моя ссылка<input value="${e(link)}" readonly data-account-referral aria-label="Реферальная ссылка"></label><button class="pet-small-button" data-account-copy>${icon('copy')} Скопировать ссылку</button><p class="pet-caption">Ссылка ведёт к регистрации питомца Учёт приглашений и начисление бонусов пока не подключены</p></section></div><a class="pet-gift-banner" href="#/gifts"><div><span class="pet-eyebrow">Праздник с хвостиком</span><h2>У тебя есть повод</h2><p>Гостинцы, день рождения и подарки просто так</p></div>${icon('arrow')}</a>`;
  }
  function profilePage(pet) { return `<div class="pet-page-head"><span class="pet-eyebrow">Знакомимся ближе</span><h1>Я - ${e(pet.name)}</h1><p>Мои привычки и предпочтения могут меняться</p></div><form class="pet-panel pet-form" data-account-form="profile">${petFields(pet)}<p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit">Сохранить мой профиль ${icon('check')}</button></form>`; }
  function humanPage(data) {
    return `<div class="pet-page-head"><span class="pet-eyebrow">Кто помогает мне с покупками</span><h1>Мой человек</h1><p>Контакты и то, о чём стоит напоминать</p></div><form class="pet-panel pet-form" data-account-form="human"><div class="pet-form-grid"><label class="pet-field">Имя моего человека<input name="name" maxlength="80" autocomplete="given-name" value="${e(data.human.name)}"></label><label class="pet-field">Email<input type="email" name="email" autocomplete="email" value="${e(data.human.email)}" placeholder="name@example.com"></label><label class="pet-field pet-field-wide">Telegram <span>Необязательно</span><input name="telegram" maxlength="33" pattern="@?[A-Za-z0-9_]{5,32}" value="${e(data.human.telegram)}" placeholder="@username"><small>Пока только сохраняем контакт Подключение бота появится позже</small></label></div><fieldset class="pet-notifications"><legend>О чём можно сообщать моему человеку</legend>${[['orderUpdates', 'Что происходит с моими заказами'], ['reminders', 'Когда пора пополнить запасы'], ['offers', 'Подарки и специальные предложения']].map(([key, label]) => `<label><input type="checkbox" name="${key}" ${data.human[key] ? 'checked' : ''}><span>${label}</span></label>`).join('')}</fieldset><p class="pet-caption">Контакты не отправляются на сервер Уведомления в этом прототипе не рассылаются</p><p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit">Сохранить настройки ${icon('check')}</button></form>`;
  }
  function page(path, params) {
    if (path === '/join' || path === '/account/welcome') return onboarding(params);
    const pet = store.activePet();
    if (!pet) return onboarding(params);
    const data = store.get();
    const section = path.split('/')[2] || '';
    const content = section === 'care' ? accountTools({ pet, data, escape: e, icon }) : section === 'orders' ? ordersPage(pet, data) : section === 'supplies' ? suppliesPage(pet, data) : section === 'perks' ? perksPage(pet, data) : section === 'profile' ? profilePage(pet) : section === 'human' ? humanPage(data) : dashboard(pet, data);
    return `<div class="page pet-account">${pageNote()}<div class="pet-account-layout"><aside class="pet-sidebar"><a class="pet-account-brand" href="#/account">${icon('paw')} Кабинет с хвостиком</a><div class="pet-switcher" role="group" aria-label="Мои питомцы">${data.pets.map(p => `<button data-account-pet="${e(p.id)}" aria-pressed="${p.id === pet.id}" class="${p.id === pet.id ? 'active' : ''}">${petIcon(p)}<span>${e(p.name)}</span>${p.id === pet.id ? icon('check') : ''}</button>`).join('')}</div><a class="pet-add" href="#/join?add=1">${icon('plus')} Добавить питомца</a><nav class="pet-navigation" aria-label="Разделы кабинета">${sections.map(([key, label, glyph]) => `<a href="#/account${key ? '/' + key : ''}" ${section === key ? 'aria-current="page"' : ''}>${icon(glyph)} ${label}</a>`).join('')}</nav><button class="pet-exit" data-account-exit>${icon('arrow')} ${store.mode() === 'demo' ? 'Создать свой кабинет' : 'Закрыть кабинет'}</button><p class="pet-sidebar-note">Каждому хвостику<br>немного больше заботы</p></aside><div class="pet-account-content">${content}</div></div></div>`;
  }
  async function click(button) {
    if (button.hasAttribute('data-account-demo')) { store.open('demo'); navigate('/account'); }
    if (button.hasAttribute('data-account-pet')) { store.switchPet(button.dataset.accountPet); render(); }
    if (button.hasAttribute('data-account-exit')) { store.open('personal'); navigate('/account/welcome'); }
    if (button.hasAttribute('data-account-reminder')) { store.toggleReminder(button.dataset.accountReminder); render(); }
    if (button.hasAttribute('data-account-repeat')) {
      const order = store.get().orders.find(o => o.id === button.dataset.accountRepeat && o.petId === store.activePet()?.id);
      if (order) { repeatOrder(order.items); navigate('/cart'); }
    }
    if (button.hasAttribute('data-account-copy')) {
      try { await navigator.clipboard.writeText(document.querySelector('[data-account-referral]').value); notify('Ссылка скопирована'); } catch { document.querySelector('[data-account-referral]').select(); notify('Выделили ссылку - её можно скопировать'); }
    }
    if (button.hasAttribute('data-account-save-order')) {
      if (!store.activePet()) { navigate('/join'); return; }
      try { store.recordOrder(getCart()); navigate('/account/orders'); } catch (error) { notify(error.message); }
    }
  }
  function submit(form) {
    const values = new FormData(form);
    try {
      const kind = form.dataset.accountForm;
      if (kind === 'join' || kind === 'profile') {
        const fields = { name: values.get('name'), species: values.get('species'), birthday: values.get('birthday'), age: values.get('age'), breed: values.get('breed'), notes: values.get('notes'), preferences: values.getAll('preferences') };
        if (kind === 'join') {
          if (routeAdding() === false) store.open('personal');
          store.savePet(fields);
          if (values.has('humanName')) store.saveHuman({ name: values.get('humanName') });
          if (values.get('ref')) store.setReferral(values.get('ref'));
          const next = new URLSearchParams(location.hash.split('?')[1]).get('return');
          if (next === 'trip' && store.tripDraft()) { store.saveTrip(store.tripDraft()); navigate('/account/care'); }
          else if (next === 'clinics') navigate('/useful/clinics');
          else navigate('/account');
        } else { store.savePet(fields, store.activePet().id); render(); notify('Профиль сохранён'); }
      }
      if (kind === 'human') { store.saveHuman({ name: values.get('name'), email: values.get('email'), telegram: values.get('telegram'), orderUpdates: values.has('orderUpdates'), reminders: values.has('reminders'), offers: values.has('offers') }); notify('Настройки сохранены'); }
      if (kind === 'reminder') { store.addReminder({ title: values.get('title'), date: values.get('date'), productId: values.get('productId') }); render(); notify('Покупка добавлена в планы'); }
      if (kind === 'promo') { store.applyPromo(values.get('code')); render(); notify('Демопромокод активирован'); }
    } catch (error) { formError(form).textContent = error.message; }
  }
  const routeAdding = () => new URLSearchParams(location.hash.split('?')[1]).get('add') === '1';
  return { page, click, submit, store };
}
