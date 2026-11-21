import { cartSku, storefrontPrice } from './variants.js';
import { productHref } from './seo-products.js?v=litter-routes-20261121';

export const pickupCopy = {
  es: {
    cart:'Tu cesta', checkout:'Finalizar pedido', back:'Seguir comprando', backCart:'Volver a la cesta',
    empty:'Todavía no has añadido productos para recoger', shop:'Ver productos para recoger',
    cartIntro:'Comprueba los productos, formatos y cantidades antes de continuar',
    checkoutIntro:'Recogida sin dirección de entrega. Acordaremos contigo la hora después del pago',
    stepCart:'Cesta', stepDetails:'Datos', stepPay:'Pago', stepDone:'Listo',
    order:'Tu pedido', stock:'Disponible para recoger', remove:'Eliminar', quantity:'Cantidad',
    pickup:'Recogida', pickupNote:'Te contactaremos para acordar cuándo recoger el pedido',
    contact:'Tus datos de contacto', contactNote:'Usaremos el teléfono y el email para acordar la recogida y confirmar el pedido',
    name:'Nombre (opcional)', phone:'Teléfono', email:'Email', discountPayment:'Descuento y pago',
    discountPaymentNote:'Después de comprobar los datos, pasarás a la página de pago seguro',
    promo:'Código promocional', apply:'Aplicar', couponHelp:'¿No funciona el código? Avísanos',
    paymentNote:'Pago con tarjeta en una página segura. Después acordaremos la recogida',
    continue:'Continuar al pedido', pay:'Ir al pago', add:'Añadir productos',
    unavailable:'Uno de los productos ya no está disponible para recoger. Revisa la cesta',
    subtotal:'Productos', discount:'Descuento', free:'Gratis', total:'Total con IVA',
    taxNote:'Los precios incluyen IVA. La recogida es gratuita',
    terms:'Antes de pagar, consulta las condiciones de compra y devoluciones',
    cancelled:'El pago no se completó. Los productos siguen en tu cesta',
    waiting:'Comprobando el pago', paid:'Pedido pagado', paidNote:'Te contactaremos para acordar cuándo recogerlo',
    pending:'El pago aún no está confirmado. Puedes comprobarlo de nuevo', retry:'Comprobar pago',
    error:'No hemos podido iniciar el pago. Inténtalo de nuevo', changed:'El precio ha cambiado. Revisa el total y vuelve a pagar',
    number:'Número de pedido', count:n=>`${n} ${n===1?'producto':'productos'}`
  },
  ru: {
    cart:'Ваша корзина', checkout:'Оформление заказа', back:'Продолжить покупки', backCart:'Вернуться в корзину',
    empty:'Вы пока не добавили товары для самовывоза', shop:'Товары для самовывоза',
    cartIntro:'Проверьте товары, варианты и количество перед оформлением',
    checkoutIntro:'Самовывоз без адреса доставки. После оплаты согласуем с вами время получения',
    stepCart:'Корзина', stepDetails:'Контакты', stepPay:'Оплата', stepDone:'Готово',
    order:'Ваш заказ', stock:'Доступно к самовывозу', remove:'Удалить', quantity:'Количество',
    pickup:'Самовывоз', pickupNote:'Свяжемся с вами и согласуем время получения заказа',
    contact:'Как с вами связаться', contactNote:'Телефон и email нужны для согласования получения и подтверждения заказа',
    name:'Имя (необязательно)', phone:'Телефон', email:'Email', discountPayment:'Скидка и оплата',
    discountPaymentNote:'После проверки данных вы перейдёте на защищённую страницу оплаты',
    promo:'Промокод', apply:'Применить', couponHelp:'Промокод не сработал? Сообщить нам',
    paymentNote:'Оплата картой на защищённой странице. После оплаты согласуем самовывоз',
    continue:'Перейти к оформлению', pay:'Перейти к оплате', add:'Добавить товары',
    unavailable:'Один из товаров уже недоступен для самовывоза. Проверьте корзину',
    subtotal:'Товары', discount:'Скидка', free:'Бесплатно', total:'Итого с IVA',
    taxNote:'Цены включают IVA. Самовывоз бесплатный',
    terms:'Перед оплатой ознакомьтесь с условиями покупки и возврата',
    cancelled:'Оплата не завершена. Товары остались в корзине',
    waiting:'Проверяем оплату', paid:'Заказ оплачен', paidNote:'Свяжемся с вами, чтобы согласовать время получения',
    pending:'Оплата ещё не подтверждена. Можно проверить её снова', retry:'Проверить оплату',
    error:'Не удалось начать оплату. Попробуйте ещё раз', changed:'Цена изменилась. Проверьте итог и повторите оплату',
    number:'Номер заказа', count:n=>`${n} товар${n===1?'':n<5?'а':'ов'}`
  },
  uk: {
    cart:'Ваш кошик', checkout:'Оформлення замовлення', back:'Продовжити покупки', backCart:'Повернутися до кошика',
    empty:'Ви ще не додали товари для самовивозу', shop:'Товари для самовивозу',
    cartIntro:'Перевірте товари, варіанти та кількість перед оформленням',
    checkoutIntro:'Самовивіз без адреси доставки. Після оплати узгодимо з вами час отримання',
    stepCart:'Кошик', stepDetails:'Контакти', stepPay:'Оплата', stepDone:'Готово',
    order:'Ваше замовлення', stock:'Доступно для самовивозу', remove:'Видалити', quantity:'Кількість',
    pickup:'Самовивіз', pickupNote:'Зв’яжемося з вами та узгодимо час отримання замовлення',
    contact:'Як з вами зв’язатися', contactNote:'Телефон і email потрібні для узгодження отримання та підтвердження замовлення',
    name:'Ім’я (необов’язково)', phone:'Телефон', email:'Email', discountPayment:'Знижка й оплата',
    discountPaymentNote:'Після перевірки даних ви перейдете на захищену сторінку оплати',
    promo:'Промокод', apply:'Застосувати', couponHelp:'Промокод не працює? Повідомте нам',
    paymentNote:'Оплата карткою на захищеній сторінці. Після оплати узгодимо самовивіз',
    continue:'Перейти до оформлення', pay:'Перейти до оплати', add:'Додати товари',
    unavailable:'Один із товарів уже недоступний для самовивозу. Перевірте кошик',
    subtotal:'Товари', discount:'Знижка', free:'Безкоштовно', total:'Разом з IVA',
    taxNote:'Ціни включають IVA. Самовивіз безкоштовний',
    terms:'Перед оплатою ознайомтеся з умовами купівлі та повернення',
    cancelled:'Оплату не завершено. Товари залишилися в кошику',
    waiting:'Перевіряємо оплату', paid:'Замовлення оплачено', paidNote:'Зв’яжемося з вами, щоб узгодити час отримання',
    pending:'Оплату ще не підтверджено. Можна перевірити ще раз', retry:'Перевірити оплату',
    error:'Не вдалося почати оплату. Спробуйте ще раз', changed:'Ціна змінилася. Перевірте суму та повторіть оплату',
    number:'Номер замовлення', count:n=>`${n} ${n===1?'товар':n<5?'товари':'товарів'}`
  }
};

