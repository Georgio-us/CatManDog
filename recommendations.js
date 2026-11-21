import { homeGroupForProduct } from './home-catalog.js?v=delivery-status-3';
import { canBuy, snapshots } from './variants.js?v=delivery-status-3';

const foodGroups = new Set(['dry-food', 'wet-food']);
const ingestibleGroups = new Set(['dry-food', 'wet-food', 'treats']);
const compatibleWith = new Map([
  ['yagu-7815320', ['yagu-7845778']]
]);

const atelierWoodCovers = {
  'SH-W-A60':'CO-W-A60', 'SH-W-A60-G':'CO-W-A60',
  'SH-F-60':'CO-W-F60', 'SH-W-F60-G':'CO-W-F60',
  'SH-W-F75':'CO-W-F75', 'SH-W-F75-G':'CO-W-F75',
  'SH-W-W95-UL':'CO-W-95', 'SH-W-W95-UR':'CO-W-95'
};
const atelierStepShelves = {
  'ST-MB-F':['SH-M-A60','SH-M-W75-SL'],
  'ST-WB-F':['SH-W-A60','SH-W-F75'],
  'RD-ST':['SH-M-A60','SH-W-A60']
};

function atelierRecommendations(product, catalog, cartIds, limit) {
  const sku = product.manufacturerSku;
  const index = new Map(catalog.filter(item => item.brand === 'Cat’s Atelier')
    .map(item => [item.manufacturerSku, item]));
  const planned = [];
  const add = (code, reason) => { if (code && code !== sku && !planned.some(item => item.code === code)) planned.push({ code, reason }); };
  const shelf = sku.startsWith('SH-');
  if (shelf) {
    const metal = sku.startsWith('SH-M-');
    const length = sku.match(/(?:60|75|95|100)(?=-|$)/)?.[0];
    const cover = metal ? `CO-M-${length}` : atelierWoodCovers[sku];
    const mattress = length && (metal || length === '60' || length === '95')
      ? `MA-${metal ? 'M' : 'W'}-${length}` : null;
    add(mattress, 'Сменный матрас для этой полки');
    add(cover, 'Сменный чехол для этой полки');
    if (product.productType === 'wall') add(metal ? 'ST-MB-F' : 'ST-WB-F', 'Ступенька для подъёма к полке');
  } else if (atelierStepShelves[sku]) {
    for (const code of atelierStepShelves[sku]) add(code, 'Полка для маршрута по стене');
  } else if (sku.startsWith('CO-') || sku.startsWith('MA-')) {
    const matchingShelves = [...index.values()].filter(item => item.manufacturerSku?.startsWith('SH-'));
    const sameMaterialAndLength = candidate => {
      const length = sku.match(/(?:60|75|95|100)$/)?.[0];
      return length && candidate.manufacturerSku?.match(/(?:60|75|95|100)(?=-|$)/)?.[0] === length;
    };
    const exactCover = candidate => atelierWoodCovers[candidate.manufacturerSku] === sku ||
      (sku.startsWith('CO-M-') && candidate.manufacturerSku?.startsWith('SH-M-') && sameMaterialAndLength(candidate));
    const similarMattress = candidate => sku.startsWith('MA-') &&
      candidate.manufacturerSku?.startsWith(`SH-${sku[3]}-`) && sameMaterialAndLength(candidate);
    const match = matchingShelves.find(candidate => exactCover(candidate) || similarMattress(candidate));
    add(match?.manufacturerSku, 'Полка той же серии');
  }
  return planned.map(({code,reason}) => ({ product:index.get(code), reason }))
    .filter(item => item.product && !cartIds.has(item.product.id) && available(item.product))
    .slice(0,limit);
}

const text = product => `${product.name || ''} ${product.tag || ''} ${product.segment || ''}`.toLocaleLowerCase('ru');
const brand = product => (product.brand || '').toLocaleLowerCase('ru').trim();
const stage = value => /kitten|котят|котен|котён/i.test(value) ? 'kitten'
  : /puppy|щен/i.test(value) ? 'puppy'
  : /senior|пожил|старш/i.test(value) ? 'senior'
  : /adult|взросл/i.test(value) ? 'adult' : 'unknown';
