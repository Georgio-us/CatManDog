import { productHref } from './seo-products.js';

const wetIds = new Set([
  'leonardo-wet-pure-chicken', 'leonardo-wet-kitten',
  'rc-wet', 'royalcanin-93e8aeca'
]);
const sterilisedIds = new Set(['leonardo-light', 'rc-sterilised', 'rc-wet']);
const kittenIds = new Set(['rc-kitten-regular', 'orijen-kitten',
  'royalcanin-93e8aeca', 'leonardo-wet-kitten']);

const copy = {
  ru: {
    title: 'Подборка для кошек',
    intro: 'Мы выбрали корм, лакомства и вещи для дома, с которых удобно начать',
    foodLead: 'Корм для взрослых стерилизованных кошек. Начните с фасовки 1,8 кг',
    fountainLead: 'Беспроводной фонтан на 3 л с датчиком движения. Поставьте его там, где кошке удобно пить',
    foodLink: 'Посмотреть корм', fountainLink: 'Посмотреть поилку',
    filterCompanion: 'Сменные фильтры',
    start: 'С чего начать',
    startIntro: 'Выберите то, что подходит вашей кошке',
    sterilised: 'Для стерилизованной кошки', sterilisedCopy: 'Повседневный сухой корм',
    kitten: 'Для котёнка', kittenCopy: 'Рацион по возрасту',
    wet: 'Влажный корм', wetCopy: 'На каждый день',
    treats: 'Лакомства', treatsCopy: 'Небольшое угощение',
    showChoice: 'Посмотреть варианты',
    pairs: 'Хорошо вместе',
    pairsIntro: 'Вещи, которые удобно выбирать парой',
    waterPair: 'Поилка и фильтры', waterPairCopy: 'Фонтан для воды и запас сменных фильтров',
    treatPair: 'Churu и коврик', treatPairCopy: 'Лакомство можно распределить по рельефной поверхности',
    litterPair: 'Лоток и наполнитель', litterPairCopy: 'Две вещи для ежедневного ухода',
    fountainName: 'Поилка', filtersName: 'Фильтры', churuName: 'Churu', matName: 'Коврик', litterBoxName: 'Лоток', litterName: 'Наполнитель',
    home: 'Для жизни дома',
    homeIntro: 'Места для отдыха и вещи для игры',
    catConcept: 'Лоток, лежанка и когтеточка в одном предмете',
    tunnel: 'Туннель, в котором можно играть и точить когти',
    toys: 'Небольшие игрушки для ежедневных игр',
    viewProduct: 'К товару',
    all: 'Вся подборка', allIntro: 'Все выбранные товары в одном месте',
    filters: [
      ['all', 'Все'], ['dry', 'Сухой корм'], ['wet', 'Влажный корм'],
      ['treats', 'Лакомства'], ['water', 'Поилки и фильтры'],
      ['hygiene', 'Лотки и наполнители'], ['home', 'Игры и дом']
    ],
    more: 'Показать ещё'
  },
  es: {
    title: 'Selección para gatos',
    intro: 'Hemos elegido alimentos, premios y accesorios para empezar con facilidad',
    foodLead: 'Pienso para gatos adultos esterilizados. Empieza con el formato de 1,8 kg',
    fountainLead: 'Fuente inalámbrica de 3 l con sensor de movimiento. Colócala donde tu gato prefiera beber',
    foodLink: 'Ver el pienso', fountainLink: 'Ver la fuente',
    filterCompanion: 'Filtros de recambio',
    start: 'Por dónde empezar',
    startIntro: 'Elige lo que necesita tu gato',
    sterilised: 'Para gatos esterilizados', sterilisedCopy: 'Pienso seco para cada día',
    kitten: 'Para gatitos', kittenCopy: 'Alimento según su edad',
    wet: 'Comida húmeda', wetCopy: 'Para cada día',
    treats: 'Premios', treatsCopy: 'Un pequeño capricho',
    showChoice: 'Ver opciones',
    pairs: 'Combinan bien',
    pairsIntro: 'Productos que resulta práctico elegir juntos',
    waterPair: 'Fuente y filtros', waterPairCopy: 'Agua fresca y filtros de recambio',
    treatPair: 'Churu y alfombrilla', treatPairCopy: 'Reparte el premio sobre la superficie en relieve',
    litterPair: 'Arenero y arena', litterPairCopy: 'Dos básicos para la higiene diaria',
    fountainName: 'Fuente', filtersName: 'Filtros', churuName: 'Churu', matName: 'Alfombrilla', litterBoxName: 'Arenero', litterName: 'Arena',
    home: 'Para la vida en casa',
    homeIntro: 'Espacios de descanso y objetos para jugar',
    catConcept: 'Arenero, cama y rascador en un solo producto',
    tunnel: 'Un túnel para jugar y rascar',
    toys: 'Juguetes pequeños para cada día',
    viewProduct: 'Ver producto',
    all: 'Toda la selección', allIntro: 'Todos los productos elegidos en un solo lugar',
    filters: [
      ['all', 'Todo'], ['dry', 'Pienso seco'], ['wet', 'Comida húmeda'],
      ['treats', 'Premios'], ['water', 'Fuentes y filtros'],
      ['hygiene', 'Areneros y arena'], ['home', 'Juegos y hogar']
    ],
    more: 'Mostrar más'
  },
  uk: {
    title: 'Добірка для котів',
    intro: 'Ми вибрали корм, ласощі та речі для дому, з яких зручно почати',
    foodLead: 'Корм для дорослих стерилізованих котів. Почніть з упаковки 1,8 кг',
    fountainLead: 'Бездротовий фонтан на 3 л з датчиком руху. Поставте його там, де коту зручно пити',
    foodLink: 'Переглянути корм', fountainLink: 'Переглянути поїлку',
    filterCompanion: 'Змінні фільтри',
    start: 'З чого почати',
    startIntro: 'Виберіть те, що підходить вашому коту',
    sterilised: 'Для стерилізованого кота', sterilisedCopy: 'Сухий корм на щодень',
    kitten: 'Для кошеняти', kittenCopy: 'Раціон за віком',
    wet: 'Вологий корм', wetCopy: 'На щодень',
    treats: 'Ласощі', treatsCopy: 'Невелике частування',
    showChoice: 'Переглянути варіанти',
    pairs: 'Добре разом',
    pairsIntro: 'Речі, які зручно вибирати парою',
    waterPair: 'Поїлка й фільтри', waterPairCopy: 'Фонтан для води та запас змінних фільтрів',
    treatPair: 'Churu й килимок', treatPairCopy: 'Ласощі можна розподілити по рельєфній поверхні',
    litterPair: 'Лоток і наповнювач', litterPairCopy: 'Дві речі для щоденного догляду',
    fountainName: 'Поїлка', filtersName: 'Фільтри', churuName: 'Churu', matName: 'Килимок', litterBoxName: 'Лоток', litterName: 'Наповнювач',
    home: 'Для життя вдома',
    homeIntro: 'Місця для відпочинку та речі для гри',
    catConcept: 'Лоток, лежанка й дряпка в одному предметі',
    tunnel: 'Тунель, у якому можна гратися й точити кігті',
    toys: 'Невеликі іграшки для щоденних ігор',
    viewProduct: 'До товару',
    all: 'Уся добірка', allIntro: 'Усі вибрані товари в одному місці',
    filters: [
      ['all', 'Усе'], ['dry', 'Сухий корм'], ['wet', 'Вологий корм'],
      ['treats', 'Ласощі'], ['water', 'Поїлки й фільтри'],
      ['hygiene', 'Лотки й наповнювачі'], ['home', 'Ігри й дім']
    ],
    more: 'Показати ще'
  }
};

