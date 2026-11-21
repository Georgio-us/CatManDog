// Copy is based on the supplier export of 18 Nov 2026 and Grania's 19 Nov
// clarification for SH-M-A60-G. Contradictory copied dimensions in the
// supplier's window copy are intentionally not repeated here.

const text = {
  ru: {
    more: 'Подробнее о товаре', less: 'Свернуть описание',
    metal: 'металлическим', wood: 'деревянным',
    sl: ', симметричная левая версия', sr: ', симметричная правая версия',
    ul: ', асимметричная левая версия', ur: ', асимметричная правая версия',
    wall: [
      'Настенная полка {shape}{length} см с {material} основанием{side} создаёт место для отдыха и наблюдения на высоте.',
      'На основании расположен мягкий матрас. Цвет ткани и отделку основания можно выбрать среди вариантов этой модели; соответствующие сменные матрасы и чехлы продаются отдельно.',
      'Полка крепится к стене и может стать частью маршрута из нескольких полок и ступенек Cat’s Atelier. Перед установкой проверьте материал стены и используйте крепёж по инструкции производителя; ступеньки не входят в комплект.'
    ],
    window: [
      'Оконная полка {shape}{length} см с {material} основанием - мягкое место для отдыха кошки у окна.',
      'Мягкий съёмный матрас лежит на полке; ткань чехла и отделку основания можно выбрать в доступных вариантах. Полка оставляет кошке место для отдыха и наблюдения за улицей.',
      'Крепление рассчитано на оконную раму, а не только на стекло. Перед заказом проверьте форму профиля и совместимость крепежа по инструкции производителя; способ установки может отличаться у разных моделей.'
    ],
    windowChecked: 'Эта модель подвешивается шнурами на металлических скобах за оконную раму, которая несёт вес полки. Присоски у края лишь стабилизируют изделие и защищают стекло; сверлить стекло не нужно. Перед заказом проверьте совместимость профиля рамы с креплением.',
    cover: [
      'Сменный тканевый чехол для матраса полки {shape}{length} см с {material} основанием.',
      'У чехла есть молния и пришитые ленты Velcro для фиксации на полке соответствующего размера. Цвет ткани выбирается при заказе.',
      'Это только сменный чехол: матрас, полка и крепёж продаются отдельно. Перед покупкой сопоставьте размер, материал основания и, для деревянной полки, форму вашей модели с артикулом чехла.'
    ],
    mattress: [
      'Отдельный мягкий матрас для полки {length} см с {material} основанием.',
      'Это комплектный матрас с полиуретановым наполнителем, внутренним слоем и наружным тканевым чехлом. Наружный чехол снимается через молнию; пришитые ленты Velcro помогают зафиксировать матрас на полке нужного размера.',
      'Полка в комплект не входит. Выберите ткань наружного чехла при заказе и проверьте соответствие длины и материала основания вашей полке Cat’s Atelier.'
    ],
    stepMetal: [
      'Плоская настенная ступенька из МДФ помогает кошке добраться до высоких полок.',
      'Площадка размером 10 × 21 см покрыта мягким войлоком, который помогает лапам не скользить. Металлический кронштейн закрыт декоративной накладкой; доступные цвета площадки и войлока выбираются при заказе.',
      'Ступеньку крепят к прочному основанию стены. Если стена обшита гипсокартоном, фиксировать изделие нужно к несущему каркасу, а не только к листу. Несколько ступенек можно расположить как путь к настенной полке.'
    ],
    stepWood: [
      'Плоская настенная ступенька из берёзовой фанеры помогает кошке добраться до высоких полок.',
      'Площадка размером 10 × 21 см покрыта мягким войлоком, который помогает лапам не скользить. Металлический кронштейн закрыт декоративной накладкой; доступные цвета площадки, войлока и кронштейна выбираются при заказе.',
      'Ступеньку крепят к прочному основанию стены. Если стена обшита гипсокартоном, фиксировать изделие нужно к несущему каркасу, а не только к листу. Несколько ступенек можно расположить как путь к настенной полке.'
    ],
    stepRound: [
      'Круглая настенная ступенька с сизалевой обмоткой помогает кошке подниматься к полкам и лежанкам.',
      'Поверхность из верёвки даёт лапам сцепление, а металлические торцы закрывают края конструкции. После установки крепёж не виден, поэтому ступенька выглядит как часть интерьера.',
      'Одна ступенька может служить переходом к полке; несколько позволяют собрать маршрут по стене. В комплект входят крепёж и инструкция производителя. Расстояние между ступенями подбирайте под размеры и подвижность кошки.'
    ]
  },
  es: {
    more: 'Más sobre el producto', less: 'Ocultar detalles',
    metal: 'metal', wood: 'madera',
    sl: ', versión simétrica izquierda', sr: ', versión simétrica derecha',
    ul: ', versión asimétrica izquierda', ur: ', versión asimétrica derecha',
    wall: [
      'El estante de pared {shape}de {length} cm con base de {material}{side} crea un lugar elevado para descansar y observar.',
      'La base lleva un colchón acolchado. Puedes elegir el tejido y el acabado de la base entre las opciones de este modelo; los colchones y las fundas de recambio se venden por separado.',
      'El estante se fija a la pared y puede formar parte de un recorrido con otros estantes y peldaños Cat’s Atelier. Antes de instalarlo, comprueba el material de la pared y sigue las instrucciones de fijación; los peldaños no están incluidos.'
    ],
    window: [
      'El estante de ventana {shape}de {length} cm con base de {material} ofrece al gato un lugar cómodo junto a la ventana.',
      'El colchón acolchado se puede retirar; el tejido de la funda y el acabado de la base se eligen entre las opciones disponibles. El estante ofrece al gato un lugar para descansar y observar el exterior.',
      'La fijación está prevista para el marco de la ventana, no solo para el cristal. Antes de pedirlo, comprueba el perfil y la compatibilidad del soporte según las instrucciones del fabricante; el montaje puede variar entre modelos.'
    ],
    windowChecked: 'Este modelo se suspende con cuerdas y ganchos metálicos sobre el marco, que soporta el peso del estante. Las ventosas del borde solo estabilizan la pieza y protegen el vidrio; no hay que perforar el cristal. Comprueba la compatibilidad del perfil de la ventana antes de pedirlo.',
    cover: [
      'Funda de tejido de recambio para el colchón del estante {shape}de {length} cm con base de {material}.',
      'La funda tiene cremallera y tiras de velcro cosidas para fijarla al estante del tamaño correspondiente. El color del tejido se elige al hacer el pedido.',
      'Se vende solo la funda de recambio: el colchón, el estante y los soportes no están incluidos. Antes de comprarla, comprueba la medida, el material de la base y, si es de madera, la forma del estante.'
    ],
    mattress: [
      'Colchón acolchado adicional para estante de {length} cm con base de {material}.',
      'Es un colchón completo con espuma de poliuretano, capa interior y funda exterior de tejido. La funda exterior tiene cremallera; las tiras de velcro cosidas ayudan a fijar el colchón al estante de la medida correspondiente.',
      'El estante no está incluido. Elige el tejido de la funda exterior al hacer el pedido y comprueba que la longitud y el material de la base coincidan con tu estante Cat’s Atelier.'
    ],
    stepMetal: [
      'El peldaño plano de pared de MDF ayuda al gato a alcanzar estantes elevados.',
      'La plataforma de 10 × 21 cm lleva fieltro suave que ayuda a evitar resbalones. El soporte metálico tiene una cubierta decorativa; los colores disponibles de la plataforma y del fieltro se eligen al hacer el pedido.',
      'Fija el peldaño a una parte resistente de la pared. Si hay placas de yeso, la fijación debe alcanzar la estructura portante, no solo la placa. Varios peldaños pueden formar un recorrido hasta un estante de pared.'
    ],
    stepWood: [
      'El peldaño plano de pared de contrachapado de abedul ayuda al gato a alcanzar estantes elevados.',
      'La plataforma de 10 × 21 cm lleva fieltro suave que ayuda a evitar resbalones. El soporte metálico tiene una cubierta decorativa; los colores disponibles de la plataforma, el fieltro y el soporte se eligen al hacer el pedido.',
      'Fija el peldaño a una parte resistente de la pared. Si hay placas de yeso, la fijación debe alcanzar la estructura portante, no solo la placa. Varios peldaños pueden formar un recorrido hasta un estante de pared.'
    ],
    stepRound: [
      'El peldaño redondo de pared recubierto de sisal ayuda al gato a subir a estantes y camas elevadas.',
      'La superficie de cuerda ofrece agarre para las patas y los extremos metálicos rematan la estructura. Una vez instalada, la fijación queda oculta y el peldaño se integra en la habitación.',
      'Un peldaño puede facilitar el acceso a un estante; varios permiten crear un recorrido por la pared. Incluye los elementos de fijación y las instrucciones del fabricante. Adapta la separación al tamaño y movilidad del gato.'
    ]
  },
  uk: {
    more: 'Докладніше про товар', less: 'Згорнути опис',
    metal: 'металевою', wood: 'дерев’яною',
    sl: ', симетрична ліва версія', sr: ', симетрична права версія',
    ul: ', асиметрична ліва версія', ur: ', асиметрична права версія',
    wall: [
      'Настінна полиця {shape}{length} см з {material} основою{side} створює місце для відпочинку та спостереження на висоті.',
      'На основі розміщений м’який матрац. Колір тканини та оздоблення основи можна вибрати серед варіантів цієї моделі; відповідні змінні матраци й чохли продаються окремо.',
      'Полиця кріпиться до стіни й може стати частиною маршруту з інших полиць і сходинок Cat’s Atelier. Перед установленням перевірте матеріал стіни та дотримуйтеся інструкції з кріплення; сходинки не входять до комплекту.'
    ],
    window: [
      'Віконна полиця {shape}{length} см з {material} основою - м’яке місце для відпочинку кота біля вікна.',
      'М’який знімний матрац лежить на полиці; тканину чохла та оздоблення основи можна вибрати серед доступних варіантів. Полиця дає коту місце для відпочинку й спостереження за вулицею.',
      'Кріплення призначене для віконної рами, а не лише для скла. Перед замовленням перевірте форму профілю та сумісність кріплення за інструкцією виробника; спосіб монтажу може відрізнятися між моделями.'
    ],
    windowChecked: 'Ця модель підвішується шнурами на металевих скобах до віконної рами, яка несе вагу полиці. Присоски біля краю лише стабілізують виріб і захищають скло; свердлити скло не потрібно. Перед замовленням перевірте сумісність профілю рами з кріпленням.',
    cover: [
      'Змінний тканинний чохол для матраца полиці {shape}{length} см з {material} основою.',
      'Чохол має блискавку та пришиті стрічки Velcro для фіксації на полиці відповідного розміру. Колір тканини вибирається під час замовлення.',
      'Продається лише змінний чохол: матрац, полиця та кріплення купуються окремо. Перед покупкою звірте розмір, матеріал основи та, для дерев’яної полиці, форму вашої моделі з артикулом чохла.'
    ],
    mattress: [
      'Окремий м’який матрац для полиці {length} см з {material} основою.',
      'Це комплектний матрац із поліуретановим наповнювачем, внутрішнім шаром і зовнішнім тканинним чохлом. Зовнішній чохол має блискавку; пришиті стрічки Velcro допомагають зафіксувати матрац на полиці відповідного розміру.',
      'Полиця не входить до комплекту. Виберіть тканину зовнішнього чохла під час замовлення та перевірте відповідність довжини й матеріалу основи вашій полиці Cat’s Atelier.'
    ],
    stepMetal: [
      'Плоска настінна сходинка з МДФ допомагає коту дістатися високих полиць.',
      'Платформа розміром 10 × 21 см вкрита м’яким фетром, який допомагає лапам не ковзати. Металевий кронштейн має декоративну накладку; доступні кольори платформи й фетру вибираються під час замовлення.',
      'Сходинку кріплять до міцної основи стіни. Якщо стіна обшита гіпсокартоном, виріб потрібно фіксувати до несучого каркаса, а не лише до листа. Кілька сходинок можуть утворити шлях до настінної полиці.'
    ],
    stepWood: [
      'Плоска настінна сходинка з березової фанери допомагає коту дістатися високих полиць.',
      'Платформа розміром 10 × 21 см вкрита м’яким фетром, який допомагає лапам не ковзати. Металевий кронштейн має декоративну накладку; доступні кольори платформи, фетру й кронштейна вибираються під час замовлення.',
      'Сходинку кріплять до міцної основи стіни. Якщо стіна обшита гіпсокартоном, виріб потрібно фіксувати до несучого каркаса, а не лише до листа. Кілька сходинок можуть утворити шлях до настінної полиці.'
    ],
    stepRound: [
      'Кругла настінна сходинка з обмоткою із сизалю допомагає коту підійматися до полиць і лежанок.',
      'Поверхня з мотузки дає лапам зчеплення, а металеві торці закривають краї конструкції. Після встановлення кріплення не видно, тому сходинка виглядає як частина інтер’єру.',
      'Одна сходинка може вести до полиці; кілька дають змогу скласти маршрут по стіні. У комплекті є кріплення й інструкція виробника. Відстань між сходинками добирайте за розміром і рухливістю кота.'
    ]
  }
};

