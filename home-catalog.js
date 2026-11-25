import { canBuy, confirmedPrice, snapshots } from './variants.js?v=delivery-status-3';

// Manual order for the unfiltered cat shelf on the homepage.
export const homeCatOrder = new Map([
  ['tc-4e50c58957', null],
  ['yagu-7515988', null],
  ['rc-sterilised', null],
  ['cat-litter-yommy-tofu-lavanda-6l', 'cat-litter-yommy-tofu-verde-6l-pack'],
  ['royalcanin-93e8aeca', null],
  ['heybopet-hb-pwfs-s30s', 'heybopet-hb-pwfs-s30s-white'],
  ['acana-first-feast', null],
  ['yagu-7517019', null],
  ['orijen-original', null],
  ['heybopet-pwf-filters-3', null],
  ['leonardo-wet-pure-chicken', null],
  ['yagu-donut-neutral', 'yagu-1127352'],
  ['yagu-2170001', null],
  ['rc-kitten-regular', null],
  ['yagu-7515817', null],
  ['tc-0707caf730', null],
  ['leonardo-light', null],
  ['yagu-9235038', null],
  ['yagu-7514697-studio', null],
  ['yagu-7514629', null],
  ['rc-wet', null],
  ['yagu-donut-pana', 'yagu-1128036'],
  ['cats-atelier-sh-w-f60-g', null],
  ['yagu-7515812', 'yagu-7515812-catalog-pack']
]);

export const homeDogOrder = new Map([
  ['cmd-source-f025a9dbc9d479c7', 'cmd-source-sku-056ca5c0a341fff1'],
  ['yagu-7570678-studio', null],
  ['yagu-7515987-studio', null],
  ['yagu-gulliver-pana-green', 'yagu-1128082'],

  ['dog-orijen-original', 'dog-orijen-original-6-'],
  ['yagu-7516214-studio', null],
  ['yagu-duvo-cotton-bone-xs', 'yagu-7516254-studio'],
  ['yagu-7510074-studio', null],

  ['cmd-source-11acbc9ed4d69f1c', 'cmd-source-sku-f5abb44131a44a05'],
  ['churu-dog-chicken', 'churu-dog-chicken-reference-pack'],
  ['yagu-7571307-studio', null],
  ['dog-mp-sensibowl-slomo', null],

  ['royal-canin-chihuahua-adult', 'royal-canin-chihuahua-adult-3kg'],
  ['yagu-7570675-studio', null],
  ['dog-yagu-harness-blue', null],
  ['dog-yagu-donut-turquoise', null],

  ['dog-orijen-six-fish', 'dog-orijen-six-fish-6-'],
  ['churu-dog-salmon-bites', null],
  ['yagu-7571313-studio', null],
  ['yagu-1126845-studio', null],

  ['cmd-source-39c2d5db76be47f7', 'cmd-source-sku-e8da119abc72f104'],
  ['yagu-7570677-studio', null],
  ['dog-duvo-huggi-rabbit', null],
  ['yagu-1126841-studio', null]
]);

export function homeFeaturedVariant(product, order) {
  const id = order.get(product.id);
  return id ? snapshots(product).find(sku => sku.id === id && canBuy(sku)) : undefined;
}

export function prioritizeHomeShelf(pet, products, order) {
  const byId = new Map(products.map(product => [product.id, product]));
  const featured = [];
  for (const [id, variantId] of order) {
    const product = byId.get(id);
    if (!product || !(variantId ? homeFeaturedVariant(product, order) : snapshots(product).some(canBuy))) continue;
    featured.push(product);
    byId.delete(id);
  }
  const available = [];
  const unavailable = [];
  for (const product of byId.values()) {
    const shelf = snapshots(product).some(canBuy) ? available : unavailable;
    shelf.push(product);
  }
  return [...featured, ...interleaveHomeGroups(pet, available), ...unavailable];
}

const definitions = [
  ['dry-food', 'Сухой корм'],
  ['wet-food', 'Влажный корм'],
  ['treats', 'Лакомства'],
  ['litter', 'Наполнители'],
  ['trays', 'Лотки'],
  ['toys', 'Игрушки и аксессуары'],
  ['bowls', 'Миски'],
  ['drinkers', 'Поилки'],
  ['feeders', 'Автокормушки'],
  ['food-prep', 'Приготовление корма'],
  ['carriers', 'Переноски'],
  ['windows', 'Окна и балконы'],
  ['care', 'Уход'],
  ['gifts', 'Подарочные наборы']
];

export const homeGroups = definitions.map(([id, label]) => ({ id, label }));
const groupLabels = new Map(definitions);
const catOnly = new Set(['litter', 'trays', 'windows']);

export const matchesPet = (product, pet) => product.pet === pet || product.pet === 'both';

