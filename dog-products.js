import { applyDogStudio } from './dog-studio-images.js?v=r2-media-1';
// First dog assortment from the saved supplier catalogues and checked Spanish retail pages
const checkedAt = '2026-10-17';
const ownatTariff = 'research/supplier-files/2026-10-14-ownat-royal-canin/PVPR_OWNAT_DIFERENTES_PAISES_FEBRERO_2026.pdf';
const yaguCatalogue = page => `https://heyzine.com/flip-book/2fca30a7bd.html#page/${page}`;

const retail = (amount, name, url, availability = null) => ({ amount, kind: 'retail', name, url, availability });
const recommended = (amount, taxIncluded = true) => ({ amount, kind: 'recommended', name: 'Ownat - PVPR Испания, февраль 2026', url: ownatTariff, taxIncluded });
const analogue = (amount, name, url, referenceAmount, note) => ({ amount, kind: 'analogue', name, url, referenceAmount, note });

function family({ id, name, brand, category = 'Корм', foodType, tag, description, details, optionLabel = 'Фасовка', source, supplierName, sourcePage, color = '#426c65', variants }) {
  const base = {
    id, name, brand, category, pet: 'dog', foodType, tag, description,
    details: [...details, ...(category === 'Корм' ? ['Норму кормления смотрите на упаковке', 'Свежая вода всегда должна быть доступна'] : [])],
    optionLabel, isReal: true, isNew: true,
    purchasePrice: null, purchasePriceStatus: 'pending', availabilityStatus: 'pending',
    image: null, // Attached from exact product references by applyDogStudio
    productSource: source ? { name: supplierName || brand, url: source, kind: supplierName ? 'supplier' : 'manufacturer' } : null,
    catalogPage: sourcePage || null,
  };
  const snapshots = variants.map(({ label, code, ean = null, price, weightKg = null, details: variantDetails = [] }) => {
    const idPart = code || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const variantId = `${id}-${idPart}`;
    const priceData = price.kind === 'analogue'
      ? { pricingBasis: { kind: 'analogue_single', amount: price.amount, group: name, sampleSize: 1,
          exampleRetailer: price.name, examplePriceEUR: price.referenceAmount, exampleUrl: price.url,
          note: price.note, checkedAt } }
      : { retailPrice: { amount: price.amount, currency: 'EUR', type: price.kind === 'recommended' ? 'recommended' : 'retail',
          status: price.kind === 'recommended' ? 'recommended' : 'temporary', taxIncluded: price.kind === 'recommended' ? price.taxIncluded : true,
          sourceName: price.name, sourceUrl: price.url, checkedAt, shippingIncluded: null, availability: price.availability } };
    return {
      ...base, id: variantId, label, weight: label, line: `${brand} · ${label}`,
      packageWeightKg: weightKg, sizes: [label], manufacturerSku: code || null, ean,
      supplier: supplierName ? { name: supplierName, sku: code || null, url: source } : null,
      price: price.amount, priceStatus: price.kind === 'recommended' ? 'recommended' : 'temporary',
      details: [...base.details, ...variantDetails], ...priceData,
    };
  });
  const first = snapshots[0];
  return { ...base, price: first.price, priceStatus: first.priceStatus, retailPrice: first.retailPrice || null,
    pricingBasis: first.pricingBasis || null, label: first.label, weight: snapshots.length > 1 ? `${snapshots[0].label} - ${snapshots.at(-1).label}` : first.label,
    packageWeightKg: first.packageWeightKg, sizes: snapshots.map(v => v.label), defaultVariantId: first.id,
    variants: snapshots, placeholderColor: color };
}