function basketModel(cart,products,promo) {
  const lines=cart.map((item,index)=>{
    const product=products.find(entry=>entry.id===(item.productId||item.id));
    const sku=cartSku(item,products);
    return {item,index,product,sku,price:storefrontPrice(sku)};
  });
  const valid=lines.length>0&&lines.every(({item,sku,price})=>sku?.pickupAvailable===true&&
    Number.isFinite(price)&&price>0&&item.qty>0);
  const subtotalCents=lines.reduce((sum,{item,price})=>sum+Math.round((price||0)*100)*item.qty,0);
  const discountCents=Math.round(subtotalCents*(Number(promo?.percent)||0)/100);
  return {lines,valid,subtotalCents,discountCents,totalCents:subtotalCents-discountCents};
}

function progress(copy,current) {
  return `<ol class="rc-flow-progress" aria-label="${copy.checkout}">${[
    copy.stepCart,copy.stepDetails,copy.stepPay,copy.stepDone].map((step,index)=>
    `<li class="${index===current?'current':index<current?'done':''}"><span>${index+1}</span>${step}</li>`).join('')}</ol>`;
}

function orderSummary(model,{copy,promo,money,escape,imageBlock}) {
  const rows=model.lines.map(({item,product,sku,price})=>
    `<div class="rc-flow-summary-item">${imageBlock(sku?.image||product?.image)}<div><strong>${escape(product?.name||sku?.name||'')}</strong><small>${escape(sku?.label||item.variantLabel||'')} · ${item.qty} × ${money(price||0)}</small></div><strong>${money((price||0)*item.qty)}</strong></div>`).join('');
  return `<aside class="rc-flow-summary"><h2>${copy.order}</h2>${promo?.code?`<p class="rc-flow-promo-status" role="status"><strong data-no-translate>${escape(promo.code)}</strong><span>${copy.discount} ${Number(promo.percent)||0}%</span></p>`:''}${rows}<div class="rc-flow-total-line"><span>${copy.subtotal}</span><strong>${money(model.subtotalCents/100)}</strong></div>${model.discountCents?`<div class="rc-flow-total-line"><span>${copy.discount}</span><strong>-${money(model.discountCents/100)}</strong></div>`:''}<div class="rc-flow-total-line"><span>${copy.pickup}</span><strong>${copy.free}</strong></div><div class="rc-flow-total-line rc-flow-total"><span>${copy.total}</span><strong>${money(model.totalCents/100)}</strong></div><p>${copy.taxNote}</p></aside>`;
}

