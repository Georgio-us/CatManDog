import { canBuy, snapshots } from './variants.js';
import { catPickLanding } from './cat-picks.js?v=picks-seo-20261112';
import { dogPickLanding } from './dog-picks.js?v=dog-editorial-20261113';
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
    'cmd-source-0f4a3ef9889b8ff3',
    'yagu-7516214-studio',
    'cmd-source-f025a9dbc9d479c7',
    'cmd-source-11acbc9ed4d69f1c',
    'royal-canin-chihuahua-adult',
    'churu-dog-chicken',
    'yagu-7515987-studio',
    'dog-mp-sensibowl-slomo',
    'cmd-source-3b6cbf7e0c31efab',
    'dog-orijen-original',
    'cmd-source-classics-red-meat',
    'cmd-source-classics-wild-coast',
    'cmd-source-acana-senior',
    'cmd-source-67755e1e1068c6f6',
    'cmd-source-puppy-small-breed',
    'dog-orijen-puppy',
    'dog-orijen-small-breed',
    'dog-orijen-six-fish',
    'dog-rc-mini-adult',
    'dog-rc-medium-adult',
    'dog-rc-maxi-adult',
    'dog-ownat-ultra-medium',
    'dog-ownat-gf-prime',
    'dog-ownat-wetline-chicken',
    'dog-nutriplus-wet-lamb',
    'churu-dog-tuna-pack4',
    'churu-dog-salmon-pack4',
    'churu-dog-chicken-bites',
    'churu-dog-tuna-bites',
    'yagu-40BW230-studio',
    'yagu-7570675-studio',
    'yagu-7570677-studio',
    'yagu-7570651-studio',
    'yagu-7570678-studio',
    'yagu-duvo-cotton-bone-xs',
    'dog-duvo-huggi-rabbit',
    'yagu-7571307-studio',
    'yagu-cosmo-pana-ancha-t2',
    'yagu-1126841-studio',
    'yagu-1126845-studio'
  ]
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
      { pet: 'dog', title: 'Наш выбор для собак', description: 'Корм, жевательные лакомства и вещи для игр', brands: 'ACANA · ORIJEN · Royal Canin · Duvo+' }
    ],
    es: [
      { pet: 'cat', title: 'Nuestra selección para gatos', description: 'Pienso, premios, fuentes y juegos para gatos', brands: 'Leonardo · Churu · Royal Canin · ACANA · HeyboPet' },
      { pet: 'dog', title: 'Nuestra selección para perros', description: 'Pienso, premios para masticar y juguetes para perros', brands: 'ACANA · ORIJEN · Royal Canin · Duvo+' }
    ],
    uk: [
      { pet: 'cat', title: 'Наш вибір для котів', description: 'Корм, ласощі, поїлки та ігри для котів', brands: 'Leonardo · Churu · Royal Canin · ACANA · HeyboPet' },
      { pet: 'dog', title: 'Наш вибір для собак', description: 'Корм, жувальні ласощі та речі для гри', brands: 'ACANA · ORIJEN · Royal Canin · Duvo+' }
    ]
  }[language] || [];
  const label = { ru: 'Подборка CatManDog', es: 'Selección CatManDog', uk: 'Добірка CatManDog' }[language];
  const action = { ru: 'Посмотреть товары', es: 'Ver productos', uk: 'Переглянути товари' }[language];
  const landmark = { ru: 'Подборки товаров', es: 'Selecciones de productos', uk: 'Добірки товарів' }[language];
  return `<section class="editorial-promos home-shortcuts" aria-label="${landmark}">
    ${cards.map(({ pet, title, description, brands }) => {
      const list = homeShortcutProducts(products, pet);
      const lead = list[0];
      const leadVariant = pet === 'dog' && lead?.variants?.find(variant => variant.id === 'acana-grass-fed-lamb-11-4kg');
      const image = leadVariant?.image?.src || lead?.image?.src || lead?.image;
      const imageAlt = leadVariant?.image?.alt || lead?.image?.alt || lead?.name;
      return `<a class="editorial-promo shortcut-${pet}" href="${language === 'es' ? pickHref(pet) : `#/picks/${pet}`}">
        ${image ? `<img class="shortcut-image" src="${escape(image)}" alt="${escape(imageAlt)}" loading="lazy">` : ''}
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
  const list = homeShortcutProducts(products, pet);
  if (pet === 'cat') return catPickLanding(list, helpers, helpers.language);
  if (pet === 'dog') return dogPickLanding(list, helpers, helpers.language);
  return '';
}
