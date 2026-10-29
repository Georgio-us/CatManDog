// Yagu 2026 catalogue, pages 6, 13-14, 16, 22, 26-27, 39, 43, 45 and 172.
// Only photographed colourways are listed. Supplier B2B quotes stay in private sourcing notes.
import { yaguRetailBenchmarks } from './yagu-retail-benchmarks.js';

const catalogue = page => `https://heyzine.com/flip-book/2fca30a7bd.html#page/${page}`;
const image = (file, alt, page) => ({
  src: `/media/yagu/${file}.webp?v=graphite-1`, alt, generated: true, presentation: 'editorial',
  originalSrc: catalogue(page)
});

function family({ id, name, category = 'Игрушки и аксессуары', pet, tag, page,
  optionLabel = 'Цвет и размер', description, details, variants }) {
  const common = {
    id, name, brand: category === 'Окна и балконы' ? 'Duvo+' : 'Yagu', category, pet,
    isReal: true, isNew: true, tag, line: 'Grupo Yagu', optionLabel, description,
    details, price: null, priceStatus: 'pending', purchasePrice: null,
    purchasePriceStatus: 'pending', availabilityStatus: 'pending',
    productSource: { name: 'Grupo Yagu - каталог 2026', url: catalogue(page), kind: 'supplier' },
    imageSource: { name: 'Grupo Yagu - каталог 2026', pageUrl: catalogue(page) }
  };
  const snapshots = variants.map(([sku, label, file]) => {
    const benchmark = yaguRetailBenchmarks[sku];
    return {
      ...common, id: `yagu-${sku}`, label, sizes: [label],
      ...(benchmark ? {
        price: benchmark.amount, priceStatus: 'temporary',
        ...(benchmark.kind === 'exact_sku' ? {
          retailPrice: {
            amount: benchmark.amount, currency: 'EUR', status: 'temporary', type: 'retail',
            sourceName: benchmark.sourceName, sourceUrl: benchmark.sourceUrl,
            checkedAt: '2026-10-29', taxIncluded: true, shippingIncluded: false,
            availability: benchmark.availability
          }
        } : {
          pricingBasis: {
            kind: 'analogue_single', amount: benchmark.amount, sampleSize: 1,
            group: 'Grupo Yagu', note: benchmark.note,
            exampleRetailer: benchmark.sourceName, examplePriceEUR: benchmark.amount,
            exampleUrl: benchmark.sourceUrl, referenceSku: benchmark.referenceSku,
            checkedAt: '2026-10-29'
          }
        })
      } : {}),
      image: image(file, `${common.brand} ${sku}`, page),
      supplier: { name: 'Grupo Yagu', sku, url: `https://odoo.grupoyagu.com/shop?search=${sku}` }
    };
  });
  return { ...common, image: snapshots[0].image, sizes: snapshots.map(v => v.label),
    supplier: snapshots[0].supplier, defaultVariantId: snapshots[0].id, variants: snapshots };
}