const needPatterns = [
  ['medical', /renal|почеч|urinary|мочев/i],
  ['sensitive', /gastro|digest|пищевар|sensitive|чувствитель|hypoallerg|гипоаллерг/i],
  ['sterilised', /sterili|стерилиз/i],
  ['hairball', /hairball|шерст/i],
  ['grain-free', /grain.free|беззернов/i]
];
const specialNeeds = value => needPatterns.filter(([, pattern]) => pattern.test(value)).map(([need]) => need);
const veterinary = product => product.segment === 'veterinary' || /prescription diet|veterinary diet|ветеринарн|ветдиет/i.test(text(product));
const profile = product => ({ stage: stage(text(product)), needs: specialNeeds(text(product)), veterinary: veterinary(product) });
const samePet = (a, b) => a.pet === b.pet || b.pet === 'both';
const available = product => product.isReal === true && !product.catalogHidden && snapshots(product).some(canBuy);
const isFilter = product => /фильтр|filter/i.test(product.name || '');
const isScoop = product => /лопатк|совок|scoop/i.test(product.name || '');
const isAutomaticTray = product => /автоматич|smart.*litter/i.test(product.name || '');
const isLickMat = product => /коврик для вылизывания|lick.*mat/i.test(product.name || '');
const isEdibleCare = product => /паста|масло|пробиотик|порошок|снек|трава|malt|bites|flor/i.test(product.name || '');
const isRestOrWalk = product => /лежанк|cuna|cama|arnés|шлейк|harness/i.test(product.name || '');
const approvedCareFor = (candidate, product) => (candidate.recommendation?.veterinaryCompatibleWith || []).includes(product.id);
const toyType = product => isLickMat(product) ? 'lick-mat'
  : /когтеточк|башня|scratcher/i.test(product.name || '') ? 'scratcher'
  : /бандан|шапоч|ошейник|шлейк/i.test(product.name || '') ? 'wearable' : 'toy';

function foodFits(candidate, context) {
  const target = profile(candidate);
  if (target.veterinary || target.needs.includes('medical')) return false;
  if (!context) return target.stage !== 'kitten' && target.stage !== 'puppy' && target.needs.length === 0;
  if (context.veterinary || context.needs.includes('medical')) return false;
  if (context.stage === 'kitten' || context.stage === 'puppy' || context.stage === 'senior') {
    if (target.stage !== context.stage) return false;
  } else if (target.stage === 'kitten' || target.stage === 'puppy' || target.stage === 'senior') return false;
  return context.needs.length === target.needs.length && context.needs.every(need => target.needs.includes(need));
}

function treatFits(candidate, context) {
  if (veterinary(candidate) || context?.veterinary || context?.needs.some(need => ['medical', 'sensitive'].includes(need))) return false;
  const targetStage = stage(text(candidate));
  if (context?.stage === 'kitten' || context?.stage === 'puppy') return targetStage === context.stage;
  return targetStage !== 'kitten' && targetStage !== 'puppy';
}

