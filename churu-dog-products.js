const image = '/media/churu-dog-2026-11-11/churu-dog-chicken-pack4.webp';
const source = 'https://www.albet.es/churu-dog-receta-de-pollo-12x4x14gr';

export const churuDogProducts = [{
  id: 'churu-dog-chicken',
  name: 'Churu DOG - курица',
  brand: 'Churu',
  category: 'Лакомства',
  pet: 'dog',
  isReal: true,
  tag: 'Кремовые лакомства',
  line: 'Churu DOG · 4 × 14 г',
  optionLabel: 'Формат',
  selectionGroup: 'creamy',
  description: 'Кремовое лакомство с курицей для собак в четырёх запечатанных тюбиках',
  details: ['Для собак', 'Курица в составе', 'Четыре тюбика по 14 г'],
  image: { src: image, alt: 'Churu DOG с курицей - пачка из четырёх тюбиков',
    presentation: 'editorial' },
  supplier: { name: 'Albet', sku: '940300', url: source },
  defaultVariantId: 'churu-dog-chicken-reference-pack',
  variants: [{
    id: 'churu-dog-chicken-reference-pack',
    label: '4 × 14 г',
    ean: '8859387701060',
    price: 3.29,
    priceStatus: 'confirmed',
    availabilityStatus: 'source_on_demand',
    packageWeightKg: 0.056,
    image: { src: image, alt: 'Churu DOG с курицей - пачка из четырёх тюбиков',
      presentation: 'editorial' },
    supplier: { name: 'Albet', sku: '940300', url: source }
  }]
}];
