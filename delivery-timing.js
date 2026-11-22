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
    standard: 'Валенсия: 24-48 часов · материковая Испания: 2-4 рабочих дня',
    local: 'Доставка по Валенсии за 24-48 часов',
    national: 'Доставка по материковой Испании за 2-4 рабочих дня',
    atelier: 'Под заказ: ориентир 4-6 рабочих дней после подтверждения',
    heybo: 'HeyboPet под заказ: срок подтвердим после проверки склада поставщика',
    mixed: 'В заказе есть товары разных поставщиков: общий срок подтвердим после проверки'
  },
  es: {
    standard: 'València: 24-48 horas · España peninsular: 2-4 días laborables',
    local: 'Entrega en València en 24-48 horas',
    national: 'Entrega en la España peninsular en 2-4 días laborables',
    atelier: 'Por encargo: plazo estimado de 4 a 6 días laborables tras la confirmación',
    heybo: 'HeyboPet por encargo: confirmaremos el plazo tras consultar al proveedor',
    mixed: 'El pedido incluye productos de varios proveedores: confirmaremos el plazo tras comprobarlos'
  },
  uk: {
    standard: 'Валенсія: 24-48 годин · материкова Іспанія: 2-4 робочі дні',
    local: 'Доставка у Валенсії за 24-48 годин',
    national: 'Доставка материковою Іспанією за 2-4 робочі дні',
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