function slotsFor(product, group, cartFood) {
  const slot = (group, reason, filter = () => true) => ({ group, reason, filter });
  const toy = candidate => toyType(candidate) !== toyType(product);
  switch (group) {
    case 'dry-food': return [
      slot('wet-food', 'Влажный корм к этому рациону'),
      slot('dry-food', 'Ещё сухой корм этого бренда', candidate => brand(candidate) === brand(product)),
      slot('treats', 'Лакомство для вашего питомца'),
      ...((veterinary(product) || specialNeeds(text(product)).includes('medical'))
        ? [slot('care', 'Уход к особому рациону', candidate => approvedCareFor(candidate, product))] : []),
      slot('bowls', 'Миска для кормления'),
      slot('drinkers', 'Вода рядом с кормлением', candidate => !isFilter(candidate))
    ];
    case 'wet-food': return [
      slot('dry-food', 'Сухой корм к этому рациону'),
      slot('wet-food', 'Ещё влажный корм этого бренда', candidate => brand(candidate) === brand(product)),
      slot('treats', 'Лакомство для вашего питомца'),
      ...((veterinary(product) || specialNeeds(text(product)).includes('medical'))
        ? [slot('care', 'Уход к особому рациону', candidate => approvedCareFor(candidate, product))] : []),
      slot('toys', 'Для спокойного кормления', candidate => isLickMat(candidate) && /паштет|pat[eé]|мусс|mousse|крем|creamy/i.test(product.name)),
      slot('bowls', 'Миска для влажного корма')
    ];
    case 'treats': return [
      slot('toys', 'Для подачи лакомства', isLickMat),
      slot('treats', 'Ещё лакомство этого бренда', candidate => brand(candidate) === brand(product)),
      slot('toys', 'Для игры вместе', candidate => toyType(candidate) === 'toy')
    ];
    case 'toys': return isRestOrWalk(product) ? [] : [
      slot('toys', 'Ещё одна игра', toy),
      slot('treats', 'Лакомство для игры'),
      ...(isLickMat(product) ? [slot('wet-food', 'Паштет для коврика', candidate => /паштет|pat[eé]|мусс|mousse|крем|creamy/i.test(candidate.name))] : []),
      slot('toys', 'Другой вариант для игры', candidate => toyType(candidate) === toyType(product))
    ];
    case 'litter': return [
      slot('trays', 'Лоток для наполнителя', candidate => !isScoop(candidate) && !isAutomaticTray(candidate)),
      slot('trays', 'Лопатка для уборки', isScoop)
    ];
    case 'trays': return isScoop(product) ? [
      slot('litter', 'Наполнитель для лотка'),
      slot('trays', 'Лоток для кошки', candidate => !isScoop(candidate) && !isAutomaticTray(candidate))
    ] : isAutomaticTray(product) ? [
      slot('trays', 'Расходник для этого лотка', candidate => (candidate.compatibleWith || compatibleWith.get(candidate.id) || []).includes(product.id))
    ] : [
      slot('litter', 'Наполнитель для лотка'),
      slot('trays', 'Лопатка для уборки', isScoop)
    ];
    case 'bowls': return [
      ...(cartFood && homeGroupForProduct(cartFood) === 'dry-food'
        ? [slot('wet-food', 'Влажный корм к вашей покупке'), slot('dry-food', 'Ещё корм для этой миски')]
        : [slot('dry-food', 'Корм для этой миски'), slot('wet-food', 'Влажный корм для этой миски')]),
      slot('drinkers', 'Вода рядом с кормлением', candidate => !isFilter(candidate))
    ];
    case 'drinkers': return isFilter(product) ? [
      slot('drinkers', 'Поилка для этого фильтра', candidate => (product.compatibleWith || compatibleWith.get(product.id) || []).includes(candidate.id))
    ] : [
      slot('drinkers', 'Фильтр для этой поилки', candidate => isFilter(candidate) && (candidate.compatibleWith || compatibleWith.get(candidate.id) || []).includes(product.id)),
      slot('bowls', 'Миска рядом с поилкой')
    ];
    case 'feeders': return [
      slot('drinkers', 'Поилка к кормушке', candidate => !isFilter(candidate)),
      slot('bowls', 'Дополнительная миска'),
      slot('dry-food', 'Корм для автокормушки')
    ];
    case 'food-prep': return [
      slot('bowls', 'Миска для подачи корма'),
      slot('drinkers', 'Поилка рядом с кормлением', candidate => !isFilter(candidate))
    ];
    case 'windows': return [slot('toys', 'Для игр у окна', candidate => toyType(candidate) === 'toy')];
    case 'care': return [slot('care', 'Дополнение к уходу', candidate => !isEdibleCare(candidate) && !isEdibleCare(product))];
    default: return [];
  }
}

export function recommendForProduct(product, catalog, { cart = [], limit = 4 } = {}) {
  if (!product || !Array.isArray(catalog) || limit < 1) return [];
  const group = homeGroupForProduct(product);
  const cartIds = new Set(cart.map(item => item.productId || item.id));
  if (product.brand === 'Cat’s Atelier' && product.manufacturerSku)
    return atelierRecommendations(product, catalog, cartIds, limit);
  const cartFood = cart.map(item => catalog.find(candidate => candidate.id === (item.productId || item.id)))
    .find(candidate => candidate && foodGroups.has(homeGroupForProduct(candidate)) && samePet(product, candidate));
  const contextFood = ingestibleGroups.has(group) ? product : cartFood;
  const context = contextFood ? profile(contextFood) : null;
  const candidates = catalog.filter(candidate => candidate.id !== product.id && !cartIds.has(candidate.id)
    && samePet(product, candidate) && available(candidate));
  const chosen = [];
  const used = new Set();
  for (const slot of slotsFor(product, group, cartFood)) {
    if (chosen.length >= limit) break;
    const pool = candidates.filter(candidate => !used.has(candidate.id)
      && homeGroupForProduct(candidate) === slot.group && slot.filter(candidate)
      && !(group === 'feeders' && slot.group === 'dry-food' && !contextFood)
      && (!foodGroups.has(slot.group) || foodFits(candidate, context))
      && (slot.group !== 'treats' || treatFits(candidate, context))
      && !(context?.veterinary && (ingestibleGroups.has(slot.group) || (slot.group === 'care' && isEdibleCare(candidate) && !approvedCareFor(candidate, product)))));
    pool.sort((a, b) => {
      const rank = candidate => (brand(candidate) && brand(candidate) === brand(product) ? 100 : 0)
        + (contextFood && brand(candidate) === brand(contextFood) ? 40 : 0)
        + (candidate.segment === 'everyday' ? 15 : 0)
        - (candidate.segment === 'premium' ? 15 : 0)
        + (candidate.isReal ? 3 : 0);
      return rank(b) - rank(a) || a.id.localeCompare(b.id);
    });
    if (pool[0]) {
      chosen.push({ product: pool[0], reason: slot.reason });
      used.add(pool[0].id);
    }
  }
  return chosen;
}
