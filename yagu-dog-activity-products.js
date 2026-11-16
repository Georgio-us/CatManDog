// Checked in the logged-in Yagu B2B shop on 2026-11-16. Prices are per
// customer-facing single toy; Yagu's historical six-unit bag for 7500016 is
// a wholesale packing rule, not six balls in the customer card.
const supplier = (sku, url) => ({ name: 'Grupo Yagu', sku, url });
const studio = (sku, alt, sourceUrl) => ({
  src: `/media/yagu/${sku}-studio-v1.webp`, alt, generated: true,
  presentation: 'editorial', originalSrc: sourceUrl
});

const items = [
  {
    sku: '7514503', name: 'Duvo+ - мяч TPR со звуком', label: '5,5 см, цвет ассорти',
    description: 'Лёгкий рельефный мяч с пищалкой для активной игры на суше и в воде',
    details: ['Один мяч диаметром 5,5 см', 'Термопластичная резина TPR',
      'Плавает в воде', 'Цвет в поставке может отличаться от изображения', 'Игра под присмотром'],
    cost: 2.70, price: 5.00, orderable: true, tag: 'Мяч для игры',
    url: 'https://odoo.grupoyagu.com/shop/product/7514503-duvo-juguete-perro-tpr-bola-sonido-5-5-cm-27134?category=1532',
    benchmark: 'https://www.paraperrosygatos.es/collections/caucho-y-goma',
    basis: { kind: 'exact_retail', offers: [{ name: 'ParaPerrosYGatos', amount: 5.00,
      url: 'https://www.paraperrosygatos.es/collections/caucho-y-goma' }] }
  },
  {
    sku: '7500016', name: 'Duvo+ - резиновый мяч для зубов', label: '7 см, цвет ассорти',
    description: 'Резиновый мяч с открытыми секциями и рельефом для игры и жевания',
    details: ['Один мяч диаметром 7 см', 'Ароматизированная резина',
      'Три цвета в ассортименте', 'Цвет в поставке может отличаться от изображения',
      'Игра под присмотром'],
    cost: 4.40, price: 6.75, orderable: false, tag: 'Мяч для игры',
    url: 'https://odoo.grupoyagu.com/shop/product/duvo-juguete-perro-goma-bola-dental-con-sabor-mix-7-cm-30584?category=1527',
    benchmark: 'https://www.paraperrosygatos.es/collections/caucho-y-goma',
    basis: { kind: 'exact_retail', offers: [{ name: 'ParaPerrosYGatos', amount: 6.75,
      url: 'https://www.paraperrosygatos.es/collections/caucho-y-goma' }] },
    purchasePack: { units: 6, source: 'https://grupoyagu.com/image/data/demeter/products/DETALLES/TARIFAS/CATALOGOS/CATALOGO%20GRUPO%20YAGU.pdf',
      note: 'Historical Yagu catalogue says Bolsa 6 uds.; current minimum order quantity requires confirmation' }
  },
  {
    sku: '7575324', name: 'Duvo+ Bite Me - резиновый диск', label: '22,8 см, чёрный',
    description: 'Резиновый диск в форме блина от штанги для броска и совместной игры',
    details: ['Размер 22,8 × 22,8 × 1,7 см', 'Форма с двумя отверстиями для захвата',
      'Игра под присмотром'],
    cost: 8.46, price: 13.99, orderable: false, tag: 'Диск для игры',
    url: 'https://odoo.grupoyagu.com/shop/product/7575324-duvo-bite-me-juguete-perro-goma-disco-pesas-22-8-x-22-8-x-1-7-cm-32820?category=1527',
    benchmark: 'https://www.paraperrosygatos.es/collections/caucho-y-goma',
    basis: { kind: 'analogue_single', exampleUrl:
      'https://www.paraperrosygatos.es/collections/caucho-y-goma',
      note: 'CatManDog proposal; comparable 22 cm dog frisbee is 13.99 EUR, no exact Bite Me disc PVP found' }
  },
  {
    sku: '7517008', name: 'Duvo+ - игрушка для лакомств', label: '14,5 × 10 см',
    description: 'Вращающаяся игрушка с регулируемыми отверстиями выдаёт лакомства во время игры',
    details: ['Размер 14,5 × 10 см', 'Регулируемые отверстия меняют сложность',
      'Наполняется сухими лакомствами', 'Игра под присмотром'],
    cost: 8.54, price: 13.39, orderable: false, tag: 'Для лакомств',
    url: 'https://odoo.grupoyagu.com/shop/product/7517008-duvo-juguete-perro-sacapremios-14-5-x-10-cm-27121?category=1533',
    benchmark: 'https://crazypet.es/perros/duvoplus/juguete-perro-sacapremios',
    basis: { kind: 'exact_retail', offers: [
      { name: 'CrazyPet', amount: 13.39, url: 'https://crazypet.es/perros/duvoplus/juguete-perro-sacapremios' }
    ], note: 'CatManDog price follows the lowest checked exact-model retail offer' }
  }
];

export const yaguDogActivityProducts = items.map(item => {
  const id = `yagu-${item.sku}-activity`;
  const image = studio(item.sku, `${item.name}, ${item.label}`, item.url);
  const shared = {
    id, name: item.name, brand: 'Duvo+', category: 'Игрушки и аксессуары', pet: 'dog',
    isReal: true, isNew: true, tag: item.tag, line: 'Grupo Yagu', optionLabel: 'Вариант',
    description: item.description, details: item.details, image, sizes: [item.label],
    supplier: supplier(item.sku, item.url),
    productSource: { name: 'Grupo Yagu B2B', url: item.url, kind: 'supplier', checkedAt: '2026-11-16' },
    imageSource: { name: 'Grupo Yagu B2B', pageUrl: item.url }
  };
  const variant = {
    ...shared, label: item.label, price: item.price, priceStatus: 'temporary',
    purchasePrice: item.cost, purchasePriceStatus: 'confirmed',
    purchasePriceTaxIncluded: false, purchasePriceCheckedAt: '2026-11-16',
    availabilityStatus: item.orderable ? 'source_on_demand' : 'unavailable',
    saleStatus: item.orderable ? 'available' : 'unavailable',
    retailPrice: { amount: item.price, currency: 'EUR', status: 'temporary', type: 'retail',
      sourceName: 'CatManDog', sourceUrl: item.benchmark, checkedAt: '2026-11-16',
      taxIncluded: true, shippingIncluded: false },
    pricingBasis: { ...item.basis, amount: item.price, checkedAt: '2026-11-16' },
    ...(item.purchasePack ? { purchasePack: item.purchasePack } : {})
  };
  return { ...shared, defaultVariantId: id, variants: [variant] };
});
