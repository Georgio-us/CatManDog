// Exact products requested after customer conversations on 2026-11-07.
// Retail prices come from matching 2026-11-08 Spanish listings. Purchase prices
// are separate and never used as the storefront price.
const imageRoot = '/media/confirmed-demand-2026-11-08';

export const confirmedDemandProducts = [
  {
    id: 'royal-canin-chihuahua-adult',
    name: 'Royal Canin Chihuahua Adult',
    brand: 'Royal Canin',
    category: 'Корм',
    pet: 'dog',
    foodType: 'dry',
    isReal: true,
    tag: 'Для чихуахуа',
    optionLabel: 'Фасовка',
    defaultVariantId: 'royal-canin-chihuahua-adult-3kg',
    description: 'Сухой корм для взрослых чихуахуа от 8 месяцев',
    details: ['Для взрослых чихуахуа от 8 месяцев', 'Гранулы адаптированы к небольшим челюстям', 'Норму кормления смотрите на упаковке'],
    image: { src: `${imageRoot}/royal-canin-chihuahua-adult-3kg.webp`,
      alt: 'Royal Canin Chihuahua Adult - сухой корм 3 кг в студийном свете' },
    productSource: { name: 'Royal Canin',
      url: 'https://www.royalcanin.com/pe/dogs/products/retail-products/chihuahua-adult-2210',
      kind: 'manufacturer' },
    variants: [{
      id: 'royal-canin-chihuahua-adult-3kg', label: '3 кг', weight: '3 кг',
      packageWeightKg: 3, ean: '3182550747820',
      price: 29.69, priceStatus: 'confirmed',
      retailPrice: { amount: 29.69, currency: 'EUR', status: 'confirmed',
        sourceName: 'Kiwoko / Tiendanimal', checkedAt: '2026-11-08',
        sourceUrl: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/royal-canin-adult-chihuahua-pienso-para-perros/ROY158115_M.html' },
      supplier: { name: 'Royal Canin', sku: '2210400', sourceFile: 'Tarifa TIENDA marzo 2026' },
      availabilityStatus: 'source_on_demand', saleStatus: 'available'
    }]
  },
  {
    id: 'royal-canin-gastrointestinal-kitten-dry',
    name: 'Royal Canin Gastrointestinal Kitten - сухой корм',
    brand: 'Royal Canin',
    category: 'Корм',
    pet: 'cat',
    foodType: 'dry',
    isReal: true,
    tag: 'Ветеринарная диета',
    optionLabel: 'Фасовка',
    defaultVariantId: 'royal-canin-gastrointestinal-kitten-dry-2kg',
    description: 'Сухой ветеринарный корм для котят с чувствительным пищеварением',
    details: ['Для котят с чувствительным пищеварением', 'Применяйте по рекомендации ветеринарного врача', 'Норму кормления смотрите на упаковке'],
    image: { src: `${imageRoot}/royal-canin-gastrointestinal-kitten-2kg.webp`,
      alt: 'Royal Canin Gastrointestinal Kitten - сухой корм 2 кг в студийном свете' },
    productSource: { name: 'Royal Canin',
      url: 'https://www.royalcanin.com/es/cats/products/vet-products/gastrointestinal-kitten-1228',
      kind: 'manufacturer' },
    variants: [{
      id: 'royal-canin-gastrointestinal-kitten-dry-2kg', label: '2 кг', weight: '2 кг',
      packageWeightKg: 2, ean: '3182550906258',
      price: 36.69, priceStatus: 'confirmed',
      pricingBasis: { kind: 'retail_source_floor', amount: 36.69,
        checkedAt: '2026-11-09', sourceCostInclVat: 33.59,
        sourceName: 'Kiwoko',
        sourceUrl: 'https://www.kiwoko.com/gatos/comida-para-gatos/dietas-veterinarias/alimentacion-seca/royal-canin-veterinary-gastrointestinal-pienso-para-gatitos/ROY1228000_M.html' },
      retailPrice: { amount: 33.59, currency: 'EUR', status: 'confirmed',
        sourceName: 'Kiwoko', checkedAt: '2026-11-09',
        sourceUrl: 'https://www.kiwoko.com/gatos/comida-para-gatos/dietas-veterinarias/alimentacion-seca/royal-canin-veterinary-gastrointestinal-pienso-para-gatitos/ROY1228000_M.html' },
      retailFulfilment: { name: 'Kiwoko', article: 'ROY1228200',
        unitCostInclVat: 33.59, checkedAt: '2026-11-09' },
      supplier: null,
      availabilityStatus: 'source_on_demand', saleStatus: 'available'
    }]
  },
  {
    id: 'cmd-source-0f4a3ef9889b8ff3',
    name: 'ACANA Grass-Fed Lamb',
    brand: 'ACANA',
    category: 'Корм',
    pet: 'dog',
    foodType: 'dry',
    isReal: true,
    tag: 'С ягнёнком',
    optionLabel: 'Фасовка',
    defaultVariantId: 'acana-grass-fed-lamb-11-4kg',
    description: 'Сухой корм ACANA Grass-Fed Lamb с ягнёнком для собак',
    details: ['Рецепт с ягнёнком', 'Для собак всех пород', 'Норму кормления смотрите на упаковке'],
    image: { src: 'https://img.catmandog.es/assets/launch-studio-2026-11-04/acana-grass-fed-lamb-6kg.webp',
      alt: 'ACANA Grass-Fed Lamb - сухой корм для собак' },
    variants: [
      {
        id: 'cmd-source-sku-98e457bf0c8cc5f2', label: '6 кг', weight: '6 кг',
        packageWeightKg: 6, ean: '064992570606',
        image: { src: 'https://img.catmandog.es/assets/launch-studio-2026-11-04/acana-grass-fed-lamb-6kg.webp',
          alt: 'ACANA Grass-Fed Lamb - 6 кг' },
        price: 58.69, priceStatus: 'confirmed',
        supplier: { name: 'Distrivet', sku: 'ACS202' },
        availabilityStatus: 'source_on_demand', saleStatus: 'available'
      },
      {
        id: 'acana-grass-fed-lamb-11-4kg', label: '11,4 кг', weight: '11,4 кг',
        packageWeightKg: 11.4, ean: '064992570125',
        image: { src: `${imageRoot}/acana-grass-fed-lamb-11-4kg.webp`,
          alt: 'ACANA Grass-Fed Lamb - 11,4 кг в студийном свете' },
        price: 92.99, priceStatus: 'confirmed',
        retailPrice: { amount: 89.49, currency: 'EUR', status: 'confirmed',
          sourceName: 'Kiwoko', checkedAt: '2026-11-08',
          sourceUrl: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/acana-singles-grass-fed-cordero-pienso-para-perros/ACAAL02_M.html' },
        pricingBasis: { kind: 'supplier_cost_floor', amount: 92.99,
          checkedAt: '2026-11-09', sourceFile: 'ACANA-ORIJEN-B2B-CATALOG-2026-10-31.md',
          supplierCostExVat: 81.22, taxRate: 0.10, recargoRate: 0.014,
          competitorPrice: 89.49,
          competitorUrl: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/acana-singles-grass-fed-cordero-pienso-para-perros/ACAAL02_M.html' },
        supplier: { name: 'Distrivet', sku: 'ACS203', sourceFile: 'Tarifa Champion Petfoods 2026' },
        // Base tariff plus IVA and recargo is 90.48 EUR. The new retail price
        // stays above this cost without relying on the first-order discount.
        availabilityStatus: 'source_on_demand', saleStatus: 'available'
      }
    ]
  }
];
