import { products } from './data.js?v=20261004-2';

const toys = ['mouse', 'rope', 'rabbit'];
const treats = ['creamy-treats', 'crunchy-treats', 'pure-treats'];
const find = id => products.find(p => p.id === id);
const presets = {
  birthday: { toy: 'mouse', treat: 'creamy-treats', accessory: 'birthday-bandana' },
  play: { toy: 'rope', treat: 'crunchy-treats', accessory: 'none' },
  cosy: { toy: 'rabbit', treat: 'pure-treats', accessory: 'none' }
};

export function normalizeGift(config = {}) {
  if (!config || typeof config !== 'object') config = {};
  return {
    season: config.season === 'newyear' ? 'newyear' : 'halloween',
    toy: toys.includes(config.toy) ? config.toy : 'mouse',
    treat: treats.includes(config.treat) ? config.treat : 'creamy-treats',
    accessory: config.accessory === 'none' ? 'none' : 'birthday-bandana',
    accessorySize: config.accessorySize === 'XS' ? 'XS' : 'S',
    recipient: typeof config.recipient === 'string' ? config.recipient.slice(0, 40) : '',
    message: typeof config.message === 'string' ? config.message.slice(0, 160) : '',
    preset: (config.preset === 'custom' || Object.hasOwn(presets, config.preset)) ? config.preset : 'birthday'
  };
}

export function giftOffer(product, config = {}) {
  const c = normalizeGift(config);
  let ids, price = product.price, image = product.image, label = 'Готовый набор';
  let preorder = false;
  if (product.gift === 'visit') {
    ids = ['rabbit', 'mouse', 'creamy-treats'];
  } else if (product.gift === 'season') {
    preorder = c.season === 'newyear';
    ids = preorder ? ['rabbit', 'pure-treats', 'elf-hat'] : ['mouse', 'crunchy-treats', 'halloween-bandana'];
    price = preorder ? 34.9 : 29.9;
    image = preorder ? 38 : product.image;
    label = preorder ? 'Новый год · предзаказ' : 'Хэллоуин';
    if (!preorder) label += ` · бандана ${c.accessorySize}`;
  } else if (product.gift === 'personal') {
    ids = [c.toy, c.treat, ...(c.accessory === 'none' ? [] : [c.accessory])];
    price = Math.round((5.6 + ids.reduce((sum, id) => sum + find(id).price, 0)) * 100) / 100;
    label = `Индивидуальный набор${c.accessory !== 'none' ? ` · бандана ${c.accessorySize}` : ''}`;
  }
  return { config: c, price, image, label, preorder, items: (ids || []).map(find) };
}

// Recompute from the selected contents instead of trusting a stored price.
export function cartUnitPrice(item) {
  const product = find(item.id);
  return product.gift ? giftOffer(product, item.giftConfig).price : product.price;
}

export function giftHome(helpers, showAll = true) {
  const { imageBlock, icon } = helpers;
  const items = [
    { id: 'gift-visit', title: 'В гости с подарком', text: 'Когда у хозяина дома есть ещё один маленький хозяин', note: '2 игрушки + лакомство', price: '24,90 €', action: 'Посмотреть состав' },
    { id: 'gift-season', title: 'Праздник с хвостиком', text: 'Хэллоуин уже близко А первый Новый год можно подготовить заранее', note: 'Хэллоуин · сейчас', price: '29,90 €', action: 'Выбрать праздник' },
    { id: 'gift-personal', title: 'Его особенный день', text: 'День рождения, год вместе или просто ваш собственный повод', note: 'Игрушка + лакомство + ваш выбор', price: 'от 16,00 €', action: 'Собрать подарок' }
  ];
  return `<section class="gift-section" aria-labelledby="gift-heading">
    <div class="gift-section-head"><div><h2 id="gift-heading">Подарок С хвостиком</h2><p>В гости, на праздник или просто потому, что любите</p></div>${showAll?'<a class="text-link" href="#/gifts">Все подарочные наборы</a>':''}</div>
    <div class="gift-grid">${items.map(item => {
      const p = find(item.id);
      return `<article class="gift-card"><a class="gift-media" href="#/product/${p.id}" aria-label="${item.title}">${imageBlock(p.image)}</a><div class="gift-card-top"><span>${item.note}</span><strong>${item.price}</strong></div><h3><a href="#/product/${p.id}">${item.title}</a></h3><p>${item.text}</p><a class="gift-action" href="#/product/${p.id}">${item.action} ${icon('arrow')}</a>${p.gift === 'season' ? '<a class="season-alternative" href="#/product/gift-season?season=newyear">Новый год · предзаказ · 34,90 €</a>' : ''}</article>`;
    }).join('')}</div>
  </section>`;
}

