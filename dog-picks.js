import { productHref } from './seo-products.js';
import { pickHref } from './seo-picks.js';

const wetIds = new Set(['dog-ownat-wetline-chicken', 'dog-nutriplus-wet-lamb']);
const puppyIds = new Set(['cmd-source-11acbc9ed4d69f1c', 'cmd-source-puppy-small-breed', 'dog-orijen-puppy']);
const walkIds = new Set(['yagu-1126841-studio', 'yagu-1126845-studio']);

const copy = {
  ru: {
    title: 'Подборка для собак', intro: 'Корм, лакомства и вещи для прогулок, игр и отдыха',
    foodLead: 'Корм с ягнёнком для собак всех пород. Здесь показан большой мешок 11,4 кг',
    bedLead: 'Лежанка с бортиком в сером и бежевом цвете',
    foodLink: 'Посмотреть корм 11,4 кг', bedLink: 'Посмотреть лежанку',
    start: 'С чего начать', startIntro: 'Подберите еду и лакомства под привычки вашей собаки',
    adult: 'Для взрослой собаки', adultCopy: 'Большой мешок на каждый день',
    puppy: 'Для щенка', puppyCopy: 'Рацион по возрасту',
    wet: 'Влажный корм', wetCopy: 'Дополнение к сухому корму',
    treats: 'Лакомства', treatsCopy: 'То, что можно грызть',
    showChoice: 'Посмотреть варианты',
    pairs: 'Хорошо вместе', pairsIntro: 'Полезные сочетания для еды, игры и прогулки',
    bowlPair: 'Корм и миска', bowlPairCopy: 'Большой мешок корма и миска для медленного кормления',
    matPair: 'Churu и коврик', matPairCopy: 'Кремовое лакомство можно распределить по рельефной поверхности',
    walkPair: 'Шлейка и поводок', walkPairCopy: 'Два аксессуара одной серии для прогулок',
    foodName: 'Корм', bowlName: 'Миска', churuName: 'Churu', matName: 'Коврик', harnessName: 'Шлейка', leadName: 'Поводок',
    home: 'Для игр и отдыха', homeIntro: 'Лежанка и игрушки, которые хочется выбрать для дома',
    bed: 'Лежанка с бортиком в двух спокойных цветах', rabbit: 'Мягкая игрушка для совместной игры', bull: 'Тканевая игрушка, которую удобно носить в зубах',
    viewProduct: 'К товару',
    all: 'Вся подборка', allIntro: 'Все выбранные товары для собак в одном месте',
    filters: [
      ['all', 'Все'], ['dry', 'Сухой корм'], ['wet', 'Влажный корм'],
      ['treats', 'Лакомства'], ['feeding', 'Для кормления'],
      ['walk', 'Для прогулок'], ['home', 'Игры и отдых']
    ], more: 'Показать ещё'
  },
  es: {
    title: 'Selección para perros', intro: 'Pienso, premios y objetos para pasear, jugar y descansar',
    foodLead: 'Pienso con cordero para perros de todas las razas. Aquí mostramos el saco de 11,4 kg',
    bedLead: 'Cama con borde en gris y beige',
    foodLink: 'Ver pienso de 11,4 kg', bedLink: 'Ver la cama',
    start: 'Por dónde empezar', startIntro: 'Elige comida y premios según los hábitos de tu perro',
    adult: 'Para perros adultos', adultCopy: 'Un saco grande para cada día',
    puppy: 'Para cachorros', puppyCopy: 'Alimento según su edad',
    wet: 'Comida húmeda', wetCopy: 'Para combinar con el pienso',
    treats: 'Premios', treatsCopy: 'Para masticar',
    showChoice: 'Ver opciones',
    pairs: 'Combinan bien', pairsIntro: 'Combinaciones útiles para comer, jugar y pasear',
    bowlPair: 'Pienso y comedero', bowlPairCopy: 'Un saco grande y un comedero de alimentación lenta',
    matPair: 'Churu y alfombrilla', matPairCopy: 'Reparte el premio cremoso sobre la superficie en relieve',
    walkPair: 'Arnés y correa', walkPairCopy: 'Dos accesorios de la misma serie para pasear',
    foodName: 'Pienso', bowlName: 'Comedero', churuName: 'Churu', matName: 'Alfombrilla', harnessName: 'Arnés', leadName: 'Correa',
    home: 'Para jugar y descansar', homeIntro: 'Una cama y juguetes para disfrutar en casa',
    bed: 'Cama con borde en dos colores discretos', rabbit: 'Peluche para jugar juntos', bull: 'Juguete de tela fácil de llevar en la boca',
    viewProduct: 'Ver producto',
    all: 'Toda la selección', allIntro: 'Todos los productos elegidos para perros en un solo lugar',
    filters: [
      ['all', 'Todo'], ['dry', 'Pienso seco'], ['wet', 'Comida húmeda'],
      ['treats', 'Premios'], ['feeding', 'Para comer'],
      ['walk', 'Para pasear'], ['home', 'Juego y descanso']
    ], more: 'Mostrar más'
  },
  uk: {
    title: 'Добірка для собак', intro: 'Корм, ласощі та речі для прогулянок, ігор і відпочинку',
    foodLead: 'Корм із ягням для собак усіх порід. Тут показано великий мішок 11,4 кг',
    bedLead: 'Лежанка з бортиком у сірому та бежевому кольорах',
    foodLink: 'Переглянути корм 11,4 кг', bedLink: 'Переглянути лежанку',
    start: 'З чого почати', startIntro: 'Виберіть їжу та ласощі за звичками вашого собаки',
    adult: 'Для дорослого собаки', adultCopy: 'Великий мішок на щодень',
    puppy: 'Для цуценяти', puppyCopy: 'Раціон за віком',
    wet: 'Вологий корм', wetCopy: 'Доповнення до сухого корму',
    treats: 'Ласощі', treatsCopy: 'Те, що можна гризти',
    showChoice: 'Переглянути варіанти',
    pairs: 'Добре разом', pairsIntro: 'Корисні поєднання для їжі, гри та прогулянки',
    bowlPair: 'Корм і миска', bowlPairCopy: 'Великий мішок корму та миска для повільного годування',
    matPair: 'Churu й килимок', matPairCopy: 'Кремові ласощі можна розподілити по рельєфній поверхні',
    walkPair: 'Шлейка й повідець', walkPairCopy: 'Два аксесуари однієї серії для прогулянок',
    foodName: 'Корм', bowlName: 'Миска', churuName: 'Churu', matName: 'Килимок', harnessName: 'Шлейка', leadName: 'Повідець',
    home: 'Для ігор і відпочинку', homeIntro: 'Лежанка та іграшки для дому',
    bed: 'Лежанка з бортиком у двох спокійних кольорах', rabbit: 'Мʼяка іграшка для спільної гри', bull: 'Тканинна іграшка, яку зручно носити в зубах',
    viewProduct: 'До товару',
    all: 'Уся добірка', allIntro: 'Усі вибрані товари для собак в одному місці',
    filters: [
      ['all', 'Усе'], ['dry', 'Сухий корм'], ['wet', 'Вологий корм'],
      ['treats', 'Ласощі'], ['feeding', 'Для годування'],
      ['walk', 'Для прогулянок'], ['home', 'Ігри та відпочинок']
    ], more: 'Показати ще'
  }
};

