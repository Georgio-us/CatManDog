// Product-specific facts checked against the European manufacturer pages.
// These URLs are editorial evidence, not customer-facing links or price sources.
import { catalogEditorialCats } from './catalog-editorial-cats.js';
import { catalogEditorialDogs } from './catalog-editorial-dogs.js';
import { catalogEditorialRoyalCanin } from './catalog-editorial-royal-canin.js';

export const catalogEditorialContent = {
  ...catalogEditorialCats,
  ...catalogEditorialDogs,
  ...catalogEditorialRoyalCanin,
  'leonardo-poultry': {
    source: 'https://www.leonardo-catfood.com/leonardo-adult-gf-poultry-1.8-kg',
    description: 'LEONARDO Adult GF Poultry - беззерновой сухой корм для взрослых кошек. В составе 30% свежего мяса птицы, 22% белка птицы и 15% амаранта. Амарант - растение, семена которого в этой рецептуре используют вместо злаков.',
    details: ['Для взрослых кошек от 1 года', '30% свежего мяса птицы и 22% белка птицы', 'Амарант 15% вместо злаков']
  },
  'cmd-source-f025a9dbc9d479c7': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-adult.html',
    description: 'ACANA Adult Dog - сухой рацион для взрослых собак. В рецептуре сочетаются курица, индейка и хек; доля ингредиентов животного происхождения по данным производителя составляет 60%.',
    details: ['Для взрослых собак', 'Курица, индейка и хек', 'Без зерновых ингредиентов']
  },
  'cmd-source-39c2d5db76be47f7': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-adult-small.html',
    description: 'ACANA Adult Small Breed создан для взрослых собак мелких пород. Курица и хек дополнены тыквой, фруктами и овощами; гранулы рассчитаны на небольшую пасть.',
    details: ['Для взрослых собак мелких пород', 'Курица и хек', 'Мелкие гранулы']
  },
  'cmd-source-5d1bd37fc7a7c699': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-prairiepoultry.html',
    description: 'ACANA Classics Prairie Poultry - сухой корм с курицей, перловкой и овсом. Это зерновая рецептура: она отличается от беззерновых линеек ACANA и подойдёт тем, кто ищет корм с птицей и злаками.',
    details: ['Свежая курица и куриная мука', 'Содержит перловку и овёс', 'Линейка Classics']
  },
  'cmd-source-c26796839ace4c6e': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-cold-water-fish.html',
    description: 'ACANA Coldwater Fish построен на рыбных ингредиентах: форели, лососе и хеке. Производитель указывает 60% ингредиентов животного происхождения; в рецептуре нет зерновых компонентов.',
    details: ['Форель, лосось и хек', 'Без зерновых ингредиентов', 'Для собак разных пород и возрастов']
  },
  'cmd-source-3b6cbf7e0c31efab': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-red-meat.html',
    description: 'ACANA Red Meat сочетает говядину, свинину и ягнёнка с тыквой, овощами и фруктами. Это беззерновая рецептура с несколькими источниками животного белка.',
    details: ['Говядина, свинина и ягнёнок', 'Без зерновых ингредиентов', 'С тыквой и овощами']
  },
  'cmd-source-4c1d8462a78eb6de': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-pacifica.html',
    description: 'ACANA Pacifica - рыбная рецептура для собак с сельдью, скумбрией, камбалой, хеком и морским окунем. По данным производителя, 70% ингредиентов составляют продукты животного происхождения.',
    details: ['Сельдь, скумбрия, камбала, хек и морской окунь', 'Без зерновых ингредиентов', 'Для собак разных пород и возрастов']
  },
  'cmd-source-95203d59566cbe4d': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-ranchlands.html',
    description: 'ACANA Ranchlands сочетает говядину, ягнёнка и свинину с пресноводной рыбой. Рецептура содержит мясо и субпродукты, а также овощи и фрукты, без зерновых ингредиентов.',
    details: ['Говядина, ягнёнок, свинина и пресноводная рыба', '70% ингредиентов животного происхождения по данным производителя', 'Без зерновых ингредиентов']
  },
  'cmd-source-90d2d4b6858c08cd': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-wild-prairie.html',
    description: 'ACANA Wild Prairie - корм с курицей, индейкой, яйцами и пресноводной рыбой. В составе также есть овощи и фрукты; производитель указывает 70% ингредиентов животного происхождения.',
    details: ['Курица, индейка, яйца и пресноводная рыба', 'Без зерновых ингредиентов', 'Для собак разных пород и возрастов']
  },
  'cmd-source-67755e1e1068c6f6': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-light-fit.html',
    description: 'ACANA Light & Fit разработан для взрослых собак, которым нужен рацион с контролем массы тела. В составе есть курица, камбала и яйца; рецептура отличается от обычной Adult Dog направленностью на поддержание формы.',
    details: ['Для взрослых собак', 'Курица, камбала и яйца', 'Рацион для контроля массы тела']
  },
  'cmd-source-11acbc9ed4d69f1c': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-puppy-junior.html',
    description: 'ACANA Puppy предназначен для щенков. В рецептуре используются курица, индейка, яйца и камбала; состав разработан с учётом потребностей растущих собак.',
    details: ['Для щенков', 'Курица, индейка, яйца и камбала', 'Без зерновых ингредиентов']
  },
  'cmd-source-5902317db04f9f0e': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-singles-beef-new.html',
    description: 'ACANA Singles Beef with Pumpkin - беззерновой корм с говядиной как единственным источником животного белка. Тыква и батат дополняют мясную основу рецептуры.',
    details: ['Один источник животного белка - говядина', 'С тыквой и бататом', 'Без зерновых ингредиентов']
  },
  'cmd-source-3e01ebf957337e76': {
    source: 'https://emea.acana.com/en/dogs/dog-food/eu-aca-singles-duck-new.html',
    description: 'ACANA Singles Free-Run Duck - рацион с уткой и грушей. В рецептуре используются мясо и субпродукты утки; производитель указывает 50% ингредиентов из утки.',
    details: ['Утка как единственный источник животного белка', 'С грушей', 'Без зерновых ингредиентов']
  },
  'cmd-source-694e05cdc1b2582c': {
    source: 'https://inabafoods-europe.com/products/main-ingredient/salmon/',
    description: 'Churu Variedades Salmón y Pollo - набор кремовых лакомств для кошек со вкусами лосося и курицы. В коробке 20 тюбиков по 14 г, которые можно давать отдельно или добавлять к корму.',
    details: ['Ассорти вкусов лосося и курицы', '20 тюбиков по 14 г', 'Кремовая текстура']
  },
  'cmd-source-6d56f8fb416a81c4': {
    source: 'https://emea.orijenpetfoods.com/en/eu-ori-ns-ori-regionalred.html',
    description: 'ORIJEN Regional Red для собак сочетает говядину, дикого кабана, бизона, ягнёнка и свинину. Производитель указывает 85% ингредиентов животного происхождения; зерновые компоненты в рецептуру не добавлены.',
    details: ['Говядина, дикий кабан, бизон, ягнёнок и свинина', '85% ингредиентов животного происхождения по данным производителя', 'Без зерновых ингредиентов']
  }
};