const imageSrc = product => product?.image?.src || (typeof product?.image === 'string' ? product.image : '');

function groupsFor(product) {
  const groups = [];
  if (wetIds.has(product.id)) groups.push('wet');
  else if (product.category === 'Корм') groups.push('dry');
  else if (product.category === 'Лакомства') groups.push('treats');
  else if (product.category === 'Миски и поилки') groups.push('water');
  else if (product.category === 'Наполнитель') groups.push('hygiene');
  else groups.push('home');
  if (sterilisedIds.has(product.id)) groups.push('sterilised');
  if (kittenIds.has(product.id)) groups.push('kitten');
  return groups.join(' ');
}

export function catPickLanding(list, { crumbs, card, icon, escape }, language = 'ru') {
  const t = copy[language] || copy.ru;
  const byId = new Map(list.map(product => [product.id, product]));
  const get = id => byId.get(id);
  const img = (product, className = '') => product && imageSrc(product)
    ? `<img class="${className}" src="${escape(imageSrc(product))}" alt="${escape(product.name)}" loading="lazy" decoding="async">` : '';
  const link = (product, label) => `<a href="${escape(productHref(product.id))}">${escape(label)} ${icon('arrow')}</a>`;
  const mainFood = get('leonardo-light');
  const fountain = get('heybopet-hb-pwfs-s30s');
  const filters = get('heybopet-pwf-filters-3');
  const fountainImage = imageSrc(fountain?.variants?.find(variant => variant.id.endsWith('-white'))) || imageSrc(fountain);
  const starts = [
    { key: 'sterilised', title: t.sterilised, detail: t.sterilisedCopy, product: get('leonardo-light') || get('rc-sterilised') },
    { key: 'kitten', title: t.kitten, detail: t.kittenCopy, product: get('rc-kitten-regular') },
    { key: 'wet', title: t.wet, detail: t.wetCopy, product: get('leonardo-wet-pure-chicken') },
    { key: 'treats', title: t.treats, detail: t.treatsCopy, product: get('tc-4e50c58957') }
  ].filter(item => item.product);
  const pairs = [
    { title: t.waterPair, detail: t.waterPairCopy, first: fountain, second: filters, firstLabel: t.fountainName, secondLabel: t.filtersName },
    { title: t.treatPair, detail: t.treatPairCopy, first: get('tc-4e50c58957'), second: get('yagu-7515988'), firstLabel: t.churuName, secondLabel: t.matName },
    { title: t.litterPair, detail: t.litterPairCopy, first: get('yagu-9235036'), second: get('yagu-7514697-studio'), firstLabel: t.litterBoxName, secondLabel: t.litterName }
  ].filter(pair => pair.first && pair.second);
  const home = [
    { product: get('yagu-9235036'), detail: t.catConcept },
    { product: get('yagu-7515817'), detail: t.tunnel },
    { product: get('yagu-7514629'), detail: t.toys }
  ].filter(item => item.product);

  return `<div class="page shortcut-page cat-picks-page">${crumbs(t.title)}
    <header class="cat-picks-intro">
      <h1>${escape(t.title)}</h1><p>${escape(t.intro)}</p>
      <nav class="shortcut-tabs" aria-label="${escape(t.title)}">
        <a href="#/picks/cat" aria-current="page">${language === 'es' ? 'Gatos' : language === 'uk' ? 'Для котів' : 'Для кошек'}</a>
        <a href="#/picks/dog">${language === 'es' ? 'Perros' : language === 'uk' ? 'Для собак' : 'Для собак'}</a>
      </nav>
    </header>
    <section class="cat-picks-featured" aria-label="${escape(t.title)}">
      ${mainFood ? `<article class="cat-pick-lead cat-pick-lead-food">
        <div class="cat-pick-lead-copy"><h2>${escape(mainFood.name)}</h2><p>${escape(t.foodLead)}</p>${link(mainFood, t.foodLink)}</div>
        ${img(mainFood, 'cat-pick-lead-image')}
      </article>` : ''}
      ${fountain ? `<article class="cat-pick-lead cat-pick-lead-water">
        <div class="cat-pick-lead-copy"><h2>${escape(fountain.name)}</h2><p>${escape(t.fountainLead)}</p>${link(fountain, t.fountainLink)}</div>
        <img class="cat-pick-lead-image" src="${escape(fountainImage)}" alt="${escape(fountain.name)}" loading="lazy" decoding="async">
        ${filters ? `<a class="cat-pick-companion" href="${escape(productHref(filters.id))}">${img(filters)}<span>${escape(t.filterCompanion)} ${icon('arrow')}</span></a>` : ''}
      </article>` : ''}
    </section>
    <section class="cat-pick-section cat-pick-start" aria-labelledby="cat-pick-start-title">
      <div class="cat-pick-section-head"><h2 id="cat-pick-start-title">${escape(t.start)}</h2><p>${escape(t.startIntro)}</p></div>
      <div class="cat-pick-start-grid">${starts.map(item => `<button type="button" class="cat-pick-start-card" data-cat-pick-filter="${item.key}" data-cat-pick-jump aria-label="${escape(t.showChoice)}: ${escape(item.title)}"><span class="cat-pick-start-copy"><strong>${escape(item.title)}</strong><small>${escape(item.detail)}</small><span class="cat-pick-start-cue">${icon('arrow')}</span></span>${img(item.product)}</button>`).join('')}</div>
    </section>
    <section class="cat-pick-section cat-pick-pairs" aria-labelledby="cat-pick-pairs-title">
      <div class="cat-pick-section-head"><h2 id="cat-pick-pairs-title">${escape(t.pairs)}</h2><p>${escape(t.pairsIntro)}</p></div>
      <div class="cat-pick-pairs-grid">${pairs.map(pair => `<article class="cat-pick-pair"><div class="cat-pick-pair-copy"><h3>${escape(pair.title)}</h3><p>${escape(pair.detail)}</p></div><div class="cat-pick-pair-photos">${img(pair.first)}${img(pair.second)}</div><div class="cat-pick-pair-links">${link(pair.first, pair.firstLabel)}${link(pair.second, pair.secondLabel)}</div></article>`).join('')}</div>
    </section>
    <section class="cat-pick-section cat-pick-home" aria-labelledby="cat-pick-home-title">
      <div class="cat-pick-section-head"><h2 id="cat-pick-home-title">${escape(t.home)}</h2><p>${escape(t.homeIntro)}</p></div>
      <div class="cat-pick-home-grid">${home.map((item, index) => `<article class="cat-pick-home-card ${index === 0 ? 'cat-pick-home-main' : ''}"><div><h3>${escape(item.product.name)}</h3><p>${escape(item.detail)}</p>${link(item.product, t.viewProduct)}</div>${img(item.product)}</article>`).join('')}</div>
    </section>
    <section class="cat-pick-section cat-pick-catalog" id="cat-pick-products" aria-labelledby="cat-pick-catalog-title" data-active-filter="all" data-visible-count="12">
      <div class="cat-pick-section-head"><h2 id="cat-pick-catalog-title">${escape(t.all)} <span>${list.length}</span></h2><p>${escape(t.allIntro)}</p></div>
      <div class="cat-pick-filters" role="group" aria-label="${escape(t.all)}">${t.filters.map(([key, label]) => `<button type="button" data-cat-pick-filter="${key}" aria-pressed="${key === 'all'}">${escape(label)}</button>`).join('')}</div>
      <div class="product-grid cat-pick-product-grid">${list.map((product, index) => `<div class="cat-pick-product" data-cat-pick-groups="${groupsFor(product)}" ${index >= 12 ? 'hidden' : ''}>${card(product)}</div>`).join('')}</div>
      <button type="button" class="cat-pick-more" data-cat-pick-more ${list.length <= 12 ? 'hidden' : ''}>${escape(t.more)} ${icon('arrow')}</button>
    </section>
  </div>`;
}

