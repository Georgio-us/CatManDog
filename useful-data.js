// Official sources checked 7 October 2026; no live opening or availability inference
export const checkedAt = '2026-10-07';
export const clinics = [
  { id: 'felinaria', name: 'Felinaria', area: 'Benicalap', address: 'C/ Río Bidasoa, 53, 46025 Valencia', phone: '+34 638 716 417', catsOnly: true, feline: true, emergency: false, description: 'Клиника исключительно для кошек - специализированная кошачья медицина', hours: 'Пн 9:30-16:00 · Вт-Чт 9:30-19:00 · Пт 9:30-15:00', source: 'https://felinaria.com/contacto/', servicesSource: 'https://felinaria.com/' },
  { id: 'constitucion', name: 'AniCura Constitución', area: 'Север Валенсии', address: 'C/ Alcudia de Crespins, 12, 46019 Valencia', phone: '+34 963 651 410', catsOnly: false, feline: false, emergency: true, description: 'Ветеринарный госпиталь с круглосуточным экстренным приёмом', hours: 'Экстренный приём 24/7 · Плановый Пн-Пт 10:00-21:00 · Сб 10:00-13:00', source: 'https://www.anicura.es/clinicas/constitucion-hospital-veterinario/contacto/', servicesSource: 'https://www.anicura.es/clinicas/constitucion-hospital-veterinario/nuestros-servicios/' },
  { id: 'ucv', name: 'Hospital Veterinario UCV', area: 'Pérez Galdós', address: 'Avda Pérez Galdós, 51, 46018 Valencia', phone: '+34 963 217 113', catsOnly: false, feline: false, emergency: true, description: 'Госпиталь специализированной помощи и экстренного приёма - уточните порядок обращения', hours: 'Экстренный приём 24/7 · Плановый приём уточняйте у госпиталя', source: 'https://www.ucv.es/hospital-veterinario-ucv/contacto', servicesSource: 'https://www.ucv.es/hospital-veterinario-ucv' },
  { id: 'tendetes', name: 'Clínica Veterinaria Tendetes', area: 'Tendetes', address: 'Avenida Burjassot, 43 bajo, 46009 Valencia', phone: '+34 963 407 759', catsOnly: false, feline: true, emergency: false, description: 'Общий приём и кошачья медицина - принимает кошек и собак', hours: 'Пн-Пт 9:30-20:00 · Сб 10:00-13:30 · Летом расписание меняется', source: 'https://veterinariatendetes.es/contacto', servicesSource: 'https://veterinariatendetes.es/especialidades/gatos' }
];
export const travelSources = {
  eu: { name: 'Your Europe - поездки с питомцами', url: 'https://europa.eu/youreurope/citizens/travel/carry/pets-and-other-animals/index_es.htm' },
  renfe: { name: 'Renfe - правила для питомцев', url: 'https://www.renfe.com/es/es/viajar/informacion-util/mascotas' },
  iberia: { name: 'Iberia - правила для питомцев', url: 'https://www.iberia.com/es/viajar-con-iberia/animales/' }
};
export const destinations = { spain: 'По Испании', eu: 'Из Испании в другую страну ЕС', outside: 'Из Испании за пределы ЕС' };
export const transports = { car: 'Автомобиль', renfe: 'Поезд Renfe', iberia: 'Самолёт Iberia', other: 'Другой перевозчик' };
