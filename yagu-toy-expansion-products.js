// Yagu B2B availability and prices checked on 2026-11-16. One supplier unit is
// one customer-facing retail pack; 7517023 contains two balls in that pack.
const items = [
  {
    sku: '7521059', pet: 'cat', name: 'Duvo+ - удочка Pompom', label: '25 × 5 см',
    description: 'Удочка с мягкими помпонами и пером для совместной игры с кошкой',
    details: ['Одна удочка с тремя помпонами и пером', 'Деревянная ручка', 'Размер игрушки 25 × 5 см', 'Игра под присмотром'],
    tag: 'Удочка для игры', cost: 2.58, price: 4.79, stock: 6,
    url: 'https://odoo.grupoyagu.com/shop/product/7521059-duvo-juguete-gato-cana-pompom-25-x-5-cm-27041?category=1383',
    offers: [{ name: 'La Casita de Los Animales', amount: 4.75, url: 'https://lacasitadelosanimales.com/brand/duvo/' },
      { name: 'CrazyPet', amount: 4.27, url: 'https://crazypet.es/gatos/s_varitas_duvoplus_disponibilidad-validada' }]
  },
  {
    sku: '7521060', pet: 'cat', name: 'Duvo+ - удочка Puffer Fish', label: '20 × 5 см',
    description: 'Удочка с мягкой рыбкой и пером для подвижной игры с кошкой',
    details: ['Одна удочка с мягкой подвесной рыбкой', 'Деревянная ручка', 'Размер игрушки 20 × 5 см', 'Игра под присмотром'],
    tag: 'Удочка для игры', cost: 2.08, price: 3.99, stock: 11,
    url: 'https://odoo.grupoyagu.com/shop/product/7521060-duvo-juguete-gato-cana-puffer-fish-20-x-5-cm-27042?category=1383',
    offers: [{ name: 'Amascotados', amount: 3.50, url: 'https://www.amascotados.com/otros/5544-duvo-juguete-gato-cana-puffer-fish-5414365258092.html' }]
  },
  {
    sku: '7517033', pet: 'cat', name: 'Duvo+ - мяч для лакомств', label: 'Синий, 5 × 5 × 5 см',
    description: 'Прозрачный синий мяч выдаёт сухие лакомства во время игры',
    details: ['Один мяч диаметром 5 см', 'Для сухих лакомств', 'Синий прозрачный корпус', 'Игра под присмотром'],
    tag: 'Для лакомств', cost: 1.86, price: 3.49,
    url: 'https://odoo.grupoyagu.com/shop/product/7517033-duvo-juguete-gato-bola-snack-azul-5-x-5-x-5-cm-27033?category=1385',
    offers: [{ name: 'TodoMascota', amount: 3.01, url: 'https://todomascota.es/209-juguetes-para-gatos' }]
  },
  {
    sku: '7517023', pet: 'cat', name: 'Duvo+ - мячики с перьями', label: 'Набор из 2 мячиков, 14 × 8 × 4 см',
    description: 'Два мягких мячика с перьями для игры и охоты',
    details: ['В одной упаковке два мячика с перьями', 'Размер набора 14 × 8 × 4 см', 'Игра под присмотром'],
    tag: 'Набор из двух', cost: 2.86, price: 5.49, pieces: 2,
    url: 'https://odoo.grupoyagu.com/shop/product/7517023-duvo-juguete-gato-bolas-con-pluma-14-x-8-x-4-cm-27034?category=1385',
    offers: [{ name: 'Madagascar Mascotas', amount: 4.50, url: 'https://www.madagascarmascotas.com/collections/juguetes-para-gatos' },
      { name: 'MiMascotaDiscount', amount: 5.59, url: 'https://www.mimascotadiscount.es/Gatos-Juguetes-para-gatos-Pelota-para-gatos%2C294%2C1k.htm' }]
  },
  {
    sku: '7512843', pet: 'cat', name: 'Duvo+ Catch ’n Play - рыба', label: '28 × 13 × 5 см',
    description: 'Электронная рыба с движущимся хвостом для самостоятельной игры кошки',
    details: ['Одна электронная игрушка размером 28 × 13 × 5 см', 'Заряжается через USB', 'Реагирует на прикосновение', 'Игра под присмотром'],
    tag: 'Интерактивная игра', cost: 11.90, price: 23.99,
    url: 'https://odoo.grupoyagu.com/shop/product/7512843-duvo-juguete-gato-pez-interactivo-28-x-13-x-5-cm-32047?category=1385',
    offers: [{ name: 'Tiendanimal', amount: 25.99, url: 'https://www.tiendanimal.es/duvoplus-catchn-play-pez-de-juguete-para-gatos/DUV12843_M.html' },
      { name: 'Mis Mascotas', amount: 30.69, url: 'https://mismiscotis.com/collections/juguetes-para-gatos' }]
  },
  {
    sku: '7571304', pet: 'dog', name: 'Duvo+ Lona - крокодил', label: '31 × 14 × 8 см',
    description: 'Тканевая игрушка-крокодил с фактурной поверхностью для совместной игры',
    details: ['Одна игрушка размером 31 × 14 × 8 см', 'Фактурная ткань', 'Игра под присмотром'],
    tag: 'Тканевая игрушка', cost: 6.86, price: 12.49, stock: 12,
    url: 'https://odoo.grupoyagu.com/shop/product/7571304-duvo-juguete-perro-lona-cocodrilo-31-x-14-x-8-cm-27100?category=1535',
    offers: [{ name: 'CrazyPet', amount: 10.79, url: 'https://crazypet.es/perros/c_juguetes-deporte_duvoplus' },
      { name: 'Mis Mascotas', amount: 15.48, url: 'https://www.mismascotas.es/collections/peluches-para-perros' }]
  },
  {
    sku: '7571301', pet: 'dog', name: 'Duvo+ Lona - акула', label: '29 × 10 × 5 см',
    description: 'Тканевая игрушка-акула с выразительной формой для совместной игры',
    details: ['Одна игрушка размером 29 × 10 × 5 см', 'Фактурная ткань', 'Игра под присмотром'],
    tag: 'Тканевая игрушка', cost: 7.14, price: 12.99, stock: 6,
    url: 'https://odoo.grupoyagu.com/shop/product/7571301-duvo-juguete-perro-lona-tiburon-29-x-10-x-5-cm-27108?category=1535',
    offers: [{ name: 'CrazyPet', amount: 11.19, url: 'https://crazypet.es/perros/c_juguetes-deporte_duvoplus' },
      { name: 'Mis Mascotas', amount: 15.98, url: 'https://www.mismascotas.es/collections/peluches-para-perros' }]
  },
  {
    sku: '7571305', pet: 'dog', name: 'Duvo+ Lona - лошадь', label: '32 × 13 × 5 см',
    description: 'Тканевая игрушка в форме головы лошади с плетёной верёвочной петлёй',
    details: ['Одна игрушка размером 32 × 13 × 5 см', 'Плетёная верёвочная петля', 'Игра под присмотром'],
    tag: 'Ткань и верёвка', cost: 6.06, price: 11.99, stock: 19,
    url: 'https://odoo.grupoyagu.com/shop/product/7571305-duvo-juguete-perro-lona-caballo-32-x-13-x-5-cm-27099?category=1535',
    offers: [{ name: 'Mis Mascotas', amount: 14.02, url: 'https://www.mismascotas.es/collections/peluches-para-perros' }]
  },
  {
    sku: '7571300', pet: 'dog', name: 'Duvo+ Lona - мяч для регби', label: '21 × 8,5 × 8,5 см',
    description: 'Тканевый мяч для регби с верёвочной шнуровкой для игры с собакой',
    details: ['Одна игрушка размером 21 × 8,5 × 8,5 см', 'Фактурная ткань и верёвочная шнуровка', 'Игра под присмотром'],
    tag: 'Мяч для игры', cost: 5.72, price: 10.49,
    url: 'https://odoo.grupoyagu.com/shop/product/7571300-duvo-juguete-perro-lona-rugby-21-x-8-5-x-8-5-cm-27107?category=1535',
    offers: [{ name: 'CrazyPet', amount: 8.99, url: 'https://crazypet.es/perros/c_juguetes-deporte_duvoplus' },
      { name: 'Miscota', amount: 9.49, url: 'https://www.miscota.es/perros/s_peluches_grande26028' }]
  },
  {
    sku: '7571319', pet: 'dog', name: 'Duvo+ - плюшевая корова', label: '30 × 24 × 10 см',
    description: 'Мягкая корова с верёвочными лапами для совместной игры с собакой',
    details: ['Одна игрушка размером 30 × 24 × 10 см', 'Мягкий текстиль и верёвочные лапы', 'Игра под присмотром'],
    tag: 'Мягкая игрушка', cost: 7.30, price: 13.49, stock: 20,
    url: 'https://odoo.grupoyagu.com/shop/product/7571319-duvo-juguete-perro-felpa-vaca-30-x-24-x-10-cm-27087?category=1529',
    offers: [{ name: 'CrazyPet', amount: 11.59, url: 'https://crazypet.es/perros/c_juguetes-deporte_duvoplus' },
      { name: 'Mis Mascotas', amount: 16.27, url: 'https://www.mismascotas.es/collections/peluches-para-perros' }]
  }
];

