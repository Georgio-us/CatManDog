import { canBuy, snapshots } from './variants.js';

// Editorial order follows the planned first assortment, not inferred sales popularity.
export const homeShortcutIds = {
  cat: [
    'rc-sterilised',
    'tc-4e50c58957',
    'leonardo-light',
    'acana-indoor',
    'royalcanin-93e8aeca',
    'orijen-original'
  ],
  dog: [
    'cmd-source-f025a9dbc9d479c7',
    'dog-orijen-original',
    'royal-canin-chihuahua-adult',
    'cmd-source-11acbc9ed4d69f1c',
    'cmd-source-0f4a3ef9889b8ff3',
    'cmd-source-puppy-small-breed'
  ]
};

export function homeShortcutProducts(products, pet) {
  const byId = new Map(products.map(product => [product.id, product]));
  return (homeShortcutIds[pet] || []).map(id => byId.get(id))
    .filter(product => product && !product.catalogHidden && product.pet === pet &&
      snapshots(product).some(canBuy));
}

export function homeShortcuts(products, icon, escape) {
  const cards = [
    { pet: 'cat', title: 'Наш выбор для кошек', description: 'Корм и лакомства для разных возрастов и привычек', brands: 'Royal Canin · Leonardo · ACANA · Churu' },
    { pet: 'dog', title: 'Наш выбор для собак', description: 'Повседневные рационы, корм для щенков и крупных пород', brands: 'ACANA · ORIJEN · Royal Canin' }
  ];
  return `<section class="editorial-promos home-shortcuts" aria-label="Подборки товаров">
    ${cards.map(({ pet, title, description, brands }) => {
      const list = homeShortcutProducts(products, pet);
      const lead = list[0];
      const image = lead?.image?.src || lead?.image;
      return `<a class="editorial-promo shortcut-${pet}" href="#/picks/${pet}">
        ${image ? `<img class="shortcut-image" src="${escape(image)}" alt="${escape(lead.image?.alt || lead.name)}" loading="lazy">` : ''}
        <div class="promo-copy"><span class="direction-label">Подборка CatManDog</span><h2>${title}</h2>
          <p>${description}</p><span class="shortcut-brands">${brands}</span>
          <span class="promo-link">Посмотреть товары ${icon('arrow')}</span>
        </div>
      </a>`;
    }).join('')}
  </section>`;
}

export function homeShortcutLanding(products, pet, { crumbs, card, icon }) {
  if (!homeShortcutIds[pet]) return '';
  const cat = pet === 'cat';
  const title = cat ? 'Подборка для кошек' : 'Подборка для собак';
  const intro = cat
    ? 'Корм и лакомства для разных возрастов - от повседневного рациона до небольшого угощения'
    : 'Корм для взрослых собак и щенков, разных пород и потребностей';
  const list = homeShortcutProducts(products, pet);
  return `<div class="page shortcut-page">${crumbs(title)}
    <div class="shortcut-intro"><span class="eyebrow">Подборка CatManDog</span><h1 class="page-title">${title}</h1>
      <p class="lead">${intro}</p><nav class="shortcut-tabs" aria-label="Подборки для питомцев">
        <a href="#/picks/cat" ${cat ? 'aria-current="page"' : ''}>Для кошек</a>
        <a href="#/picks/dog" ${!cat ? 'aria-current="page"' : ''}>Для собак</a>
      </nav></div>
    <section class="section shortcut-products" aria-label="${title}">
      <div class="product-grid">${list.map(card).join('')}</div>
      <a class="text-link shortcut-all" href="#/catalog?pet=${pet}">Весь каталог ${icon('arrow')}</a>
    </section>
  </div>`;
}
