// Six exact Yagu basket SKUs checked in the B2B cart on 2026-11-13.
// Supplier quotes exclude tax; customer prices include tax and have their own sources.
const checkedAt = '2026-11-13';
const cartUrl = 'https://odoo.grupoyagu.com/shop/cart';

const items = [
  {
    sku: '7510082', name: 'Duvo+ Beauty - ножницы для когтей', pet: 'cat',
    category: 'Уход', tag: 'Уход за когтями', label: 'Для небольших животных',
    description: 'Небольшие ножницы с кольцевыми ручками для аккуратной стрижки когтей домашних животных',
    details: ['Короткая режущая часть', 'Кольцевые ручки для точного хвата', 'Для небольших домашних животных'],
    purchase: 4.42, price: 12.99, retailKind: 'analogue_single',
    retailName: 'Complementos para Aves - точный артикул 7510082',
    retailUrl: 'https://complementosparaaves.com/es/304-cepillos-cardas-unas',
    supplierUrl: 'https://odoo.grupoyagu.com/shop/product/duvo-beauty-tijera-cortaunas-curvas-30012'
  },
  {
    sku: '7510074', name: 'Duvo+ Beauty - когтерез L', pet: 'dog',
    category: 'Уход', tag: 'Уход за когтями', label: 'Размер L',
    description: 'Когтерез с пружинным механизмом и нескользящими ручками рассчитан на контроль при стрижке крупных когтей',
    details: ['Металлическая режущая часть', 'Пружинный механизм', 'Нескользящие вставки на ручках', 'Фиксатор для хранения'],
    purchase: 7.50, price: 16.99, retailKind: 'analogue_single',
    retailName: 'Complementos para Aves - точный артикул 7510074',
    retailUrl: 'https://complementosparaaves.com/es/304-cepillos-cardas-unas',
    supplierUrl: 'https://odoo.grupoyagu.com/shop/product/duvo-beauty-cortaunas-30004'
  },
  {
    sku: '7514696', name: 'Duvo+ White Sensitive Baby Powder - наполнитель 12 кг', pet: 'cat',
    category: 'Наполнитель', tag: 'Комкующийся наполнитель', label: '12 кг',
    description: 'Белый комкующийся наполнитель из бентонита с ароматом детской присыпки для кошачьего лотка',
    details: ['Мешок 12 кг', 'Белый бентонит образует плотные комки', 'Аромат детской присыпки'],
    purchase: 8.98, price: 13.99, retailKind: 'exact_retail',
    retailName: 'Meintierdiscount España - та же фасовка',
    retailUrl: 'https://es.meintierdiscount.de/Duvo%2B%2C1o.htm',
    supplierUrl: 'https://odoo.grupoyagu.com/shop/product/7514696-duvo-bentonita-white-sensitive-baby-power-12-kg-45879'
  },
  {
    sku: '7570675', name: 'Duvo+ Farmz - говяжья трахея 250 г', pet: 'dog',
    category: 'Лакомства', tag: 'Натуральное лакомство', label: '250 г',
    description: 'Хрустящие сушёные кусочки говяжьей трахеи дают собаке возможность погрызть лакомство с выраженной текстурой',
    details: ['Говяжья трахея', 'Пакет 250 г', 'Без добавленных красителей и ароматизаторов'],
    purchase: 3.42, price: 5.89, retailKind: 'exact_retail',
    retailName: 'Miscota - та же фасовка',
    retailUrl: 'https://www.miscota.es/perros/duvoplus/farmz-traquea-de-ternera',
    supplierUrl: 'https://odoo.grupoyagu.com/shop/product/7570675-duvo-farmz-traquea-de-ternera-250-gr-31084'
  },
  {
    sku: '7570677', name: 'Duvo+ Farmz - сушёные куриные лапки 250 г', pet: 'dog',
    category: 'Лакомства', tag: 'Натуральное лакомство', label: '250 г',
    description: 'Сушёные куриные лапки в пакете 250 г - порционные жевательные лакомства для собак',
    details: ['Куриные лапки', 'Пакет 250 г', 'Без добавленных красителей и ароматизаторов'],
    purchase: 3.14, price: 7.45, retailKind: 'exact_retail',
    retailName: 'MisMascotas - та же фасовка',
    retailUrl: 'https://www.mismascotas.es/collections/snacks-para-perros?page=2',
    supplierUrl: 'https://odoo.grupoyagu.com/shop/product/7570677-duvo-farmz-patas-de-pollo-250-gr-31081'
  },
  {
    sku: '7570678', name: 'Duvo+ Farmz - говяжьи жилы 350 г', pet: 'dog',
    category: 'Лакомства', tag: 'Жевательное лакомство', label: '350 г · около 10 штук',
    description: 'Пакет говяжьих жил Farmz содержит примерно десять жевательных палочек длиной около 15 см',
    details: ['Говяжьи жилы', 'Пакет 350 г', 'Около 10 палочек по 15 см; количество может отличаться'],
    purchase: 13.69, price: 29.99, retailKind: 'analogue_single',
    retailName: 'Tiendanimal Marketplace - та же фасовка',
    retailUrl: 'https://www.tiendanimal.es/duvo-farmz-nervio-de-buey-para-perros/MRK000215671_M.html',
    supplierUrl: 'https://odoo.grupoyagu.com/shop/product/7570678-oferta-duvo-farmz-nervio-de-buey-15-cm-350-gr-10-uni-46580',
    promotion: true
  }
];

export const yaguBasketProducts = items.map(item => {
  const image = {
    src: `/media/yagu/${item.sku}-studio-v1.webp`, alt: item.name,
    generated: true, presentation: 'editorial', originalSrc: item.supplierUrl
  };
  const common = {
    id: `yagu-${item.sku}-studio`, name: item.name, brand: 'Duvo+',
    category: item.category, pet: item.pet, isReal: true, isNew: true,
    tag: item.tag, line: 'Grupo Yagu', optionLabel: 'Вариант',
    description: item.description, details: item.details,
    price: item.price, priceStatus: 'temporary',
    retailPrice: item.retailKind === 'exact_retail' ? {
      amount: item.price, currency: 'EUR', status: 'temporary', type: 'retail',
      sourceName: item.retailName, sourceUrl: item.retailUrl, checkedAt,
      taxIncluded: true, shippingIncluded: false
    } : undefined,
    pricingBasis: item.retailKind === 'analogue_single' ? {
      kind: 'analogue_single', amount: item.price, checkedAt,
      exampleUrl: item.retailUrl,
      note: 'Цена CatManDog ниже найденной розничной цены точного артикула'
    } : undefined,
    purchasePrice: item.purchase, purchasePriceStatus: 'confirmed',
    purchasePriceTaxIncluded: false,
    purchaseQuote: {
      supplier: 'Grupo Yagu', sourceUrl: cartUrl, checkedAt,
      amountExVat: item.purchase, currency: 'EUR',
      ...(item.promotion ? { note: 'Акционная цена в корзине на дату проверки' } : {})
    },
    availabilityStatus: 'pending',
    image,
    productSource: { name: 'Grupo Yagu - B2B карточка', url: item.supplierUrl, kind: 'supplier' },
    imageSource: { name: 'Grupo Yagu - исходное фото', pageUrl: item.supplierUrl },
    supplier: { name: 'Grupo Yagu', sku: item.sku, url: item.supplierUrl }
  };
  const variant = {
    ...common, id: common.id, label: item.label, sizes: [item.label]
  };
  return {
    ...common, sizes: [item.label], defaultVariantId: variant.id,
    variants: [variant]
  };
});
