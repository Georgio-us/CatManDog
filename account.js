import { createAccountStore } from './account-store.js?v=cat-assortment-1';
import { createAccountApi } from './account-api.js?v=google-signin-2';
import { accountTools } from './useful.js?v=account-cleanup-1';
import { orderProgress, orderVariantId as resolveOrderVariantId } from './order-progress.js';
const store = createAccountStore(localStorage);
const api = createAccountApi();

const preferenceOptions = ['Сухой корм', 'Влажный корм', 'Без зерна', 'Стерилизован', 'Чувствительное пищеварение', 'Игрушки с кошачьей мятой'];
const sections = [['', 'Мой кабинет', 'paw'], ['supplies', 'Мои запасы', 'calendar'], ['care', 'Мои инструменты', 'map'], ['profile', 'Мой профиль', 'cat'], ['human', 'Мой человек', 'heart']];
const statuses = { packing: 'Собираем коробку', received: 'Демозаказ сохранён', delivering: 'Везём к вам', delivered: 'Коробка доставлена' };
const dateLabel = value => new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long' }).format(new Date(value + 'T12:00:00'));
const petYears = birthdayValue => {
  if (!birthdayValue) return null;
  const birthday = new Date(birthdayValue + 'T12:00:00');
  if (Number.isNaN(birthday.getTime())) return null;
  const now = new Date();
  const months = (now.getFullYear() - birthday.getFullYear()) * 12 + now.getMonth() - birthday.getMonth() - (now.getDate() < birthday.getDate() ? 1 : 0);
  if (months < 0) return null;
  return { months, years: Math.floor(months / 12) };
};
const yearsLabel = years => {
  const ending = new Intl.PluralRules('ru').select(years);
  return `${years} ${ending === 'one' ? 'год' : ending === 'few' ? 'года' : 'лет'}`;
};
const catYearsLabel = years => {
  const ending = new Intl.PluralRules('ru').select(years);
  return `${years} ${ending === 'one' ? 'кошачий год' : ending === 'few' ? 'кошачьих года' : 'кошачьих лет'}`;
};
// Approximate equivalence from International Cat Care's "How old is your cat?" chart.
const catHumanYears = years => years === 1 ? 15 : 24 + (years - 2) * 4;
const catAgePreview = birthday => {
  const age = petYears(birthday);
  return age?.years >= 1 ? `${catYearsLabel(age.years)} - примерно ${catHumanYears(age.years)} по человеческим меркам` : '';
};
const ageLabel = pet => {
  if (!pet.birthday) return pet.age || 'Возраст пока не указан';
  const age = petYears(pet.birthday);
  if (!age) return pet.age || 'Возраст пока не указан';
  const { months, years } = age;
  if (months < 12) return `${months} мес`;
  return pet.species === 'cat' ? `${catYearsLabel(years)} · примерно ${catHumanYears(years)} по человеческим меркам` : yearsLabel(years);
};
export function createAccountUI(helpers) {
  const { escape: e, icon, money, products, imageBlock, render, notify, getCart, repeatOrder } = helpers;
  if (helpers.publicStore && store.mode() === 'demo') store.open('personal');
  let accountsEnabled = false;
  let emailEnabled = false;
  let googleClientId = null;
  let googleScript = null;
  let customer = null;
  let pendingEmail = '';
  let pendingLinkKind = 'verify';
  let authStatus = '';
  let verifyingToken = null;
  let googleInitialized = false;
  let googleBusy = false;
  function setCustomer(value) {
    customer = value;
    const adminLink = typeof document === 'undefined' ? null : document.querySelector('#admin-link');
    if (adminLink) adminLink.hidden = value?.canManageStore !== true;
  }
  async function refreshCustomer() { setCustomer((await api.me()).customer); }
  function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (!googleScript) googleScript = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Google-вход временно недоступен'));
      document.head.append(script);
    }).catch(error => { googleScript = null; throw error; });
    return googleScript;
  }
  async function googleCredential(response) {
    if (googleBusy || !response?.credential) return;
    googleBusy = true;
    const mode = document.querySelector('[data-google-mode]')?.dataset.googleMode;
    try {
      if (mode === 'link') {
        await api.linkGoogle(response.credential);
        await refreshCustomer();
        render();
        notify('Google подключён к кабинету');
      } else if (mode === 'signin') {
        await api.googleSignIn(response.credential);
        await refreshCustomer();
        await loadRemote();
        navigate('/account');
      }
    } catch (error) {
      const message = document.querySelector('[data-google-error]');
      if (message) {
        message.textContent = error.message;
        if (error.status === 409 && mode === 'signin') {
          const link = document.createElement('a');
          link.href = '#/account/login';
          link.className = 'text-link';
          link.textContent = 'Войти по паролю';
          message.append(' ', link);
        }
      }
      else notify(error.message);
    } finally { googleBusy = false; }
  }
  async function afterRender() {
    const host = document.querySelector('[data-google-mode]');
    if (!host || !googleClientId) return;
    try {
      await loadGoogleScript();
      if (!host.isConnected) return;
      if (!googleInitialized) {
        window.google.accounts.id.initialize({ client_id: googleClientId, callback: googleCredential,
          auto_select: false, cancel_on_tap_outside: true });
        googleInitialized = true;
      }
      window.google.accounts.id.renderButton(host, { type: 'standard', theme: 'outline', size: 'large',
        shape: 'pill', text: 'continue_with', locale: 'ru', width: Math.min(320, host.parentElement?.clientWidth || 300) });
    } catch (error) { if (host.isConnected) host.textContent = error.message; }
  }
  async function loadRemote() {
    const snapshot = await api.cabinet();
    store.connectRemote(snapshot.cabinet, snapshot.revision, api.saveCabinet);
  }
  async function initialize() {
    try {
      const config = await api.config();
      accountsEnabled = config.accountsEnabled === true;
      emailEnabled = config.emailEnabled === true;
      googleClientId = config.googleClientId || null;
      if (!accountsEnabled) { render(); return; }
      if (location.hash.startsWith('#/account/verify?')) { await handleLink(); return; }
      await refreshCustomer();
      await loadRemote();
      render();
    } catch (error) {
      setCustomer(null);
      if (error.status !== 401) console.warn('Cabinet initialization:', error.message);
      render();
    }
  }
  async function handleLink() {
    if (!accountsEnabled || !location.hash.startsWith('#/account/verify?')) return;
    const token = new URLSearchParams(location.hash.split('?')[1] || '').get('token');
    if (!token || verifyingToken === token) return;
    verifyingToken = token;
    authStatus = 'Проверяем ссылку из письма';
    render();
    try {
      await api.verify(token);
      await refreshCustomer();
      await loadRemote();
      notify('Email подтверждён');
      navigate('/account');
    } catch (error) { authStatus = error.message; render(); }
  }
  function navigate(path) { if (location.hash === '#' + path) render(); else location.hash = path; }
  const petIcon = pet => `<span class="pet-avatar pet-avatar-${pet?.color || 'sage'}">${icon(pet?.species === 'dog' ? 'paw' : 'cat')}</span>`;
  const orderVariantId = item => resolveOrderVariantId(products, item);
  const productFor = item => {
    const p = products.find(p => p.id === item.productId);
    const variantId = orderVariantId(item);
    return variantId ? p?.variants?.find(v => v.id === variantId) || p : p;
  };
  const formError = form => form.querySelector('[data-account-error]');
  const pageNote = () => store.mode() === 'remote' ? '' : `<p class="pet-local-note">${icon('shield')}Данные этого профиля хранятся на устройстве${accountsEnabled ? ' <a href="#/account/login">Войти или зарегистрироваться</a>' : ''}</p>`;
  function authPage(kind = 'login') {
    const registering = kind === 'register';
    const recovering = kind === 'recover';
    const resetting = kind === 'reset';
    const checking = kind === 'check-email';
    const verifying = kind === 'verify';
    const title = registering ? 'Создать аккаунт' : recovering ? 'Восстановить пароль' : resetting ? 'Новый пароль' : checking ? 'Проверьте почту' : verifying ? 'Подтверждаем email' : 'Войти в кабинет';
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const token = params.get('token') || '';
    const emailForm = `<form class="pet-panel pet-form" data-account-form="${checking && pendingLinkKind === 'verify' ? 'resend-verification' : 'recover'}"><label class="pet-field">${checking ? 'Проверить или исправить email' : 'Email'}<input type="email" name="email" required maxlength="160" autocomplete="email" value="${e(pendingEmail)}"></label><p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit" ${accountsEnabled && emailEnabled ? '' : 'disabled'}>${checking ? 'Отправить ссылку ещё раз' : 'Получить ссылку'} ${icon('arrow')}</button></form>`;
    const passwordForm = `<form class="pet-panel pet-form" data-account-form="reset"><input type="hidden" name="token" value="${e(token)}"><label class="pet-field">Новый пароль<input type="password" name="password" required minlength="12" maxlength="200" autocomplete="new-password"></label><label class="pet-field">Повторите пароль<input type="password" name="passwordConfirm" required minlength="12" maxlength="200" autocomplete="new-password"></label><p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit" ${token && accountsEnabled ? '' : 'disabled'}>Сохранить пароль ${icon('arrow')}</button></form>`;
    const authForm = `<form class="pet-panel pet-form" data-account-form="${registering ? 'register' : 'login'}">${registering ? '<label class="pet-field">Ваше имя<input name="name" maxlength="100" autocomplete="name"></label>' : ''}<label class="pet-field">Email<input type="email" name="email" required maxlength="160" autocomplete="email"></label><label class="pet-field">Пароль<input type="password" name="password" required minlength="12" maxlength="200" autocomplete="${registering ? 'new-password' : 'current-password'}"></label>${registering ? '<label class="pet-field">Повторите пароль<input type="password" name="passwordConfirm" required minlength="12" maxlength="200" autocomplete="new-password"></label>' : ''}<p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit" ${accountsEnabled && (!registering || emailEnabled) ? '' : 'disabled'}>${registering ? 'Зарегистрироваться' : 'Войти'} ${icon('arrow')}</button>${accountsEnabled && (!registering || emailEnabled) ? '' : '<p class="pet-form-hint">Регистрация и вход станут доступны после подключения почтовых писем</p>'}</form>`;
    const content = verifying ? `<p class="pet-intro-copy" role="status">${e(authStatus || 'Проверяем ссылку из письма')}</p><a class="text-link" href="#/account/check-email">Запросить новую ссылку</a>`
      : resetting ? `<p class="pet-intro-copy">Введите новый пароль для вашего аккаунта</p>${passwordForm}`
      : checking ? `<p class="pet-intro-copy" role="status">${pendingEmail ? `Запрос принят для <strong class="pet-auth-address">${e(pendingEmail)}</strong>. ` : ''}Если указанный email связан с аккаунтом, письмо со ссылкой придёт на почту. Проверьте также папку «Спам».</p>${emailForm}<div class="pet-auth-links"><a class="text-link" href="#/account/login">Вернуться ко входу</a><a class="text-link" href="#/account/register">Создать аккаунт</a></div>`
      : recovering ? `<p class="pet-intro-copy">Укажите email, который использовали при регистрации. Мы отправим ссылку для создания нового пароля, если адрес связан с аккаунтом.</p>${emailForm}<div class="pet-auth-links"><a class="text-link" href="#/account/login">Вернуться ко входу</a><a class="text-link" href="#/account/register">Создать аккаунт</a></div>`
      : `<p class="pet-intro-copy">${registering ? 'Сохраните питомцев и планы в своём аккаунте' : 'Ваши питомцы и планы будут доступны на ваших устройствах'}</p>${authForm}${googleClientId ? '<div class="pet-google-divider"><span>или</span></div><div class="pet-google-control" data-google-mode="signin"></div><p class="pet-form-error" data-google-error role="alert"></p>' : ''}<div class="pet-auth-links"><a class="text-link" href="#/account/${registering ? 'login' : 'register'}">${registering ? 'Уже есть аккаунт' : 'Создать аккаунт'}</a>${!registering ? '<a class="text-link" href="#/account/recover">Забыли пароль?</a>' : ''}</div>`;
    return `<div class="page pet-onboarding pet-auth-page"><div class="pet-auth-panel"><span class="pet-eyebrow">Кабинет с хвостиком</span><h1>${title}</h1>${content}</div></div>`;
  }
  const emptyPanel = (title, text, action = 'Выбрать товары', href = '#/catalog?pet=cat') => `<div class="pet-empty">${icon('paw')}<h3>${title}</h3><p>${text}</p><a class="button outline" href="${href}">${action}</a></div>`;
  const petChoice = (name, title, options, selected, note = '') => {
    const current = options.find(([value]) => value === selected) || options[0];
    return `<div class="pet-field pet-choice-field"><span class="pet-field-title" id="pet-${name}-label">${title}</span>${note ? `<span class="pet-field-note">${note}</span>` : ''}<details class="pet-choice"><summary aria-labelledby="pet-${name}-label pet-${name}-value"><span id="pet-${name}-value" data-pet-choice-value>${e(current[1])}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="pet-choice-options" role="radiogroup" aria-labelledby="pet-${name}-label">${options.map(([value, label]) => `<label class="pet-choice-option"><input type="radio" name="${name}" value="${e(value)}" aria-label="${e(label)}" ${selected === value ? 'checked' : ''}><span>${e(label)}</span>${icon('check')}</label>`).join('')}</div></details></div>`;
  };
  function petFields(pet = {}) {
    const today = new Date().toISOString().slice(0, 10);
    const ageOptions = [['', 'Выбрать'], ...['До года', '1-3 года', '4-7 лет', '8 лет и старше'].map(value => [value, value])];
    return `<div class="pet-form-grid"><label class="pet-field">Имя питомца<input name="name" value="${e(pet.name || '')}" required maxlength="40" placeholder="Например, Барсик" autocomplete="off"></label>${petChoice('species', 'Кто живёт с вами', [['cat', 'Кошка или кот'], ['dog', 'Собака']], pet.species === 'dog' ? 'dog' : 'cat')}<label class="pet-field">День рождения <span>Если знаете</span><input type="date" name="birthday" max="${today}" value="${e(pet.birthday || '')}"><small class="pet-age-preview" data-pet-age-preview aria-live="polite">${pet.species === 'dog' ? '' : e(catAgePreview(pet.birthday))}</small></label>${petChoice('age', 'Примерный возраст', ageOptions, pet.age || '', 'Если дата неизвестна')}<label class="pet-field pet-field-wide">Порода <span>Необязательно</span><input name="breed" value="${e(pet.breed || '')}" maxlength="80" placeholder="Любимая домашняя кошка"></label></div><fieldset class="pet-preferences"><legend>Что подходит и нравится</legend><p>Сохраните привычки и предпочтения питомца</p><div>${preferenceOptions.map(v => `<label><input type="checkbox" name="preferences" value="${e(v)}" ${(pet.preferences || []).includes(v) ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></fieldset><label class="pet-field">Ещё кое-что обо мне <span>Необязательно</span><textarea name="notes" maxlength="400" rows="3" placeholder="Любимые игры, привычки и маленькие особенности">${e(pet.notes || '')}</textarea></label>`;
  }
  function onboarding(params) {
    const adding = params.get('add') === '1';
    return `<div class="page pet-onboarding">${pageNote()}<div class="pet-onboarding-grid"><div><span class="pet-eyebrow">У каждого хвоста - свой кабинет</span><h1>Давайте знакомиться<br>Как тебя зовут?</h1><p class="pet-intro-copy">Твои коробки, привычки и маленькие радости - в одном месте. А твой человек поможет всё заполнить.</p><form class="pet-panel pet-onboarding-form" data-account-form="join">${petFields()}${!adding ? '<label class="pet-field">Как зовут твоего человека <span>Необязательно</span><input name="humanName" maxlength="80" autocomplete="given-name" placeholder="Можно просто имя"></label>' : ''}<input type="hidden" name="ref" value="${e(params.get('ref') || '')}"><p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit">${adding ? 'Добавить питомца' : 'Создать мой кабинет'} ${icon('arrow')}</button><p class="pet-form-hint">${store.mode() === 'remote' ? 'Профиль сохранится в вашем аккаунте' : 'Профиль сохранится на этом устройстве'}</p></form>${!adding && store.mode() === 'personal' && store.activePet() ? '<a class="text-link pet-demo-link" href="#/account">Открыть мой кабинет</a><br>' : ''}${!adding && store.mode() !== 'remote' ? '<a class="text-link pet-demo-link" href="#/account/login">Войти в аккаунт</a>' : '<div class="pet-onboarding-links"><a class="text-link" href="#/account">Вернуться в кабинет</a><button class="text-link" data-account-exit>Выйти из аккаунта</button></div>'}</div><aside class="pet-onboarding-story"><img src="https://img.catmandog.es/assets/hero-happy.png" alt="Кот и собака отдыхают дома"><div><span class="pet-eyebrow">Хорошо быть собой</span><h2>Здесь всё<br>про тебя</h2><p>Когда заканчивается корм<br>Когда хочется новой игрушки<br>Когда у тебя день рождения</p></div></aside></div></div>`;
  }
  function emptyAccount() {
    return `<div class="page pet-account">${pageNote()}<section class="pet-panel pet-empty-account"><span class="pet-eyebrow">Кабинет с хвостиком</span><h1>Вы вошли в аккаунт</h1><p class="pet-empty-account-email">${e(customer?.email || store.get().human.email || '')}</p><p class="pet-muted">Питомца можно добавить позже</p><div class="pet-empty-account-actions"><a class="button" href="#/join">Добавить питомца ${icon('arrow')}</a><a class="button outline" href="#/catalog">Перейти в каталог</a>${customer?.canManageStore ? '<a class="button outline" href="/admin">Управление магазином</a>' : ''}</div><button class="text-link" data-account-exit>Выйти из аккаунта</button></section></div>`;
  }
  function orderCard(order, compact = false) {
    const total = order.items.reduce((sum, item) => sum + item.price * item.qty, 0) * (1 - (order.discount || 0) / 100);
    return `<article class="pet-order"><div class="pet-order-head"><div><strong>${e(order.number)}</strong><span>${dateLabel(order.date)}</span></div><span class="pet-status ${order.status === 'delivered' ? 'pet-status-delivered' : ''}">${statuses[order.status] || 'Демозаказ'}</span></div><div class="pet-order-products">${order.items.slice(0, compact ? 3 : order.items.length).map(item => { const p = productFor(item); const variantId = orderVariantId(item); return `<a href="#/product/${e(item.productId)}${variantId ? '?variant=' + encodeURIComponent(variantId) : ''}" aria-label="${e(p?.name || 'Товар')}">${p ? imageBlock(p.image) : icon('bag')}<span>${e(p?.name || item.name || 'Товар')}<small>${item.qty} шт${item.size && item.size !== '1 шт' ? ' · ' + e(item.size) : ''}</small></span></a>`; }).join('')}</div><div class="pet-order-bottom"><strong>${money(total)}</strong><div class="pet-order-actions"><a class="pet-small-button" href="#/account/orders/${encodeURIComponent(order.id)}">Детали заказа ${icon('arrow')}</a><button class="pet-small-button" data-account-repeat="${e(order.id)}">${icon('refresh')} Повторить заказ</button></div></div>${order.status !== 'delivered' ? '<p class="pet-caption">Статус показан для демонстрации - реальная отправка пока не подключена</p>' : ''}</article>`;
  }
  function reminderRow(reminder) {
    return `<div class="pet-reminder ${reminder.done ? 'pet-reminder-done' : ''}"><button class="pet-check" data-account-reminder="${e(reminder.id)}" aria-label="${reminder.done ? 'Вернуть в планы' : 'Отметить выполненным'}: ${e(reminder.title)}" aria-pressed="${reminder.done}">${icon(reminder.done ? 'check' : 'calendar')}</button><div><strong>${e(reminder.title)}</strong><span>${dateLabel(reminder.date)}</span></div>${reminder.productId ? `<a class="pet-round-link" href="#/product/${e(reminder.productId)}" aria-label="Посмотреть товар">${icon('arrow')}</a>` : ''}</div>`;
  }
  function dashboard(pet, data) {
    const reminders = data.reminders.filter(r => r.petId === pet.id && !r.done);
    const trips = (data.trips || []).filter(t => t.petId === pet.id);
    return `<div class="pet-welcome"><div><span class="pet-eyebrow">Мой маленький мир</span><h1>Привет, ${e(pet.name)}</h1><p>Всё для твоей хорошей жизни с хвостиком</p></div>${petIcon(pet)}</div><div class="pet-stat-grid pet-stat-grid-two"><a href="#/account/supplies"><span>${icon('calendar')} Мои планы</span><strong>${reminders.length}</strong><small>Покупки, о которых стоит помнить</small></a><a href="#/account/care"><span>${icon('compass')} Мои поездки</span><strong>${trips.length}</strong><small>Сохранённые маршруты и чек-листы</small></a></div><div class="pet-dashboard-grid"><section class="pet-panel"><div class="pet-panel-head"><h2>Мои планы</h2><a class="text-link" href="#/account/supplies">Все планы</a></div>${reminders.length ? reminders.slice(0, 3).map(reminderRow).join('') : '<p class="pet-muted">Планов пока нет</p>'}<a class="pet-inline-link" href="#/account/supplies">${icon('plus')} Запланировать покупку</a></section><section class="pet-panel"><div class="pet-panel-head"><h2>Мои инструменты</h2><a class="text-link" href="#/account/care">Открыть</a></div><div class="pet-dashboard-tools"><a href="#/useful/clinics">${icon('map')} Найти ветеринарную клинику ${icon('arrow')}</a><a href="#/useful/travel">${icon('compass')} Собрать чек-лист поездки ${icon('arrow')}</a></div></section></div><section class="pet-profile-summary pet-panel">${petIcon(pet)}<div><span class="pet-eyebrow">Пара слов обо мне</span><h2>${e(pet.name)}</h2><p>${e(pet.breed || (pet.species === 'dog' ? 'Любимая собака' : 'Любимая домашняя кошка'))} · ${e(ageLabel(pet))}</p><div class="pet-chips">${(pet.preferences || []).map(v => `<span>${e(v)}</span>`).join('')}</div></div><a class="text-link" href="#/account/profile">Мой профиль</a></section>`;
  }
  function orderDetailPage(pet, order) {
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = subtotal * (order.discount || 0) / 100;
    const supportLink = `#/support?order=${encodeURIComponent(order.number)}`;
    const items = order.items.map(item => {
      const product = productFor(item);
      const variantId = orderVariantId(item);
      const name = product?.name || item.name || 'Товар';
      const label = `${name}${item.size ? ' · ' + item.size : ''}`;
      const key = `${item.productId}|${variantId || ''}`;
      const productLink = `#/product/${e(item.productId)}${variantId ? '?variant=' + encodeURIComponent(variantId) : ''}`;
      return `<li><a href="${productLink}">${product ? imageBlock(product.image) : icon('bag')}<span><strong>${e(name)}</strong><small>${e(item.size || '1 шт')} · ${item.qty} шт × ${money(item.price)}</small></span></a><strong>${money(item.price * item.qty)}</strong><a class="text-link" href="#/returns?order=${encodeURIComponent(order.number)}&amp;product=${encodeURIComponent(key)}" aria-label="Возврат товара: ${e(label)}">Запросить возврат</a></li>`;
    }).join('');
    return `<div class="pet-page-head"><a class="text-link" href="#/account/orders">${icon('arrow')} Все заказы</a><span class="pet-eyebrow">Демонстрационный заказ ${e(order.number)}</span><h1>Заказ ${e(order.number)}</h1><p>Сохранён ${dateLabel(order.date)} для ${e(pet.name)}. Статусы показаны для примера.</p></div><div class="pet-order-detail"><section class="pet-panel"><h2>Статус заказа</h2>${orderProgress(order.status, { icon, escape: e })}<p class="pet-caption">Реальная доставка и автоматическое обновление статуса пока не подключены</p></section><section class="pet-panel"><h2>Товары в заказе</h2><ul class="pet-order-detail-items">${items}</ul><div class="summary-line"><span>Товары</span><strong>${money(subtotal)}</strong></div>${discount ? `<div class="summary-line"><span>Скидка</span><strong>−${money(discount)}</strong></div>` : ''}<div class="summary-line total"><span>Сумма товаров</span><strong>${money(subtotal - discount)}</strong></div><p class="pet-caption">Доставка и оплата в этом демонстрационном заказе не записаны</p></section><div class="pet-order-detail-actions"><a class="button outline" href="${supportLink}">Задать вопрос по заказу ${icon('arrow')}</a><button class="pet-small-button" data-account-repeat="${e(order.id)}">${icon('refresh')} Повторить заказ</button></div></div>`;
  }
  function ordersPage(pet, data, orderId) {
    const list = data.orders.filter(o => o.petId === pet.id);
    if (orderId) {
      const order = list.find(item => item.id === orderId);
      return order ? orderDetailPage(pet, order) : emptyPanel('Заказ не найден', 'Откройте список заказов своего питомца', 'Мои заказы', '#/account/orders');
    }
    return `<div class="pet-page-head"><span class="pet-eyebrow">Коробки для ${e(pet.name)}</span><h1>Мои заказы</h1><p>Что уже приехало и что мы ещё собираем</p></div>${list.length ? `<div class="pet-order-grid">${list.map(o => orderCard(o)).join('')}</div>` : `<section class="pet-panel">${emptyPanel('Первая коробка ещё впереди', store.mode() === 'remote' ? 'После первого настоящего заказа он появится здесь' : 'Выбери товары и сохрани демозаказ в корзине')}</section>`}`;
  }
  function suppliesPage(pet, data) {
    const list = data.reminders.filter(r => r.petId === pet.id);
    return `<div class="pet-page-head"><span class="pet-eyebrow">Чтобы всё нужное было под лапой</span><h1>Мои запасы</h1><p>Запланированные покупки для ${e(pet.name)} - без автоматических заказов и списаний</p></div><div class="pet-dashboard-grid"><section class="pet-panel"><h2>Мои планы</h2>${list.length ? list.map(reminderRow).join('') : '<p class="pet-muted">Пока ничего не запланировано</p>'}</section><form class="pet-panel pet-form" data-account-form="reminder"><h2>Добавить в планы</h2><label class="pet-field">Что понадобится<input name="title" required maxlength="120" placeholder="Например, наполнитель"></label><label class="pet-field">Когда понадобится<input name="date" type="date" required min="${new Date().toISOString().slice(0, 10)}"></label><label class="pet-field">Товар <span>Необязательно</span><select name="productId"><option value="">Выберу позже</option>${products.filter(p => !p.catalogHidden && p.pet !== 'dog').map(p => `<option value="${e(p.id)}">${e(p.name)}</option>`).join('')}</select></label><p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit">Сохранить план ${icon('plus')}</button></form></div>`;
  }
  function perksPage(pet, data) {
    const link = location.href.split('#')[0] + '#/join?ref=' + encodeURIComponent(data.referral);
    return `<div class="pet-page-head"><span class="pet-eyebrow">Поводы порадовать ${e(pet.name)}</span><h1>Подарки и бонусы</h1><p>Маленькие приятности для тебя и твоих друзей</p></div><div class="pet-dashboard-grid"><section class="pet-panel pet-perk"><span class="pet-perk-icon">${icon('gift')}</span><h2>Первый подарок</h2><p>10% на демонстрационный заказ<br>Код <strong>WELCOME10</strong></p><form class="pet-form" data-account-form="promo"><label class="pet-field">Мой промокод<input name="code" required maxlength="40" value="${e(data.promo || '')}" placeholder="WELCOME10" autocapitalize="characters"></label><p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit">Применить промокод</button></form>${data.promo ? `<p class="pet-success">${icon('check')} ${e(data.promo)} активен - скидка 10% в демокорзине</p>` : ''}</section><section class="pet-panel pet-perk"><span class="pet-perk-icon">${icon('paw')}</span><h2>Позови друга</h2><p>Пусть у его хвостика тоже появится свой кабинет</p><label class="pet-field">Моя ссылка<input value="${e(link)}" readonly data-account-referral aria-label="Реферальная ссылка"></label><button class="pet-small-button" data-account-copy>${icon('copy')} Скопировать ссылку</button><p class="pet-caption">Ссылка ведёт к регистрации питомца Учёт приглашений и начисление бонусов пока не подключены</p></section></div><a class="pet-gift-banner" href="#/gifts"><div><span class="pet-eyebrow">Праздник с хвостиком</span><h2>У тебя есть повод</h2><p>Гостинцы, день рождения и подарки просто так</p></div>${icon('arrow')}</a>`;
  }
  function profilePage(pet) { return `<div class="pet-page-head"><span class="pet-eyebrow">Знакомимся ближе</span><h1>Я - ${e(pet.name)}</h1><p>Мои привычки и предпочтения могут меняться</p></div><form class="pet-panel pet-form" data-account-form="profile">${petFields(pet)}<p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit">Сохранить мой профиль ${icon('check')}</button></form>`; }
  function humanPage(data) {
    return `<div class="pet-page-head"><span class="pet-eyebrow">Кто помогает мне с покупками</span><h1>Мой человек</h1><p>Имя и контакты в кабинете</p></div><form class="pet-panel pet-form" data-account-form="human"><div class="pet-form-grid"><label class="pet-field">Имя моего человека<input name="name" maxlength="80" autocomplete="given-name" value="${e(data.human.name)}"></label><label class="pet-field">Email<input type="email" name="email" autocomplete="email" value="${e(data.human.email)}" placeholder="name@example.com"></label><label class="pet-field pet-field-wide">Telegram <span>Необязательно</span><input name="telegram" maxlength="33" pattern="@?[A-Za-z0-9_]{5,32}" value="${e(data.human.telegram)}" placeholder="@username"></label></div><p class="pet-form-error" data-account-error role="alert"></p><button class="button" type="submit">Сохранить контакты ${icon('check')}</button></form>${store.mode() === 'remote' && googleClientId ? `<section class="pet-panel pet-google-link"><h2>Вход через Google</h2>${customer?.googleLinked ? '<p class="pet-muted">Google подключён к этому кабинету</p>' : '<p class="pet-muted">Подключите Google с тем же email, чтобы входить без пароля</p><div class="pet-google-control" data-google-mode="link"></div><p class="pet-form-error" data-google-error role="alert"></p>'}</section>` : ''}`;
  }
  function page(path, params) {
    if (['login','register','recover','reset','verify','check-email'].includes(path.split('/')[2]) && path.startsWith('/account/')) return authPage(path.split('/')[2]);
    if (path === '/join' || path === '/account/welcome') return onboarding(params);
    const pet = store.activePet();
    if (!pet) return store.mode() === 'remote' ? emptyAccount() : accountsEnabled ? authPage('login') : onboarding(params);
    const data = store.get();
    const section = path.split('/')[2] || '';
    const content = section === 'care' ? accountTools({ pet, data, escape: e, icon }) : section === 'supplies' ? suppliesPage(pet, data) : section === 'profile' ? profilePage(pet) : section === 'human' ? humanPage(data) : section === 'orders' && store.mode() === 'demo' ? ordersPage(pet, data, path.split('/')[3]) : dashboard(pet, data);
    return `<div class="page pet-account">${pageNote()}<div class="pet-account-layout"><aside class="pet-sidebar"><a class="pet-account-brand" href="#/account">${icon('paw')} Кабинет с хвостиком</a><div class="pet-switcher" role="group" aria-label="Мои питомцы">${data.pets.map(p => `<button data-account-pet="${e(p.id)}" aria-pressed="${p.id === pet.id}" class="${p.id === pet.id ? 'active' : ''}">${petIcon(p)}<span>${e(p.name)}</span>${p.id === pet.id ? icon('check') : ''}</button>`).join('')}</div><a class="pet-add" href="#/join?add=1">${icon('plus')} Добавить питомца</a><nav class="pet-navigation" aria-label="Разделы кабинета">${sections.map(([key, label, glyph]) => `<a href="#/account${key ? '/' + key : ''}" ${section === key ? 'aria-current="page"' : ''}>${icon(glyph)} ${label}</a>`).join('')}</nav>${customer?.canManageStore ? `<a class="pet-admin-entry" href="/admin">${icon('shield')} Управление магазином ${icon('arrow')}</a>` : ''}<button class="pet-exit" data-account-exit>${icon('arrow')} ${store.mode() === 'demo' ? 'Создать свой кабинет' : store.mode() === 'remote' ? 'Выйти из аккаунта' : 'Закрыть кабинет'}</button><p class="pet-sidebar-note">Каждому хвостику<br>немного больше заботы</p></aside><div class="pet-account-content">${content}</div></div></div>`;
  }
  async function click(button) {
    if (button.hasAttribute('data-account-pet')) { store.switchPet(button.dataset.accountPet); render(); await syncChanges().catch(() => {}); }
    if (button.hasAttribute('data-account-exit')) { if (store.mode() === 'remote') { try { await api.logout(); setCustomer(null); store.disconnectRemote(); navigate('/account/login'); } catch (error) { notify(error.message); } } else { store.open('personal'); navigate('/account/welcome'); } }
    if (button.hasAttribute('data-account-reminder')) { store.toggleReminder(button.dataset.accountReminder); render(); await syncChanges().catch(() => {}); }
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
  function change(target) {
    const form = target.closest('[data-account-form="join"], [data-account-form="profile"]');
    if (!form || !['species', 'age', 'birthday'].includes(target.name)) return;
    if (target.matches('.pet-choice-option input')) {
      const choice = target.closest('.pet-choice');
      choice.querySelector('[data-pet-choice-value]').textContent = target.parentElement.querySelector('span').textContent;
      choice.open = false;
      choice.querySelector('summary').focus();
    }
    const preview = form.querySelector('[data-pet-age-preview]');
    preview.textContent = form.elements.species.value === 'cat' ? catAgePreview(form.elements.birthday.value) : '';
  }
  function dismissChoices(target) {
    document.querySelectorAll('.pet-choice[open]').forEach(choice => {
      if (!choice.contains(target)) choice.open = false;
    });
  }
  function escapeChoices() {
    const open = document.querySelector('.pet-choice[open]');
    if (!open) return;
    open.open = false;
    open.querySelector('summary').focus();
  }
  async function syncChanges() {
    if (store.mode() !== 'remote') return;
    try { await store.sync(); }
    catch (error) { notify(error.message); throw error; }
  }
  async function submit(form) {
    const values = new FormData(form);
    try {
      const kind = form.dataset.accountForm;
      if (kind === 'register' || kind === 'login') {
        if (kind === 'register' && values.get('password') !== values.get('passwordConfirm')) throw new Error('Пароли не совпадают');
        const button = form.querySelector('button[type=submit]'); button.disabled = true;
        try {
          const result = await api[kind]({ email: values.get('email'), password: values.get('password'), name: values.get('name') });
          if (kind === 'register') { pendingEmail = result.email; pendingLinkKind = 'verify'; navigate('/account/check-email'); }
          else { await refreshCustomer(); await loadRemote(); navigate('/account'); }
        } catch (error) {
          if (kind === 'login' && error.status === 403) {
            pendingEmail = String(values.get('email') || '');
            pendingLinkKind = 'verify';
            navigate('/account/check-email');
          }
          throw error;
        } finally { button.disabled = false; }
        return;
      }
      if (kind === 'recover' || kind === 'resend-verification') {
        pendingEmail = String(values.get('email') || '');
        pendingLinkKind = kind === 'recover' ? 'reset' : 'verify';
        await api[kind === 'recover' ? 'recover' : 'resendVerification'](pendingEmail);
        navigate('/account/check-email');
        notify('Проверьте адрес и почту');
        return;
      }
      if (kind === 'reset') {
        if (values.get('password') !== values.get('passwordConfirm')) throw new Error('Пароли не совпадают');
        await api.reset(values.get('token'), values.get('password'));
        navigate('/account/login');
        notify('Пароль обновлён. Войдите с новым паролем');
        return;
      }
      if (kind === 'join' || kind === 'profile') {
        const fields = { name: values.get('name'), species: values.get('species'), birthday: values.get('birthday'), age: values.get('age'), breed: values.get('breed'), notes: values.get('notes'), preferences: values.getAll('preferences') };
        if (kind === 'join') {
          if (routeAdding() === false && store.mode() !== 'remote') store.open('personal');
          store.savePet(fields);
          if (values.has('humanName')) store.saveHuman({ name: values.get('humanName') });
          if (values.get('ref')) store.setReferral(values.get('ref'));
          await syncChanges();
          const next = new URLSearchParams(location.hash.split('?')[1]).get('return');
          if (next === 'trip' && store.tripDraft()) { store.saveTrip(store.tripDraft()); await syncChanges(); navigate('/account/care'); }
          else if (next === 'clinics') navigate('/useful/clinics');
          else navigate('/account');
        } else { store.savePet(fields, store.activePet().id); await syncChanges(); render(); notify('Профиль сохранён'); }
      }
      if (kind === 'human') { store.saveHuman({ name: values.get('name'), email: values.get('email'), telegram: values.get('telegram') }); await syncChanges(); notify('Настройки сохранены'); }
      if (kind === 'reminder') { store.addReminder({ title: values.get('title'), date: values.get('date'), productId: values.get('productId') }); await syncChanges(); render(); notify('Покупка добавлена в планы'); }
      if (kind === 'promo') { store.applyPromo(values.get('code')); render(); notify('Демопромокод активирован'); }
    } catch (error) { if (form.isConnected) formError(form).textContent = error.message; else notify(error.message); }
  }
  const routeAdding = () => new URLSearchParams(location.hash.split('?')[1]).get('add') === '1';
  return { page, click, change, dismissChoices, escapeChoices, submit, store, initialize, syncChanges, handleLink, afterRender };
}