export function giftOptions(product, state, helpers) {
  const { money } = helpers;
  const c = normalizeGift(state);
  let html = '';
  if (product.gift === 'season') {
    html = `<fieldset class="gift-fieldset"><legend>Какой праздник?</legend><div class="season-options"><button class="season-option ${c.season === 'halloween' ? 'active' : ''}" data-gift-season="halloween" aria-pressed="${c.season === 'halloween'}"><strong>Хэллоуин</strong><span>Сейчас · ${money(29.9)}</span></button><button class="season-option ${c.season === 'newyear' ? 'active' : ''}" data-gift-season="newyear" aria-pressed="${c.season === 'newyear'}"><strong>Новый год</strong><span>Предзаказ · ${money(34.9)}</span></button></div></fieldset>`;
  }
  if (product.gift === 'personal') {
    html = `<fieldset class="gift-fieldset"><legend>Начните с характера кота</legend><div class="gift-presets">${[['birthday','День рождения'],['play','Любит играть'],['cosy','Любит уют']].map(([id,label])=>`<button class="pill ${c.preset === id ? 'active' : ''}" data-gift-preset="${id}" aria-pressed="${c.preset === id}">${label}</button>`).join('')}</div></fieldset>
    <div class="gift-selects"><label>Игрушка<select data-gift-choice="toy">${toys.map(id=>`<option value="${id}" ${c.toy===id?'selected':''}>${find(id).name} · ${money(find(id).price)}</option>`).join('')}</select></label><label>Лакомство<select data-gift-choice="treat">${treats.map(id=>`<option value="${id}" ${c.treat===id?'selected':''}>${find(id).name} · ${money(find(id).price)}</option>`).join('')}</select></label><label>Праздничный аксессуар<select data-gift-choice="accessory"><option value="birthday-bandana" ${c.accessory!=='none'?'selected':''}>Бандана Birthday Star · ${money(8.9)}</option><option value="none" ${c.accessory==='none'?'selected':''}>Без аксессуара</option></select></label></div>`;
  }
  if ((product.gift === 'season' && c.season === 'halloween') || (product.gift === 'personal' && c.accessory !== 'none')) {
    html += `<label class="gift-size">Размер банданы<select data-gift-choice="accessorySize"><option value="XS" ${c.accessorySize==='XS'?'selected':''}>XS</option><option value="S" ${c.accessorySize==='S'?'selected':''}>S</option></select></label>`;
  }
  return html;
}

export function giftSummary(product, state, helpers) {
  const { money, imageBlock } = helpers;
  const offer = giftOffer(product, state);
  return `<h3>Что внутри</h3><ul class="gift-contents">${offer.items.map(p=>`<li><a href="#/product/${p.id}">${imageBlock(p.image)}<span>${p.name}<small>${p.id.includes('bandana')?offer.config.accessorySize+' · 1 шт':p.sizes[0]==='1 шт'?'1 шт':p.sizes[0]+' · 1 шт'}</small></span></a></li>`).join('')}</ul><div class="gift-wrapping"><span>Подарочная коробка, лента и открытка</span><strong>${product.gift==='personal'?money(5.6):'Включены'}</strong></div>`;
}