export const yaguToyExpansionProducts = items.map(item => {
  const id = `yagu-${item.sku}-toy`;
  const image = { src: `/media/yagu/${item.sku}-studio-v1.webp`,
    alt: `${item.name}, ${item.label}`, generated: true, presentation: 'editorial',
    originalSrc: item.url };
  const shared = {
    id, name: item.name, brand: 'Duvo+', category: 'Игрушки и аксессуары', pet: item.pet,
    isReal: true, isNew: true, tag: item.tag, line: 'Grupo Yagu', optionLabel: 'Вариант',
    description: item.description, details: item.details, image, sizes: [item.label],
    supplier: { name: 'Grupo Yagu', sku: item.sku, url: item.url },
    productSource: { name: 'Grupo Yagu B2B', url: item.url, kind: 'supplier', checkedAt: '2026-11-16' },
    imageSource: { name: 'Grupo Yagu B2B', pageUrl: item.url }
  };
  const variant = {
    ...shared, label: item.label, price: item.price, priceStatus: 'temporary',
    purchasePrice: item.cost, purchasePriceStatus: 'confirmed',
    purchasePriceTaxIncluded: false, purchasePriceCheckedAt: '2026-11-16',
    purchaseUnit: { retailPacks: 1, piecesPerPack: item.pieces || 1 },
    availabilityStatus: 'source_on_demand', saleStatus: 'available',
    retailPrice: { amount: item.price, currency: 'EUR', status: 'temporary', type: 'retail',
      sourceName: 'CatManDog', sourceUrl: item.offers[0].url, checkedAt: '2026-11-16',
      taxIncluded: true, shippingIncluded: false },
    pricingBasis: { kind: 'market_comparison', amount: item.price, checkedAt: '2026-11-16',
      offers: item.offers, minimumMarginPercent: 30,
      conservativePurchaseTaxPercent: 26.2,
      note: 'Product margin before shipping and payment fees; includes 21% IVA and a 5.2% recargo allowance in the conservative cash-cost check' },
    supplierStockSeen: { checkedAt: '2026-11-16', ...(item.stock ? { units: item.stock } : { status: 'En existencias' }) }
  };
  return { ...shared, defaultVariantId: id, variants: [variant] };
});
