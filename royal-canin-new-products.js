const imageBase = 'https://img.catmandog.es/assets/food/editorial';

const image = (file, alt) => ({
  src: `${imageBase}/${file}`,
  presentation: 'editorial',
  generated: true,
  alt
});

const sphynxPage = 'https://www.royalcanin.com/es/cats/products/retail-products/sphynx-adult-2556';
const kittenJellyPage = 'https://www.royalcanin.com/es/cats/products/retail-products/kitten--chunks-in-jelly-4150';

export const royalCaninNewProducts = [
  {
    id: 'rc-sphynx-adult',
    name: 'Royal Canin Sphynx Adult', brand: 'Royal Canin',
    category: 'Корм', pet: 'cat', foodType: 'dry',
    isReal: true, isNew: true, segment: 'everyday',
    tag: 'Для взрослых сфинксов', optionLabel: 'Фасовка',
    description: 'Royal Canin Sphynx Adult - полнорационный сухой корм для сфинксов старше 12 месяцев. У породы повышенная потребность в энергии для поддержания температуры тела, поэтому рецептура содержит 23 % жира. Треугольные гранулы адаптированы к челюсти сфинкса, а жирные кислоты омега-3 и омега-6 помогают поддерживать состояние кожи.',
    details: ['Для сфинксов старше 12 месяцев', 'Гранулы адаптированы к форме челюсти', 'Высокая энергетическая ценность'],
    image: image('rc-sphynx-adult-2kg-studio-v1.webp', 'Royal Canin Sphynx Adult 2 кг'),
    imageSource: { name: 'Royal Canin', pageUrl: sphynxPage, url: sphynxPage },
    productSource: { name: 'Royal Canin', url: sphynxPage, kind: 'manufacturer' },
    defaultVariantId: 'rc-sphynx-adult-2kg',
    weight: '2 кг', sizes: ['2 кг'],
    variants: [{
      id: 'rc-sphynx-adult-2kg', label: '2 кг', weight: '2 кг',
      packageWeightKg: 2, sizes: ['2 кг'],
      price: 32.99, priceStatus: 'confirmed',
      retailPrice: { amount: 32.99, currency: 'EUR', status: 'confirmed',
        sourceName: 'Решение владельца', checkedAt: '2026-11-25', shippingIncluded: false },
      ean: '3182550758840', supplierCode: '2556200',
      saleStatus: 'available', availabilityStatus: 'source_on_demand',
      purchasePrice: null, purchasePriceStatus: 'pending',
      purchaseQuote: { amountExVat: 23.33, currency: 'EUR', supplier: 'Royal Canin',
        supplierCode: '2556200', checkedAt: '2026-11-25', taxRatePercent: 10 }
    }]
  },
  {
    id: 'rc-kitten-jelly',
    name: 'Royal Canin Kitten - желе', brand: 'Royal Canin',
    category: 'Корм', pet: 'cat', foodType: 'wet',
    isReal: true, isNew: true, segment: 'everyday',
    tag: 'Для котят', optionLabel: 'Фасовка',
    description: 'Royal Canin Kitten в желе - полнорационный влажный корм для котят от 4 до 12 месяцев. Размер и текстура кусочков подходят растущим котятам. В рецептуре есть витамины C и E, DHA, пребиотики MOS и легкоусвояемые белки; корм можно сочетать с сухим рационом Royal Canin Kitten.',
    details: ['Для котят от 4 до 12 месяцев', 'Кусочки в желе', 'Один пауч 85 г'],
    image: image('rc-kitten-jelly-85g-studio-v1.webp', 'Royal Canin Kitten в желе 85 г'),
    imageSource: { name: 'Royal Canin', pageUrl: kittenJellyPage, url: kittenJellyPage },
    productSource: { name: 'Royal Canin', url: kittenJellyPage, kind: 'manufacturer' },
    defaultVariantId: 'rc-kitten-jelly-85g',
    weight: '85 г', sizes: ['85 г'],
    variants: [{
      id: 'rc-kitten-jelly-85g', label: '85 г', weight: '85 г',
      packageWeightKg: 0.085, sizes: ['85 г'],
      price: 1.49, priceStatus: 'confirmed',
      retailPrice: { amount: 1.49, currency: 'EUR', status: 'confirmed',
        sourceName: 'Решение владельца', checkedAt: '2026-11-25', shippingIncluded: false },
      ean: '9003579311714', supplierCode: '4150001',
      saleStatus: 'available', availabilityStatus: 'source_on_demand',
      purchasePrice: null, purchasePriceStatus: 'pending',
      purchaseQuote: { amountExVat: 13.50, currency: 'EUR', supplier: 'Royal Canin',
        supplierCode: '4150001', checkedAt: '2026-11-25', taxRatePercent: 10,
        caseSize: 12 }
    }]
  }
];
