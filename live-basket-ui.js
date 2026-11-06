import { checkoutTotals } from './checkout-model.js';
import { cartSku, storefrontPrice } from './variants.js';

export function fulfillmentState(sku) {
  if (sku?.saleStatus) return sku.saleStatus === 'available' ? 'stock' :
    sku.saleStatus === 'preorder' ? 'supplier' : 'pending';
  if (sku?.serverSourcingAvailability) {
    if (sku.serverSourcingAvailability === 'on_hand') return 'stock';
    if (sku.serverSourcingAvailability === 'source_on_demand') return 'supplier';
    return 'pending';
  }
  if (!sku || sku.serverPriceConfirmed !== true || sku.serverAvailableForCart !== true) return 'pending';
  if (sku.serverAvailabilityStatus === 'on_hand') return 'stock';
  if (sku.serverAvailabilityStatus === 'source_on_demand') return 'supplier';
  return 'pending';
}

export function basketGroups(cart, products) {
  const entries = cart.map((item, index) => {
    const product = products.find(entry => entry.id === (item.productId || item.id));
    const sku = cartSku(item, products);
    const state = fulfillmentState(sku);
    return { item, index, product, sku, state, price: storefrontPrice(sku) };
  });
  return {
    entries,
    stock: entries.filter(entry => entry.state === 'stock'),
    supplier: entries.filter(entry => entry.state === 'supplier'),
    pending: entries.filter(entry => entry.state === 'pending')
  };
}

