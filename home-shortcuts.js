import { canBuy, snapshots } from './variants.js';
import { catPickLanding } from './cat-picks.js?v=picks-seo-20261112';
import { pickHref } from './seo-picks.js';

// Editorial order follows the planned first assortment, not inferred sales popularity.
export const homeShortcutIds = {
  cat: [
    'leonardo-light',
    'tc-4e50c58957',
    'rc-sterilised',
    'acana-homestead',
    'leonardo-fresh-salmon',
    'tc-0707caf730',
    'rc-kitten-regular',
    'orijen-kitten',
    'leonardo-wet-pure-chicken',
    'tc-768abf17c2',
    'rc-wet',
    'acana-pacifica',
    'tc-dc3d6d94c2',
    'royalcanin-93e8aeca',
    'cmd-source-694e05cdc1b2582c',
    'orijen-original',
    'orijen-six-fish',
    'orijen-guardian8',
    'leonardo-wet-kitten',
    'heybopet-hb-pwfs-s30s',
    'heybopet-pwf-filters-3',
    'yagu-2170004',
    'yagu-7514697-studio',
    'yagu-2170014',
    'yagu-2170001',
    'yagu-9235036',
    'yagu-9235121',
    'yagu-9235142',
    'yagu-7515817',
    'yagu-7517019',
    'yagu-7514629',
    'yagu-7514626',
    'yagu-7514968-studio',
    'yagu-7515988',
    'yagu-donut-neutral',
    'yagu-misi-pana',
    'yagu-sorolla-backpack',
    'yagu-7515812',
    'yagu-7552371',
    'yagu-M0295-studio'
  ],
  dog: [
    'cmd-source-f025a9dbc9d479c7',
    'dog-orijen-original',
    'royal-canin-chihuahua-adult',
    'cmd-source-11acbc9ed4d69f1c',
    'cmd-source-0f4a3ef9889b8ff3',
    'cmd-source-puppy-small-breed',
    'yagu-7515987-studio',
    'yagu-duvo-cotton-bone-xs',
    'dog-duvo-huggi-rabbit',
    'dog-mp-sensibowl-slomo',
    'yagu-7571307-studio',
    'dog-yagu-harness-blue'
  ]
};

const shortcutTags = {
  'cmd-source-f025a9dbc9d479c7': { ru: 'Для взрослых собак', es: 'Para perros adultos', uk: 'Для дорослих собак' },
  'cmd-source-11acbc9ed4d69f1c': { ru: 'Для щенков', es: 'Para cachorros', uk: 'Для цуценят' },
  'cmd-source-puppy-small-breed': { ru: 'Для щенков мелких пород', es: 'Para cachorros de razas pequeñas', uk: 'Для цуценят малих порід' }
};

export function homeShortcutProducts(products, pet) {
  const byId = new Map(products.map(product => [product.id, product]));
  return (homeShortcutIds[pet] || []).map(id => byId.get(id))
    .filter(product => product && !product.catalogHidden && product.pet === pet &&
      snapshots(product).some(canBuy));
}

