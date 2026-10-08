import { travelSources } from './useful-data.js';
// Stable keys preserve check marks when a saved trip is reopened
export function tripChecklist(trip) {
  const items = [
    { id: 'stay', group: 'До поездки', title: 'Подтвердить размещение с питомцем', text: 'Уточните правила жилья, возможную доплату и ограничения' },
    { id: 'carrier', group: 'В дорогу', title: 'Подготовить переноску', text: 'Проверьте размер, вентиляцию и надёжность креплений' },
    { id: 'supplies', group: 'В дорогу', title: 'Собрать привычные вещи', text: 'Корм, вода, миска, пелёнки, пакеты и знакомая подстилка' },
    { id: 'contacts', group: 'До поездки', title: 'Сохранить контакты клиники в месте назначения', text: 'Выберите клинику и запишите телефон для экстренной связи' }
  ];
  if (trip.destination === 'eu') items.unshift(
    { id: 'passport', group: 'Документы', title: 'Проверить европейский паспорт питомца', text: 'Для поездок между странами ЕС требуется действующий паспорт питомца', source: travelSources.eu },
    { id: 'rabies', group: 'Документы', title: 'Проверить чип и действительность прививки от бешенства', text: 'Чип должен предшествовать вакцинации После первичной прививки обычно требуется минимум 21 день - точную дату допуска подтвердите с ветеринаром', source: travelSources.eu },
    { id: 'country', group: 'Документы', title: 'Проверить правила выбранной страны', text: 'Уточните требования для вида и возраста вашего питомца по конкретному маршруту', source: travelSources.eu }
  );
  if (trip.destination === 'outside') items.unshift(
    { id: 'entry', group: 'Документы', title: 'Уточнить требования въезда в стране назначения', text: 'Нужны правила официальной ветеринарной службы выбранной страны - универсального списка документов нет' },
    { id: 'return', group: 'Документы', title: 'Заранее проверить условия возвращения в ЕС', text: 'Обсудите с ветеринаром документы и необходимость анализа на антитела к бешенству до выезда', source: travelSources.eu }
  );
  if (trip.transport === 'renfe') items.push(
    { id: 'ticket', group: 'Перевозчик', title: 'Оформить перевозку питомца в Renfe', text: 'Для малых питомцев в AVE и дальних поездах - до 10 кг, переноска до 60 × 35 × 35 см и отдельный билет Проверьте условия именно вашего типа поезда', source: travelSources.renfe }
  );
  if (trip.transport === 'iberia') items.push(
    { id: 'flight', group: 'Перевозчик', title: 'Подтвердить место питомца на каждом рейсе', text: 'В салоне Iberia - до 8 кг вместе с переноской, до 45 × 35 × 25 см Проверьте ограничения рейса, породы и фактического перевозчика', source: travelSources.iberia }
  );
  if (trip.transport === 'other') items.push({ id: 'operator', group: 'Перевозчик', title: 'Получить правила своего перевозчика', text: 'Подтвердите допуск питомца, документы, переноску и место на каждом участке маршрута' });
  if (trip.transport === 'car') items.push({ id: 'car', group: 'В дорогу', title: 'Продумать безопасное размещение в автомобиле', text: 'Подготовьте закреплённую переноску и запланируйте остановки' });
  return items;
}
export function tripProgress(trip) {
  const items = tripChecklist(trip); const done = items.filter(item => trip.checked?.includes(item.id)).length;
  return { done, total: items.length, percent: Math.round(done / items.length * 100) };
}
