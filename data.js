import { applyCatalogPolicy } from './catalog-policy.js';
import { applyRetailUpdates } from './retail-updates.js?v=retail-coverage-1';
import { applyProvisionalPrices } from './provisional-prices.js';
import { foodProducts as originalFoodProducts } from './food-products.js?v=r2-media-1';
import { expandRoyalCaninFood } from './royal-canin-products.js?v=r2-media-1';
import { expandPriorityFood } from './priority-food-products.js?v=r2-media-1';
import { heybopetProducts } from './heybopet-products.js?v=r2-media-1';
import { treatsCareProducts } from './treats-care-products.js?v=r2-media-1';
import { yaguProducts, expandYaguCare } from './yagu-products.js?v=r2-media-1';
import { ownatProducts } from './ownat-products.js?v=r2-media-1';
import { dogProducts } from './dog-products.js?v=r2-media-1';

const foodProducts = [...expandPriorityFood(expandRoyalCaninFood(originalFoodProducts)), ...ownatProducts];

export const categories = ["Корм", "Лакомства", "Наполнитель", "Игрушки и аксессуары", "Миски и поилки", "Переноски", "Окна и балконы", "Уход", "Подарочные наборы"];

const demoProducts = [
  {
    "id": "bowl",
    "name": "Керамическая миска Pebble",
    "category": "Миски и поилки",
    "pet": "cat",
    "price": 19,
    "image": 1,
    "tag": "Выбор CatManDog",
    "line": "CatManDog · Home collection",
    "sizes": [
      "400 мл",
      "800 мл"
    ],
    "description": "Небольшая деталь, которая делает каждый день приятнее Устойчивая керамическая миска в спокойном шалфейном оттенке для корма и свежей воды",
    "details": [
      "Глазурованная керамика",
      "Подходит для воды и сухого корма",
      "Можно мыть в посудомоечной машине"
    ],
    "optionLabel": "Объём",
    "isNew": false
  },
  {
    "id": "rope",
    "name": "Дразнилка Loop",
    "category": "Игрушки",
    "pet": "cat",
    "price": 12,
    "image": 2,
    "tag": "Для игр вместе",
    "line": "CatManDog · Play everyday",
    "sizes": [
      "Один размер"
    ],
    "description": "Лёгкая дразнилка с деревянной ручкой, гибким шнуром и перьями Для маленькой домашней охоты: шуршит, движется и приглашает поиграть вместе",
    "details": [
      "Дерево, шнур и натуральные перья",
      "Играйте вместе под присмотром; после игры убирайте дразнилку",
      "Проверяйте шнур и крепления перед каждой игрой"
    ],
    "optionLabel": "Размер",
    "isNew": false
  },
  {
    "id": "mouse",
    "name": "Мышка Cotton",
    "category": "Игрушки",
    "pet": "cat",
    "price": 5.5,
    "image": 18,
    "tag": "Первая игрушка",
    "line": "CatManDog · Play everyday",
    "sizes": [
      "1 шт",
      "Набор из 3"
    ],
    "description": "Маленькая мягкая мышка с тонким хвостиком Её удобно ловить лапой, носить по дому и прятать под диван - простая игрушка для любимой домашней охоты",
    "details": [
      "Мягкая хлопковая оболочка",
      "Для игры под присмотром",
      "Проверяйте швы и хвостик; повреждённую игрушку замените"
    ],
    "optionLabel": "Комплектация",
    "isNew": false
  },
  {
    "id": "rabbit",
    "name": "Вязаный зайчик Sage",
    "category": "Игрушки",
    "pet": "cat",
    "price": 14.5,
    "image": 19,
    "tag": "В подарок",
    "line": "CatManDog · Little joys",
    "sizes": [
      "Один размер"
    ],
    "description": "Тактильный вязаный зайчик в шалфейном оттенке Маленький красивый подарок кошке и её человеку - для игр лапами, домашних фотографий и уютных моментов",
    "details": [
      "Мягкая вязаная оболочка без пластиковых глаз",
      "Лёгкий наполнитель внутри",
      "Игра под присмотром; бережная ручная очистка"
    ],
    "optionLabel": "Размер",
    "isNew": false
  },
  {
    "id": "puzzle",
    "name": "Головоломка для лакомств Sense",
    "category": "Игрушки",
    "pet": "cat",
    "price": 24,
    "image": 20,
    "tag": "Игра с задачкой",
    "line": "CatManDog · Play everyday",
    "sizes": [
      "Один размер"
    ],
    "description": "Спрячьте несколько лакомств под подвижными крышечками и предложите кошке найти их Спокойная игра на любопытство, которую удобно включить в домашний день",
    "details": [
      "Деревянная основа и подвижные элементы",
      "Начинайте с открытых ячеек и небольшого количества лакомств",
      "Используйте под присмотром; протирайте влажной тканью"
    ],
    "optionLabel": "Размер",
    "isNew": true
  },
  {
    "id": "scratch-arch",
    "name": "Когтеточка-лежанка Arch",
    "category": "Игрушки",
    "pet": "cat",
    "price": 39,
    "image": 21,
    "tag": "Два любимых занятия",
    "line": "CatManDog · Home collection",
    "sizes": [
      "60 × 25 см"
    ],
    "description": "Потянуться, поцарапать, прилечь Изогнутая картонная когтеточка объединяет привычную активность и небольшое место для отдыха, не перегружая интерьер",
    "details": [
      "Плотный гофрокартон",
      "Удобная дугообразная форма для царапания и отдыха",
      "Держите вдали от воды; заменяйте по мере износа"
    ],
    "optionLabel": "Размер",
    "isNew": false
  },
  {
    "id": "bowl-steel",
    "name": "Стальная миска Everyday",
    "category": "Миски и поилки",
    "pet": "cat",
    "price": 8.5,
    "image": 24,
    "tag": "Базовый выбор",
    "line": "CatManDog · Daily essentials",
    "sizes": [
      "250 мл",
      "400 мл"
    ],
    "description": "Небольшая стальная миска для корма или воды Лёгкая, понятная и удобная в уходе - для ежедневного использования дома или в поездке",
    "details": [
      "Нержавеющая сталь",
      "Невысокие бортики",
      "Мойте после кормления; можно мыть в посудомоечной машине"
    ],
    "optionLabel": "Объём",
    "isNew": false
  },
  {
    "id": "bowls-duo",
    "name": "Миски на подставке Duo",
    "category": "Миски и поилки",
    "pet": "cat",
    "price": 39,
    "image": 25,
    "tag": "Красиво дома",
    "line": "CatManDog · Home collection",
    "sizes": [
      "2 × 300 мл"
    ],
    "description": "Две кремовые керамические миски на низкой деревянной подставке Собранное место для кормления, которое выглядит естественно рядом с вашей кухней",
    "details": [
      "Две съёмные керамические миски",
      "Подставка из светлого дерева",
      "Миски можно мыть в машине; деревянную основу протирайте вручную"
    ],
    "optionLabel": "Комплектация",
    "isNew": false
  },
  {
    "id": "creamy-treats",
    "name": "Кремовые лакомства Creamy",
    "category": "Корм",
    "pet": "cat",
    "price": 4.9,
    "image": 32,
    "tag": "Маленькая радость",
    "line": "CatManDog · Little celebrations",
    "sizes": [
      "4 × 15 г"
    ],
    "description": "Порционные кремовые лакомства для спокойных моментов вместе Небольшие стики удобно предложить с ложечки, добавить в подарок или взять с собой в поездку",
    "details": [
      "4 стика по 15 г",
      "Дополнительное угощение, не замена основному рациону",
      "После вскрытия хранить в холодильнике и использовать в течение суток"
    ],
    "optionLabel": "Упаковка",
    "isNew": true,
    "catalogHidden": true
  },
  {
    "id": "crunchy-treats",
    "name": "Хрустящие лакомства Crunchy",
    "category": "Корм",
    "pet": "cat",
    "price": 6.5,
    "image": 33,
    "tag": "Для маленьких побед",
    "line": "CatManDog · Little celebrations",
    "sizes": [
      "60 г"
    ],
    "description": "Небольшие хрустящие кусочки для игр, знакомства с новой игрушкой и приятных домашних ритуалов Лёгкий гостинец, который удобно положить в подарочную коробку",
    "details": [
      "Упаковка 60 г с закрывающимся краем",
      "Дополнительное угощение; учитывайте его в суточном рационе",
      "Храните закрытым в сухом прохладном месте"
    ],
    "optionLabel": "Упаковка",
    "isNew": true,
    "catalogHidden": true
  },
  {
    "id": "pure-treats",
    "name": "Рыбные лакомства Pure",
    "category": "Корм",
    "pet": "cat",
    "price": 8.9,
    "image": 34,
    "tag": "Особенное угощение",
    "line": "CatManDog · Little celebrations",
    "sizes": [
      "25 г"
    ],
    "description": "Небольшие сублимированные кусочки рыбы в аккуратной упаковке Для тех, кто хочет добавить в набор особенный вкус и побаловать кошку чем-то новым",
    "details": [
      "Упаковка 25 г",
      "Сублимированная рыба; дополнительное угощение",
      "Вводите новый вкус маленькими порциями; храните упаковку плотно закрытой"
    ],
    "optionLabel": "Упаковка",
    "isNew": true,
    "catalogHidden": true
  },
  {
    "id": "halloween-bandana",
    "name": "Бандана Pumpkin Mood",
    "category": "Аксессуары",
    "pet": "cat",
    "price": 9,
    "image": 35,
    "tag": "Хэллоуин",
    "line": "CatManDog · Little celebrations",
    "sizes": [
      "XS",
      "S"
    ],
    "description": "Мягкая бандана в приглушённом тыквенном оттенке с маленьким сезонным рисунком Для короткого праздничного кадра - или просто красивого оформления подарка",
    "details": [
      "Мягкий текстиль; декоративный аксессуар",
      "Используйте только если кошке комфортно; можно положить рядом для фото",
      "Не затягивайте и не оставляйте на кошке без присмотра; ручная стирка"
    ],
    "optionLabel": "Размер",
    "isNew": true
  },
  {
    "id": "elf-hat",
    "name": "Праздничная шапочка Little Elf",
    "category": "Аксессуары",
    "pet": "cat",
    "price": 9.9,
    "image": 36,
    "tag": "Первый Новый год",
    "line": "CatManDog · Little celebrations",
    "sizes": [
      "Один размер"
    ],
    "description": "Маленькая мягкая шапочка в шалфейном оттенке с кремовой отделкой Для первого новогоднего фото кота: аксессуар можно держать рядом, не надевая на питомца",
    "details": [
      "Мягкий текстиль без резинок и завязок",
      "Декор для короткого фото; не фиксируйте на животном",
      "Если кошке некомфортно, используйте рядом как реквизит; бережная ручная очистка"
    ],
    "optionLabel": "Размер",
    "isNew": true
  },
  {
    "id": "birthday-bandana",
    "name": "Бандана Birthday Star",
    "category": "Аксессуары",
    "pet": "cat",
    "price": 8.9,
    "image": 37,
    "tag": "Его особенный день",
    "line": "CatManDog · Little celebrations",
    "sizes": [
      "XS",
      "S"
    ],
    "description": "Кремовая бандана с маленькими шалфейными звёздами Для дня рождения, годовщины встречи и других дат, которые хочется отметить вместе с любимым хвостиком",
    "details": [
      "Мягкий текстиль с неброским рисунком",
      "Декоративный аксессуар; используйте только если кошке комфортно",
      "Не затягивайте и не оставляйте без присмотра; можно использовать как декор для фото"
    ],
    "optionLabel": "Размер",
    "isNew": true
  },
  {
    "id": "gift-visit",
    "name": "Набор «В гости с подарком»",
    "category": "Подарочные наборы",
    "pet": "cat",
    "price": 24.9,
    "image": "https://img.catmandog.es/assets/gift-visit.png",
    "tag": "Гостинец для кота",
    "line": "CatManDog · Little celebrations",
    "sizes": [
      "Готовый набор"
    ],
    "description": "Идёте в гости к человеку, у которого есть кот? Возьмите подарок и для маленького хозяина дома Две мягкие игрушки, кремовые лакомства и открытка в красивой коробке - ничего лишнего, всё с заботой",
    "details": [
      "Вязаный зайчик Sage, мышка Cotton и Creamy 4 × 15 г",
      "Подарочная коробка, лента и открытка включены",
      "Состав, варианты и пожелание выбираются в карточке набора"
    ],
    "optionLabel": "Комплектация",
    "isNew": true,
    "gift": "visit"
  },
  {
    "id": "gift-season",
    "name": "Сезонный набор «Праздник с хвостиком»",
    "category": "Подарочные наборы",
    "pet": "cat",
    "price": 29.9,
    "image": "https://img.catmandog.es/assets/gift-halloween.png",
    "tag": "Хэллоуин · сейчас",
    "line": "CatManDog · Little celebrations",
    "sizes": [
      "Хэллоуин",
      "Новый год"
    ],
    "description": "Маленький праздник для большого любимца Выберите осенний Хэллоуин или новогодний предзаказ: в каждом наборе есть игрушка, кошачьи лакомства и сезонный аксессуар для короткого кадра",
    "details": [
      "Хэллоуин: мышка Cotton, Crunchy 60 г и бандана Pumpkin Mood",
      "Новый год: зайчик Sage, Pure 25 г и шапочка Little Elf",
      "Подарочная упаковка и открытка включены; предзаказ пока демонстрационный"
    ],
    "optionLabel": "Праздник",
    "isNew": true,
    "gift": "season"
  },
  {
    "id": "gift-personal",
    "name": "Набор «Его особенный день»",
    "category": "Подарочные наборы",
    "pet": "cat",
    "price": 16,
    "image": 39,
    "tag": "Соберите сами",
    "line": "CatManDog · Little celebrations",
    "sizes": [
      "Индивидуальный набор"
    ],
    "description": "Первый день рождения, год с вами или просто ваша особенная дата Соберите набор под характер кота: любимая игрушка, подходящее лакомство и праздничный аксессуар по желанию",
    "details": [
      "Выбор из трёх игрушек и трёх видов лакомств",
      "Бандана Birthday Star - по желанию",
      "Подарочная коробка и открытка - 5,60 €; итог зависит от выбранного состава"
    ],
    "optionLabel": "Комплектация",
    "isNew": true,
    "gift": "personal"
  }
];