export function handleCatPickClick(event) {
  const button = event.target.closest('[data-cat-pick-filter], [data-cat-pick-more]');
  const page = button?.closest('.cat-picks-page');
  const catalog = page?.querySelector('.cat-pick-catalog');
  if (!catalog) return false;
  if (button.hasAttribute('data-cat-pick-filter')) {
    catalog.dataset.activeFilter = button.dataset.catPickFilter;
    catalog.dataset.visibleCount = '12';
  } else {
    catalog.dataset.visibleCount = String(Number(catalog.dataset.visibleCount || 12) + 12);
  }
  const active = catalog.dataset.activeFilter;
  const visibleCount = Number(catalog.dataset.visibleCount || 12);
  let matches = 0;
  for (const item of catalog.querySelectorAll('.cat-pick-product')) {
    const included = active === 'all' || item.dataset.catPickGroups.split(' ').includes(active);
    item.hidden = !included || matches >= visibleCount;
    if (included) matches++;
  }
  for (const filter of catalog.querySelectorAll('[data-cat-pick-filter]')) {
    filter.setAttribute('aria-pressed', String(filter.dataset.catPickFilter === active));
  }
  catalog.querySelector('[data-cat-pick-more]').hidden = matches <= visibleCount;
  if (button.hasAttribute('data-cat-pick-jump')) {
    catalog.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  return true;
}
