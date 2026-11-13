const pair = {
  'Duvo+ Farmz - говяжьи копыта, 6 шт': ['Duvo+ Farmz - pezuñas de vaca, 6 unidades', 'Duvo+ Farmz - яловичі копита, 6 шт'],
  'Duvo+ Meat! - сушёная утиная грудка 100 г': ['Duvo+ Meat! - pechuga de pato deshidratada 100 g', 'Duvo+ Meat! - сушена качина грудка 100 г'],
  'Шесть натуральных говяжьих копыт Farmz - плотное жевательное лакомство для собак, которым нравится долго грызть': ['Seis pezuñas de vaca naturales Farmz para perros que disfrutan de un premio firme y duradero para masticar', 'Шість натуральних яловичих копит Farmz - щільні жувальні ласощі для собак, які люблять довго гризти'],
  'Полоски сушёной утиной грудки Duvo+ Meat! можно дать собаке целиком или разделить на небольшие кусочки': ['Las tiras de pechuga de pato deshidratada Duvo+ Meat! se pueden dar enteras o dividir en trozos pequeños', 'Смужки сушеної качиної грудки Duvo+ Meat! можна дати собаці цілими або розділити на невеликі шматочки'],
  'Говяжьи копыта': ['Pezuñas de vaca', 'Яловичі копита'],
  'Упаковка 6 шт': ['Envase de 6 unidades', 'Упаковка 6 шт'],
  'Утиная грудка': ['Pechuga de pato', 'Качина грудка'],
  'Пакет 100 г': ['Bolsa de 100 g', 'Пакет 100 г'],
  'Полоски можно разделить на порции': ['Las tiras se pueden dividir en porciones', 'Смужки можна розділити на порції'],
  'Miscota - упаковка 6 шт': ['Miscota - envase de 6 unidades', 'Miscota - упаковка 6 шт'],
  'El Baúl de Yuma - та же фасовка': ['El Baúl de Yuma - mismo formato', 'El Baúl de Yuma - та сама фасовка']
};

export const yaguChewTestEs = Object.fromEntries(Object.entries(pair).map(([key, value]) => [key, value[0]]));
export const yaguChewTestUk = Object.fromEntries(Object.entries(pair).map(([key, value]) => [key, value[1]]));
