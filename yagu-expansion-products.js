// Supplier SKU and retail unit are kept separate from the first physical basket.
// A numeric price is a dated public retail reference, never a Yagu purchase price.
const catalogue = 'https://heyzine.com/flip-book/2fca30a7bd.html';
const supplierUrl = sku => `https://odoo.grupoyagu.com/shop?search=${encodeURIComponent(sku)}`;
const photo = (sku, alt) => ({
  src: `/media/yagu/${sku}-studio-v1.webp`, alt, generated: true,
  presentation: 'editorial', originalSrc: catalogue
});

const retail = {
  '7514968': [18.30, 'MisMascotas', 'https://www.mismascotas.es/collections/gatos?resultsPerPage=99999'],
  M0295: [7.91, 'Menforsan', 'https://menforsan.com/es/champus-para-gatos/241-champu-muy-suave-para-gatos-300ml.html'],
  '7514697': [14.65, 'Endanea', 'https://endaneamascotas.com/juguetes/80488-duvo-bentonita-white-sensitive-black-carbon-12kg-5414365426880.html'],
  '40BW822': [36.93, 'MisMascotas', 'https://www.mismascotas.es/collections/snacks-para-perros?page=7'],
  '1128038': [37.91, 'Complementos para Aves', 'https://complementosparaaves.com/gb/yagu-263?from-xhr=&page=19'],
  '1128044': [37.91, 'Complementos para Aves', 'https://complementosparaaves.com/gb/yagu-263?from-xhr=&page=19'],
  '1127850': [38.90, 'Complementos para Aves', 'https://complementosparaaves.com/gb/yagu-263?from-xhr=&page=19'],
  '1128077': [30.99, 'Guaw', 'https://guaw.com/yagu-cuna-cama-para-perros-gulliver-frida-caqui-turron.html'],
  '1127836': [39.18, 'MisMascotas', 'https://www.mismascotas.es/collections/camas-para-perros?page=2'],
  '7571307': [14.53, 'MisMascotas', 'https://www.mismascotas.es/collections/peluches-para-perros'],
  '7571313': [15.33, 'MisMascotas', 'https://www.mismascotas.es/collections/peluches-para-perros'],
  '1127841': [40.25, 'MisMascotas', 'https://www.mismascotas.es/collections/camas-para-perros?page=2'],
  '7515814': [43.52, 'MisMascotas', 'https://www.mismascotas.es/products/duvo-rascador-gato-tunel-square-beige-30-x-30-x-28-cm-46233?variant=57986184085886'],
  '7515813': [23.76, 'MisMascotas', 'https://www.mismascotas.es/products/duvo-rascador-gato-poste-sole-gris-30-x-30-x-45-cm-46228?variant=57986184020350'],
  '9235150': [39.99, 'Kiwoko', 'https://www.kiwoko.com/gatos/arenas-y-accesorios/areneros/cerrados/moderna-top-cat-arenero/MODAG50_M.html'],
  '1126845': [8.79, 'MisMascotas', 'https://www.mismascotas.es/collections/perros?page=5'],
  '40BW230': [39.24, 'MisMascotas', 'https://www.mismascotas.es/collections/snacks-para-perros?page=7']
};

function snapshot(sku, label, common) {
  const benchmark = retail[sku];
  const amount = benchmark?.[0] ?? null;
  return {
    ...common, id: `yagu-${sku}-studio`, label, sizes: [label],
    price: amount, priceStatus: amount === null ? 'pending' : 'temporary',
    // The supplier's B2B price is recorded privately, not substituted into retail.
    purchasePrice: null, purchasePriceStatus: 'pending',
    availabilityStatus: 'pending',
    ...(benchmark ? { retailPrice: {
      amount, currency: 'EUR', status: 'temporary', type: 'retail',
      sourceName: benchmark[1], sourceUrl: benchmark[2], checkedAt: '2026-11-06',
      taxIncluded: true, shippingIncluded: false
    } } : {}),
    image: photo(sku, `${common.brand} ${sku}`),
    supplier: { name: 'Grupo Yagu', sku, url: supplierUrl(sku) }
  };
}

