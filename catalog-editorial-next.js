// Copy prepared for the next SEO batch. Keep these pages on noindex until review.
// Sources refer to the exact European recipes; percentages are not inferred from names.
const copy = (source, previousDescription, description, esDescription, ukDescription,
  details, esDetails, ukDetails) => ({
  source, previousDescription, description, esDescription, ukDescription,
  details, esDetails, ukDetails
});

export const catalogEditorialNextNames = {
  'Royal Canin Sensory Feel - соус': ['Royal Canin Sensory Feel - en salsa', 'Royal Canin Sensory Feel - у соусі'],
  'Royal Canin Sensory Smell - соус': ['Royal Canin Sensory Smell - en salsa', 'Royal Canin Sensory Smell - у соусі'],
  'Royal Canin Sensory Taste - соус': ['Royal Canin Sensory Taste - en salsa', 'Royal Canin Sensory Taste - у соусі'],
  'Royal Canin Ageing 11+ - желе': ['Royal Canin Ageing 11+ - en gelatina', 'Royal Canin Ageing 11+ - у желе'],
  'Royal Canin Ageing 15+ - соус': ['Royal Canin Ageing 15+ - en salsa', 'Royal Canin Ageing 15+ - у соусі'],
  'Royal Canin Appetite Control Care - соус': ['Royal Canin Appetite Control Care - en salsa', 'Royal Canin Appetite Control Care - у соусі'],
  'Royal Canin Digestive Care Mousse': ['Royal Canin Digestive Care Mousse', 'Royal Canin Digestive Care Mousse'],
  'Royal Canin Hairball Care - желе': ['Royal Canin Hairball Care - en gelatina', 'Royal Canin Hairball Care - у желе'],
  'Royal Canin Kitten - паштет': ['Royal Canin Kitten - paté', 'Royal Canin Kitten - паштет']
};