export function pickupBasketPage({cart,products,language,money,escape,icon,imageBlock,promo,cancelled=false}) {
  const copy=pickupCopy[language]||pickupCopy.es;
  const model=basketModel(cart,products,promo);
  const rows=model.lines.map(({item,index,product,sku,price})=>{
    const href=`${productHref(product?.id||'')}?variant=${encodeURIComponent(sku?.id||'')}&pickup=1`;
    return `<div class="rc-flow-basket-item">${imageBlock(sku?.image||product?.image)}<div><a href="${escape(href)}"><strong>${escape(product?.name||sku?.name||'')}</strong></a><span>${escape(sku?.label||item.variantLabel||'')}</span><small>${copy.stock}</small><div class="rc-flow-quantity" aria-label="${copy.quantity}"><button type="button" data-pickup-qty="${index}" data-delta="-1" aria-label="${copy.quantity} - 1">${icon('minus')}</button><span>${item.qty}</span><button type="button" data-pickup-qty="${index}" data-delta="1" aria-label="${copy.quantity} + 1">${icon('plus')}</button></div><button class="rc-flow-remove" type="button" data-pickup-remove="${index}">${copy.remove}</button></div><strong>${price===null?copy.unavailable:money(price*item.qty)}</strong></div>`;
  }).join('');
  return `<div class="page rc-flow-page live-order-page pickup-cart-page"><a class="rc-flow-back" href="/recogida">${icon('arrow')} ${copy.back}</a>${progress(copy,0)}<div class="rc-flow-heading"><h1>${copy.cart}</h1><p>${model.lines.length?copy.cartIntro:copy.empty}</p></div>${cancelled?`<p class="rc-flow-notice" role="status">${icon('bag')}${copy.cancelled}</p>`:''}${!model.lines.length?`<a class="button" href="/recogida">${copy.shop} ${icon('arrow')}</a>`:`<div class="rc-flow-layout"><div class="rc-flow-main"><section class="rc-flow-panel">${rows}</section><p class="rc-flow-notice">${icon('bag')}${copy.pickupNote}</p><div class="rc-flow-actions">${model.valid?`<a class="button" href="#/pickup-checkout">${copy.continue} ${icon('arrow')}</a>`:`<button class="button" type="button" disabled>${copy.continue} ${icon('arrow')}</button>`}<a class="button outline" href="/recogida">${copy.add}</a></div>${!model.valid?`<p class="checkout-error" role="alert">${copy.unavailable}</p>`:''}</div>${orderSummary(model,{copy,promo,money,escape,imageBlock})}</div>`}</div>`;
}

