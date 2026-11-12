import { churuDogProducts } from '../churu-dog-products.js';

const flavors = {
  tuna: ['pollo y atún', 'курка й тунець'],
  salmon: ['pollo y salmón', 'курка й лосось'],
  cheese: ['pollo y queso', 'курка й сир'],
  chicken: ['pollo', 'курка']
};
const formats = {
  pack4: ['4 tubos × 14 g', '4 тюбики × 14 г'],
  pack8: ['8 tubos × 20 g', '8 тюбиків × 20 г'],
  bites: ['8 porciones × 12 g', '8 порцій × 12 г']
};

const pairs = [["Мягкие лакомства", ["Premios blandos", "М’які ласощі"]],
  [churuDogProducts[0].name, ['Churu DOG - pollo', 'Churu DOG - курка']],
  [churuDogProducts[0].description, [
    'Premio cremoso de pollo para perros en cuatro tubos sellados.',
    'Кремові ласощі з куркою для собак у чотирьох запечатаних тюбиках.'
  ]],
  ...churuDogProducts.slice(1).flatMap(product => {
  const [, , flavorId, formatId] = product.id.split('-');
  const [esFlavor, ukFlavor] = flavors[flavorId];
  const [esFormat, ukFormat] = formats[formatId];
  const bites = formatId === 'bites';
  const brand = bites ? 'Churu Bites DOG' : 'Churu DOG';
  return [
    [product.name, [`${brand} - ${esFlavor}, ${esFormat}`, `${brand} - ${ukFlavor}, ${ukFormat}`]],
    [product.description, [bites
      ? `Bocados blandos con relleno cremoso de ${esFlavor}, ${esFormat}.`
      : `Premio cremoso para perros de ${esFlavor}, ${esFormat}.`,
    bites
      ? `М’які шматочки з кремовою начинкою зі смаком ${ukFlavor}, ${ukFormat}.`
      : `Кремові ласощі для собак зі смаком ${ukFlavor}, ${ukFormat}.`]],
    [product.variants[0].label, [esFormat, ukFormat]]
  ];
  })];

export const churuDogEs = Object.fromEntries(pairs.map(([source, [es]]) => [source, es]));
export const churuDogUk = Object.fromEntries(pairs.map(([source, [, uk]]) => [source, uk]));
export const churuDogUkNames = Object.fromEntries(churuDogProducts.slice(1)
  .map(product => [product.name, churuDogUk[product.name]]));