const kiwoko = {
  miniPuppy: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/royal-canin-mini-puppy-pienso-para-perros/ROY150318_M.html',
  miniAdult: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/royal-canin-mini-adult-pienso-para-perros/ROY150535_M.html',
  mediumAdult: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/royal-canin-medium-adult-pienso-para-perros/ROY152036_M.html',
  maxiAdult: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-razas-grandes/royal-canin-maxi-adult-pienso-para-perros/ROY153637_M.html',
  orijenOriginal: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/orijen-original-pienso-para-perros/ORJOA02_M.html',
  orijenPuppy: 'https://www.kiwoko.com/perros/especial-cachorro/pienso-para-cachorros/orijen-puppy-pienso-para-perros/ORJOP02_M.html',
  orijenFish: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/pienso-natural/orijen-six-fish-pienso-para-perros/ORJOF02_M.html',
  orijenSmall: 'https://www.kiwoko.com/perros/comida-para-perros/pienso-seco-para-perros/orijen-small-breed-pienso-para-perros/ORJOOAS01_M.html',
};
const rcSource = 'https://www.royalcanin.com/es/dogs';
const rc = (props) => family({ brand: 'Royal Canin', source: rcSource, supplierName: 'Royal Canin', color: '#a73537', foodType: 'dry', ...props });
const ownat = (props) => family({ brand: 'Ownat', source: 'https://www.ownat.com/', supplierName: 'Ownat', color: '#668a54', foodType: 'dry', ...props });
const orijen = (props) => family({ brand: 'Orijen', color: '#3a545a', foodType: 'dry', ...props });
const yagu = (props) => family({ supplierName: 'Yagu', color: '#6d7986', ...props });

