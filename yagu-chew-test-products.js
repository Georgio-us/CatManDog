// Small chew assortment for customer demand testing; these items are not in the Yagu basket.
// B2B amounts exclude tax. Storefront prices include tax and are sourced independently.
const checkedAt = '2026-11-13';

const items = [
  {
    sku: '7570651',
    name: 'Duvo+ Farmz - говяжьи копыта, 6 шт',
    label: '6 шт',
    description: 'Шесть натуральных говяжьих копыт Farmz - плотное жевательное лакомство для собак, которым нравится долго грызть',
    details: ['Говяжьи копыта', 'Упаковка 6 шт', 'Без добавленных красителей и ароматизаторов'],
    purchase: 3.78,
    price: 6.19,
    supplierUrl: 'https://odoo.grupoyagu.com/shop/product/7570651-duvo-farmz-pezunas-de-vaca-6-uni-31083',
    retailName: 'Miscota - упаковка 6 шт',
    retailUrl: 'https://www.miscota.es/perros/duvoplus/pezunas-de-vaca-farmz'
  },
  {
    sku: '7516214',
    name: 'Duvo+ Meat! - сушёная утиная грудка 100 г',
    label: '100 г',
    description: 'Полоски сушёной утиной грудки Duvo+ Meat! можно дать собаке целиком или разделить на небольшие кусочки',
    details: ['Утиная грудка', 'Пакет 100 г', 'Полоски можно разделить на порции'],
    purchase: 1.90,
    price: 4.85,
    supplierUrl: 'https://odoo.grupoyagu.com/shop/product/7516214-duvo-meat-pechugas-de-pato-100-gr-46670',
    retailName: 'El Baúl de Yuma - та же фасовка',
    retailUrl: 'https://elbauldeyuma.es/producto/pechugas-de-pato-duvo-meat-bolsa-de-100-g/'
  }
];

export const yaguChewTestProducts = items.map(item => {
  const id = `yagu-${item.sku}-studio`;
  const image = {
    src: `/media/yagu/${item.sku}-studio-v1.webp`, alt: item.name,
    generated: true, presentation: 'editorial', originalSrc: item.supplierUrl
  };
  const common = {
    id, name: item.name, brand: 'Duvo+', category: 'Лакомства', pet: 'dog',
    isReal: true, isNew: true, tag: 'Жевательное лакомство', line: 'Grupo Yagu',
    optionLabel: 'Вариант', description: item.description, details: item.details,
    price: item.price, priceStatus: 'temporary',
    retailPrice: {
      amount: item.price, currency: 'EUR', status: 'temporary', type: 'retail',
      sourceName: item.retailName, sourceUrl: item.retailUrl,
      checkedAt, taxIncluded: true, shippingIncluded: false
    },
    purchasePrice: item.purchase, purchasePriceStatus: 'confirmed',
    purchasePriceTaxIncluded: false,
    purchaseQuote: {
      supplier: 'Grupo Yagu', sourceUrl: item.supplierUrl, checkedAt,
      amountExVat: item.purchase, currency: 'EUR'
    },
    availabilityStatus: 'pending', image,
    productSource: { name: 'Grupo Yagu - B2B карточка', url: item.supplierUrl, kind: 'supplier' },
    imageSource: { name: 'Grupo Yagu - исходное фото', pageUrl: item.supplierUrl },
    supplier: { name: 'Grupo Yagu', sku: item.sku, url: item.supplierUrl }
  };
  const variant = { ...common, label: item.label, sizes: [item.label] };
  return { ...common, sizes: [item.label], defaultVariantId: id, variants: [variant] };
});