export const yaguLaunchProducts = [
  family({ id: 'yagu-donut-neutral', name: 'Yagu Donut Antiestrés', pet: 'cat', tag: 'Мягкая лежанка', page: 6,
    description: 'Круглая плюшевая лежанка с мягким бортиком и нескользящей основой',
    details: ['Мягкая плюшевая ткань', 'Наполнитель из переработанного волокна', 'Нескользящая основа'],
    variants: [
      ['1127355','Бежевый · T1 · 52 × 52 × 13 см','donut-beige'],
      ['1127356','Бежевый · T2 · 65 × 65 × 15 см','donut-beige'],
      ['1127357','Бежевый · T3 · 85 × 85 × 17 см','donut-beige'],
      ['1127352','Антрацит · T1 · 52 × 52 × 13 см','donut-antracita'],
      ['1127353','Антрацит · T2 · 65 × 65 × 15 см','donut-antracita'],
      ['1127354','Антрацит · T3 · 85 × 85 × 17 см','donut-antracita']
    ] }),
  family({ id: 'yagu-misi-pana', name: 'Yagu Misi Pana Ancha', pet: 'cat', tag: 'Уютное гнездо', page: 13,
    description: 'Глубокая круглая лежанка из фактурной ткани с широким рубчиком',
    details: ['Ткань pana ancha', 'Нескользящая основа', 'Наполнитель из переработанного волокна'],
    variants: [
      ['1128027','Бежевый · T1 · 47 × 47 × 25 см','misi-pana-beige'],
      ['1128028','Бежевый · T2 · 55 × 55 × 25 см','misi-pana-beige'],
      ['1128023','Серый · T1 · 47 × 47 × 25 см','misi-pana-gris'],
      ['1128024','Серый · T2 · 55 × 55 × 25 см','misi-pana-gris']
    ] }),
  family({ id: 'yagu-donut-pana', name: 'Yagu Donut Pana Ancha', pet: 'cat', tag: 'Фактурная лежанка', page: 14,
    description: 'Круглая лежанка из мягкой ткани с широким рубчиком',
    details: ['Ткань pana ancha', 'Нескользящая основа', 'Наполнитель из переработанного волокна'],
    variants: [
      ['1128035','Бежевый · T1 · 52 × 52 × 12 см','donut-pana-beige'],
      ['1128036','Бежевый · T2 · 65 × 65 × 13 см','donut-pana-beige'],
      ['1128037','Бежевый · T3 · 85 × 85 × 15 см','donut-pana-beige'],
      ['1128029','Серый · T1 · 52 × 52 × 12 см','donut-pana-gris'],
      ['1128030','Серый · T2 · 65 × 65 × 13 см','donut-pana-gris'],
      ['1128031','Серый · T3 · 85 × 85 × 15 см','donut-pana-gris']
    ] }),
  family({ id: 'yagu-beti-prints', name: 'Yagu Beti', pet: 'cat', tag: 'Компактная лежанка', page: 43,
    description: 'Лежанка с мягким бортиком в спокойных текстильных принтах',
    details: ['Наполнитель из переработанного волокна', 'Мягкий бортик', 'Основание из ткани texpunt'],
    variants: [
      ['1128216','Зелёный в горошек · T1 · 50 × 38 × 13 см','beti-puntito-verde'],
      ['1128217','Зелёный в горошек · T2 · 60 × 45 × 14 см','beti-puntito-verde'],
      ['1128218','Зелёный в горошек · T3 · 70 × 50 × 16 см','beti-puntito-verde'],
      ['1128219','Зелёный в горошек · T4 · 85 × 60 × 17 см','beti-puntito-verde'],
      ['1128224','Бежевый цветочный · T1 · 50 × 38 × 13 см','beti-cieza-beige'],
      ['1128225','Бежевый цветочный · T2 · 60 × 45 × 14 см','beti-cieza-beige'],
      ['1128226','Бежевый цветочный · T3 · 70 × 50 × 16 см','beti-cieza-beige'],
      ['1128227','Бежевый цветочный · T4 · 85 × 60 × 17 см','beti-cieza-beige']
    ] }),
  family({ id: 'yagu-cubo-pana-green', name: 'Yagu Cubo Compacto Pana Green', pet: 'cat', tag: 'Домик', page: 26,
    optionLabel: 'Размер', description: 'Компактный закрытый домик из фактурной зелёной ткани',
    details: ['Размер 33 × 33 × 33 см', 'Мягкие стенки', 'Нескользящая основа'],
    variants: [['1128085','33 × 33 × 33 см','cubo-pana-green']] }),
  family({ id: 'yagu-gulliver-pana-green', name: 'Yagu Gulliver Pana Green', pet: 'dog', tag: 'Лежанка с бортиком', page: 26,
    optionLabel: 'Размер', description: 'Лежанка с мягкими стенками из зелёной фактурной ткани',
    details: ['Мягкие стенки', 'Наполнитель из переработанного волокна', 'Нескользящая основа'],
    variants: [
      ['1128082','T2 · 55 × 46 × 19 см','gulliver-pana-green'],
      ['1128083','T3 · 65 × 50 × 20 см','gulliver-pana-green'],
      ['1128084','T4 · 74 × 60 × 21 см','gulliver-pana-green']
    ] }),
  family({ id: 'yagu-kubo-plus-pana', name: 'Yagu Kubo Plus Pana Ancha', pet: 'dog', tag: 'Большая лежанка', page: 27,
    description: 'Просторная лежанка с низким мягким бортиком из ткани с широким рубчиком',
    details: ['Съёмный чехол на молнии', 'Наполнитель из переработанного волокна', 'Нескользящая основа'],
    variants: [
      ['1128087','Бежевый · T1 · 80 × 58 × 17 см','kubo-pana-beige'],
      ['1128088','Бежевый · T2 · 100 × 70 × 19 см','kubo-pana-beige'],
      ['1128089','Бежевый · T3 · 120 × 85 × 22 см','kubo-pana-beige'],
      ['1128096','Зелёный · T1 · 80 × 58 × 17 см','kubo-pana-verde'],
      ['1128097','Зелёный · T2 · 100 × 70 × 19 см','kubo-pana-verde'],
      ['1128098','Зелёный · T3 · 120 × 85 × 22 см','kubo-pana-verde']
    ] }),
  family({ id: 'yagu-roma-prints', name: 'Yagu Colchoneta Roma', pet: 'dog', tag: 'Лёгкий матрас', page: 39,
    description: 'Невысокий матрас для отдыха собаки в двух спокойных принтах',
    details: ['Съёмный чехол', 'Наполнитель из полиэстера', 'Основание из ткани texpunt'],
    variants: [
      ['1128184','Зелёный в горошек · T2 · 80 × 60 × 6 см','roma-puntito-verde'],
      ['1128185','Зелёный в горошек · T3 · 100 × 70 × 6 см','roma-puntito-verde'],
      ['1128188','Бежевый цветочный · T2 · 80 × 60 × 6 см','roma-cieza-beige'],
      ['1128189','Бежевый цветочный · T3 · 100 × 70 × 6 см','roma-cieza-beige']
    ] }),
  family({ id: 'yagu-nico-cieza', name: 'Yagu Colchón Nico Cieza Beige', pet: 'dog', tag: 'Мягкий матрас', page: 45,
    optionLabel: 'Размер', description: 'Мягкий матрас с бежевым цветочным принтом и съёмным чехлом',
    details: ['Съёмный чехол', 'Наполнитель из измельчённой пены', 'Основание из ткани texpunt'],
    variants: [
      ['1128244','T2 · 80 × 60 × 10 см','nico-cieza-beige'],
      ['1128245','T3 · 100 × 70 × 10 см','nico-cieza-beige']
    ] }),
  family({ id: 'yagu-sorolla-backpack', name: 'Yagu Mochila Sorolla', category: 'Переноски', pet: 'cat', tag: 'Рюкзак-переноска', page: 22,
    optionLabel: 'Размер', description: 'Рюкзак-переноска из ткани букле для поездок с питомцем',
    details: ['Размер 33 × 19 × 41 см', 'Регулируемые лямки', 'Внутренний карабин для фиксации'],
    variants: [['1127893','33 × 19 × 41 см','sorolla-mochila']] }),
  family({ id: 'yagu-navy-louise-bag', name: 'Yagu Bolso Navy Louise', category: 'Переноски', pet: 'cat', tag: 'Сумка-переноска', page: 16,
    optionLabel: 'Размер', description: 'Сумка-переноска из серой ткани с мягкой внутренней подушкой',
    details: ['Размер 39 × 21 × 34 см', 'Ткань pana fina', 'Мягкая внутренняя подушка'],
    variants: [['1127842','39 × 21 × 34 см','navy-louise-bolso']] }),
  family({ id: 'yagu-duvo-balcony-net', name: 'Duvo+ сетка для балкона', category: 'Окна и балконы', pet: 'cat', tag: 'Для балкона', page: 172,
    optionLabel: 'Размер', description: 'Прозрачная сетка для ограждения балкона; монтируйте по инструкции и проверяйте крепления',
    details: ['Прозрачная сетка', 'Размер подбирайте по проёму', 'Не оставляйте питомца на балконе без присмотра'],
    variants: [
      ['7611509','300 × 200 см','balcony-net'],
      ['7611510','400 × 300 см','balcony-net']
    ] })
];
