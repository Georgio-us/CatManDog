import { catalogEditorialContent } from '../catalog-editorial-content.js';
import { catalogEditorialCats } from '../catalog-editorial-cats.js';
import { catalogEditorialDogs } from '../catalog-editorial-dogs.js';

// Translations of verified catalog copy. Match the server's exact source text so
// hydrated product and variant descriptions cannot fall back to Russian.
const descriptionByProduct = {
  'leonardo-poultry': [
    'LEONARDO Adult GF Poultry es un pienso sin cereales para gatos adultos. Contiene un 30 % de carne fresca de ave, un 22 % de proteína de ave y un 15 % de amaranto. En esta receta se usan las semillas de amaranto en lugar de cereales.',
    'LEONARDO Adult GF Poultry - беззерновий сухий корм для дорослих котів. Містить 30 % свіжого м’яса птиці, 22 % білка птиці та 15 % амаранту. Насіння амаранту в цій рецептурі використовують замість злаків.'
  ],
  'cmd-source-f025a9dbc9d479c7': [
    'ACANA Adult Dog es un pienso para perros adultos con pollo, pavo y merluza. Según el fabricante, el 60 % de sus ingredientes es de origen animal.',
    'ACANA Adult Dog - сухий раціон для дорослих собак із куркою, індичкою та хеком. За даними виробника, 60 % інгредієнтів мають тваринне походження.'
  ],
  'cmd-source-39c2d5db76be47f7': [
    'ACANA Adult Small Breed está pensado para perros adultos de razas pequeñas. Combina pollo y merluza con calabaza, fruta y verdura; sus croquetas son pequeñas.',
    'ACANA Adult Small Breed створено для дорослих собак малих порід. У рецептурі є курка, хек, гарбуз, фрукти й овочі; гранули невеликого розміру.'
  ],
  'cmd-source-5d1bd37fc7a7c699': [
    'ACANA Classics Prairie Poultry combina pollo, cebada perlada y avena. Es una receta con cereales, distinta de las gamas sin cereales de ACANA.',
    'ACANA Classics Prairie Poultry поєднує курку, перловку та овес. Це рецептура зі злаками, на відміну від беззернових лінійок ACANA.'
  ],
  'cmd-source-c26796839ace4c6e': [
    'ACANA Coldwater Fish contiene trucha, salmón y merluza. Según el fabricante, el 60 % de sus ingredientes es de origen animal y no contiene cereales.',
    'ACANA Coldwater Fish містить форель, лосося та хека. За даними виробника, 60 % інгредієнтів мають тваринне походження; злаків у рецептурі немає.'
  ],
  'cmd-source-3b6cbf7e0c31efab': [
    'ACANA Red Meat combina ternera, cerdo y cordero con calabaza, verduras y frutas. Es una receta sin cereales con varias fuentes de proteína animal.',
    'ACANA Red Meat поєднує яловичину, свинину та ягня з гарбузом, овочами й фруктами. Це беззернова рецептура з кількома джерелами тваринного білка.'
  ],
  'cmd-source-4c1d8462a78eb6de': [
    'ACANA Pacifica es una receta de pescado con arenque, caballa, platija, merluza y gallineta. Según el fabricante, el 70 % de sus ingredientes es de origen animal.',
    'ACANA Pacifica - рибна рецептура з оселедцем, скумбрією, камбалою, хеком і морським окунем. За даними виробника, 70 % інгредієнтів мають тваринне походження.'
  ],
  'cmd-source-95203d59566cbe4d': [
    'ACANA Ranchlands combina ternera, cordero y cerdo con pescado de agua dulce. Incluye carne, vísceras, verduras y frutas, sin cereales.',
    'ACANA Ranchlands поєднує яловичину, ягня, свинину та прісноводну рибу. Рецептура містить м’ясо, субпродукти, овочі й фрукти без зернових інгредієнтів.'
  ],
  'cmd-source-90d2d4b6858c08cd': [
    'ACANA Wild Prairie contiene pollo, pavo, huevos y pescado de agua dulce, además de verduras y frutas. Según el fabricante, el 70 % de sus ingredientes es de origen animal.',
    'ACANA Wild Prairie містить курку, індичку, яйця та прісноводну рибу, а також овочі й фрукти. За даними виробника, 70 % інгредієнтів мають тваринне походження.'
  ],
  'cmd-source-67755e1e1068c6f6': [
    'ACANA Light & Fit está pensado para perros adultos que necesitan controlar su peso. Contiene pollo, platija y huevos y se distingue de Adult Dog por su enfoque en el mantenimiento de la forma.',
    'ACANA Light & Fit розроблено для дорослих собак, яким потрібен контроль маси тіла. У складі є курка, камбала та яйця; цим раціон відрізняється від звичайного Adult Dog.'
  ],
  'cmd-source-11acbc9ed4d69f1c': [
    'ACANA Puppy está formulado para cachorros. Contiene pollo, pavo, huevos y platija; la receta tiene en cuenta las necesidades de los perros en crecimiento.',
    'ACANA Puppy призначено для цуценят. Рецептура містить курку, індичку, яйця та камбалу й враховує потреби собак у період росту.'
  ],
  'cmd-source-5902317db04f9f0e': [
    'ACANA Singles Beef with Pumpkin es un pienso sin cereales con ternera como única fuente de proteína animal. La calabaza y el boniato completan la receta.',
    'ACANA Singles Beef with Pumpkin - беззерновий корм із яловичиною як єдиним джерелом тваринного білка. Гарбуз і батат доповнюють м’ясну основу.'
  ],
  'cmd-source-3e01ebf957337e76': [
    'ACANA Singles Free-Run Duck combina pato y pera. Incluye carne y vísceras de pato; según el fabricante, el 50 % de los ingredientes procede del pato.',
    'ACANA Singles Free-Run Duck поєднує качку та грушу. У рецептурі є м’ясо й субпродукти качки; за даними виробника, з качки походять 50 % інгредієнтів.'
  ],
  'cmd-source-694e05cdc1b2582c': [
    'Churu Variedades Salmón y Pollo es un surtido de premios cremosos para gatos con sabores a salmón y pollo. La caja contiene 20 tubos de 14 g para ofrecer por separado o añadir a la comida.',
    'Churu Variedades Salmón y Pollo - набір кремових ласощів для котів зі смаками лосося та курки. У коробці 20 тюбиків по 14 г; їх можна давати окремо або додавати до корму.'
  ],
  'cmd-source-6d56f8fb416a81c4': [
    'ORIJEN Regional Red para perros combina ternera, jabalí, bisonte, cordero y cerdo. Según el fabricante, el 85 % de sus ingredientes es de origen animal y la receta no contiene cereales.',
    'ORIJEN Regional Red для собак поєднує яловичину, дикого кабана, бізона, ягня та свинину. За даними виробника, 85 % інгредієнтів мають тваринне походження; злаків у рецептурі немає.'
  ]
};