export function renderLiveBasket({ cart, products, promo, grouping, escape, icon, money, imageBlock }) {
  const { entries, stock, supplier, pending } = basketGroups(cart, products);
  const mixed = stock.length > 0 && supplier.length > 0;
  const split = mixed && grouping === 'separate';
  const priced = list => list.map(({ item, price }) => ({ price: price || 0, qty: item.qty }));
  const combined = checkoutTotals(priced(entries), promo);
  const stockTotal = checkoutTotals(priced(stock), promo);
  const supplierTotal = checkoutTotals(priced(supplier), promo);
  const delivery = split ? stockTotal.delivery + supplierTotal.delivery : combined.delivery;
  const total = split ? stockTotal.total + supplierTotal.total : combined.total;
  const complete = entries.length > 0 && pending.length === 0 && entries.every(entry =>
    entry.product && entry.price !== null &&
    (entry.sku?.saleStatus || entry.sku?.serverPriceConfirmed === true));
  const pricesConfirmed = entries.every(entry => entry.sku?.serverPriceConfirmed === true);
  const label = state => ({ stock: 'Доступно к заказу', supplier: 'Под заказ', pending: 'Недоступно' })[state];
  const progress = `<ol class="rc-flow-progress" aria-label="Этапы заказа"><li class="current"><span>1</span>Корзина</li><li><span>2</span>Доставка</li><li><span>3</span>Оплата</li><li><span>4</span>Готово</li></ol>`;
  const promoStatus = promo ? `<p role="status"><strong data-no-translate>${escape(promo.code)}</strong> <span>Промокод принят - скидка 10% будет учтена при оформлении подходящего заказа</span></p>` : '';
  if (!entries.length) return `<div class="page rc-flow-page live-order-page"><a class="rc-flow-back" href="#/catalog">${icon('arrow')} В каталог</a>${progress}<div class="rc-flow-heading"><h1>Ваша корзина</h1><p>Пока здесь пусто</p>${promoStatus}</div><a class="button" href="#/catalog">За покупками ${icon('arrow')}</a></div>`;

  const itemName = entry => escape(entry.product?.name || entry.sku?.name || 'Товар');
  const itemLabel = entry => escape(entry.sku?.label || entry.item.variantLabel || entry.item.size || 'Вариант не выбран');
  const itemImage = entry => imageBlock(entry.sku?.image || entry.product?.image);
  const row = entry => `<div class="rc-flow-basket-item">${itemImage(entry)}<div><a href="#/product/${escape(entry.product?.id || '')}"><strong>${itemName(entry)}</strong></a><span>${itemLabel(entry)}</span><small>${label(entry.state)}</small><div class="rc-flow-quantity" aria-label="Количество"><button type="button" data-cart-qty="${entry.index}" data-delta="-1" aria-label="Уменьшить количество">${icon('minus')}</button><span>${entry.item.qty}</span><button type="button" data-cart-qty="${entry.index}" data-delta="1" aria-label="Увеличить количество">${icon('plus')}</button></div><button class="rc-flow-remove" type="button" data-remove="${entry.index}">Удалить</button></div><strong>${entry.price === null ? 'Цена уточняется' : money(entry.price * entry.item.qty)}</strong></div>`;
  const summaryItem = entry => `<div class="rc-flow-summary-item">${itemImage(entry)}<div><strong>${itemName(entry)}</strong><small>${itemLabel(entry)} · ${entry.item.qty} × ${entry.price === null ? 'цена уточняется' : money(entry.price)}</small></div><strong>${entry.price === null ? '' : money(entry.price * entry.item.qty)}</strong></div>`;
  const deliveryLine = amount => amount ? money(amount) : 'Бесплатно';
  const discountLine = totals => totals.discount ? `<div class="rc-flow-total-line"><span>Скидка</span><strong>-${money(totals.discount)}</strong></div>` : '';
  const groupSummary = (title, list, totals) => `<section class="rc-flow-summary-group"><h3>${title}</h3>${list.map(summaryItem).join('')}<div class="rc-flow-total-line"><span>Товары</span><strong>${money(totals.subtotal)}</strong></div>${discountLine(totals)}<div class="rc-flow-total-line"><span>Доставка</span><strong>${deliveryLine(totals.delivery)}</strong></div><div class="rc-flow-total-line rc-flow-group-total"><span>Итого по заказу</span><strong>${money(totals.total)}</strong></div></section>`;
  const summary = `<aside class="rc-flow-summary"><h2>Ваш заказ</h2>${promoStatus}${split ? groupSummary('Заказ 1 - обычная доставка', stock, stockTotal) + groupSummary('Заказ 2 - под заказ', supplier, supplierTotal) : entries.map(summaryItem).join('') + `<div class="rc-flow-total-line"><span>Товары</span><strong>${complete ? money(combined.subtotal) : 'Итог уточняется'}</strong></div>${complete ? discountLine(combined) : ''}<div class="rc-flow-total-line"><span>Доставка</span><strong>${complete ? deliveryLine(delivery) : 'Итог уточняется'}</strong></div>`}<div class="rc-flow-total-line rc-flow-total"><span>Итого с IVA</span><strong>${complete ? money(total) : 'Итог уточняется'}</strong></div><p>Цены включают IVA · Бесплатная доставка от 49 € ${split ? 'для каждого заказа отдельно' : 'после скидки'}</p></aside>`;
  const choice = mixed ? `<section class="rc-flow-panel rc-flow-delivery-choice"><h2>Как доставить товары</h2><p>В корзине есть товары с обычной доставкой и под заказ. Выберите способ получения до оформления</p><div class="rc-flow-choice-list"><label><input type="radio" name="live-delivery-grouping" value="together" ${split ? '' : 'checked'}><span><strong>Один заказ - одна доставка</strong><small>Отправим всё вместе после поступления товара под заказ. Срок уточним до оплаты</small><em>Доставка: ${deliveryLine(combined.delivery)}</em></span></label><label><input type="radio" name="live-delivery-grouping" value="separate" ${split ? 'checked' : ''}><span><strong>Два заказа - две доставки</strong><small>Товары с обычной доставкой можно получить раньше. Каждый заказ оплачивается и доставляется отдельно</small><em>Доставка: ${deliveryLine(stockTotal.delivery + supplierTotal.delivery)}</em></span></label></div></section>` : `<p class="rc-flow-notice">${icon('truck')}${supplier.length ? 'Товар под заказ: срок доставки согласуем до оплаты' : pending.length ? 'Уточняем наличие выбранных товаров' : 'Удобное время доставки можно указать при оформлении'}</p>`;
  return `<div class="page rc-flow-page live-order-page"><a class="rc-flow-back" href="#/catalog">${icon('arrow')} Продолжить покупки</a>${progress}<div class="rc-flow-heading"><h1>Ваша корзина</h1><p>Проверьте товары, фасовки и количество перед оформлением</p></div><div class="rc-flow-layout"><div class="rc-flow-main"><section class="rc-flow-panel">${entries.map(row).join('')}</section>${choice}<div class="rc-flow-actions"><button class="button" id="checkout" data-live-checkout-group="${split ? 'stock' : 'all'}" ${complete ? '' : 'disabled'}>Перейти к оформлению ${icon('arrow')}</button><a class="button outline" href="#/catalog">Добавить товары</a></div>${split ? '<p class="rc-flow-help">Сначала оформите товары с обычной доставкой. Остальные останутся в корзине для второго заказа</p>' : ''}${!complete ? '<p class="rc-flow-help">Для оформления нужна розничная цена каждого варианта</p>' : !pricesConfirmed ? '<p class="rc-flow-help">Часть цен пока ориентировочная. Проверить доставку можно, оплата откроется после подтверждения цен</p>' : ''}</div>${summary}</div></div>`;
}
