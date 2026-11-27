import { cartSku, storefrontPrice } from './variants.js?v=sale-price-policy-20261109';
import { recurringProductCard } from './recurring-product-ui.js?v=recurring-cards-20261117';

export const recurringKey = item => `${item.productId || item.id}|${item.variantId || ''}`;
export const recurringWeeks = [2, 4, 6];
export const nextRecurringDate = () => { const day=new Date(); day.setDate(day.getDate()+1); return `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`; };

export function normalizeRecurringDraft(value, cart) {
  const keys = new Set(cart.map(recurringKey));
  return { enabled: value?.enabled === true,
    cadenceWeeks: recurringWeeks.includes(Number(value?.cadenceWeeks)) ? Number(value.cadenceWeeks) : 4,
    nextDate: /^\d{4}-\d{2}-\d{2}$/.test(value?.nextDate || '') ? value.nextDate : nextRecurringDate(),
    items: Array.isArray(value?.items) ? value.items.filter(key => keys.has(key)) : [] };
}

export function recurringChoiceFromCart(value, cart) {
  const draft = normalizeRecurringDraft(value, cart);
  if (!draft.enabled) return null;
  const selected = new Set(draft.items);
  return { cadenceWeeks: draft.cadenceWeeks, nextDate: draft.nextDate, items: cart.filter(item => selected.has(recurringKey(item)))
    .map(item => ({ productId: item.productId || item.id, variantId: item.variantId,
      qty: item.qty })) };
}

export function renderRecurringCart({ cart, products, draft, signedIn, accountsAvailable, language = 'ru',
  escape, icon, imageBlock, money }) {
  if (!accountsAvailable || !cart.length) return '';
  const current = normalizeRecurringDraft(draft, cart);
  const names = { ru: ['Покупать регулярно', 'Выберите товары и период. Перед каждым следующим заказом мы проверим наличие, цену и доставку. Оплата только после вашего подтверждения'],
    es: ['Comprar periódicamente', 'Elige productos y frecuencia. Antes de cada nuevo pedido comprobaremos disponibilidad, precio y entrega. Pagarás solo después de confirmar'],
    uk: ['Купувати регулярно', 'Оберіть товари та період. Перед кожним наступним замовленням ми перевіримо наявність, ціну й доставку. Оплата лише після вашого підтвердження'] };
  const [heading, description] = names[language] || names.ru;
  const labels = {
    ru: { step: 'Шаг 1 · Корзина', guest: 'Выбрать товары можно здесь до оформления или после оплаты в кабинете',
      login: 'Войти, чтобы настроить регулярный заказ', legend: 'Выберите товары для повтора',
      frequency: 'Как часто', nextDate:'Желаемая дата следующего заказа', selected: 'Вы выбираете товары сейчас, до оформления. План сохранится после оплаты этой покупки. Следующую покупку и её цену согласуем с вами отдельно',
      idle: 'Можно выбрать нужные товары сейчас или вернуться к ним после оплаты в кабинете' },
    es: { step: 'Paso 1 · Cesta', guest: 'Puedes elegir los productos aquí antes de pagar o después en tu cuenta',
      login: 'Iniciar sesión para programar compras periódicas', legend: 'Elige los productos que quieres repetir',
      frequency: 'Frecuencia', nextDate:'Fecha deseada para el próximo pedido', selected: 'Elige los productos antes de finalizar la compra. Guardaremos el plan después del pago. Confirmaremos contigo la próxima compra y su precio',
      idle: 'Puedes elegir los productos ahora o después del pago en tu cuenta' },
    uk: { step: 'Крок 1 · Кошик', guest: 'Товари можна вибрати тут до оформлення або після оплати в кабінеті',
      login: 'Увійти, щоб налаштувати регулярне замовлення', legend: 'Оберіть товари для повторення',
      frequency: 'Як часто', nextDate:'Бажана дата наступного замовлення', selected: 'Виберіть товари зараз, до оформлення. План збережеться після оплати цієї покупки. Наступну покупку та її ціну узгодимо з вами окремо',
      idle: 'Можна вибрати товари зараз або повернутися до них після оплати в кабінеті' }
  }[language] || null;
  const copy = labels || { step: 'Шаг 1 · Корзина', guest: '', login: 'Войти', legend: 'Выберите товары для повтора',
    frequency: 'Как часто', selected: '', idle: '' };
  const cadenceLabel = weeks => language === 'es' ? `Cada ${weeks} semanas`
    : language === 'uk' ? `Кожні ${weeks} ${weeks === 6 ? 'тижнів' : 'тижні'}`
      : `Каждые ${weeks} ${weeks === 6 ? 'недель' : 'недели'}`;
  if (!signedIn) return `<section class="rc-flow-panel recurring-cart-card"><span class="recurring-step-label">${copy.step}</span>${current.enabled && current.items.length ? `<label class="recurring-main-toggle"><input type="checkbox" checked disabled><span><strong>${heading}</strong><small>${description}</small></span></label>` : `<h2>${heading}</h2><p>${description}</p>`}<p>${copy.guest}</p><a class="text-link" href="#/account/login?return=cart">${copy.login} ${icon('arrow')}</a></section>`;
  return `<section class="rc-flow-panel recurring-cart-card"><span class="recurring-step-label">${copy.step}</span><label class="recurring-main-toggle"><input type="checkbox" data-recurring-enable ${current.enabled ? 'checked' : ''}><span><strong>${heading}</strong><small>${description}</small></span></label>${current.enabled ? `<fieldset class="recurring-cart-items"><legend>${copy.legend}</legend>${cart.map(item => {
    const sku = cartSku(item, products);
    const product = products.find(entry => entry.id === (item.productId || item.id));
    const key = recurringKey(item);
    return recurringProductCard({ item: { ...item, displayPrice: storefrontPrice(sku) }, sku, product,
      imageBlock, escape, money, language, selected: current.items.includes(key),
      input: `<input type="checkbox" data-recurring-item value="${escape(key)}" ${current.items.includes(key) ? 'checked' : ''}>` });
  }).join('')}</fieldset><div class="recurring-cart-schedule"><label class="recurring-cadence">${copy.nextDate}<input type="date" data-recurring-next-date min="${nextRecurringDate()}" value="${current.nextDate}"></label><label class="recurring-cadence">${copy.frequency}<select data-recurring-weeks>${recurringWeeks.map(weeks => `<option value="${weeks}" ${current.cadenceWeeks === weeks ? 'selected' : ''}>${cadenceLabel(weeks)}</option>`).join('')}</select></label></div><p class="rc-flow-help">${copy.selected}</p>` : `<p class="rc-flow-help">${copy.idle}</p>`}</section>`;
}
