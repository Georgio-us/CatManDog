// Exact dog-food formats in the paid and bonus lists sent to Adrián on 2026-11-08.
// Supplier tariff excludes IVA and recargo. Storefront prices include IVA.
const checkedAt = '2026-11-09';
const imageRoot = '/media/acana-orijen-selected-2026-11-09';
const tariffFile = 'ACANA-ORIJEN-B2B-CATALOG-2026-10-31.md';
const kiwoko = {
  adult: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/acana-adult-pienso-para-perros/ACAACB02_M.html',
  puppy: 'https://www.kiwoko.com/perros/especial-cachorro/pienso-para-cachorros/acana-puppy_junior-pienso-para-perros/ACAAPJ00_M.html',
  redMeat: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-sin-cereales/acana-red-meat-pienso-para-perros/ACA1121K020N_M.html',
  lightFit: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-light/acana-light_fit-pienso-para-perros/ACAALF13_M.html',
  original: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/orijen-original-pienso-para-perros/ORJOA02_M.html',
  classicsRed: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/acana-classics-red-meat-pienso-para-perros/ACACAR11_M.html',
  classicsWild: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-de-pescado/acana-classics-wild-coast-pescado-pienso-para-perros/ACACAW11_M.html',
  puppySmall: 'https://www.kiwoko.com/perros/especial-cachorro/pienso-para-cachorros/acana-puppy-small-breed-pienso-para-perros/ACAAPS00_M.html',
  wildPrairie: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/acana-hp-wild-prairie-pienso-para-perros/ACAAW00_M.html',
  senior: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-perros-seniores/acana-senior-pienso-para-perros/ACAAS00_M.html',
  regionalRed: 'https://www.miscota.es/perros/orijen/dry-regional-red-dog-134811'
};

const selected = [
  { productId: 'cmd-source-f025a9dbc9d479c7', name: 'ACANA Adult Dog', brand: 'ACANA', id: 'acana-adult-dog-11-4kg', article: '064992525118', ean: '064992525118', kg: 11.4, tariff: 63.46, retail: 75.99, retailer: 'Kiwoko', retailUrl: kiwoko.adult, image: 'acana-adult-dog-11-4kg.webp', basket: 'paid' },
  { productId: 'cmd-source-11acbc9ed4d69f1c', name: 'ACANA Puppy', brand: 'ACANA', id: 'acana-puppy-11-4kg', article: 'ACH106', ean: '064992500115', kg: 11.4, tariff: 63.49, retail: 92.19, retailer: 'Kiwoko', retailUrl: kiwoko.puppy, image: 'acana-puppy-11-4kg.webp', basket: 'paid' },
  { productId: 'cmd-source-3b6cbf7e0c31efab', name: 'ACANA Dog Red Meat', brand: 'ACANA', id: 'acana-dog-red-meat-11-4kg', article: '064992730918', ean: '064992730918', kg: 11.4, tariff: 61.49, retail: 76.99, retailer: 'Kiwoko', retailUrl: kiwoko.redMeat, image: 'acana-dog-red-meat-11-4kg.webp', basket: 'paid' },
  { productId: 'cmd-source-67755e1e1068c6f6', name: 'ACANA Light & Fit', brand: 'ACANA', id: 'acana-light-fit-6kg', article: 'ACH124', ean: '064992512606', kg: 6, tariff: 38.11, retail: 42.99, retailer: 'Kiwoko', retailUrl: kiwoko.lightFit, image: 'acana-light-fit-6kg.webp', basket: 'paid' },
  { productId: 'dog-orijen-original', name: 'Orijen Original Dog', brand: 'Orijen', id: 'dog-orijen-original-11-4kg', article: 'ORD110', ean: '064992182120', kg: 11.4, tariff: 81.14, retail: 90.49, retailer: 'Kiwoko', retailUrl: kiwoko.original, image: 'orijen-original-dog-11-4kg.webp', basket: 'paid', priceBasis: 'supplier_cost_floor', competitorRetail: 88.39 },
  { productId: 'cmd-source-classics-red-meat', name: 'ACANA Classics Red Meat', brand: 'ACANA', id: 'acana-classics-red-meat-9-7kg', article: 'CAR10', ean: '064992561123', kg: 9.7, tariff: 52.02, retail: 63.89, retailer: 'Kiwoko', retailUrl: kiwoko.classicsRed, image: 'acana-classics-red-meat-9-7kg.webp', basket: 'bonus' },
  { productId: 'cmd-source-classics-wild-coast', name: 'ACANA Classics Wild Coast', brand: 'ACANA', id: 'acana-classics-wild-coast-9-7kg', article: 'CAW10', ean: '064992562120', kg: 9.7, tariff: 53.35, retail: 63.39, retailer: 'Kiwoko', retailUrl: kiwoko.classicsWild, image: 'acana-classics-wild-coast-9-7kg.webp', basket: 'bonus' },
  { productId: 'cmd-source-puppy-small-breed', name: 'ACANA Puppy Small Breed', brand: 'ACANA', id: 'acana-puppy-small-breed-6kg', article: 'ACH102', ean: '064992502607', kg: 6, tariff: 38.11, retail: 42.99, retailer: 'Kiwoko', retailUrl: kiwoko.puppySmall, image: 'acana-puppy-small-breed-6kg.webp', basket: 'bonus' },
  { productId: 'cmd-source-90d2d4b6858c08cd', name: 'ACANA Highest Protein Wild Prairie', brand: 'ACANA', id: 'acana-wild-prairie-6kg', article: 'ACR202', ean: '064992540616', kg: 6, tariff: 44.72, retail: 53.29, retailer: 'Kiwoko', retailUrl: kiwoko.wildPrairie, image: 'acana-wild-prairie-6kg.webp', basket: 'bonus' },
  { productId: 'cmd-source-6d56f8fb416a81c4', name: 'Orijen Regional Red', brand: 'Orijen', id: 'orijen-regional-red-6kg', article: 'ORD117', ean: '064992184605', kg: 6, tariff: 65.14, retail: 74.99, retailer: 'Miscota', retailUrl: kiwoko.regionalRed, image: 'orijen-regional-red-6kg.webp', basket: 'bonus', priceBasis: 'supplier_cost_floor', competitorRetail: 69.84 },
  { productId: 'cmd-source-acana-senior', name: 'ACANA Senior', brand: 'ACANA', id: 'acana-senior-6kg', article: 'ACH128', ean: '064992510688', kg: 6, tariff: 38.11, retail: 46.49, retailer: 'Kiwoko', retailUrl: kiwoko.senior, image: 'acana-senior-6kg.webp', basket: 'bonus' }
];