function family({ id, name, brand = 'Yagu', category = 'Игрушки и аксессуары', pet,
  tag, description, details, optionLabel = 'Вариант', items }) {
  const common = {
    id, name, brand, category, pet, isReal: true, isNew: true, tag,
    line: 'Grupo Yagu', optionLabel, description, details,
    price: null, priceStatus: 'pending', purchasePrice: null,
    purchasePriceStatus: 'pending', availabilityStatus: 'pending',
    productSource: { name: 'Grupo Yagu - каталог 2026', url: catalogue, kind: 'supplier' },
    imageSource: { name: 'Grupo Yagu - каталог 2026', pageUrl: catalogue }
  };
  const variants = items.map(([sku, label]) => snapshot(sku, label, common));
  return {
    ...common, image: variants[0].image, sizes: variants.map(v => v.label),
    supplier: variants[0].supplier, defaultVariantId: variants[0].id, variants
  };
}

const one = (sku, label, spec) => family({ id: `yagu-${sku}-studio`, ...spec, items: [[sku, label]] });

export const yaguExpansionProducts = [
  one('7515987', 'Серый', { name: 'Duvo+ - коврик для вылизывания', brand: 'Duvo+', pet: 'dog', tag: 'Для лакомств',
    description: 'Рельефный коврик для неспешного поедания мягкого лакомства',
    details: ['Серый цвет', 'Для мягких лакомств', 'Очищайте после использования'] }),
  one('7514968', '1 сова, цвет ассорти', { name: 'Duvo+ - электронная сова', brand: 'Duvo+', pet: 'cat', tag: 'Игрушка для кошки',
    description: 'Электронная игрушка-сова для активной игры кошки',
    details: ['Одна игрушка размером 6 × 10 × 13 см', 'Цвет в поставке может отличаться от изображения', 'Игра под присмотром'] }),
  one('M0295', '300 мл', { name: 'Menforsan - мягкий шампунь для кошек', brand: 'Menforsan', category: 'Уход', pet: 'cat', tag: 'Уход за шерстью',
    description: 'Мягкий шампунь для ухода за шерстью кошки', details: ['Флакон 300 мл', 'Применяйте по инструкции производителя'] }),
  family({ id: 'yagu-duvo-cotton-bone-xs', name: 'Duvo+ - хлопковая косточка XS', brand: 'Duvo+', pet: 'dog',
    tag: 'Игрушка для собаки', optionLabel: 'Цвет', description: 'Небольшая хлопковая игрушка-косточка для игры под присмотром',
    details: ['Размер XS', 'Длина 15 см', 'Вес 50 г'], items: [['7516254', 'Голубой'], ['7516245', 'Коричневый']] }),
  one('7514697', '12 кг', { name: 'Duvo+ Black Carbon - наполнитель для кошек', brand: 'Duvo+', category: 'Наполнитель', pet: 'cat', tag: 'Бентонитовый наполнитель',
    description: 'Бентонитовый наполнитель с активированным углём', details: ['Мешок 12 кг', 'Учитывайте вес мешка при доставке'] }),
  one('40BW822', 'Короб 15 × 60 г', { name: 'Bow Wow Immunity - лакомства для собак', brand: 'Bow Wow', category: 'Лакомства', pet: 'dog', tag: 'Лакомства для собак',
    description: 'Короб из 15 отдельных пакетов лакомства по 60 г',
    details: ['Цена указана за короб 15 × 60 г', 'На изображении показан один пакет из короба'] }),
  family({ id: 'yagu-cosmo-pana-ancha-t2', name: 'Yagu Cosmo Pana Ancha T2', pet: 'dog', tag: 'Лежанка с бортиком',
    optionLabel: 'Цвет', description: 'Лежанка для собаки из фактурной ткани с мягким бортиком',
    details: ['Размер 63 × 50 × 16 см', 'Фактурная ткань pana ancha'],
    items: [['1128038', 'Серый'], ['1128044', 'Бежевый']] }),
  one('1127850', 'Серый, T2', { name: 'Yagu Cosmo Antoni', pet: 'dog', tag: 'Лежанка с бортиком',
    description: 'Серая лежанка для собаки с мягким бортиком', details: ['Размер 55 × 46 × 19 см'] }),
  one('1128077', 'Каки и коричневый, T2', { name: 'Yagu Gulliver Frida', pet: 'dog', tag: 'Лежанка с бортиком',
    description: 'Лежанка для собаки в приглушённых оливковых и коричневых тонах', details: ['Размер 55 × 46 × 19 см'] }),
  one('1127836', 'Louise, T2', { name: 'Yagu Gulliver Louise', pet: 'dog', tag: 'Лежанка с бортиком',
    description: 'Текстильная лежанка для собаки с мягким бортиком', details: ['Размер 55 × 46 × 19 см'] }),
  one('7571307', '29 × 29 × 5 см', { name: 'Duvo+ Lona Toro - игрушка для собак', brand: 'Duvo+', pet: 'dog', tag: 'Тканевая игрушка',
    description: 'Тканевая игрушка в форме быка', details: ['Размер 29 × 29 × 5 см', 'Игра под присмотром'] }),
  one('7571313', '21 × 19 × 5 см', { name: 'Duvo+ Lona Búho - игрушка для собак', brand: 'Duvo+', pet: 'dog', tag: 'Тканевая игрушка',
    description: 'Тканевая игрушка в форме совы', details: ['Размер 21 × 19 × 5 см', 'Игра под присмотром'] }),
  one('1127841', '40 × 40 × 40 см', { name: 'Yagu Igloo Compacto Louise', pet: 'cat', tag: 'Домик для кошки',
    description: 'Закрытый мягкий домик для отдыха кошки', details: ['Размер 40 × 40 × 40 см'] }),
  one('9235150', 'Тёмно-серый', { name: 'Moderna Top Cat - закрытый лоток', brand: 'Moderna', category: 'Лотки', pet: 'cat', tag: 'Кошачий лоток',
    description: 'Закрытый лоток с верхним входом в тёмно-сером цвете', details: ['Размер 58,5 × 39 × 39 см'] }),
  one('7588782', 'Серый, 60 × 25 × 25 см', { name: 'D&D Home Lana - игровой тоннель', brand: 'D&D Home', pet: 'cat', tag: 'Игровой тоннель',
    description: 'Серый текстильный тоннель для игры и отдыха кошки', details: ['Размер 60 × 25 × 25 см', 'Игра под присмотром'] }),
  one('1126841', 'Aqua, T1', { name: 'Yagu Petral Reflectante - шлейка', pet: 'dog', tag: 'Шлейка для собаки',
    description: 'Шлейка для собаки в цвете aqua со светоотражающими элементами', details: ['Размер T1', 'Проверьте посадку перед прогулкой'] }),
  one('1126845', 'Aqua, T2', { name: 'Yagu Ramal Reflectante - поводок', pet: 'dog', tag: 'Поводок для собаки',
    description: 'Поводок в цвете aqua со светоотражающими элементами', details: ['Длина 120 см', 'Ширина 1,5 см'] }),
  one('40BW230', 'Короб 15 × 60 г', { name: 'Bow Wow Beef Bites - лакомства для собак', brand: 'Bow Wow', category: 'Лакомства', pet: 'dog', tag: 'Лакомства для собак',
    description: 'Короб из 15 отдельных пакетов лакомства по 60 г',
    details: ['Цена указана за короб 15 × 60 г', 'На изображении показан один пакет из короба'] })
];

export function expandYaguColourVariants(products) {
  const additions = new Map([
    ['yagu-7515812', ['7515813', 'Бежевый', 'Серый']],
    ['yagu-7515817', ['7515814', 'Чёрный', 'Бежевый']]
  ]);
  return products.map(product => {
    const addition = additions.get(product.id);
    if (!addition) return product;
    const [sku, newColour, oldColour] = addition;
    const base = product.variants[0];
    const description = product.id === 'yagu-7515812'
      ? 'Бежевая когтеточка-столбик Sole с круглым мягким основанием и подвесным мячиком'
      : 'Чёрный туннель Square с мягкими краями и поверхностью для точения когтей';
    const added = snapshot(sku, newColour, {
      ...base, description,
      details: [ `${newColour} цвет`, ...product.details.slice(1) ],
      optionLabel: 'Цвет'
    });
    return {
      ...product, optionLabel: 'Цвет', sizes: [oldColour, newColour],
      variants: [{ ...base, label: oldColour, sizes: [oldColour], optionLabel: 'Цвет' }, added]
    };
  });
}