const detailCopy = {
  'Для взрослых кошек от 1 года': ['Para gatos adultos a partir de un año', 'Для дорослих котів віком від 1 року'],
  '30% свежего мяса птицы и 22% белка птицы': ['30 % de carne fresca de ave y 22 % de proteína de ave', '30 % свіжого м’яса птиці та 22 % білка птиці'],
  'Амарант 15% вместо злаков': ['15 % de amaranto en lugar de cereales', '15 % амаранту замість злаків'],
  'Для взрослых собак': ['Para perros adultos', 'Для дорослих собак'],
  'Курица, индейка и хек': ['Pollo, pavo y merluza', 'Курка, індичка та хек'],
  'Без зерновых ингредиентов': ['Sin ingredientes de cereales', 'Без зернових інгредієнтів'],
  'Для взрослых собак мелких пород': ['Para perros adultos de razas pequeñas', 'Для дорослих собак малих порід'],
  'Курица и хек': ['Pollo y merluza', 'Курка та хек'],
  'Мелкие гранулы': ['Croquetas pequeñas', 'Невеликі гранули'],
  'Свежая курица и куриная мука': ['Pollo fresco y harina de pollo', 'Свіжа курка та куряче борошно'],
  'Содержит перловку и овёс': ['Contiene cebada perlada y avena', 'Містить перловку та овес'],
  'Линейка Classics': ['Gama Classics', 'Лінійка Classics'],
  'Форель, лосось и хек': ['Trucha, salmón y merluza', 'Форель, лосось та хек'],
  'Для собак разных пород и возрастов': ['Para perros de distintas razas y edades', 'Для собак різних порід і віку'],
  'Говядина, свинина и ягнёнок': ['Ternera, cerdo y cordero', 'Яловичина, свинина та ягня'],
  'С тыквой и овощами': ['Con calabaza y verduras', 'З гарбузом та овочами'],
  'Сельдь, скумбрия, камбала, хек и морской окунь': ['Arenque, caballa, platija, merluza y gallineta', 'Оселедець, скумбрія, камбала, хек і морський окунь'],
  'Говядина, ягнёнок, свинина и пресноводная рыба': ['Ternera, cordero, cerdo y pescado de agua dulce', 'Яловичина, ягня, свинина та прісноводна риба'],
  '70% ингредиентов животного происхождения по данным производителя': ['70 % de ingredientes de origen animal según el fabricante', '70 % інгредієнтів тваринного походження за даними виробника'],
  'Курица, индейка, яйца и пресноводная рыба': ['Pollo, pavo, huevos y pescado de agua dulce', 'Курка, індичка, яйця та прісноводна риба'],
  'Курица, камбала и яйца': ['Pollo, platija y huevos', 'Курка, камбала та яйця'],
  'Рацион для контроля массы тела': ['Receta para controlar el peso', 'Раціон для контролю маси тіла'],
  'Для щенков': ['Para cachorros', 'Для цуценят'],
  'Курица, индейка, яйца и камбала': ['Pollo, pavo, huevos y platija', 'Курка, індичка, яйця та камбала'],
  'Один источник животного белка - говядина': ['Una fuente de proteína animal: ternera', 'Одне джерело тваринного білка - яловичина'],
  'С тыквой и бататом': ['Con calabaza y boniato', 'З гарбузом і бататом'],
  'Утка как единственный источник животного белка': ['Pato como única fuente de proteína animal', 'Качка як єдине джерело тваринного білка'],
  'С грушей': ['Con pera', 'З грушею'],
  'Ассорти вкусов лосося и курицы': ['Surtido de sabores a salmón y pollo', 'Асорті зі смаками лосося та курки'],
  '20 тюбиков по 14 г': ['20 tubos de 14 g', '20 тюбиків по 14 г'],
  'Кремовая текстура': ['Textura cremosa', 'Кремова текстура'],
  'Говядина, дикий кабан, бизон, ягнёнок и свинина': ['Ternera, jabalí, bisonte, cordero y cerdo', 'Яловичина, дикий кабан, бізон, ягня та свинина'],
  '85% ингредиентов животного происхождения по данным производителя': ['85 % de ingredientes de origen animal según el fabricante', '85 % інгредієнтів тваринного походження за даними виробника']
};

const pairs = [
  ...Object.values({ ...catalogEditorialCats, ...catalogEditorialDogs }).flatMap(copy => [
    [copy.description, [copy.esDescription, copy.ukDescription]],
    ...copy.details.map((detail, index) => [detail, [copy.esDetails[index], copy.ukDetails[index]]])
  ]),
  ...Object.entries(descriptionByProduct).map(([id, values]) => [catalogEditorialContent[id].description, values]),
  ...Object.entries(detailCopy),
  ['Беззерновой сухой корм с птицей для взрослых кошек Амарант заменяет злаки в повседневной рецептуре', [
    'Pienso seco sin cereales con ave para gatos adultos. Contiene un 30 % de carne fresca de ave, un 22 % de proteína de ave y un 15 % de amaranto, una semilla que sustituye a los cereales.',
    'Беззерновий сухий корм із птицею для дорослих котів. Містить 30 % свіжого м’яса птиці, 22 % білка птиці та 15 % амаранту - насіння, яке в цій рецептурі замінює злаки.'
  ]]
];

export const editorialEs = Object.fromEntries(pairs.map(([source, [es]]) => [source, es]));
export const editorialUk = Object.fromEntries(pairs.map(([source, [, uk]]) => [source, uk]));