// Preserve gift components until the gift assortment is researched separately
const heybopetFamilyNames = {
  'heybopet-feeder': 'Heybo Pet - автокормушка без камеры',
  'heybopet-camera-feeder': 'Heybo Pet - автокормушка с камерой'
};
const catalogHeybopetProducts = heybopetProducts.map(p => ({ ...p, name: heybopetFamilyNames[p.id] || p.name }));
const mergedCategory = category => ["Игрушки", "Аксессуары"].includes(category) ? "Игрушки и аксессуары" : category;
const mergeCategory = product => {
  if (mergedCategory(product.category) === product.category) return product;
  return {
    ...product,
    category: mergedCategory(product.category),
    ...(product.variants ? { variants: product.variants.map(variant => ({ ...variant, category: mergedCategory(variant.category) })) } : {})
  };
};
export const products = applyProvisionalPrices(applyRetailUpdates(applyCatalogPolicy([...foodProducts, ...dogProducts, ...expandYaguCare(treatsCareProducts), ...yaguProducts, ...catalogHeybopetProducts, ...demoProducts.map(p => ["Игрушки", "Миски и поилки"].includes(p.category) ? { ...p, catalogHidden: true } : p)]).map(mergeCategory)));
export const catalogProducts = products.filter(p => !p.catalogHidden);

export { articles } from './journal-content.js';