export const selectedAcanaOrijenFormats = selected;

export const selectedAcanaOrijenProducts = selected.map(item => {
  const image = { src: `${imageRoot}/${item.image}`,
    alt: `${item.name} - saco de ${String(item.kg).replace('.', ',')} kg en estudio`,
    presentation: 'editorial', generated: true };
  const variant = {
    id: item.id, label: `${String(item.kg).replace('.', ',')} кг`,
    weight: `${String(item.kg).replace('.', ',')} кг`, packageWeightKg: item.kg,
    ean: item.ean, manufacturerSku: item.article, image,
    price: item.retail, priceStatus: 'confirmed',
    ...(item.priceBasis === 'supplier_cost_floor' ? {
      pricingBasis: { kind: 'supplier_cost_floor', amount: item.retail,
        checkedAt, sourceFile: tariffFile, supplierCostExVat: item.tariff,
        taxRate: 0.10, recargoRate: 0.014,
        competitorPrice: item.competitorRetail, competitorUrl: item.retailUrl }
    } : {
      retailPrice: { amount: item.retail, currency: 'EUR', status: 'confirmed',
        sourceName: item.retailer, sourceUrl: item.retailUrl, checkedAt }
    }),
    supplier: { name: 'Distrivet', sku: item.article, sourceFile: tariffFile },
    supplierTariffExVat: item.tariff,
    purchasePrice: null, purchasePriceStatus: 'pending',
    availabilityStatus: 'source_on_demand', saleStatus: 'available'
  };
  return {
    id: item.productId, name: item.name, brand: item.brand, category: 'Корм',
    pet: 'dog', foodType: 'dry', isReal: true,
    optionLabel: 'Фасовка', defaultVariantId: item.id,
    description: `Сухой корм ${item.name} для собак`,
    details: ['Сухой полнорационный корм', 'Норму кормления смотрите на упаковке'],
    image, variants: [variant]
  };
});

// Existing products keep their other package sizes. Only missing sizes are appended.
export function withSelectedAcanaOrijenFormats(products) {
  const byId = new Map(selectedAcanaOrijenProducts.map(product => [product.id, product]));
  const found = new Set();
  const merged = products.map(product => {
    const addition = byId.get(product.id);
    if (!addition) return product;
    found.add(product.id);
    const known = new Set((product.variants || []).map(variant => variant.id));
    return { ...product,
      ...(product.id === 'dog-orijen-original'
        ? { image: addition.image, defaultVariantId: addition.defaultVariantId } : {}),
      variants: [...(product.variants || []),
        ...addition.variants.filter(variant => !known.has(variant.id))] };
  });
  return [...merged, ...selectedAcanaOrijenProducts.filter(product => !found.has(product.id))];
}
