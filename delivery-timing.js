export function productDeliveryKind(product, variant = product) {
  const id = String(product?.id || product?.productId || '');
  const brand = String(product?.brand || '');
  if (id.startsWith('cats-atelier-') || brand === 'Cat’s Atelier') return 'atelier';
  if (id.startsWith('heybopet-') || /^(?:heybo pet|heybopet)$/i.test(brand)) {
    const sourcing = variant?.serverSourcingAvailability || variant?.serverAvailabilityStatus;
    const onHand = sourcing ? sourcing === 'on_hand' : variant?.fulfillment === 'stock';
    return onHand ? 'standard' : 'heybo';
  }
  return 'standard';
}

export function cartDeliveryKind(items = []) {
  const kinds = new Set(items.map(item => productDeliveryKind(item, item)));
  if (kinds.has('atelier') && kinds.has('heybo')) return 'mixed';
  if (kinds.has('heybo')) return 'heybo';
  if (kinds.has('atelier')) return 'atelier';
  return 'standard';
}

const copy = {
  ru: {
    standard: 'Валенсия: 24-48 часов · материк: 2-4 дня · острова, Сеута и Мелилья: 2-10 рабочих дней',
    local: 'Доставка по Валенсии за 24-48 часов',
    national: 'Доставка по Испании: материк 2-4, острова, Сеута и Мелилья 2-10 рабочих дней',
    atelier: 'Под заказ: ориентир 4-6 рабочих дней после подтверждения',
    heybo: 'HeyboPet под заказ: срок подтвердим после проверки склада поставщика',
    mixed: 'В заказе есть товары разных поставщиков: общий срок подтвердим после проверки'
  },
  es: {
    standard: 'València: 24-48 horas · península: 2-4 días · islas, Ceuta y Melilla: 2-10 días laborables',
    local: 'Entrega en València en 24-48 horas',
    national: 'Entrega en España: península 2-4 días, islas, Ceuta y Melilla 2-10 días laborables',
    atelier: 'Por encargo: plazo estimado de 4 a 6 días laborables tras la confirmación',
    heybo: 'HeyboPet por encargo: confirmaremos el plazo tras consultar al proveedor',
    mixed: 'El pedido incluye productos de varios proveedores: confirmaremos el plazo tras comprobarlos'
  },
  uk: {
    standard: 'Валенсія: 24-48 годин · материк: 2-4 дні · острови, Сеута й Мелілья: 2-10 робочих днів',
    local: 'Доставка у Валенсії за 24-48 годин',
    national: 'Доставка Іспанією: материк 2-4, острови, Сеута й Мелілья 2-10 робочих днів',
    atelier: 'Під замовлення: орієнтовно 4-6 робочих днів після підтвердження',
    heybo: 'HeyboPet під замовлення: строк підтвердимо після перевірки складу постачальника',
    mixed: 'У замовленні є товари різних постачальників: загальний строк підтвердимо після перевірки'
  }
};

export function deliveryTiming(kind, language = 'ru', region = 'all') {
  const messages = copy[language] || copy.ru;
  return kind === 'standard' && region !== 'all'
    ? messages[region] || messages.standard
    : messages[kind] || copy.ru.standard;
}

export function importChargesNotice(language = 'ru') {
  return ({
    ru: 'Для Канарских островов, Сеуты и Мелильи при вручении возможны местные налоги и таможенные сборы. Их оплачивает получатель отдельно; бесплатная доставка от 99 € покрывает только перевозку',
    es: 'Para Canarias, Ceuta y Melilla pueden aplicarse impuestos locales y gastos de aduana a la entrega. Los paga el destinatario por separado; el envío gratuito a partir de 99 € solo cubre el transporte',
    uk: 'Для Канарських островів, Сеути й Мелільї під час вручення можливі місцеві податки та митні збори. Їх окремо сплачує одержувач; безплатна доставка від 99 € покриває лише перевезення'
  })[language] || 'Для Канарских островов, Сеуты и Мелильи при вручении возможны местные налоги и таможенные сборы. Их оплачивает получатель отдельно; бесплатная доставка от 99 € покрывает только перевозку';
}