export function giftDetail(product, state, helpers) {
  const { escape, money, imageBlock, icon, crumbs } = helpers;
  const offer = giftOffer(product, state);
  const c = offer.config;
  return `<div class="page gift-detail">${crumbs(product.name)}<div class="detail-grid">
    <div class="gift-gallery"><div id="gift-picture">${imageBlock(offer.image,'detail-image')}</div><p class="gift-photo-note">${product.gift==='personal'?'Пример оформления Ваш точный состав - справа':'Игрушки, лакомство и упаковка - в одной коробке'}</p><div class="gift-gallery-note"><h3>Маленький подарок<br>Большой повод для радости</h3><p>Без случайных мелочей: то, с чем можно играть, что можно попробовать и что приятно подарить</p></div></div>
    <div class="detail-copy"><span class="eyebrow">CatManDog · Little celebrations</span><h1>${product.name}</h1><div id="gift-status" class="gift-status">${offer.preorder?'Новогодний предзаказ':'Для кошек · подарочная упаковка'}</div><div class="detail-price" id="gift-price" aria-live="polite">${money(offer.price)}</div><p>${product.description}</p>
    <div id="gift-options">${giftOptions(product,c,helpers)}</div><div class="gift-summary" id="gift-summary">${giftSummary(product,c,helpers)}</div>
    <fieldset class="gift-fieldset gift-message"><legend>Для кого этот подарок?</legend><label>Кличка кота <span>необязательно</span><input data-gift-text="recipient" maxlength="40" value="${escape(c.recipient)}" placeholder="Например, Мурчик"></label><label>Текст открытки <span>необязательно</span><textarea data-gift-text="message" maxlength="160" rows="3" placeholder="Маленькому хозяину - с большой любовью">${escape(c.message)}</textarea></label><span class="gift-message-count" id="gift-message-count">${c.message.length}/160</span></fieldset>
    <div class="buy-row"><div class="quantity"><button data-detail-qty="-1" aria-label="Уменьшить количество">−</button><span id="detail-qty">1</span><button data-detail-qty="1" aria-label="Увеличить количество">+</button></div><button class="button" data-gift-buy="${product.id}" id="gift-buy">${offer.preorder?'Предзаказать набор':'Добавить набор'} ${icon('bag')}</button></div><p class="gift-order-note" id="gift-order-note">${offer.preorder?'Предзаказ сохраняется в демонстрационной корзине Дата отправки появится при запуске магазина':'Упаковка входит в цену Оплата и отправка заказов пока не подключены'}</p>
    <details open><summary>Как подарить</summary><p>Откройте коробку вместе с человеком, который заботится о коте Новые лакомства предлагайте маленькими порциями с учётом привычного рациона Игрушки используйте для совместной игры</p></details><details><summary>Об аксессуарах и составе</summary><p>Банданы и шапочка - необязательный реквизит для короткого фото Если кошке некомфортно, положите аксессуар рядом Не фиксируйте шапочку и не оставляйте кошку в аксессуарах без присмотра Состав выбранного набора сохраняется в корзине</p></details>
    </div></div></div>`;
}

export function applyGiftPreset(state, name) {
  return normalizeGift({ ...state, ...presets[name], preset: name });
}

export function giftLanding(helpers) {
  return `<div class="page gift-landing-intro">${helpers.crumbs('Подарочные наборы')}<div class="gift-intro"><h1 class="page-title">У котов тоже бывают праздники</h1><p class="lead">В гости к друзьям, на первый Новый год или в день, когда вы встретились Три способа сказать маленькому любимцу: «Ты очень важен»</p></div></div>${giftHome(helpers, false)}<section class="gift-how"><h2>Подарить - просто</h2><div><article><span>01</span><h3>Выберите повод</h3><p>Готовый гостинец, сезонный праздник или ваш собственный день</p></article><article><span>02</span><h3>Проверьте состав</h3><p>Выберите то, что нравится коту В индивидуальном наборе можно поменять каждый подарок</p></article><article><span>03</span><h3>Добавьте пару слов</h3><p>Кличка получателя и текст открытки делают коробку именно его подарком</p></article></div></section><section class="section"><div class="section-head"><h2>Маленькие гостинцы отдельно</h2><a class="text-link" href="#/catalog?q=${encodeURIComponent('лакомства')}">Все лакомства</a></div><div class="product-grid">${['creamy-treats','crunchy-treats','pure-treats','rabbit'].map(id=>helpers.card(find(id))).join('')}</div></section>`;
}