export function homeShortcuts(products, icon, escape, language = 'ru') {
  const cards = {
    ru: [
      { pet: 'cat', title: 'Наш выбор для кошек', description: 'Корм, лакомства, поилки и игры для кошек', brands: 'Leonardo · Churu · Royal Canin · ACANA · HeyboPet' },
      { pet: 'dog', title: 'Наш выбор для собак', description: 'Корм, миски и игрушки для собак', brands: 'ACANA · ORIJEN · Royal Canin · Duvo+' }
    ],
    es: [
      { pet: 'cat', title: 'Nuestra selección para gatos', description: 'Pienso, premios, fuentes y juegos para gatos', brands: 'Leonardo · Churu · Royal Canin · ACANA · HeyboPet' },
      { pet: 'dog', title: 'Nuestra selección para perros', description: 'Pienso, comederos y juguetes para perros', brands: 'ACANA · ORIJEN · Royal Canin · Duvo+' }
    ],
    uk: [
      { pet: 'cat', title: 'Наш вибір для котів', description: 'Корм, ласощі, поїлки та ігри для котів', brands: 'Leonardo · Churu · Royal Canin · ACANA · HeyboPet' },
      { pet: 'dog', title: 'Наш вибір для собак', description: 'Корм, миски й іграшки для собак', brands: 'ACANA · ORIJEN · Royal Canin · Duvo+' }
    ]
  }[language] || [];
  const label = { ru: 'Подборка CatManDog', es: 'Selección CatManDog', uk: 'Добірка CatManDog' }[language];
  const action = { ru: 'Посмотреть товары', es: 'Ver productos', uk: 'Переглянути товари' }[language];
  const landmark = { ru: 'Подборки товаров', es: 'Selecciones de productos', uk: 'Добірки товарів' }[language];
  return `<section class="editorial-promos home-shortcuts" aria-label="${landmark}">
    ${cards.map(({ pet, title, description, brands }) => {
      const list = homeShortcutProducts(products, pet);
      const lead = list[0];
      const image = lead?.image?.src || lead?.image;
      return `<a class="editorial-promo shortcut-${pet}" href="${language === 'es' ? pickHref(pet) : `#/picks/${pet}`}">
        ${image ? `<img class="shortcut-image" src="${escape(image)}" alt="${escape(lead.image?.alt || lead.name)}" loading="lazy">` : ''}
        <div class="promo-copy"><span class="direction-label">${label}</span><h2>${title}</h2>
          <p>${description}</p><span class="shortcut-brands">${brands}</span>
          <span class="promo-link">${action} ${icon('arrow')}</span>
        </div>
      </a>`;
    }).join('')}
  </section>`;
}

export function homeShortcutLanding(products, pet, helpers) {
  if (!homeShortcutIds[pet]) return '';
  const { crumbs, card, icon } = helpers;
  const list = homeShortcutProducts(products, pet);
  if (pet === 'cat') return catPickLanding(list, helpers, helpers.language);
  const language = helpers.language || 'ru';
  const words = {
    ru: { title: 'Подборка для собак', intro: 'Корм для взрослых собак и щенков, миски и вещи для игр', eyebrow: 'Подборка CatManDog', cats: 'Для кошек', dogs: 'Для собак', all: 'Весь каталог', nav: 'Подборки для питомцев' },
    es: { title: 'Selección para perros', intro: 'Pienso para perros adultos y cachorros, comederos y juguetes', eyebrow: 'Selección CatManDog', cats: 'Gatos', dogs: 'Perros', all: 'Todo el catálogo', nav: 'Selecciones para mascotas' },
    uk: { title: 'Добірка для собак', intro: 'Корм для дорослих собак і цуценят, миски та речі для гри', eyebrow: 'Добірка CatManDog', cats: 'Для котів', dogs: 'Для собак', all: 'Увесь каталог', nav: 'Добірки для улюбленців' }
  }[language];
  const title = words.title;
  const catHref = language === 'es' ? pickHref('cat') : '#/picks/cat';
  const dogHref = language === 'es' ? pickHref('dog') : '#/picks/dog';
  return `<div class="page shortcut-page">${crumbs(title)}
    <div class="shortcut-intro"><span class="eyebrow">${words.eyebrow}</span><h1 class="page-title">${title}</h1>
      <p class="lead">${words.intro}</p><nav class="shortcut-tabs" aria-label="${words.nav}">
        <a href="${catHref}">${words.cats}</a>
        <a href="${dogHref}" aria-current="page">${words.dogs}</a>
      </nav></div>
    <section class="section shortcut-products" aria-label="${title}">
      <div class="product-grid">${list.map(product => card(shortcutTags[product.id] && !product.tag
        ? { ...product, tag: shortcutTags[product.id][language] } : product)).join('')}</div>
      <a class="text-link shortcut-all" href="${language === 'es' ? `/catalogo?pet=${pet}` : `/#/catalog?pet=${pet}`}">${words.all} ${icon('arrow')}</a>
    </section>
  </div>`;
}