export function pickupCheckoutPage({cart,products,language,money,escape,icon,imageBlock,promo,contact={},error='',busy=false}) {
  const copy=pickupCopy[language]||pickupCopy.es;
  const model=basketModel(cart,products,promo);
  if (!model.lines.length) return pickupBasketPage({cart,products,language,money,escape,icon,imageBlock,promo});
  const terms=language==='es'?'/purchase-terms-es.html':language==='uk'?'/purchase-terms-uk.html':'/purchase-terms.html';
  return `<div class="page checkout-page rc-flow-page live-order-page pickup-checkout-page"><div class="checkout-head"><a class="text-link" href="#/pickup-cart">${icon('arrow')} ${copy.backCart}</a><span>${copy.pickup}</span></div>${progress(copy,1)}<div class="rc-flow-heading"><h1>${copy.checkout}</h1><p>${copy.checkoutIntro}</p></div><div class="checkout-layout rc-flow-layout"><form id="pickup-checkout-form" class="checkout-form"><section class="checkout-section"><div class="checkout-section-head"><span>01</span><div><h2>${copy.contact}</h2><p>${copy.contactNote}</p></div></div><div class="checkout-fields"><label>${copy.name}<input name="name" autocomplete="name" maxlength="100" value="${escape(contact.name||'')}"></label><label>${copy.email}<input name="email" type="email" autocomplete="email" maxlength="160" required value="${escape(contact.email||'')}"></label><label>${copy.phone}<input name="phone" type="tel" autocomplete="tel" minlength="6" maxlength="24" required value="${escape(contact.phone||'')}"></label></div></section><section class="checkout-section"><div class="checkout-section-head"><span>02</span><div><h2>${copy.pickup}</h2><p>${copy.pickupNote}</p></div></div><p class="rc-flow-notice">${icon('bag')}${copy.checkoutIntro}</p></section><section class="checkout-section"><div class="checkout-section-head"><span>03</span><div><h2>${copy.discountPayment}</h2><p>${copy.discountPaymentNote}</p></div></div><div class="checkout-promo"><label>${copy.promo}<input name="promoCode" maxlength="40" value="${escape(promo?.code||'')}"></label><button class="button outline" type="button" data-pickup-promo>${copy.apply}</button></div><a class="checkout-coupon-help" href="#/coupon">${copy.couponHelp}</a><div class="checkout-payment">${icon('shield')}<span>${copy.paymentNote}</span></div></section><p class="checkout-terms"><a href="${terms}">${copy.terms}</a></p>${!model.valid?`<p class="checkout-error" role="alert">${copy.unavailable}</p>`:''}${error?`<p class="checkout-error" role="alert">${escape(error)}</p>`:''}<button class="button checkout-next" type="submit" ${!model.valid||busy?'disabled':''}>${copy.pay} ${icon('arrow')}</button></form>${orderSummary(model,{copy,promo,money,escape,imageBlock})}</div></div>`;
}

export function pickupConfirmationPage({language,state,icon}) {
  const copy=pickupCopy[language]||pickupCopy.es;
  const paid=state?.paymentStatus==='paid';
  return `<div class="page rc-flow-page pickup-confirmation">${progress(copy,paid?3:2)}<h1>${paid?copy.paid:copy.waiting}</h1><p>${paid?copy.paidNote:copy.pending}</p>${state?.number?`<p><strong>${copy.number}: ${state.number}</strong></p>`:''}${paid?`<a class="button" href="/recogida">${copy.shop} ${icon('arrow')}</a>`:`<button class="button" type="button" data-pickup-refresh>${copy.retry} ${icon('arrow')}</button>`}</div>`;
}
