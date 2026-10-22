import { canBuy, confirmedPrice, snapshots } from './variants.js';

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
