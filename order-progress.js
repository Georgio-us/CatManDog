export const orderSteps = [
  ['received', 'Заказ получен'],
  ['packing', 'Собираем заказ'],
  ['delivering', 'Везём к вам'],
  ['delivered', 'Доставлен']
];

export function orderVariantId(products, item) {
  if (item.variantId) return item.variantId;
  const parent = products.find(product => product.id === item.productId);
  const matches = parent?.variants?.filter(variant => variant.label === item.size || variant.sizes?.includes(item.size)) || [];
  return matches.length === 1 ? matches[0].id : null;
}

export function orderProgress(status, { icon, escape }) {
  const current = Math.max(0, orderSteps.findIndex(([key]) => key === status));
  return `<ol class="order-progress" aria-label="Статус заказа">${orderSteps.map(([key, label], index) => `<li class="${index < current ? 'completed' : index === current ? 'current' : ''}" ${index === current ? 'aria-current="step"' : ''}><span class="order-progress-icon">${index < current ? icon('check') : index + 1}</span><span>${escape(label)}</span></li>`).join('')}</ol>`;
}
