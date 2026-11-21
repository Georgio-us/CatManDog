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
    standard: 'Доставка за 24-48 часов',
    atelier: 'Под заказ: ориентир 4-6 рабочих дней после подтверждения',
    heybo: 'HeyboPet под заказ: срок подтвердим после проверки склада поставщика',
    mixed: 'В заказе есть товары разных поставщиков: общий срок подтвердим после проверки'
  },
  es: {
    standard: 'Entrega en 24-48 horas',
    atelier: 'Por encargo: plazo estimado de 4 a 6 días laborables tras la confirmación',
    heybo: 'HeyboPet por encargo: confirmaremos el plazo tras consultar al proveedor',
    mixed: 'El pedido incluye productos de varios proveedores: confirmaremos el plazo tras comprobarlos'
  },
  uk: {
    standard: 'Доставка за 24-48 годин',
    atelier: 'Під замовлення: орієнтовно 4-6 робочих днів після підтвердження',
    heybo: 'HeyboPet під замовлення: строк підтвердимо після перевірки складу постачальника',
    mixed: 'У замовленні є товари різних постачальників: загальний строк підтвердимо після перевірки'
  }
};

export function deliveryTiming(kind, language = 'ru') {
  return (copy[language] || copy.ru)[kind] || copy.ru.standard;
}
