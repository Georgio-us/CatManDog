const image = '/media/churu-dog-2026-11-11/churu-dog-chicken-pack4.webp';
const source = 'https://www.albet.es/churu-dog-receta-de-pollo-12x4x14gr';

const firstProduct = {
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
  supplierPurchase: { cartonPriceExVat: 21.12, packsPerCarton: 12,
    unitPriceExVat: 1.76, recommendedCartonExVat: 35.89,
    sourceDate: '2026-11-11' },
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
};

// Albet quotes purchase cartons before IVA. The retail price below is the
// recommended PVP per sealed consumer pack, including the 10% IVA for snacks.
const formats = {
  pack4: { label: '4 тюбика × 14 г', packWeightKg: 0.056, packsPerCarton: 12,
    wholesaleCarton: 21.12, recommendedCarton: 35.89, retail: 3.29,
    tag: 'Кремовые лакомства', line: 'Churu DOG · 4 × 14 г' },
  pack8: { label: '8 тюбиков × 20 г', packWeightKg: 0.16, packsPerCarton: 8,
    wholesaleCarton: 25.68, recommendedCarton: 43.56, retail: 5.99,
    tag: 'Кремовые лакомства', line: 'Churu DOG · 8 × 20 г' },
  bites: { label: '8 порций × 12 г', packWeightKg: 0.096, packsPerCarton: 8,
    wholesaleCarton: 30.72, recommendedCarton: 48.73, retail: 6.70,
    tag: 'Мягкие лакомства', line: 'Churu Bites DOG · 8 × 12 г' }
};

const choices = [
  { id: 'tuna', taste: 'курица с тунцом', pack4: ['940301',
    'https://www.albet.es/churu-dog-receta-de-pollo-y-atun-12x4x14gr'],
  pack8: ['940351', 'https://www.albet.es/churu-dog-receta-de-pollo-y-atun-8x8x20gr',
    '8859387701121'],
  bites: ['940401', 'https://www.albet.es/bites-pollo-atun-churu-dog-snacks-perros'] },
  { id: 'salmon', taste: 'курица с лососем', pack4: ['940302',
    'https://www.albet.es/churu-dog-receta-de-pollo-y-salmon-12x4x14gr'],
  pack8: ['940352', 'https://www.albet.es/churu-dog-receta-de-pollo-y-salmon-8x8x20gr',
    '8859387701138'],
  bites: ['940402', 'https://www.albet.es/bites-pollo-salmon-churu-dog-snacks-perros',
    '8859387701343'] },
  { id: 'cheese', taste: 'курица с сыром', pack4: ['940303',
    'https://www.albet.es/churu-dog-receta-de-pollo-y-queso-12x4x14gr'],
  pack8: ['940353', 'https://www.albet.es/churu-dog-receta-de-pollo-y-queso-8x8x20gr'],
  bites: ['940403', 'https://www.albet.es/bites-pollo-queso-churu-dog-snacks-perros'] },
  { id: 'chicken', taste: 'курица',
  pack8: ['940350', 'https://www.albet.es/churu-dog-receta-de-pollo-8x8x20gr',
    '8859387701114'],
  bites: ['940400', 'https://www.albet.es/bites-pollo-churu-dog-snacks-perros',
    '8859387701329'] }
];

const makeProduct = (choice, formatId) => {
  const format = formats[formatId];
  const [sku, url, ean] = choice[formatId];
  const id = `churu-dog-${choice.id}-${formatId}`;
  const image = `/media/churu-dog-2026-11-11/${id}.webp`;
  const title = formatId === 'bites' ? 'Churu Bites DOG' : 'Churu DOG';
  const name = `${title} - ${choice.taste}, ${format.label}`;
  const description = formatId === 'bites'
    ? `Мягкие кусочки с кремовой начинкой, вкус ${choice.taste}, 8 порций по 12 г`
    : `Кремовое лакомство для собак со вкусом ${choice.taste}, ${format.label}`;
  const supplier = { name: 'Albet', sku, url };
  const purchase = {
    cartonPriceExVat: format.wholesaleCarton,
    packsPerCarton: format.packsPerCarton,
    unitPriceExVat: format.wholesaleCarton / format.packsPerCarton,
    recommendedCartonExVat: format.recommendedCarton,
    sourceDate: '2026-11-11'
  };
  return {
    id, name, brand: 'Churu', category: 'Лакомства', pet: 'dog',
    isReal: true, tag: format.tag, line: format.line,
    description, details: [format.label, 'Для собак'],
    image: { src: image, alt: name, presentation: 'editorial' },
    supplier, supplierPurchase: purchase,
    defaultVariantId: `${id}-pack`,
    variants: [{ id: `${id}-pack`, label: format.label, ean: ean || null,
      price: format.retail, priceStatus: 'confirmed',
      purchasePrice: purchase.unitPriceExVat, purchasePriceStatus: 'confirmed',
      purchasePriceTaxIncluded: false, supplierPurchase: purchase,
      availabilityStatus: 'source_on_demand', packageWeightKg: format.packWeightKg,
      image: { src: image, alt: name, presentation: 'editorial' },
      supplier }]
  };
};

export const churuDogProducts = [firstProduct,
  ...choices.flatMap(choice => Object.keys(formats)
    .filter(formatId => choice[formatId])
    .map(formatId => makeProduct(choice, formatId)))];
