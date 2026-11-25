const imageBase = 'https://img.catmandog.es/assets/food/editorial';
const supplierPage = 'https://www.royalcanin.com/es/cats/products/retail-products/persian-kitten-2554';

const formats = [
  { size: '400g', label: '400 г', kg: 0.4, price: 7.99, ean: '3182550721202', supplierCode: '2554001', quote: 6.09 },
  { size: '2kg', label: '2 кг', kg: 2, price: 31.99, ean: '3182550721219', supplierCode: '2554201', quote: 26.67 },
  { size: '4kg', label: '4 кг', kg: 4, price: 59.99, ean: '3182550721226', supplierCode: '2554401', quote: 45.39 }
];

const image = size => ({
  src: `${imageBase}/rc-persian-kitten-${size}-studio-v1.webp`,
  presentation: 'editorial', generated: true,
  alt: `Royal Canin Persian Kitten ${size}`
});

export const royalCaninPersianKitten = {
  id: 'rc-persian-kitten',
  name: 'Royal Canin Persian Kitten',
  brand: 'Royal Canin',
  category: 'Корм', pet: 'cat', foodType: 'dry',
  isReal: true, isNew: true,
  tag: 'Для персидских котят', segment: 'everyday',
  optionLabel: 'Фасовка',
  description: 'Полнорационный сухой корм Royal Canin Persian Kitten',
  details: ['Для персидских котят до 12 месяцев', 'Фасовку выберите перед добавлением в корзину'],
  image: image('2kg'),
  imageSource: { name: 'Royal Canin', pageUrl: supplierPage, url: supplierPage },
  productSource: { name: 'Royal Canin', url: supplierPage, kind: 'manufacturer' },
  defaultVariantId: 'rc-persian-kitten-2kg',
  weight: '400 г - 4 кг',
  sizes: formats.map(format => format.label),
  variants: formats.map(format => ({
    id: `rc-persian-kitten-${format.size}`,
    label: format.label, weight: format.label,
    packageWeightKg: format.kg, sizes: [format.label],
    description: 'Полнорационный сухой корм Royal Canin Persian Kitten',
    details: ['Для персидских котят до 12 месяцев', 'Фасовку выберите перед добавлением в корзину'],
    price: format.price, priceStatus: 'confirmed',
    retailPrice: { amount: format.price, currency: 'EUR', status: 'confirmed',
      sourceName: 'Решение владельца', checkedAt: '2026-11-25', shippingIncluded: false },
    ean: format.ean, supplierCode: format.supplierCode,
    image: image(format.size),
    saleStatus: 'available', availabilityStatus: 'source_on_demand',
    purchasePrice: null, purchasePriceStatus: 'pending',
    purchaseQuote: { amountExVat: format.quote, currency: 'EUR', supplier: 'Royal Canin',
      supplierCode: format.supplierCode, checkedAt: '2026-11-25', taxRatePercent: 10 }
  }))
};
