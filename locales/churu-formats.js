const flavors = [
  ['Churu - тунец', 'Churu - atún', 'Churu - тунець'],
  ['Churu - курица', 'Churu - pollo', 'Churu - курка'],
  ['Churu - тунец с гребешком', 'Churu - atún con vieira', 'Churu - тунець із гребінцем'],
  ['Churu - курица с сыром', 'Churu - pollo con queso', 'Churu - курка із сиром']
];

export const churuFormatsEs = {
  '4 тюбика × 14 г': '4 tubos × 14 g',
  '1 тюбик × 14 г': '1 tubo × 14 g',
  'Короб 12 пачек × 4 тюбика': 'Caja de 12 sobres × 4 tubos',
  'Короб 20 тюбиков × 14 г': 'Caja de 20 tubos × 14 g',
  '1 тюбик × 14 г · лосося': '1 tubo × 14 g · salmón',
  '1 тюбик × 14 г · лосося с курицей': '1 tubo × 14 g · salmón y pollo',
  'Churu - лосось и курица': 'Churu - salmón y pollo',
  'Кремовые лакомства Churu со вкусами лосося и лосося с курицей':
    'Premios cremosos Churu con salmón y salmón con pollo',
  'Churu - лосось и курица, короб 20 тюбиков': 'Churu - salmón y pollo, caja de 20 tubos',
  'Churu лосося - один тюбик 14 г': 'Churu salmón - un tubo de 14 g',
  'Churu лосося с курицей - один тюбик 14 г': 'Churu salmón y pollo - un tubo de 14 g',
  'Один запечатанный тюбик кремового лакомства Churu 14 г':
    'Un tubo cerrado de premio cremoso Churu de 14 g',
  '12 закрытых пачек Churu по 4 тюбика 14 г одного вкуса':
    '12 sobres cerrados Churu de 4 tubos de 14 g del mismo sabor',
  'Кремовое лакомство Churu со вкусом лосося в одном тюбике 14 г':
    'Premio cremoso Churu de salmón en un tubo de 14 g',
  'Кремовое лакомство Churu со вкусом лосося с курицей в одном тюбике 14 г':
    'Premio cremoso Churu de salmón y pollo en un tubo de 14 g'
};

export const churuFormatsUk = {
  'Churu - лосось и курица': 'Churu - лосось і курка',
  'Кремовые лакомства Churu со вкусами лосося и лосося с курицей':
    'Кремові ласощі Churu зі смаками лосося та лосося з куркою',
  '4 тюбика × 14 г': '4 тюбики × 14 г',
  '1 тюбик × 14 г': '1 тюбик × 14 г',
  'Короб 12 пачек × 4 тюбика': 'Короб 12 пачок × 4 тюбики',
  'Короб 20 тюбиков × 14 г': 'Короб 20 тюбиків × 14 г',
  '1 тюбик × 14 г · лосося': '1 тюбик × 14 г · лосось',
  '1 тюбик × 14 г · лосося с курицей': '1 тюбик × 14 г · лосось із куркою',
  'Churu - лосось и курица, короб 20 тюбиков': 'Churu - лосось і курка, короб 20 тюбиків',
  'Churu лосося - один тюбик 14 г': 'Churu лосось - один тюбик 14 г',
  'Churu лосося с курицей - один тюбик 14 г': 'Churu лосось із куркою - один тюбик 14 г',
  'Один запечатанный тюбик кремового лакомства Churu 14 г':
    'Один запечатаний тюбик кремових ласощів Churu 14 г',
  '12 закрытых пачек Churu по 4 тюбика 14 г одного вкуса':
    '12 закритих пачок Churu по 4 тюбики 14 г одного смаку',
  'Кремовое лакомство Churu со вкусом лосося в одном тюбике 14 г':
    'Кремові ласощі Churu зі смаком лосося в одному тюбику 14 г',
  'Кремовое лакомство Churu со вкусом лосося с курицей в одном тюбике 14 г':
    'Кремові ласощі Churu зі смаком лосося з куркою в одному тюбику 14 г'
};

for (const [source, es, uk] of flavors) {
  churuFormatsEs[`${source} - один тюбик 14 г`] = `${es} - un tubo de 14 g`;
  churuFormatsEs[`${source} - 12 упаковок по 4 тюбика`] = `${es} - 12 sobres de 4 tubos`;
  churuFormatsUk[`${source} - один тюбик 14 г`] = `${uk} - один тюбик 14 г`;
  churuFormatsUk[`${source} - 12 упаковок по 4 тюбика`] = `${uk} - 12 пачок по 4 тюбики`;
}