const imageSrc = product => product?.image?.src || (typeof product?.image === 'string' ? product.image : '');

function groupsFor(product) {
  const groups = [];
  if (wetIds.has(product.id)) groups.push('wet');
  else if (product.category === 'Корм') groups.push('dry');
  else if (product.category === 'Лакомства') groups.push('treats');
  else if (product.category === 'Миски и поилки') groups.push('feeding');
  else if (walkIds.has(product.id)) groups.push('walk');
  else groups.push('home');
  if (puppyIds.has(product.id)) groups.push('puppy');
  else if (product.category === 'Корм' && !wetIds.has(product.id)) groups.push('adult');
  return groups.join(' ');
}

export function dogPickLanding(list, { crumbs, card, icon, escape }, language = 'ru') {
  const t = copy[language] || copy.ru;
  const catHref = language === 'es' ? pickHref('cat') : '#/picks/cat';
  const dogHref = language === 'es' ? pickHref('dog') : '#/picks/dog';
  const byId = new Map(list.map(product => [product.id, product]));
  const get = id => byId.get(id);
  const img = (product, className = '') => product && imageSrc(product)
    ? `<img class="${className}" src="${escape(imageSrc(product))}" alt="${escape(product.name)}" loading="lazy" decoding="async">` : '';
  const link = (product, label) => `<a href="${escape(productHref(product.id))}">${escape(label)} ${icon('arrow')}</a>`;
  const mainFood = get('cmd-source-0f4a3ef9889b8ff3');
  const mainVariant = mainFood?.variants?.find(variant => variant.id === 'acana-grass-fed-lamb-11-4kg');
  const mainFoodImage = mainVariant ? { ...mainFood, image: mainVariant.image } : mainFood;
  const mainHref = mainFood && mainVariant ? `${productHref(mainFood.id)}?variant=${encodeURIComponent(mainVariant.id)}` : mainFood && productHref(mainFood.id);
  const bed = get('yagu-cosmo-pana-ancha-t2');
  const starts = [
    { key: 'adult', title: t.adult, detail: t.adultCopy, product: mainFood, image: mainFoodImage },
    { key: 'puppy', title: t.puppy, detail: t.puppyCopy, product: get('cmd-source-11acbc9ed4d69f1c') },
    { key: 'wet', title: t.wet, detail: t.wetCopy, product: get('dog-ownat-wetline-chicken') },
    { key: 'treats', title: t.treats, detail: t.treatsCopy, product: get('yagu-7516214-studio') }
  ].filter(item => item.product);
  const pairs = [
    { title: t.bowlPair, detail: t.bowlPairCopy, first: mainFoodImage, second: get('dog-mp-sensibowl-slomo'), firstLabel: t.foodName, secondLabel: t.bowlName },
    { title: t.matPair, detail: t.matPairCopy, first: get('churu-dog-chicken'), second: get('yagu-7515987-studio'), firstLabel: t.churuName, secondLabel: t.matName },
    { title: t.walkPair, detail: t.walkPairCopy, first: get('yagu-1126841-studio'), second: get('yagu-1126845-studio'), firstLabel: t.harnessName, secondLabel: t.leadName }
  ].filter(pair => pair.first && pair.second);
  const home = [
    { product: bed, detail: t.bed },
    { product: get('dog-duvo-huggi-rabbit'), detail: t.rabbit },
    { product: get('yagu-7571307-studio'), detail: t.bull }
  ].filter(item => item.product);

  return `<div class="page shortcut-page cat-picks-page dog-picks-page">${crumbs(t.title)}
    <header class="cat-picks-intro">
      <h1>${escape(t.title)}</h1><p>${escape(t.intro)}</p>
      <nav class="shortcut-tabs" aria-label="${escape(t.title)}">
        <a href="${catHref}">${language === 'es' ? 'Gatos' : language === 'uk' ? 'Для котів' : 'Для кошек'}</a>
        <a href="${dogHref}" aria-current="page">${language === 'es' ? 'Perros' : 'Для собак'}</a>
      </nav>
    </header>
    <section class="cat-picks-featured" aria-label="${escape(t.title)}">
      ${mainFood ? `<article class="cat-pick-lead cat-pick-lead-food">
        <div class="cat-pick-lead-copy"><h2>${escape(mainFood.name)}</h2><p>${escape(t.foodLead)}</p><a href="${escape(mainHref)}">${escape(t.foodLink)} ${icon('arrow')}</a></div>
        ${mainVariant ? img({ name: `${mainFood.name} 11,4 кг`, image: mainVariant.image }, 'cat-pick-lead-image') : img(mainFood, 'cat-pick-lead-image')}
      </article>` : ''}
      ${bed ? `<article class="cat-pick-lead cat-pick-lead-water">
        <div class="cat-pick-lead-copy"><h2>${escape(bed.name)}</h2><p>${escape(t.bedLead)}</p>${link(bed, t.bedLink)}</div>
        ${img(bed, 'cat-pick-lead-image')}
      </article>` : ''}
    </section>
    <section class="cat-pick-section cat-pick-start" aria-labelledby="dog-pick-start-title">
      <div class="cat-pick-section-head"><h2 id="dog-pick-start-title">${escape(t.start)}</h2><p>${escape(t.startIntro)}</p></div>
      <div class="cat-pick-start-grid">${starts.map(item => `<button type="button" class="cat-pick-start-card" data-cat-pick-filter="${item.key}" data-cat-pick-jump aria-label="${escape(t.showChoice)}: ${escape(item.title)}"><span class="cat-pick-start-copy"><strong>${escape(item.title)}</strong><small>${escape(item.detail)}</small><span class="cat-pick-start-cue">${icon('arrow')}</span></span>${img(item.image || item.product)}</button>`).join('')}</div>
    </section>
    <section class="cat-pick-section cat-pick-pairs" aria-labelledby="dog-pick-pairs-title">
      <div class="cat-pick-section-head"><h2 id="dog-pick-pairs-title">${escape(t.pairs)}</h2><p>${escape(t.pairsIntro)}</p></div>
      <div class="cat-pick-pairs-grid">${pairs.map(pair => `<article class="cat-pick-pair"><div class="cat-pick-pair-copy"><h3>${escape(pair.title)}</h3><p>${escape(pair.detail)}</p></div><div class="cat-pick-pair-photos">${img(pair.first)}${img(pair.second)}</div><div class="cat-pick-pair-links">${link(pair.first, pair.firstLabel)}${link(pair.second, pair.secondLabel)}</div></article>`).join('')}</div>
    </section>
    <section class="cat-pick-section cat-pick-home" aria-labelledby="dog-pick-home-title">
      <div class="cat-pick-section-head"><h2 id="dog-pick-home-title">${escape(t.home)}</h2><p>${escape(t.homeIntro)}</p></div>
      <div class="cat-pick-home-grid">${home.map((item, index) => `<article class="cat-pick-home-card ${index === 0 ? 'cat-pick-home-main' : ''}"><div><h3>${escape(item.product.name)}</h3><p>${escape(item.detail)}</p>${link(item.product, t.viewProduct)}</div>${img(item.product)}</article>`).join('')}</div>
    </section>
    <section class="cat-pick-section cat-pick-catalog" id="dog-pick-products" aria-labelledby="dog-pick-catalog-title" data-active-filter="all" data-visible-count="12">
      <div class="cat-pick-section-head"><h2 id="dog-pick-catalog-title">${escape(t.all)} <span>${list.length}</span></h2><p>${escape(t.allIntro)}</p></div>
      <div class="cat-pick-filters" role="group" aria-label="${escape(t.all)}">${t.filters.map(([key, label]) => `<button type="button" data-cat-pick-filter="${key}" aria-pressed="${key === 'all'}">${escape(label)}</button>`).join('')}</div>
      <div class="product-grid cat-pick-product-grid">${list.map((product, index) => `<div class="cat-pick-product" data-cat-pick-groups="${groupsFor(product)}" ${index >= 12 ? 'hidden' : ''}>${card(product.id === mainFood?.id ? mainFoodImage : product)}</div>`).join('')}</div>
      <button type="button" class="cat-pick-more" data-cat-pick-more ${list.length <= 12 ? 'hidden' : ''}>${escape(t.more)} ${icon('arrow')}</button>
    </section>
  </div>`;
}