const dogProductFamilies = [
  rc({ id:'dog-rc-mini-puppy', name:'Royal Canin Mini Puppy', tag:'Для щенков', description:'Сухой корм для щенков мелких пород', details:['Для щенков мелких пород', 'Полнорационный сухой корм'], variants:[
    {label:'2 кг',code:'3000202',ean:'3182550793001',weightKg:2,price:retail(20.49,'Kiwoko',kiwoko.miniPuppy)},
    {label:'4 кг',code:'3000403',ean:'3182550793032',weightKg:4,price:retail(31.99,'Kiwoko',kiwoko.miniPuppy)},
  ]}),
  rc({ id:'dog-rc-mini-adult', name:'Royal Canin Mini Adult', tag:'Мелкие породы', description:'Сухой корм для взрослых собак мелких пород', details:['Для взрослых собак мелких пород', 'Полнорационный сухой корм'], variants:[
    {label:'2 кг',code:'R462987',ean:'3182551055672',weightKg:2,price:retail(18.29,'Kiwoko',kiwoko.miniAdult)},
    {label:'4 кг',code:'R462991',ean:'3182551055719',weightKg:4,price:retail(28.99,'Kiwoko',kiwoko.miniAdult)},
  ]}),
  rc({ id:'dog-rc-medium-adult', name:'Royal Canin Medium Adult', tag:'Средние породы', description:'Сухой корм для взрослых собак средних пород', details:['Для взрослых собак средних пород', 'Полнорационный сухой корм'], variants:[
    {label:'4 кг',code:'R463035',ean:'3182551055788',weightKg:4,price:retail(28.59,'Kiwoko',kiwoko.mediumAdult)},
    {label:'10 кг',code:'R463039',ean:'3182551055825',weightKg:10,price:retail(62.99,'Kiwoko',kiwoko.mediumAdult,'out_of_stock')},
  ]}),
  rc({ id:'dog-rc-maxi-adult', name:'Royal Canin Maxi Adult', tag:'Крупные породы', description:'Сухой корм для взрослых собак крупных пород', details:['Для взрослых собак крупных пород', 'Полнорационный сухой корм'], variants:[
    {label:'4 кг',code:'R463056',ean:'3182551055894',weightKg:4,price:retail(29.69,'Kiwoko',kiwoko.maxiAdult)},
    {label:'10 кг',code:'R463060',ean:'3182551055931',weightKg:10,price:retail(68.20,'Royal Canin','https://www.royalcanin.com/es/dogs/products/retail-products/maxi-adult-3007')},
  ]}),
  rc({ id:'dog-rc-mini-digestive', name:'Royal Canin Mini Digestive Care', tag:'Для пищеварения', description:'Сухой корм для взрослых собак мелких пород с чувствительным пищеварением', details:['Для взрослых собак мелких пород', 'Рацион для чувствительного пищеварения'], variants:[
    {label:'1 кг',code:'2447001',ean:'3182550893947',weightKg:1,price:retail(13.89,'Tiendanimal','https://www.tiendanimal.es/royal-canin-digestive-care-mini-pienso-para-perros/ROY2447601_M.html')},
    {label:'3 кг',code:'2447401',ean:'3182550894012',weightKg:3,price:retail(32.19,'Tiendanimal','https://www.tiendanimal.es/royal-canin-digestive-care-mini-pienso-para-perros/ROY2447601_M.html')},
  ]}),

  ownat({ id:'dog-ownat-classic-complet', name:'Ownat Classic Complet Dog', tag:'Классический рацион', description:'Повседневный сухой корм для взрослых собак', details:['Для взрослых собак', 'Линейка Ownat Classic'], variants:[
    {label:'4 кг',code:'031404',ean:'8429037016044',weightKg:4,price:recommended(10.60)},
    {label:'12 кг',code:'031471',ean:'8429037014682',weightKg:12,price:recommended(29.58)},
  ]}),
  ownat({ id:'dog-ownat-ultra-medium', name:'Ownat Ultra Medium Adult Dog', tag:'Средние породы', description:'Сухой корм Ownat Ultra для взрослых собак средних пород', details:['Для взрослых собак средних пород', 'Линейка Ownat Ultra'], variants:[
    {label:'3 кг',code:'031684',ean:'8429037016730',weightKg:3,price:recommended(18.93)},
    {label:'12 кг',code:'031674',ean:'8429037001057',weightKg:12,price:recommended(52.28)},
  ]}),
  ownat({ id:'dog-ownat-just-gf-chicken', name:'Ownat Just Grain Free Adult Chicken Dog', tag:'Без зерна', description:'Беззерновой сухой корм с курицей для взрослых собак', details:['Для взрослых собак', 'Беззерновая рецептура'], variants:[
    {label:'3 кг',code:'031448',ean:'8429037016419',weightKg:3,price:recommended(16.07)},
    {label:'14 кг',code:'031447',ean:'8429037016426',weightKg:14,price:recommended(56.25)},
  ]}),
  ownat({ id:'dog-ownat-gf-prime', name:'Ownat Grain Free Prime Adult Chicken & Turkey Dog', tag:'Без зерна', description:'Беззерновой сухой корм с курицей и индейкой для взрослых собак', details:['Для взрослых собак', 'Линейка Grain Free Prime'], variants:[
    {label:'3 кг',code:'031432',ean:'8429037016310',weightKg:3,price:recommended(22.44)},
    {label:'12 кг',code:'031600',ean:'8429037014606',weightKg:12,price:recommended(64.91)},
  ]}),
  ownat({ id:'dog-ownat-author-duck', name:'Ownat Author Fresh Duck & Chicken Dog', tag:'С уткой и курицей', description:'Сухой корм Ownat Author с уткой и курицей для взрослых собак', details:['Для взрослых собак', 'Линейка Ownat Author'], variants:[
    {label:'3 кг',code:'031629',ean:'8429037015207',weightKg:3,price:recommended(24.06)},
    {label:'10 кг',code:'031628',ean:'8429037015191',weightKg:10,price:recommended(68.92)},
  ]}),
  ownat({ id:'dog-ownat-wetline-chicken', name:'Ownat Wetline Chicken with Carrots Dog', foodType:'wet', tag:'Влажный корм', description:'Влажный корм с курицей и морковью для собак', details:['Влажный корм для собак', 'Курица и морковь'], variants:[
    {label:'395 г',code:'057019',ean:'8429037030088',weightKg:0.395,price:recommended(3.18,null)},
  ]}),

  orijen({ id:'dog-orijen-original', name:'Orijen Original Dog', tag:'Для взрослых', description:'Сухой корм Orijen Original для собак', details:['Рецепт Original', 'Сухой полнорационный корм'], source:'https://emea.orijenpetfoods.com/es-ES/dogs/dog-food/eu-ori-ns-ori-original.html', variants:[
    {label:'2 кг',weightKg:2,price:retail(27.19,'Kiwoko',kiwoko.orijenOriginal)},
    {label:'6 кг',weightKg:6,price:retail(62.09,'Kiwoko',kiwoko.orijenOriginal)},
  ]}),
  orijen({ id:'dog-orijen-puppy', name:'Orijen Puppy Dog', tag:'Для щенков', description:'Сухой корм Orijen Puppy для щенков', details:['Для щенков', 'Сухой полнорационный корм'], source:'https://emea.orijenpetfoods.com/es-ES/dogs/dog-food/eu-ori-ns-puppy.html', variants:[
    {label:'2 кг',weightKg:2,price:retail(26.09,'Kiwoko',kiwoko.orijenPuppy)},
    {label:'6 кг',weightKg:6,price:retail(60.99,'Kiwoko',kiwoko.orijenPuppy)},
  ]}),
  orijen({ id:'dog-orijen-six-fish', name:'Orijen Six Fish Dog', tag:'С рыбой', description:'Сухой корм Orijen Six Fish с рыбой для собак', details:['Рыбная рецептура', 'Сухой полнорационный корм'], source:'https://emea.orijenpetfoods.com/es-ES/dogs/dog-food/eu-ori-ns-ori-sixfish.html', variants:[
    {label:'2 кг',weightKg:2,price:retail(32.39,'Kiwoko',kiwoko.orijenFish)},
    {label:'6 кг',weightKg:6,price:retail(72.19,'Kiwoko',kiwoko.orijenFish)},
  ]}),
  orijen({ id:'dog-orijen-small-breed', name:'Orijen Small Breed Dog', tag:'Мелкие породы', description:'Сухой корм Orijen Small Breed для собак мелких пород', details:['Для мелких пород', 'Сухой полнорационный корм'], source:'https://emea.orijenpetfoods.com/es-ES/dogs/dog-food/eu-ori-ns-ori-small-breed.html', variants:[
    {label:'1,8 кг',weightKg:1.8,price:retail(25.49,'Kiwoko',kiwoko.orijenSmall)},
    {label:'4,5 кг',weightKg:4.5,price:retail(57.99,'Kiwoko',kiwoko.orijenSmall)},
  ]}),
  orijen({ id:'dog-orijen-fit-trim', name:'Orijen Fit & Trim Dog', tag:'Контроль веса', description:'Сухой корм Orijen Fit & Trim для собак с контролем веса', details:['Для взрослых собак', 'Рацион для контроля веса'], source:'https://emea.orijenpetfoods.com/es-ES/dogs/dog-food/eu-ori-ns-ori-fittrim.html', variants:[
    {label:'2 кг',weightKg:2,price:retail(29.78,'Barakaldo Vet Shop','https://www.barakaldotiendaveterinaria.es/orijen-adult-fit-trim-dog.html')},
    {label:'6 кг',weightKg:6,price:retail(61.40,'Barakaldo Vet Shop','https://www.barakaldotiendaveterinaria.es/orijen-adult-fit-trim-dog.html')},
  ]}),

  yagu({ id:'dog-nutriplus-adult-chicken', name:'NutriPlus Perro Adulto Pollo', brand:'NutriPlus', foodType:'dry', tag:'С курицей', description:'Сухой корм NutriPlus с курицей для взрослых собак', details:['Для взрослых собак', 'Сухой полнорационный корм'], source:yaguCatalogue(97), sourcePage:97, variants:[
    {label:'3 кг',code:'4000004',weightKg:3,price:retail(13.20,'MisMascotas','https://www.mismascotas.es/marca/172-nutriplus')},
    {label:'12 кг',code:'4000026',weightKg:12,price:analogue(42.24,'MisMascotas','https://www.mismascotas.es/marca/172-nutriplus',13.20,'Расчёт из цены 3 кг с коэффициентом 3,2; цена 12 кг требует проверки')},
  ]}),
  yagu({ id:'dog-nutriplus-wet-lamb', name:'NutriPlus Comida Húmeda Perro Cordero', brand:'NutriPlus', foodType:'wet', tag:'С ягнёнком', description:'Влажный корм NutriPlus с ягнёнком для собак', details:['Влажный полнорационный корм', 'Рецепт с ягнёнком'], source:yaguCatalogue(99), sourcePage:99, variants:[
    {label:'400 г',code:'4000202',weightKg:0.4,price:retail(2.50,'Ducán Pienso a domicilio','https://pienso-a-domicilio.com/nutriplus-monoproteica/978-nutriplus-lata-monoproteica-cordero-400-grs-caja-6-unidades.html')},
  ]}),
  yagu({ id:'dog-yagu-donut-turquoise', name:'Yagu Cuna Donut Antiestrés Turquesa', brand:'Yagu', category:'Игрушки и аксессуары', tag:'Лежанка', optionLabel:'Размер', description:'Круглая мягкая лежанка бирюзового цвета с нескользящей основой', details:['Цвет - бирюзовый', 'Нескользящая основа', 'Наполнитель из переработанного волокна'], source:yaguCatalogue(5), sourcePage:5, variants:[
    {label:'T1 · 52 × 52 × 13 см',code:'1127723',price:analogue(29.99,'Tiendanimal','https://www.tiendanimal.es/yagu-descanso-cuna-donut-antiestres-marron/MRK000307633_M.html',29.99,'Та же модель и размер в другом цвете; цену бирюзового варианта проверить')},
    {label:'T2 · 65 × 65 × 15 см',code:'1127724',price:analogue(39.00,'Tiendanimal','https://www.tiendanimal.es/yagu-descanso-cuna-donut-antiestres-lila-_t-2--65-x-65-x-15-cm_/MRK000306488_M.html',39.00,'Та же модель и размер в другом цвете; цену бирюзового варианта проверить')},
  ]}),
  yagu({ id:'dog-yagu-harness-blue', name:'Yagu Arnés Confort Acolchado Azul', brand:'Yagu', category:'Игрушки и аксессуары', tag:'Для прогулок', optionLabel:'Размер', description:'Мягкая прогулочная шлейка синего цвета', details:['Цвет - синий', 'Размер подбирайте по обхвату шеи и груди'], source:yaguCatalogue(47), sourcePage:47, variants:[
    {label:'T2 · шея 25-27 см',code:'1128108',price:analogue(13.45,'MisMascotas','https://www.mismascotas.es/products/arnes-acolchado-ibanez-glam',13.45,'Цена сопоставимой мягкой шлейки; цену Yagu T2 проверить'),details:['Грудь 32,5 см']},
    {label:'T3 · шея 30-32 см',code:'1128109',price:analogue(13.45,'MisMascotas','https://www.mismascotas.es/products/arnes-acolchado-ibanez-glam',13.45,'Цена сопоставимой мягкой шлейки; цену Yagu T3 проверить'),details:['Грудь 34,5 см']},
    {label:'T4 · шея 35-37 см',code:'1128110',price:analogue(13.45,'MisMascotas','https://www.mismascotas.es/products/arnes-acolchado-ibanez-glam',13.45,'Цена сопоставимой мягкой шлейки; цену Yagu T4 проверить'),details:['Грудь 41,5 см']},
  ]}),
  yagu({ id:'dog-mp-sensibowl-slomo', name:'MP Comedero Sensibowl Slomo', brand:'MP Bergamo', category:'Миски и поилки', tag:'Медленное кормление', optionLabel:'Цвет', description:'Миска для медленного кормления собак с нескользящей основой', details:['Объём 950 мл', 'Размер 34,6 × 24,5 × 8,5 см', 'Подходит для посудомоечной машины'], source:yaguCatalogue(128), sourcePage:128, variants:[
    {label:'Чёрный · 950 мл',code:'9235073',price:retail(14.59,'Petness','https://petness.es/perros/c_comederos-bebederos_mpbergamo')},
    {label:'Белый · 950 мл',code:'9235074',price:retail(11.40,'Huella Canina','https://www.huellacanina.com/perro-comederos-comederos-plastico-mp-comedero-sensibowl-slomo-blanco-para-perros-p-22987.html')},
  ]}),
  yagu({ id:'dog-duvo-huggi-rabbit', name:'Duvo+ Peluche Huggi Conejo Lila', brand:'Duvo+', category:'Игрушки и аксессуары', tag:'Мягкая игрушка', optionLabel:'Размер', description:'Мягкая игрушка в форме кролика для собак', details:['Цвет - лиловый', 'Играйте с собакой под присмотром'], source:yaguCatalogue(147), sourcePage:147, variants:[
    {label:'S · 41 × 17 × 3,5 см',code:'7516407',ean:'5414365466763',price:analogue(5.29,'eBay Deutschland','https://www.ebay.de/itm/267773771243',5.29,'Та же модель размера S в Германии; цену в Испании проверить')},
    {label:'L · 63 × 33 × 4,5 см',code:'7516408',ean:'5414365466855',price:analogue(16.49,'Zooplus Deutschland','https://www.zooplus.de/shop/hunde/hundespielzeug/pluesch/9980620596',16.49,'Та же модель размера L в Германии; цену в Испании проверить')},
  ]}),
];

export const dogProducts = dogProductFamilies.map(applyDogStudio);
