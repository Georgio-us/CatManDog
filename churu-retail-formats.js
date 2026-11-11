// Retail formats are separate from Albet purchase units. One 940001/3/4/7
// purchase carton contains 12 sealed four-stick packs (48 sticks total).
export const churuRetailFormats = Object.freeze({
  stick: { units: 1, priceCents: 89 },
  pack4: { units: 4, priceCents: 329 },
  carton48: { units: 48, priceCents: 3699 },
  mixedBox20: { units: 20, priceCents: 1449 }
});

const factoryPacks = new Map([
  ['tc-4e50c58957', '940001'],
  ['tc-0707caf730', '940003'],
  ['tc-768abf17c2', '940004'],
  ['tc-dc3d6d94c2', '940007'],
  ['tc-713f42fb9a', '946512'],
  ['churu-dog-chicken', '940300']
]);
const studioBase = '/media/churu-formats-2026-11-05';
const flavorImages = {
  '940001': { stick: 'churu-tuna-stick.webp', carton48: 'churu-tuna-carton48.webp' },
  '940003': { stick: 'churu-chicken-stick.webp', carton48: 'churu-chicken-carton48.webp' },
  '940004': { stick: 'churu-tuna-scallop-stick.webp', carton48: 'churu-tuna-scallop-carton48.webp' },
  '940007': { stick: 'churu-chicken-cheese-stick.webp', carton48: 'churu-chicken-cheese-carton48.webp' },
  '946512': { stick: '/media/churu-kitten-2026-11-11/churu-kitten-chicken-stick.webp',
    carton48: '/media/churu-kitten-2026-11-11/churu-kitten-chicken-carton48.webp' },
  '940300': { stick: '/media/churu-dog-2026-11-11/churu-dog-chicken-stick.webp',
    carton48: '/media/churu-dog-2026-11-11/churu-dog-chicken-carton48.webp' }
};
const formatImage = (code, kind) => {
  const file = flavorImages[code][kind];
  return file.startsWith('/') ? file : `${studioBase}/${file}`;
};
const expandedCopy = {
  '946512': {
    description: 'Кремовое лакомство с курицей для котят в четырёх запечатанных тюбиках',
    details: ['Для котят до одного года', 'Курица в составе', 'Четыре тюбика по 14 г'],
    stickDescription: 'Один запечатанный тюбик Churu Kitten с курицей для котят',
    cartonDescription: 'Короб из 12 закрытых пачек Churu Kitten с курицей, по четыре тюбика в каждой'
  },
  '940300': {
    description: 'Кремовое лакомство с курицей для собак в четырёх запечатанных тюбиках',
    details: ['Для собак', 'Курица в составе', 'Четыре тюбика по 14 г'],
    stickDescription: 'Один запечатанный тюбик Churu DOG с курицей для собак',
    cartonDescription: 'Короб из 12 закрытых пачек Churu DOG с курицей, по четыре тюбика в каждой'
  }
};

const price = cents => cents / 100;
const format = (source, id, label, kind, sourceItemId, units) => ({
  ...source, id, label, weight: label, sizes: [label],
  price: price(churuRetailFormats[kind].priceCents), priceStatus: 'confirmed',
  packageWeightKg: units * 0.014,
  retailFormat: { kind, units, sourceItemId,
    sourceUnitsPerPurchaseUnit: churuPurchaseUnit[sourceItemId.split(':').at(-1)]?.sticks },
  ...(kind === 'pack4' ? {} : { ean: null, productSource: null, imageSource: null }),
  // The studio images illustrate the exact retail format; carton packaging is illustrative.
  ...(kind === 'stick' ? { details: [
    'Один запечатанный тюбик 14 г',
    'Используйте по инструкции на упаковке производителя'
  ], description: 'Один запечатанный тюбик кремового лакомства Churu 14 г' } : kind === 'carton48' ? { details: [
    'В коробе 12 закрытых пачек по 4 тюбика одного вкуса',
    'Всего 48 тюбиков по 14 г',
    'Транспортная коробка на изображении показана условно'
  ], description: '12 закрытых пачек Churu по 4 тюбика 14 г одного вкуса' } : {})
});

