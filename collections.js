import { products } from './data.js';

export const activeHomeGroups = [
  { title: 'Свой этаж у окна', text: 'Наблюдать за птицами, ловить солнце и отдыхать выше пола', ids: ['window-hammock'] },
  { title: 'Потянуться и поточить когти', text: 'Напольная когтеточка: поставили в любимом месте, переставили вместе с мебелью', ids: ['scratch-arch'] },
  { title: 'Охота прямо в гостиной', text: 'Движение и маленькие задачи для любопытного кота - без изменений в квартире', ids: ['rope', 'puzzle'] }
];

export function homeDirections(icon) {
  return `<section class="editorial-promos home-directions" aria-label="Особенные идеи для вашего кота">
    <a class="editorial-promo direction-gifts" href="#/gifts"><img src="assets/gift-visit.png" alt="Подарочная коробка с игрушками и лакомствами для кота" loading="lazy"><div class="promo-copy"><span class="direction-label">Подарки коту</span><h2>Маленький подарок<br>Большой повод</h2><p>Хэллоуин уже близко<br>А для гостинца повод не нужен</p><span class="promo-link">Выбрать подарок ${icon('arrow')}</span></div></a>
    <a class="editorial-promo direction-home" href="#/active-home"><img src="assets/active-home-promo.png" alt="Активная кошка на оконной лежанке с присосками в светлой квартире" loading="lazy"><div class="promo-copy"><span class="direction-label">Дом для активного кота</span><h2>Больше движения<br>Без сверления</h2><p>Место для кошачьих привычек<br>Даже в съёмной квартире</p><span class="promo-link">Обустроить его мир ${icon('arrow')}</span></div></a>
  </section>`;
}

export function activeHomeLanding({ crumbs, card, icon }) {
  return `<div class="page active-home-page">${crumbs('Дом для активного кота')}
    <section class="active-home-intro"><div><span class="eyebrow">CatManDog · Home, their way</span><h1 class="page-title">Его маленький мир<br>В вашей квартире</h1><p class="lead">Коту нужно играть, точить когти и наблюдать за жизнью сверху Для этого можно обойтись без отверстий в стенах: место у окна, напольная когтеточка и игры, которые легко забрать при переезде</p><div class="home-benefits"><span>Без сверления стен</span><span>Можно переставить</span><span>Можно забрать с собой</span></div></div><img src="assets/active-home-promo.png" alt="Кошка наблюдает из окна на лежанке с присосками"></section>
    <section class="home-product-group active-home-products"><div class="section-head"><div><h2>Для его домашних приключений</h2><p>Четыре простых способа сделать привычную квартиру интереснее</p></div></div><div class="product-grid">${activeHomeGroups.flatMap(group=>group.ids).map(id=>card(products.find(p=>p.id===id))).join('')}</div></section>
    <div class="home-habits">${activeHomeGroups.map(group=>`<article><h3>${group.title}</h3><p>${group.text}</p></article>`).join('')}</div>
    <div class="home-fitting-note"><h2>Под вашу квартиру Под вашего кота</h2><p>Для оконной лежанки нужно подходящее гладкое стекло: проверьте крепления и допустимую нагрузку по инструкции Когтеточку можно поставить рядом с любимым местом отдыха, а для игр оставить свободный участок пола</p><a class="text-link" href="#/catalog">Весь каталог ${icon('arrow')}</a></div>
  </div>`;
}
