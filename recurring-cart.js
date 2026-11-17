import { cartSku } from './variants.js?v=sale-price-policy-20261109';

export const recurringKey = item => `${item.productId || item.id}|${item.variantId || ''}`;
export const recurringWeeks = [2, 4, 6];

export function normalizeRecurringDraft(value, cart) {
  const keys = new Set(cart.map(recurringKey));
  return { enabled: value?.enabled === true,
    cadenceWeeks: recurringWeeks.includes(Number(value?.cadenceWeeks)) ? Number(value.cadenceWeeks) : 4,
    items: Array.isArray(value?.items) ? value.items.filter(key => keys.has(key)) : [] };
}

export function recurringChoiceFromCart(value, cart) {
  const draft = normalizeRecurringDraft(value, cart);
  if (!draft.enabled) return null;
  const selected = new Set(draft.items);
  return { cadenceWeeks: draft.cadenceWeeks, items: cart.filter(item => selected.has(recurringKey(item)))
    .map(item => ({ productId: item.productId || item.id, variantId: item.variantId,
      qty: item.qty })) };
}

export function renderRecurringCart({ cart, products, draft, signedIn, accountsAvailable, language = 'ru',
  escape, icon }) {
  if (!accountsAvailable || !cart.length) return '';
  const current = normalizeRecurringDraft(draft, cart);
  const names = { ru: ['Покупать регулярно', 'Выберите товары и период. Перед каждым следующим заказом мы проверим наличие, цену и доставку. Оплата только после вашего подтверждения'],
    es: ['Comprar periódicamente', 'Elige productos y frecuencia. Antes de cada nuevo pedido comprobaremos disponibilidad, precio y entrega. Pagarás solo después de confirmar'],
    uk: ['Купувати регулярно', 'Оберіть товари та період. Перед кожним наступним замовленням ми перевіримо наявність, ціну й доставку. Оплата лише після вашого підтвердження'] };
  const [heading, description] = names[language] || names.ru;
  if (!signedIn) return `<section class="rc-flow-panel recurring-cart-card"><h2>${heading}</h2><p>${description}</p><a class="text-link" href="#/account/login?return=cart">Войти, чтобы настроить регулярный заказ ${icon('arrow')}</a></section>`;
  return `<section class="rc-flow-panel recurring-cart-card"><label class="recurring-main-toggle"><input type="checkbox" data-recurring-enable ${current.enabled ? 'checked' : ''}><span><strong>${heading}</strong><small>${description}</small></span></label>${current.enabled ? `<fieldset class="recurring-cart-items"><legend>Какие товары повторять</legend>${cart.map(item => {
    const sku = cartSku(item, products);
    const product = products.find(entry => entry.id === (item.productId || item.id));
    const key = recurringKey(item);
    return `<label><input type="checkbox" data-recurring-item value="${escape(key)}" ${current.items.includes(key) ? 'checked' : ''}><span>${escape(product?.name || sku?.name || 'Товар')} · ${escape(sku?.label || item.variantLabel || 'Вариант')} × ${item.qty}</span></label>`;
  }).join('')}</fieldset><label class="recurring-cadence">Как часто<select data-recurring-weeks>${recurringWeeks.map(weeks => `<option value="${weeks}" ${current.cadenceWeeks === weeks ? 'selected' : ''}>Каждые ${weeks} ${weeks === 2 || weeks === 4 ? 'недели' : 'недель'}</option>`).join('')}</select></label><p class="rc-flow-help">Регулярный заказ сохранится после оплаты этой покупки. Будущие покупки не оплачиваются автоматически</p>` : ''}</section>`;
}
