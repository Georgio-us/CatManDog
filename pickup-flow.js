import { cartSku, storefrontPrice } from './variants.js';

export const pickupCopy = {
  es: { cart:'Cesta para recogida', back:'Seguir eligiendo', empty:'Todavía no has añadido productos para recoger',
    intro:'Solo productos que tenemos disponibles para recoger. Te contactaremos para acordar la hora',
    name:'Nombre (opcional)', phone:'Teléfono', email:'Email', pay:'Pagar con Stripe',
    unavailable:'La recogida de uno de los productos ya no está disponible. Revisa la cesta',
    subtotal:'Productos', discount:'Descuento', delivery:'Recogida', free:'Gratis', total:'Total con IVA',
    terms:'Antes de pagar, consulta las condiciones de compra y devoluciones',
    cancelled:'El pago no se completó. Los productos siguen en tu cesta',
    waiting:'Comprobando el pago', paid:'Pedido pagado', paidNote:'Te contactaremos para acordar cuándo recogerlo',
    pending:'El pago aún no está confirmado. Puedes comprobarlo de nuevo', retry:'Comprobar pago',
    error:'No hemos podido iniciar el pago. Inténtalo de nuevo', changed:'El precio ha cambiado. Revisa el total y vuelve a pagar',
    number:'Número de pedido', shop:'Ver productos para recoger',
    count: n => `${n} ${n === 1 ? 'producto' : 'productos'}` },
  ru: { cart:'Корзина самовывоза', back:'Выбирать дальше', empty:'Вы пока не добавили товары для самовывоза',
    intro:'Здесь только товары для самовывоза. После оплаты свяжемся с вами и согласуем время',
    name:'Имя (необязательно)', phone:'Телефон', email:'Email', pay:'Оплатить через Stripe',
    unavailable:'Один из товаров уже недоступен для самовывоза. Проверьте корзину',
    subtotal:'Товары', discount:'Скидка', delivery:'Самовывоз', free:'Бесплатно', total:'Итого с IVA',
    terms:'Перед оплатой ознакомьтесь с условиями покупки и возврата',
    cancelled:'Оплата не завершена. Товары остались в корзине',
    waiting:'Проверяем оплату', paid:'Заказ оплачен', paidNote:'Свяжемся с вами, чтобы согласовать время получения',
    pending:'Оплата ещё не подтверждена. Можно проверить её снова', retry:'Проверить оплату',
    error:'Не удалось начать оплату. Попробуйте ещё раз', changed:'Цена изменилась. Проверьте итог и повторите оплату',
    number:'Номер заказа', shop:'Товары для самовывоза',
    count: n => `${n} товар${n === 1 ? '' : n < 5 ? 'а' : 'ов'}` },
  uk: { cart:'Кошик самовивозу', back:'Вибирати далі', empty:'Ви ще не додали товари для самовивозу',
    intro:'Тут лише товари для самовивозу. Після оплати зв’яжемося з вами та узгодимо час',
    name:'Ім’я (необов’язково)', phone:'Телефон', email:'Email', pay:'Оплатити через Stripe',
    unavailable:'Один із товарів уже недоступний для самовивозу. Перевірте кошик',
    subtotal:'Товари', discount:'Знижка', delivery:'Самовивіз', free:'Безкоштовно', total:'Разом з IVA',
    terms:'Перед оплатою ознайомтеся з умовами купівлі та повернення',
    cancelled:'Оплату не завершено. Товари залишилися в кошику',
    waiting:'Перевіряємо оплату', paid:'Замовлення оплачено', paidNote:'Зв’яжемося з вами, щоб узгодити час отримання',
    pending:'Оплату ще не підтверджено. Можна перевірити ще раз', retry:'Перевірити оплату',
    error:'Не вдалося почати оплату. Спробуйте ще раз', changed:'Ціна змінилася. Перевірте суму та повторіть оплату',
    number:'Номер замовлення', shop:'Товари для самовивозу',
    count: n => `${n} ${n === 1 ? 'товар' : n < 5 ? 'товари' : 'товарів'}` }
};

