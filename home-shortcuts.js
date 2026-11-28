import { canBuy, snapshots } from './variants.js';
import { catPickLanding } from './cat-picks.js?v=mobile-cards-20261115';
import { dogPickLanding } from './dog-picks.js?v=mobile-cards-20261115';

// Editorial order follows the planned first assortment, not inferred sales popularity.
export const homeShortcutIds = {
  cat: [
    'leonardo-light',
    'tc-4e50c58957',
    'heybopet-hb-pwfs-s30s',
    'leonardo-wet-pure-chicken',
    'yagu-7514697-studio',
    'yagu-7517019',
    'rc-kitten-regular',
    'heybopet-pwf-filters-3',
    'tc-0707caf730',
    'rc-sterilised',
    'yagu-7515817',
    'acana-homestead',
    'leonardo-fresh-salmon',
    'orijen-kitten',
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
    'yagu-2170004',
    'yagu-2170014',
    'yagu-2170001',
    'yagu-9235036',
    'yagu-9235121',
    'yagu-9235142',
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
    'yagu-7571307-studio',
    'yagu-cosmo-pana-ancha-t2',
    'dog-orijen-original',
    'churu-dog-chicken',
    'yagu-1126841-studio',
    'dog-mp-sensibowl-slomo',
    'cmd-source-11acbc9ed4d69f1c',
    'dog-ownat-wetline-chicken',
    'yagu-1126845-studio',
    'yagu-7515987-studio',
    'cmd-source-f025a9dbc9d479c7',
    'royal-canin-chihuahua-adult',
    'cmd-source-3b6cbf7e0c31efab',
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
    'dog-duvo-huggi-rabbit'
  ]
};

export function homeShortcutProducts(products, pet) {
  const byId = new Map(products.map(product => [product.id, product]));
  return (homeShortcutIds[pet] || []).map(id => byId.get(id))
    .filter(product => product && !product.catalogHidden && product.pet === pet &&
      snapshots(product).some(canBuy));
}

const homePromotionCopy = {
  ru: {
    label: 'Подарки и идеи для дома',
    comingSoon: 'Скоро',
    giftTitle: 'Новогодний домик для кота',
    giftDescription: 'Пачка Churu, маленькая игрушка и два пауча влажного корма',
    atelierTitle: 'Больше места для прыжков',
    atelierDescription: 'Полки, ступеньки и мостики для стен и балкона, чтобы кот мог лазать, прыгать и отдыхать наверху',
    atelierAction: 'Смотреть Cat’s Atelier',
  },
  es: {
    label: 'Regalos e ideas para casa',
    comingSoon: 'Próximamente',
    giftTitle: 'Casita navideña para tu gato',
    giftDescription: 'Un paquete de Churu, un juguete pequeño y dos sobres de comida húmeda',
    atelierTitle: 'Más espacio para saltar',
    atelierDescription: 'Baldas, escalones y puentes para paredes y balcones, para que tu gato trepe, salte y descanse en las alturas',
    atelierAction: 'Ver Cat’s Atelier',
  },
  uk: {
    label: 'Подарунки та ідеї для дому',
    comingSoon: 'Незабаром',
    giftTitle: 'Новорічний будиночок для кота',
    giftDescription: 'Пачка Churu, маленька іграшка та два паучі вологого корму',
    atelierTitle: 'Більше місця для стрибків',
    atelierDescription: 'Полиці, сходинки та містки для стін і балкона, щоб кіт міг лазити, стрибати й відпочивати нагорі',
    atelierAction: 'Переглянути Cat’s Atelier',
  },
};

export function homePromotions(icon, language) {
  const copy = homePromotionCopy[language] ?? homePromotionCopy.ru;
  const atelierHref = '/catalogo?q=' + encodeURIComponent('Cat’s Atelier');

  return `<section class="editorial-promos home-shortcuts" aria-label="${copy.label}">
    <article class="editorial-promo promo-holiday">
      <div class="promo-copy">
        <span class="direction-label">${copy.comingSoon}</span>
        <h2>${copy.giftTitle}</h2>
        <p>${copy.giftDescription}</p>
      </div>
    </article>
    <a class="editorial-promo promo-atelier" href="${atelierHref}">
      <img class="shortcut-image" src="https://img.catmandog.es/assets/cats-atelier/SH-M-DA100-studio-v2.webp" alt="" loading="lazy">
      <div class="promo-copy">
        <span class="direction-label">Cat’s Atelier</span>
        <h2>${copy.atelierTitle}</h2>
        <p>${copy.atelierDescription}</p>
        <span class="promo-link">${copy.atelierAction} ${icon('arrow')}</span>
      </div>
    </a>
  </section>`;
}

export function homeShortcutLanding(products, pet, helpers) {
  if (!homeShortcutIds[pet]) return '';
  const list = homeShortcutProducts(products, pet);
  if (pet === 'cat') return catPickLanding(list, helpers, helpers.language);
  if (pet === 'dog') return dogPickLanding(list, helpers, helpers.language);
  return '';
}