export function applyChuruRetailFormats(products) {
  const expanded = products.map(product => {
    const code = factoryPacks.get(product.id);
    if (!code) return product;
    const original = product.variants.find(variant => variant.id === product.defaultVariantId);
    const sourceItemId = `albet-churu-2026-11-03:${code}`;
    const copy = expandedCopy[code];
    const pack = { ...format(original, original.id, '4 тюбика × 14 г', 'pack4', sourceItemId, 4),
      ...(copy ? { availabilityStatus: 'source_on_demand' } : {}),
      ...(copy ? { description: copy.description, details: copy.details } : {}) };
    const stick = { ...format(original, `${product.id}-stick`, '1 тюбик × 14 г', 'stick', sourceItemId, 1),
      image: { src: formatImage(code, 'stick'),
        alt: `${product.name} - один тюбик 14 г` },
      availabilityStatus: copy ? 'source_on_demand' : 'unavailable',
      ...(copy ? { description: copy.stickDescription,
        details: ['Один запечатанный тюбик 14 г', copy.details[0]] } : {}) };
    const carton = { ...format(original, `${product.id}-carton48`, 'Короб 12 пачек × 4 тюбика',
      'carton48', sourceItemId, 48),
      image: { src: formatImage(code, 'carton48'),
        alt: `${product.name} - 12 упаковок по 4 тюбика` },
      availabilityStatus: 'source_on_demand',
      ...(copy ? { description: copy.cartonDescription,
        details: ['12 закрытых пачек по 4 тюбика', 'Всего 48 тюбиков по 14 г',
          'Транспортная коробка на изображении показана условно'] } : {}) };
    return { ...product, price: pack.price, priceStatus: 'confirmed',
      ...(copy ? { description: copy.description, details: copy.details } : {}),
      variants: [pack, stick, carton] };
  });

  const image = 'https://img.catmandog.es/assets/launch-studio-2026-11-04/churu-salmon-pollo-20x14g.webp';
  const productId = 'cmd-source-694e05cdc1b2582c';
  const sourceItemId = 'albet-churu-2026-11-03:949577';
  const base = { name: 'Churu - лосось и курица', brand: 'Churu', category: 'Лакомства',
    pet: 'cat', isReal: true, tag: 'Кремовые лакомства', line: 'Churu · 20 × 14 г',
    description: 'Кремовые лакомства Churu со вкусами лосося и лосося с курицей',
    details: ['В коробе 10 тюбиков с лососем и 10 тюбиков с лососем и курицей',
      'Используйте по инструкции на упаковке производителя'],
    image: { src: image, alt: 'Churu - лосось и курица, короб 20 тюбиков' },
    supplier: { name: 'Albet', sku: '949577', url: 'https://www.albet.es/churu-cat-variedades-salmon-pollo-snack-cremoso-20x14g' },
    availabilityStatus: 'source_on_demand' };
  const box = format(base, 'cmd-source-sku-9c96bc24c8863222',
    'Короб 20 тюбиков × 14 г', 'mixedBox20', sourceItemId, 20);
  const single = (flavor, suffix) => ({ ...format(base, `${productId}-${suffix}-stick`,
    `1 тюбик × 14 г · ${flavor}`, 'stick', sourceItemId, 1),
    image: { src: `${studioBase}/churu-${suffix}-stick.webp`,
      alt: `Churu ${flavor} - один тюбик 14 г` },
    description: `Кремовое лакомство Churu со вкусом ${flavor} в одном тюбике 14 г`,
    availabilityStatus: 'unavailable',
    retailFormat: { kind: 'stick', units: 1, sourceItemId,
      sourceUnitsPerPurchaseUnit: 10 },
    details: [`Один запечатанный тюбик со вкусом ${flavor}`,
      'Используйте по инструкции на упаковке производителя'] });
  expanded.push({ ...base, id: productId, price: box.price, priceStatus: 'confirmed',
    optionLabel: 'Формат', defaultVariantId: box.id, variants: [box,
      single('лосося', 'salmon'), single('лосося с курицей', 'salmon-chicken')] });
  return expanded;
}

export const churuPurchaseUnit = Object.freeze({
  '940001': { sticks: 48, wholesaleCents: 2112 },
  '940003': { sticks: 48, wholesaleCents: 2112 },
  '940004': { sticks: 48, wholesaleCents: 2112 },
  '940007': { sticks: 48, wholesaleCents: 2112 },
  '946512': { sticks: 48, wholesaleCents: 2112 },
  '940300': { sticks: 48, wholesaleCents: 2112 },
  '949577': { sticks: 20, wholesaleCents: 834 }
});

// Physical stock is held in one format at a time. Opening packaging moves it
// between customer SKUs; the selected supplier basket never creates stock.
export function churuRepackOptions(productId) {
  if (factoryPacks.has(productId)) {
    const pack = `${productId}-reference-pack`;
    const stick = `${productId}-stick`;
    const carton = `${productId}-carton48`;
    return [
      { id: 'open-pack', label: 'Открыть пачку - 4 отдельных тюбика',
        from: { id: pack, units: 1 }, to: [{ id: stick, units: 4 }] },
      { id: 'assemble-carton', label: 'Собрать короб из 12 закрытых пачек',
        from: { id: pack, units: 12 }, to: [{ id: carton, units: 1 }] },
      { id: 'open-carton', label: 'Разобрать короб на 12 закрытых пачек',
        from: { id: carton, units: 1 }, to: [{ id: pack, units: 12 }] }
    ];
  }
  if (productId === 'cmd-source-694e05cdc1b2582c') return [
    { id: 'open-mixed-box', label: 'Открыть короб - 10 тюбиков каждого вкуса',
      from: { id: 'cmd-source-sku-9c96bc24c8863222', units: 1 },
      to: [
        { id: `${productId}-salmon-stick`, units: 10 },
        { id: `${productId}-salmon-chicken-stick`, units: 10 }
      ] }
  ];
  return [];
}