export function pickupBasketPage({ cart, products, language, money, escape, icon, promo, contact = {},
  error = '', busy = false, cancelled = false }) {
  const copy = pickupCopy[language] || pickupCopy.es;
  const terms = language === 'es' ? '/purchase-terms-es.html'
    : language === 'uk' ? '/purchase-terms-uk.html' : '/purchase-terms.html';
  const lines = cart.map((item, index) => {
    const product = products.find(entry => entry.id === (item.productId || item.id));
    const sku = cartSku(item, products);
    const price = storefrontPrice(sku);
    return { item, index, product, sku, price };
  });
  const valid = lines.length > 0 && lines.every(line => line.sku?.pickupAvailable === true &&
    Number.isFinite(line.price) && line.price > 0 && line.item.qty > 0);
  const subtotal = lines.reduce((sum, line) => sum + (line.price || 0) * line.item.qty, 0);
  const discount = Math.round(subtotal * (Number(promo?.percent) || 0)) / 100;
  const rows = lines.map(({ item, index, product, sku, price }) =>
    `<li class="pickup-basket-item"><div><strong>${escape(product?.name || item.productId)}</strong><small>${escape(sku?.label || '')}</small></div><div class="pickup-basket-controls"><button type="button" data-pickup-qty="${index}" data-delta="-1" aria-label="${language === 'es' ? 'Reducir cantidad' : language === 'uk' ? 'Зменшити кількість' : 'Уменьшить количество'}">${icon('minus')}</button><span>${item.qty}</span><button type="button" data-pickup-qty="${index}" data-delta="1" aria-label="${language === 'es' ? 'Aumentar cantidad' : language === 'uk' ? 'Збільшити кількість' : 'Увеличить количество'}">${icon('plus')}</button></div><strong>${price === null ? '—' : money(price * item.qty)}</strong><button type="button" class="pickup-remove" data-pickup-remove="${index}" aria-label="${language === 'es' ? 'Eliminar' : language === 'uk' ? 'Видалити' : 'Удалить'}">${icon('close')}</button></li>`).join('');
  return `<div class="page pickup-checkout-page"><a class="text-link" href="/recogida">${icon('arrow')} ${copy.back}</a><div class="pickup-checkout-heading"><h1>${copy.cart}</h1><p>${copy.intro}</p></div>${cancelled ? `<p class="pickup-notice" role="status">${copy.cancelled}</p>` : ''}${!lines.length ? `<section class="pickup-empty"><p>${copy.empty}</p><a class="button" href="/recogida">${copy.shop}</a></section>` : `<div class="pickup-checkout-layout"><section class="pickup-checkout-main"><ul class="pickup-basket-list">${rows}</ul><form id="pickup-checkout-form"><h2>${copy.pay}</h2><div class="pickup-contact-fields"><label>${copy.name}<input name="name" autocomplete="name" maxlength="100" value="${escape(contact.name || '')}"></label><label>${copy.phone}<input name="phone" type="tel" autocomplete="tel" minlength="6" maxlength="24" required value="${escape(contact.phone || '')}"></label><label>${copy.email}<input name="email" type="email" autocomplete="email" maxlength="160" required value="${escape(contact.email || '')}"></label></div>${!valid ? `<p class="checkout-error" role="alert">${copy.unavailable}</p>` : ''}${error ? `<p class="checkout-error" role="alert">${escape(error)}</p>` : ''}<p class="checkout-terms"><a href="${terms}">${copy.terms}</a></p><button class="button" type="submit" ${!valid || busy ? 'disabled' : ''}>${copy.pay} ${icon('arrow')}</button></form></section><aside class="pickup-checkout-summary"><h2>${copy.total}</h2><div><span>${copy.subtotal}</span><strong>${money(subtotal)}</strong></div>${discount ? `<div><span>${copy.discount}</span><strong>-${money(discount)}</strong></div>` : ''}<div><span>${copy.delivery}</span><strong>${copy.free}</strong></div><div class="pickup-total"><span>${copy.total}</span><strong>${money(subtotal - discount)}</strong></div></aside></div>`}</div>`;
}

export function pickupConfirmationPage({ language, state, icon }) {
  const copy = pickupCopy[language] || pickupCopy.es;
  const paid = state?.paymentStatus === 'paid';
  return `<div class="page pickup-confirmation"><span class="pet-eyebrow">${copy.cart}</span><h1>${paid ? copy.paid : copy.waiting}</h1><p>${paid ? copy.paidNote : copy.pending}</p>${state?.number ? `<p><strong>${copy.number}: ${state.number}</strong></p>` : ''}${paid ? `<a class="button" href="/recogida">${copy.shop} ${icon('arrow')}</a>` : `<button class="button" type="button" data-pickup-refresh>${copy.retry} ${icon('arrow')}</button>`}</div>`;
}