export const catalogEditorialNext = {
  'rc-urinary': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/urinary-care-1800',
    'Полнорационный сухой корм Royal Canin Urinary Care',
    'Royal Canin Urinary Care - сухой рацион для взрослых кошек, разработанный для поддержания здоровья мочевыводящих путей. Формула регулирует минеральный баланс и помогает поддерживать низкий уровень pH мочи.',
    'Royal Canin Urinary Care es un pienso para gatos adultos formulado para ayudar a mantener la salud del tracto urinario. Regula el equilibrio mineral y ayuda a mantener un pH urinario bajo.',
    'Royal Canin Urinary Care - сухий раціон для дорослих котів, створений для підтримки здоров’я сечовивідних шляхів. Формула регулює мінеральний баланс і допомагає підтримувати низький рівень pH сечі.',
    ['Для взрослых кошек', 'Сбалансированное содержание минералов', 'Поддержка здоровья мочевыводящих путей'],
    ['Para gatos adultos', 'Contenido mineral equilibrado', 'Ayuda a mantener la salud urinaria'],
    ['Для дорослих котів', 'Збалансований вміст мінералів', 'Підтримка здоров’я сечовивідних шляхів']
  ),
  'rc-light': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/light-weight-care-2524',
    'Полнорационный сухой корм Royal Canin Light Weight Care',
    'Royal Canin Light Weight Care создан для взрослых кошек, склонных к набору веса. Умеренная энергетическая плотность и сочетание разных видов клетчатки помогают контролировать массу тела без отказа от полноценного рациона.',
    'Royal Canin Light Weight Care está formulado para gatos adultos con tendencia a ganar peso. Su aporte energético moderado y la combinación de fibras ayudan a controlar el peso dentro de una dieta completa.',
    'Royal Canin Light Weight Care призначений для дорослих котів зі схильністю до набору ваги. Помірна енергетична цінність і поєднання різних видів клітковини допомагають контролювати масу тіла в межах повноцінного раціону.',
    ['Для взрослых кошек, склонных к набору веса', 'Умеренная энергетическая плотность', 'Сочетание разных видов клетчатки'],
    ['Para gatos adultos con tendencia al sobrepeso', 'Aporte energético moderado', 'Combinación de fibras'],
    ['Для дорослих котів зі схильністю до зайвої ваги', 'Помірна енергетична цінність', 'Поєднання різних видів клітковини']
  ),
  'leonardo-senior': copy(
    'https://es.leonardo-catfood.com/leonardo-senior-7-5-kg',
    'Сухой корм для кошек Leonardo Senior',
    'LEONARDO Senior рассчитан на кошек старше 10 лет. В составе есть свежая птица; по сравнению со взрослыми рецептами этой линейки корм содержит меньше фосфора, натрия и белка.',
    'LEONARDO Senior está pensado para gatos mayores de 10 años y contiene carne fresca de ave. Frente a las recetas para adultos de la gama, presenta contenidos reducidos de fósforo, sodio y proteína.',
    'LEONARDO Senior розроблений для котів віком понад 10 років і містить свіже м’ясо птиці. Порівняно з дорослими раціонами лінійки він має менший вміст фосфору, натрію та білка.',
    ['Для кошек старше 10 лет', 'Со свежим мясом птицы', 'Снижены фосфор, натрий и белок'],
    ['Para gatos mayores de 10 años', 'Con carne fresca de ave', 'Fósforo, sodio y proteína reducidos'],
    ['Для котів віком понад 10 років', 'Зі свіжим м’ясом птиці', 'Знижений вміст фосфору, натрію та білка']
  ),
  'leonardo-senior-gf': copy(
    'https://es.leonardo-catfood.com/leonardo-senior-gf-7-5-kg',
    'Сухой корм для кошек Leonardo Senior GF',
    'LEONARDO Senior GF - беззерновой рацион для пожилых кошек с чувствительным пищеварением. Свежий лосось сочетается с амарантом вместо злаков; энергетическая ценность, содержание фосфора, натрия и белка снижены.',
    'LEONARDO Senior GF es un pienso sin cereales para gatos mayores sensibles. Combina salmón fresco con amaranto en lugar de cereales y reduce el aporte energético, el fósforo, el sodio y la proteína.',
    'LEONARDO Senior GF - беззерновий раціон для літніх котів із чутливим травленням. Свіжий лосось поєднано з амарантом замість злаків; енергетичну цінність, вміст фосфору, натрію та білка знижено.',
    ['Свежий лосось и амарант', 'Без зерновых ингредиентов', 'Для пожилых кошек'],
    ['Salmón fresco y amaranto', 'Sin ingredientes de cereales', 'Para gatos mayores'],
    ['Свіжий лосось і амарант', 'Без зернових інгредієнтів', 'Для літніх котів']
  ),
  'leonardo-complete': copy(
    'https://es.leonardo-catfood.com/leonardo-adult-complete-32-16-1-8-kg',
    'Сухой корм для кошек Leonardo Adult Complete 32/16',
    'LEONARDO Adult Complete 32/16 - сухой корм с птицей для взрослых кошек. Соотношение 32% белка и 16% жира и умеренная энергетическая ценность делают его вариантом для спокойных домашних и стерилизованных кошек.',
    'LEONARDO Adult Complete 32/16 es un pienso con ave para gatos adultos. Su 32 % de proteína, 16 % de grasa y aporte energético moderado lo hacen adecuado también para gatos esterilizados o poco activos.',
    'LEONARDO Adult Complete 32/16 - сухий корм із птицею для дорослих котів. Співвідношення 32 % білка та 16 % жиру й помірна енергетична цінність підходять також стерилізованим або малорухливим котам.',
    ['32% белка и 16% жира', 'Рецептура с птицей', 'Подходит малоподвижным кошкам'],
    ['32 % de proteína y 16 % de grasa', 'Receta con ave', 'También para gatos poco activos'],
    ['32 % білка та 16 % жиру', 'Рецептура з птицею', 'Також для малорухливих котів']
  ),
  'rc-persian': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/persian-adult-2552',
    'Полнорационный сухой корм Royal Canin Persian Adult',
    'Royal Canin Persian Adult предназначен для персидских кошек старше 12 месяцев. Миндалевидную гранулу удобнее захватывать короткой челюстью; комплекс жирных кислот поддерживает кожу и длинную шерсть, а клетчатка помогает выводить проглоченные волоски.',
    'Royal Canin Persian Adult está formulado para gatos persas de más de 12 meses. La croqueta con forma de almendra facilita la prensión; sus ácidos grasos cuidan la piel y el pelo largo, mientras la fibra ayuda a eliminar el pelo ingerido.',
    'Royal Canin Persian Adult призначений для перських котів віком понад 12 місяців. Мигдалеподібну гранулу легше захоплювати короткою щелепою; жирні кислоти підтримують шкіру й довгу шерсть, а клітковина допомагає виводити проковтнуту шерсть.',
    ['Для персидских кошек старше 12 месяцев', 'Миндалевидная гранула', 'Клетчатка для выведения шерсти'],
    ['Para persas de más de 12 meses', 'Croqueta con forma de almendra', 'Fibra para eliminar el pelo ingerido'],
    ['Для перських котів віком понад 12 місяців', 'Мигдалеподібна гранула', 'Клітковина для виведення шерсті']
  ),
  'leonardo-fish': copy(
    'https://es.leonardo-catfood.com/leonardo-adult-fish',
    'Сухой корм для кошек Leonardo Adult Fish',
    'LEONARDO Adult Fish - сухой корм для взрослых кошек со свежим лососем и морской рыбной мукой. В рецептуре есть криль и семена чиа; они дополняют рыбную основу источниками жирных кислот омега-3.',
    'LEONARDO Adult Fish es un pienso para gatos adultos con salmón fresco y harina de pescado marino. El krill y las semillas de chía completan la receta con fuentes de ácidos grasos omega-3.',
    'LEONARDO Adult Fish - сухий корм для дорослих котів зі свіжим лососем і борошном морської риби. Криль і насіння чіа доповнюють рибну основу джерелами жирних кислот омега-3.',
    ['Со свежим лососем и морской рыбой', 'Криль и семена чиа', 'Для взрослых кошек'],
    ['Con salmón fresco y pescado marino', 'Krill y semillas de chía', 'Para gatos adultos'],
    ['Зі свіжим лососем і морською рибою', 'Криль і насіння чіа', 'Для дорослих котів']
  ),
  'leonardo-lamb': copy(
    'https://es.leonardo-catfood.com/leonardo-adult-lamb',
    'Сухой корм для кошек Leonardo Adult Lamb',
    'LEONARDO Adult Lamb - сухой корм со свежей ягнятиной для взрослых кошек. Производитель предлагает эту рецептуру кошкам с чувствительным пищеварением; в составе также есть рис, криль и семена чиа.',
    'LEONARDO Adult Lamb es un pienso con cordero fresco para gatos adultos sensibles. La receta también incorpora arroz, krill y semillas de chía; el fabricante destaca su digestibilidad.',
    'LEONARDO Adult Lamb - сухий корм зі свіжою ягнятиною для дорослих котів із чутливим травленням. Рецептура також містить рис, криль і насіння чіа; виробник наголошує на її засвоюваності.',
    ['Со свежей ягнятиной', 'Для кошек с чувствительным пищеварением', 'Рис, криль и семена чиа'],
    ['Con cordero fresco', 'Para gatos con digestión sensible', 'Arroz, krill y semillas de chía'],
    ['Зі свіжою ягнятиною', 'Для котів із чутливим травленням', 'Рис, криль і насіння чіа']
  ),
  'dog-rc-mini-puppy': copy(
    'https://www.royalcanin.com/es/dogs/products/retail-products/mini-puppy-3000',
    'Сухой корм для щенков мелких пород',
    'Royal Canin Mini Puppy предназначен для щенков мелких пород до 10 месяцев, которые во взрослом возрасте весят до 10 кг. Небольшие гранулы подходят маленькой челюсти, а в рецептуре есть DHA - жирная кислота омега-3.',
    'Royal Canin Mini Puppy está formulado para cachorros de razas pequeñas de hasta 10 meses y hasta 10 kg de peso adulto. Las croquetas se adaptan a su mandíbula pequeña y la receta aporta DHA, un ácido graso omega-3.',
    'Royal Canin Mini Puppy призначений для цуценят малих порід віком до 10 місяців, доросла вага яких не перевищує 10 кг. Невеликі гранули підходять малій щелепі, а рецептура містить DHA - жирну кислоту омега-3.',
    ['Для щенков мелких пород до 10 месяцев', 'Ожидаемый взрослый вес до 10 кг', 'Небольшие гранулы и DHA'],
    ['Para cachorros pequeños de hasta 10 meses', 'Peso adulto de hasta 10 kg', 'Croquetas pequeñas y DHA'],
    ['Для цуценят малих порід віком до 10 місяців', 'Очікувана доросла вага до 10 кг', 'Невеликі гранули та DHA']
  ),
  'dog-rc-maxi-adult': copy(
    'https://www.royalcanin.com/es/dogs/products/retail-products/maxi-adult-3007',
    'Сухой корм для взрослых собак крупных пород',
    'Royal Canin Maxi Adult создан для собак весом 26-44 кг старше 15 месяцев. Легкоусвояемые белки и сочетание пищевых волокон учитывают особенности пищеварения крупных собак; размер гранул стимулирует жевание.',
    'Royal Canin Maxi Adult está destinado a perros de 26 a 44 kg y más de 15 meses. Combina proteínas digestibles y fibras para la digestión de las razas grandes; el tamaño de la croqueta favorece la masticación.',
    'Royal Canin Maxi Adult створений для собак вагою 26-44 кг віком понад 15 місяців. Легкозасвоювані білки та поєднання харчових волокон враховують травлення великих собак; розмір гранул заохочує жування.',
    ['Для собак весом 26-44 кг старше 15 месяцев', 'Легкоусвояемые белки и клетчатка', 'Крупные гранулы для жевания'],
    ['Para perros de 26 a 44 kg y más de 15 meses', 'Proteínas digestibles y fibras', 'Croquetas adaptadas para masticar'],
    ['Для собак вагою 26-44 кг віком понад 15 місяців', 'Легкозасвоювані білки та клітковина', 'Гранули, пристосовані для жування']
  ),
  'dog-ownat-classic-complet': copy(
    'https://www.ownat.com/classic-complet-perro',
    'Повседневный сухой корм для взрослых собак',
    'Ownat Classic Complet - сухой рацион для взрослых собак разных пород с обычной активностью. Рецептура содержит свежее мясо, цельные злаки и яблоко; производитель указывает 10% свежего мяса до приготовления.',
    'Ownat Classic Complet es un pienso para perros adultos de cualquier raza con actividad normal. Combina carne fresca, cereales integrales y manzana; el fabricante indica un 10 % de carne fresca antes de la cocción.',
    'Ownat Classic Complet - сухий раціон для дорослих собак різних порід зі звичайною активністю. Рецептура містить свіже м’ясо, цільні злаки та яблуко; виробник зазначає 10 % свіжого м’яса до приготування.',
    ['Для взрослых собак с обычной активностью', '10% свежего мяса до приготовления', 'С цельными злаками и яблоком'],
    ['Para perros adultos con actividad normal', '10 % de carne fresca antes de cocinar', 'Con cereales integrales y manzana'],
    ['Для дорослих собак зі звичайною активністю', '10 % свіжого м’яса до приготування', 'Із цільними злаками та яблуком']
  ),
  'leonardo-wet-kitten': copy(
    'https://es.leonardo-catfood.com/leonardo-finest-selection-kitten-puro-en-ave-16-x-85-g-es',
    'Влажный корм для кошек Leonardo Finest Selection Kitten Poultry',
    'LEONARDO Finest Selection Kitten Poultry - влажный корм для котят до года. Мясо и субпродукты птицы составляют 70% рецептуры; корм дополнен бульоном птицы и небольшим количеством лососевого масла.',
    'LEONARDO Finest Selection Kitten Poultry es un alimento húmedo para gatitos de hasta un año. La carne y las vísceras de ave representan el 70 % de la receta, acompañadas de caldo de ave y una pequeña cantidad de aceite de salmón.',
    'LEONARDO Finest Selection Kitten Poultry - вологий корм для кошенят віком до року. М’ясо та субпродукти птиці становлять 70 % рецептури; їх доповнюють бульйон із птиці та невелика кількість лососевої олії.',
    ['Для котят до одного года', '70% мяса и субпродуктов птицы', 'С лососевым маслом'],
    ['Para gatitos de hasta un año', '70 % de carne y vísceras de ave', 'Con aceite de salmón'],
    ['Для кошенят віком до року', '70 % м’яса та субпродуктів птиці', 'Із лососевою олією']
  ),
  'leonardo-wet-rabbit': copy(
    'https://es.leonardo-catfood.com/leonardo-finest-selection-conejo-cranberries-16-x-85-g-es',
    'Влажный корм для кошек Leonardo Finest Selection Rabbit & Cranberries',
    'В LEONARDO Finest Selection Rabbit & Cranberries кролик составляет 30% состава, курица - ещё 30%. Клюквы здесь 4%; в рецептуре также есть бульон и говяжьи субпродукты, поэтому это не корм с одним источником животного белка.',
    'En LEONARDO Finest Selection Rabbit & Cranberries, el conejo supone el 30 % de la receta y el pollo otro 30 %. Contiene un 4 % de cranberries, caldo y vísceras de vacuno; no es una fórmula de una sola proteína animal.',
    'У LEONARDO Finest Selection Rabbit & Cranberries кролик становить 30 % рецептури, курка - ще 30 %. Журавлини тут 4 %; також є бульйон і яловичі субпродукти, тому це не монобілковий корм.',
    ['30% кролика и 30% курицы', '4% клюквы', 'Также содержит говяжьи субпродукты'],
    ['30 % de conejo y 30 % de pollo', '4 % de cranberries', 'También contiene vísceras de vacuno'],
    ['30 % кролика та 30 % курки', '4 % журавлини', 'Також містить яловичі субпродукти']
  ),
  'leonardo-wet-buffalo': copy(
    'https://es.leonardo-catfood.com/leonardo-finest-selection-bufalo-arandanos-azules-16-x-85-g-es',
    'Влажный корм для кошек Leonardo Finest Selection Buffalo & Blueberries',
    'LEONARDO Finest Selection Buffalo & Blueberries сочетает 30% субпродуктов водяного буйвола и 30% курицы. Черники в рецептуре 3%; бульон также содержит буйвола, курицу и телятину.',
    'LEONARDO Finest Selection Buffalo & Blueberries combina un 30 % de vísceras de búfalo de agua con un 30 % de pollo. Incluye un 3 % de arándanos azules; el caldo contiene búfalo, pollo y ternera.',
    'LEONARDO Finest Selection Buffalo & Blueberries поєднує 30 % субпродуктів водяного буйвола і 30 % курки. Чорниці в рецептурі 3 %; бульйон також містить буйвола, курку й телятину.',
    ['30% водяного буйвола и 30% курицы', '3% черники', 'Бульон с телятиной'],
    ['30 % de búfalo de agua y 30 % de pollo', '3 % de arándanos azules', 'Caldo que también contiene ternera'],
    ['30 % водяного буйвола та 30 % курки', '3 % чорниці', 'Бульйон також містить телятину']
  ),
  'leonardo-wet-pheasant': copy(
    'https://es.leonardo-catfood.com/leonardo-finest-selection-faisan-cranberries-16-x-85-g-es',
    'Влажный корм для кошек Leonardo Finest Selection Pheasant & Cranberries',
    'LEONARDO Finest Selection Pheasant & Cranberries содержит 30% мяса фазана и 37% куриных сердца, печени и желудков. Клюквы в составе 2%; мясную основу дополняет бульон из курицы и фазана.',
    'LEONARDO Finest Selection Pheasant & Cranberries contiene un 30 % de carne de faisán y un 37 % de corazón, hígado y mollejas de pollo. Añade un 2 % de cranberries y caldo de pollo y faisán.',
    'LEONARDO Finest Selection Pheasant & Cranberries містить 30 % м’яса фазана та 37 % курячих серця, печінки й шлунків. Журавлини в складі 2 %; м’ясну основу доповнює бульйон із курки й фазана.',
    ['30% мяса фазана', '37% куриных субпродуктов', '2% клюквы'],
    ['30 % de carne de faisán', '37 % de vísceras de pollo', '2 % de cranberries'],
    ['30 % м’яса фазана', '37 % курячих субпродуктів', '2 % журавлини']
  ),
  'leonardo-wet-lamb-cranberry': copy(
    'https://es.leonardo-catfood.com/leonardo-finest-selection-cordero-cranberries-16-x-85-g-es',
    'Влажный корм для кошек Leonardo Finest Selection Lamb & Cranberries',
    'LEONARDO Finest Selection Lamb & Cranberries включает 36,5% мяса и субпродуктов ягнёнка и 30% птицы. Клюква составляет 4% рецептуры; это сочетание двух видов мяса, а не корм только с ягнёнком.',
    'LEONARDO Finest Selection Lamb & Cranberries reúne un 36,5 % de carne y vísceras de cordero con un 30 % de ave. Las cranberries representan el 4 % de la receta; no es un alimento elaborado solo con cordero.',
    'LEONARDO Finest Selection Lamb & Cranberries поєднує 36,5 % м’яса та субпродуктів ягняти з 30 % птиці. Журавлина становить 4 % рецептури; це корм із двома видами м’яса, а не лише з ягнятиною.',
    ['36,5% мяса и субпродуктов ягнёнка', '30% птицы', '4% клюквы'],
    ['36,5 % de carne y vísceras de cordero', '30 % de ave', '4 % de cranberries'],
    ['36,5 % м’яса та субпродуктів ягняти', '30 % птиці', '4 % журавлини']
  ),
  'leonardo-wet-duck-cheese': copy(
    'https://es.leonardo-catfood.com/leonardo-finest-selection-pato-queso-16-x-85-g-es',
    'Влажный корм для кошек Leonardo Finest Selection Duck & Cheese',
    'LEONARDO Finest Selection Duck & Cheese содержит 30% мяса и субпродуктов утки, а также куриные субпродукты. Сырные кубики составляют 4%; в составе присутствуют и говяжьи субпродукты, поэтому вкус не ограничивается уткой.',
    'LEONARDO Finest Selection Duck & Cheese contiene un 30 % de carne y vísceras de pato, además de vísceras de pollo. Los dados de queso representan el 4 %; la receta también incluye vísceras de vacuno.',
    'LEONARDO Finest Selection Duck & Cheese містить 30 % м’яса та субпродуктів качки, а також курячі субпродукти. Кубики сиру становлять 4 %; у складі також є яловичі субпродукти.',
    ['30% утки', '4% сырных кубиков', 'Также содержит курицу и говядину'],
    ['30 % de pato', '4 % de dados de queso', 'También contiene pollo y vacuno'],
    ['30 % качки', '4 % кубиків сиру', 'Також містить курку та яловичину']
  ),
  'leonardo-wet-fish-shrimp': copy(
    'https://es.leonardo-catfood.com/leonardo-finest-selection-pescado-gambas-16-x-85-g-es',
    'Влажный корм для кошек Leonardo Finest Selection Fish & Shrimps',
    'В рыбной рецептуре LEONARDO Finest Selection Fish & Shrimps 30% лосося, 18% сельди и 12% креветок. Кроме рыбы и морепродуктов, в составе есть 10% печени птицы.',
    'La receta LEONARDO Finest Selection Fish & Shrimps contiene un 30 % de salmón, un 18 % de arenque y un 12 % de gambas. También incorpora un 10 % de hígado de ave.',
    'Рибна рецептура LEONARDO Finest Selection Fish & Shrimps містить 30 % лосося, 18 % оселедця та 12 % креветок. Крім риби й морепродуктів, у складі є 10 % печінки птиці.',
    ['30% лосося и 18% сельди', '12% креветок', '10% печени птицы'],
    ['30 % de salmón y 18 % de arenque', '12 % de gambas', '10 % de hígado de ave'],
    ['30 % лосося та 18 % оселедця', '12 % креветок', '10 % печінки птиці']
  ),
  'leonardo-wet-trout-catnip': copy(
    'https://es.leonardo-catfood.com/leonardo-finest-selection-trucha-catnip-16-x-85-g-es',
    'Влажный корм для кошек Leonardo Finest Selection Trout & Catnip',
    'LEONARDO Finest Selection Trout & Catnip содержит 30% форели и столько же куриных сердца и печени. Кошачья мята добавлена в количестве 0,1%; в составе также есть говяжьи субпродукты.',
    'LEONARDO Finest Selection Trout & Catnip contiene un 30 % de trucha y otro 30 % de corazón e hígado de pollo. La hierba gatera representa el 0,1 %; la receta también incluye vísceras de vacuno.',
    'LEONARDO Finest Selection Trout & Catnip містить 30 % форелі та стільки ж курячих серця й печінки. Котячу м’яту додано в кількості 0,1 %; у складі також є яловичі субпродукти.',
    ['30% форели и 30% куриных субпродуктов', '0,1% кошачьей мяты', 'Также содержит говядину'],
    ['30 % de trucha y 30 % de vísceras de pollo', '0,1 % de hierba gatera', 'También contiene vacuno'],
    ['30 % форелі та 30 % курячих субпродуктів', '0,1 % котячої м’яти', 'Також містить яловичину']
  ),
  'leonardo-wet-meat-menu': copy(
    'https://es.leonardo-catfood.com/leonardo-finest-selection-menu-de-carne-16-x-85-g-es',
    'Влажный корм для кошек Leonardo Finest Selection Meat Menu',
    'LEONARDO Finest Selection Meat Menu соединяет 29% курицы, 29% телятины и 12% лёгких ягнёнка. Три вида мяса дополняет бульон из курицы, телятины и ягнёнка.',
    'LEONARDO Finest Selection Meat Menu combina un 29 % de pollo, un 29 % de ternera y un 12 % de pulmón de cordero. Se completa con caldo de estas tres carnes, por lo que su mezcla animal es distinta de las recetas centradas en un solo sabor.',
    'LEONARDO Finest Selection Meat Menu поєднує 29 % курки, 29 % телятини та 12 % легенів ягняти. Ці три види м’яса доповнює бульйон із курки, телятини й ягняти.',
    ['29% курицы и 29% телятины', '12% лёгких ягнёнка', 'Бульон из трёх видов мяса'],
    ['29 % de pollo y 29 % de ternera', '12 % de pulmón de cordero', 'Caldo de tres carnes'],
    ['29 % курки та 29 % телятини', '12 % легенів ягняти', 'Бульйон із трьох видів м’яса']
  ),
  'leonardo-wet-pure-turkey': copy(
    'https://es.leonardo-catfood.com/leonardo-finest-selection-puro-en-pavo-16-x-85-g-es',
    'Влажный корм для кошек Leonardo Finest Selection Pure Turkey',
    'LEONARDO Finest Selection Pure Turkey строится на индейке: мясо и субпродукты составляют 70% рецептуры, бульон из индейки - ещё 28,8%. Лососевое масло добавлено в небольшом количестве, а других видов мяса в составе нет.',
    'LEONARDO Finest Selection Pure Turkey se basa en pavo: la carne y las vísceras representan el 70 % de la receta y el caldo de pavo otro 28,8 %. Añade una pequeña cantidad de aceite de salmón, sin otras carnes.',
    'LEONARDO Finest Selection Pure Turkey побудований на індичці: м’ясо й субпродукти становлять 70 % рецептури, бульйон з індички - ще 28,8 %. Лососеву олію додано в невеликій кількості, інших видів м’яса немає.',
    ['70% мяса и субпродуктов индейки', '28,8% бульона из индейки', 'Без других видов мяса'],
    ['70 % de carne y vísceras de pavo', '28,8 % de caldo de pavo', 'Sin otras carnes'],
    ['70 % м’яса та субпродуктів індички', '28,8 % бульйону з індички', 'Без інших видів м’яса']
  ),
  'royalcanin-8d039848': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/sensory-feel-gravy-1519',
    'Влажный корм Royal Canin Sensory Feel - соус',
    'Royal Canin Sensory Feel - влажный корм для взрослых кошек с кусочками в соусе. Разная фактура кусочков и кремовая текстура соуса создают особые ощущения во рту; именно текстура отличает Feel от Smell и Taste.',
    'Royal Canin Sensory Feel ofrece bocaditos de distintas texturas en una salsa cremosa para gatos adultos. Se centra en la sensación en la boca, a diferencia de Sensory Smell y Taste, que destacan el aroma y el sabor.',
    'Royal Canin Sensory Feel - вологий корм для дорослих котів зі шматочками в соусі. Різна фактура шматочків і кремова текстура соусу створюють особливі відчуття в роті; саме текстура відрізняє Feel від Smell і Taste.',
    ['Кусочки разной фактуры в соусе', 'Акцент на ощущениях от текстуры', 'Для взрослых кошек'],
    ['Bocaditos de distintas texturas en salsa', 'Enfoque en la sensación bucal', 'Para gatos adultos'],
    ['Шматочки різної фактури в соусі', 'Акцент на відчуттях від текстури', 'Для дорослих котів']
  ),
  'royalcanin-659556dc': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/sensory-smell-chunks-in-gravy-1517',
    'Влажный корм Royal Canin Sensory Smell - соус',
    'Royal Canin Sensory Smell - кусочки в соусе для взрослых кошек, созданные с акцентом на аромат корма. Профиль запаха отличается от Sensory Feel и Taste; эта рецептура рассчитана на кошек, для которых запах особенно важен при выборе еды.',
    'Royal Canin Sensory Smell presenta trocitos en salsa para gatos adultos y se centra en el aroma del alimento. Su perfil olfativo se distingue de Sensory Feel y Taste y busca atraer a los gatos que eligen la comida por su olor.',
    'Royal Canin Sensory Smell - шматочки в соусі для дорослих котів з акцентом на ароматі корму. Профіль запаху відрізняється від Sensory Feel і Taste; рецептура орієнтована на котів, для яких запах особливо важливий під час вибору їжі.',
    ['Кусочки в соусе', 'Акцент на аромате корма', 'Для взрослых кошек'],
    ['Trocitos en salsa', 'Enfoque en el aroma', 'Para gatos adultos'],
    ['Шматочки в соусі', 'Акцент на ароматі корму', 'Для дорослих котів']
  ),
  'royalcanin-a510d4e9': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/sensory-taste-chunks-in-gravy-1518',
    'Влажный корм Royal Canin Sensory Taste - соус',
    'Royal Canin Sensory Taste - влажный корм с кусочками в соусе для взрослых кошек. Его вкусовой профиль создан с акцентом на мясные ноты и отличается от ароматической идеи Smell и текстурной идеи Feel.',
    'Royal Canin Sensory Taste es un alimento húmedo con trocitos en salsa para gatos adultos. Su perfil de sabor acentúa las notas cárnicas y se distingue del enfoque aromático de Smell y de la textura de Feel.',
    'Royal Canin Sensory Taste - вологий корм зі шматочками в соусі для дорослих котів. Смаковий профіль підкреслює м’ясні ноти й відрізняється від ароматичної ідеї Smell та текстурної ідеї Feel.',
    ['Кусочки в соусе', 'Акцент на мясных вкусовых нотах', 'Для взрослых кошек'],
    ['Trocitos en salsa', 'Enfoque en las notas de sabor cárnicas', 'Para gatos adultos'],
    ['Шматочки в соусі', 'Акцент на м’ясних смакових нотах', 'Для дорослих котів']
  ),
  'royalcanin-f2600773': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/ageing-12%2B-jelly-4153',
    'Влажный корм Royal Canin Ageing 11+ - желе',
    'Royal Canin Ageing 11+ в желе предназначен для кошек старше 11 лет. Мягкие кусочки легче есть пожилым животным; формула учитывает изменение потребностей в энергии и питательных веществах с возрастом.',
    'Royal Canin Ageing 11+ en gelatina está destinado a gatos mayores de 11 años. Sus trocitos de textura fácil de comer se adaptan a esta etapa y la fórmula tiene en cuenta las necesidades nutricionales de los gatos sénior.',
    'Royal Canin Ageing 11+ у желе призначений для котів віком понад 11 років. М’які шматочки легше їсти літнім тваринам; формула враховує вікові зміни потреб у поживних речовинах.',
    ['Для кошек старше 11 лет', 'Мягкие кусочки в желе', 'Рецептура для пожилых кошек'],
    ['Para gatos mayores de 11 años', 'Trocitos blandos en gelatina', 'Fórmula para la etapa sénior'],
    ['Для котів віком понад 11 років', 'М’які шматочки в желе', 'Рецептура для літніх котів']
  ),
  'royalcanin-d861a238': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/ageing-15%2B-chunks-in-gravy-8076',
    'Влажный корм Royal Canin Ageing 15+ - соус',
    'Royal Canin Ageing 15+ в соусе рассчитан на кошек старше 15 лет. Кусочки имеют текстуру, которую удобно есть пожилым животным; комплекс HealthyAge7 объединяет питательные вещества для семи аспектов здоровья в старшем возрасте.',
    'Royal Canin Ageing 15+ en salsa está formulado para gatos mayores de 15 años. Sus trocitos tienen una textura fácil de comer y el complejo HealthyAge7 reúne nutrientes destinados a siete aspectos de la salud en esta etapa.',
    'Royal Canin Ageing 15+ у соусі розроблений для котів віком понад 15 років. Шматочки мають текстуру, яку зручно їсти літнім тваринам; комплекс HealthyAge7 поєднує поживні речовини для семи аспектів здоров’я в старшому віці.',
    ['Для кошек старше 15 лет', 'Кусочки в соусе с удобной текстурой', 'Комплекс HealthyAge7'],
    ['Para gatos mayores de 15 años', 'Trocitos en salsa fáciles de comer', 'Complejo HealthyAge7'],
    ['Для котів віком понад 15 років', 'Шматочки в соусі з м’якою текстурою', 'Комплекс HealthyAge7']
  ),
  'royalcanin-6168e429': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/appetite-control-care-thin-slices-in-gravy-1466',
    'Влажный корм Royal Canin Appetite Control Care - соус',
    'Royal Canin Appetite Control Care в соусе создан для взрослых стерилизованных кошек, склонных просить еду между кормлениями. Формула с умеренным содержанием жира и энергии помогает контролировать массу тела; влажная текстура дополняет сухой рацион этой линейки.',
    'Royal Canin Appetite Control Care en salsa está pensado para gatos adultos esterilizados que piden comida entre tomas. Su contenido moderado de grasa y energía ayuda a controlar el peso; la textura húmeda complementa el pienso de la gama.',
    'Royal Canin Appetite Control Care у соусі створений для дорослих стерилізованих котів, які просять їжу між годуваннями. Помірний вміст жиру й енергії допомагає контролювати вагу; волога текстура доповнює сухий корм лінійки.',
    ['Для взрослых стерилизованных кошек', 'Умеренное содержание жира и энергии', 'Кусочки в соусе'],
    ['Para gatos adultos esterilizados', 'Grasa y energía moderadas', 'Trocitos en salsa'],
    ['Для дорослих стерилізованих котів', 'Помірний вміст жиру й енергії', 'Шматочки в соусі']
  ),
  'royalcanin-e34b38d7': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/digestive-care-loaf-1612',
    'Влажный корм Royal Canin Digestive Care Mousse',
    'Royal Canin Digestive Care Mousse - влажный корм с мягкой текстурой паштета для взрослых кошек с чувствительным пищеварением. Сбалансированная формула поддерживает пищеварение и качество стула; это отдельная текстура от версии с кусочками в соусе.',
    'Royal Canin Digestive Care Mousse ofrece una textura blanda tipo paté para gatos adultos con digestión sensible. Su fórmula equilibrada ayuda a mantener la digestión y la calidad de las heces; se distingue de la versión con trocitos en salsa.',
    'Royal Canin Digestive Care Mousse - вологий корм із м’якою текстурою паштету для дорослих котів із чутливим травленням. Збалансована формула підтримує травлення та якість випорожнень; це інша текстура, ніж версія зі шматочками в соусі.',
    ['Мягкая текстура паштета', 'Поддержка пищеварения', 'Для взрослых кошек'],
    ['Textura blanda de paté', 'Ayuda a la digestión', 'Para gatos adultos'],
    ['М’яка текстура паштету', 'Підтримка травлення', 'Для дорослих котів']
  ),
  'royalcanin-9f8011d7': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/hairball-care-thin-slices-in-jelly-1608',
    'Влажный корм Royal Canin Hairball Care - желе',
    'Royal Canin Hairball Care в желе предназначен для взрослых кошек, у которых образуются комки проглоченной шерсти. Сочетание пищевых волокон помогает естественному выведению волосков через пищеварительный тракт.',
    'Royal Canin Hairball Care en gelatina está formulado para gatos adultos propensos a las bolas de pelo. Su combinación de fibras ayuda al tránsito natural del pelo ingerido a través del aparato digestivo.',
    'Royal Canin Hairball Care у желе призначений для дорослих котів, у яких утворюються грудки проковтнутої шерсті. Поєднання харчових волокон допомагає природному виведенню шерсті через травний тракт.',
    ['Кусочки в желе', 'Клетчатка для выведения проглоченной шерсти', 'Для взрослых кошек'],
    ['Trocitos en gelatina', 'Fibras para eliminar el pelo ingerido', 'Para gatos adultos'],
    ['Шматочки в желе', 'Клітковина для виведення проковтнутої шерсті', 'Для дорослих котів']
  ),
  'royalcanin-7f8c2e4e': copy(
    'https://www.royalcanin.com/es/cats/products/retail-products/kitten-loaf-in-sauce-4145',
    'Влажный корм Royal Canin Kitten - паштет',
    'Royal Canin Kitten в форме паштета создан для котят в период активного роста после отъёма от матери. Мягкая текстура облегчает переход к самостоятельному питанию; рецепт учитывает потребности растущего котёнка.',
    'Royal Canin Kitten en paté está pensado para gatitos en la etapa de crecimiento tras el destete. Su textura blanda facilita el paso a la alimentación independiente y la receta responde a las necesidades del gatito en desarrollo.',
    'Royal Canin Kitten у формі паштету створений для кошенят у період активного росту після відлучення від матері. М’яка текстура полегшує перехід до самостійного харчування; рецепт враховує потреби кошеняти, що росте.',
    ['Паштет для котят после отъёма', 'Мягкая текстура', 'Рецептура для периода роста'],
    ['Paté para gatitos tras el destete', 'Textura blanda', 'Receta para la etapa de crecimiento'],
    ['Паштет для кошенят після відлучення', 'М’яка текстура', 'Рецептура для періоду росту']
  ),
};