export function homeGroupForProduct(product) {
  const name = product.name || '';
  switch (product.category) {
    case 'Корм': return product.foodType === 'dry' ? 'dry-food' : product.foodType === 'wet' ? 'wet-food' : 'other-food';
    case 'Лакомства': return 'treats';
    case 'Наполнитель': return /лопатк|лоток|совок/i.test(name) ? 'trays' : 'litter';
    case 'Лотки': return 'trays';
    case 'Лотки и гигиена': return 'trays';
    case 'Игрушки и аксессуары': return 'toys';
    case 'Миски и поилки':
      if (/автокормуш|кормушк|\bfeeder\b/i.test(name)) return 'feeders';
      if (/приготовлени[яе] корма/i.test(name)) return 'food-prep';
      if (/миска|тарелк|\bbowl\b|comedero|sensibowl/i.test(name)) return 'bowls';
      return 'drinkers';
    case 'Переноски': return 'carriers';
    case 'Окна и балконы': return 'windows';
    case 'Уход': return 'care';
    case 'Подарочные наборы': return 'gifts';
    default: return `category:${product.category}`;
  }
}

export function interleaveHomeGroups(pet, products) {
  const groups = homeGroupsForPet(pet, products).map(group =>
    products.filter(product => homeGroupForProduct(product) === group.id)
  );
  const ordered = [];
  for (let i = 0; groups.some(group => group[i]); i++) {
    for (const group of groups) {
      if (group[i]) ordered.push(group[i]);
    }
  }
  return ordered;
}

export function homeGroupsForPet(pet, products) {
  const available = new Set(products.filter(product => matchesPet(product, pet)).map(homeGroupForProduct));
  const known = homeGroups.filter(group => available.has(group.id) && (pet === 'cat' || !catOnly.has(group.id)));
  const extra = [...available].filter(id => !groupLabels.has(id)).map(id => ({
    id,
    label: id === 'other-food' ? 'Другой корм' : id.slice('category:'.length)
  }));
  return [...known, ...extra];
}

const textOf = product => `${product.name || ''} ${product.tag || ''} ${product.description || ''}`;
const featureDefinitions = {
  'dry-food': [
    ['sterilized', 'Для стерилизованных', product => /sterili|стерилиз/i.test(textOf(product))],
    ['kitten', 'Для котят', product => /kitten|котят|котён|котен|щенк|puppy/i.test(textOf(product))],
    ['grain-free', 'Без зерна', product => product.segment === 'grain-free' || /grain.free|беззернов/i.test(textOf(product))]
  ],
  'wet-food': [
    ['sterilized', 'Для стерилизованных', product => /sterili|стерилиз/i.test(textOf(product))],
    ['kitten', 'Для котят', product => /kitten|котят|котён|котен|щенк|puppy/i.test(textOf(product))],
    ['veterinary', 'Ветеринарный рацион', product => product.segment === 'veterinary' || /veterinary|ветеринарн/i.test(textOf(product))]
  ],
  litter: [
    ['clumping', 'Комкующийся', product => /комкующ/i.test(textOf(product))],
    ['plant', 'Растительный', product => /растительн/i.test(textOf(product))],
    ['absorbent', 'Впитывающий', product => /впитывающ/i.test(textOf(product))]
  ],
  trays: [
    ['automatic', 'Автоматические', product => /автоматич|smart.*litter/i.test(textOf(product))],
    ['closed', 'Закрытые', product => /закрыт/i.test(textOf(product))],
    ['scoop', 'Лопатки', product => /лопатк|scoop/i.test(textOf(product))]
  ],
  drinkers: [
    ['fountain', 'Фонтаны', product => /фонтан|fountain/i.test(textOf(product))],
    ['filters', 'Сменные фильтры', product => /фильтр|filter/i.test(product.name || '')]
  ],
  feeders: [
    ['camera', 'С камерой', product => /с камерой/i.test(product.name || '')],
    ['no-camera', 'Без камеры', product => /без камеры/i.test(product.name || '')]
  ]
};

export function homeFeatureOptions(groupId, products) {
  return (featureDefinitions[groupId] || [])
    .filter(([, , matches]) => products.some(matches))
    .map(([id, label]) => ({ id, label }));
}

export function matchesHomeFeature(product, groupId, featureId) {
  if (!featureId) return true;
  const feature = (featureDefinitions[groupId] || []).find(([id]) => id === featureId);
  return !!feature && feature[2](product);
}

export function homePriceOptions(products) {
  const amounts = products.map(product => Math.min(...snapshots(product).filter(canBuy).map(variant => confirmedPrice(variant) ?? Infinity)));
  return [3, 5, 10, 20, 30, 50, 100, 200].filter(limit => amounts.some(amount => amount <= limit) && amounts.some(amount => amount > limit && Number.isFinite(amount)));
}

export function matchesHomePrice(product, maxPrice) {
  if (!maxPrice) return true;
  const limit = Number(maxPrice);
  return Number.isFinite(limit) && snapshots(product).some(variant => canBuy(variant) && (confirmedPrice(variant) ?? Infinity) <= limit);
}