function model(product) {
  const sku = product.manufacturerSku;
  const length = product.name.match(/(?:60|75|95|100) см/)?.[0].replace(' см', '')
    || sku.match(/(?:60|75|95|100)/)?.[0];
  let shape = ['Double Arch', 'Wave', 'Arc', 'Flat'].find(value => product.name.includes(value)) || '';
  if (sku === 'CO-W-95') shape = 'Wave';
  if (sku === 'CO-W-A60') shape = 'Arc';
  if (sku.startsWith('CO-W-F')) shape = 'Flat';
  const material = /^(?:SH|CO|MA)-M-/.test(sku) ? 'metal' : 'wood';
  const side = shape === 'Wave' ? (sku.match(/-(SL|SR|UL|UR)$/)?.[1] || '').toLowerCase() : '';
  const kind = product.productType === 'window' ? 'window'
    : sku.startsWith('SH-') ? 'wall'
      : sku.startsWith('CO-') ? 'cover'
        : sku.startsWith('MA-') ? 'mattress'
          : sku === 'ST-MB-F' ? 'stepMetal'
            : sku === 'ST-WB-F' ? 'stepWood' : 'stepRound';
  return { length, shape: shape ? shape + ' ' : '', material, side, kind };
}

export function atelierDescription(product, language = 'ru') {
  if (product?.brand !== 'Cat’s Atelier' || !product.manufacturerSku) return null;
  const lang = text[language] ? language : 'ru';
  const words = text[lang];
  const values = model(product);
  const parts = [...words[values.kind]];
  if (product.manufacturerSku === 'SH-M-A60-G') parts[2] = words.windowChecked;
  const vars = {
    length: values.length, shape: values.shape, material: words[values.material],
    side: words[values.side] || ''
  };
  const render = value => value.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
  const [summary, ...paragraphs] = parts.map(render);
  return { summary, paragraphs };
}

export function atelierDescriptionMarkup(product, language, escape) {
  const copy = atelierDescription(product, language);
  if (!copy) return '';
  const words = text[language] || text.ru;
  return '<p class="atelier-description-intro">' + escape(copy.summary) + '</p>'
    + '<details class="atelier-description-more"><summary><span class="atelier-more-label">'
    + escape(words.more) + '</span><span class="atelier-less-label">' + escape(words.less)
    + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"'
    + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/>'
    + '</svg></summary><div class="atelier-description-body">'
    + copy.paragraphs.map(paragraph => '<p>' + escape(paragraph) + '</p>').join('')
    + '</div></details>';
}
