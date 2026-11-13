import { createUsefulUI } from './useful.js?v=ukrainian-public-3';
import { createAccountUI } from './account.js?v=live-orders-20261112';
import { hasVariants, snapshots, resolveVariant, confirmedPrice, storefrontPrice, canBuy, catalogPrice, normalizeCart, cartSku, sameCartSku } from './variants.js?v=sale-price-policy-20261109';
import { accessoryDetail, customerDetails } from './accessory-ui.js?v=churu-cat-editorial-20261112';
import { basketGroups, fulfillmentState, renderLiveBasket } from './live-basket-ui.js?v=all-product-urls-20261110';
import { recommendForProduct } from './recommendations.js?v=delivery-status-3';
import { homeGroups, homeGroupsForPet, homeGroupForProduct, homeFeatureOptions, matchesHomeFeature, matchesHomePrice, homePriceOptions, matchesPet } from './home-catalog.js?v=delivery-status-3';
import { categories, products, catalogProducts, articles } from './data.js?v=yagu-basket-20261113';
import { normalizeGift, giftOffer, cartUnitPrice as legacyCartUnitPrice, giftOptions, giftSummary, giftDetail, applyGiftPreset, giftLanding } from './gifts.js?v=product-urls-20261110';
import { createCheckoutUI } from './checkout-ui.js?v=address-check-20261112';
import { availabilityRequestPage } from './availability-request-ui.js?v=request-size-20261111';
import { orderVariantId } from './order-progress.js';
import { applyServerCatalog } from './server-prices.js?v=unavailable-single-20261110';

import { activeHomeLanding } from './collections.js?v=cat-assortment-1';
import { homeShortcuts, homeShortcutLanding } from './home-shortcuts.js?v=picks-seo-20261112';
import { handleCatPickClick } from './cat-picks.js?v=picks-seo-20261112';
import { installLocale, intlLocale, locale, translate } from './locale.js?v=yagu-basket-20261113';
import { articlesEs } from './journal-content-es.js?v=es-1';
import { articlesUk } from './journal-content-uk.js';
import { seoCategoryForPath, seoCategoryPath } from './seo-categories.js';
import { productHref, seoProductForPath } from './seo-products.js?v=yagu-basket-links-20261113';
import { seoPickForPath } from './seo-picks.js';
import { analyticsItem, announceCommerce } from './analytics-events.js?v=delivery-status-3';
import { installAnalytics } from './analytics-consent.js?v=picks-seo-20261112';
import { createCartActivity } from './cart-activity.js?v=cart-reliability-20261112';
import { matchesCatalogSearch, catalogSuggestions } from './catalog-search.js';
import { rememberProductOrigin, productOrigin, requestProductReturn,
  takeProductReturnScroll } from './product-return.js';

const app = document.querySelector('#app');
installLocale();
const analytics = installAnalytics(locale());
const displayArticles = locale() === 'es' ? articlesEs : locale() === 'uk' ? articlesUk : articles;
const paths = {map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',phone:'<path d="m7 3 3 5-3 2a15 15 0 0 0 7 7l2-3 5 3-2 4C9 21 3 15 3 5l4-2Z"/>',cat:'<path d="M5 8 4 3l6 4h4l6-4-1 5c2 2 3 4 3 6 0 5-4 8-10 8S2 19 2 14c0-2 1-4 3-6Z"/><path d="M8 13h.01M16 13h.01M11 17h2m-9-1H1m19 0h3"/>',paw:'<ellipse cx="12" cy="16" rx="6" ry="5"/><ellipse cx="5" cy="8" rx="2" ry="3"/><ellipse cx="10" cy="5" rx="2" ry="3"/><ellipse cx="15" cy="5" rx="2" ry="3"/><ellipse cx="20" cy="8" rx="2" ry="3"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3"/>',gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z"/>',shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-2l2 3M4 16l2 3a7 7 0 0 0 12-2"/>',copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',heart:'<path d="M20.8 4.8a5.4 5.4 0 0 0-7.6 0L12 6l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.6a5.4 5.4 0 0 0 0-7.6Z"/>',bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 9V5a3 3 0 0 1 6 0v4"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',leaf:'<path d="M20 3C8 2 3 8 5 15s13 7 15-12Z"/><path d="M3 21 16 8"/>',truck:'<path d="M2 4h12v13H2zM14 9h4l4 5v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',check:'<path d="m5 12 4 4L19 6"/>'};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.heart}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const itemCount = n => locale() === 'es' ? `${n} ${n === 1 ? 'producto' : 'productos'}` : `${n} ${({one:'товар',few:'товара',many:'товаров',other:'товара'})[new Intl.PluralRules('ru-RU').select(n)]}`;
const variantCount = n => {
  if (locale() === 'es') return `${n} ${n === 1 ? 'formato' : 'formatos'}`;
  const language = locale() === 'uk' ? 'uk' : 'ru';
  const forms = language === 'uk'
    ? { one: 'варіант', few: 'варіанти', many: 'варіантів', other: 'варіанта' }
    : { one: 'вариант', few: 'варианта', many: 'вариантов', other: 'варианта' };
  return `${n} ${forms[new Intl.PluralRules(language).select(n)]}`;
};
const money = value => Number.isFinite(value) ? new Intl.NumberFormat(intlLocale(),{style:'currency',currency:'EUR',currencyDisplay:'narrowSymbol'}).format(value) : locale() === 'es' ? 'No disponible' : 'Недоступно';
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}}
let cart = normalizeCart(read('catmandog-cart',[]), products);
let basketGrouping = read('catmandog-delivery-grouping','together') === 'separate' ? 'separate' : 'together';
let checkoutGroup = (() => { try { return sessionStorage.getItem('catmandog-checkout-group') === 'stock' ? 'stock' : 'all'; } catch { return 'all'; } })();
function checkoutCart() {
  const groups = basketGroups(cart, products);
  return checkoutGroup === 'stock' && basketGrouping === 'separate' && groups.stock.length && groups.supplier.length
    ? groups.stock.map(entry => entry.item) : cart;
}
function cartUnitPrice(item){const p=products.find(p=>p.id===(item.productId||item.id));return p?.gift?legacyCartUnitPrice(item):storefrontPrice(cartSku(item,products));}
let favorites = read('catmandog-favorites',[]); if(!Array.isArray(favorites))favorites=[];favorites=favorites.filter(x=>products.some(p=>p.id===x));
let catalogPriceMax = Math.max(100, Math.ceil(Math.max(...catalogProducts.map(p => catalogPrice(p).max ?? 0)) / 10) * 10);
let catalogUnavailable = false;
let catalogLoading = ['http:', 'https:'].includes(location.protocol);
const cartActivity = createCartActivity(() => catalogLoading ? [] : cart, () => activityStage());
const displayedMinPrice = p => catalogPrice(p).min;
let homePet='cat', homeGroup='', homeBrand='', homePrice='', homeFeature='', homeVisible=8, selectedSize='', detailQuantity=1, priceLimit=catalogPriceMax, journalCategory='Все материалы';
let selectedVariantId=null;
let availabilityRequestState = null;
let giftState=normalizeGift();
const giftHelpers={money,imageBlock,icon,escape,crumbs,card};
let toastTimer;
let lastCartAddition = null;
const account = createAccountUI({ escape, icon, money, products, imageBlock, render, notify, publicStore: true,
  getCart: () => cart.map(item => ({ ...item, productId: item.productId || item.id, price: cartUnitPrice(item), name: cartSku(item, products)?.name })),
  repeatOrder: items => items.forEach(item => add(item.productId, item.size, item.qty, item.giftConfig, item.variantId))
});
const checkoutPromo = () => account.promo();
const useful = createUsefulUI({ escape, icon, store: account.store, render, notify, syncChanges: account.syncChanges });
const checkout = createCheckoutUI({
  escape, icon, money, imageBlock, render,
  getCartActivityId: () => cartActivity.id(),
  onPaymentStart: () => {
    cartActivity.sync('payment');
    announceCommerce('add_payment_info', cartCommerceItems(checkoutCart()));
  },
  getCheckoutProfile: () => account.checkoutProfile(),
  saveCheckoutProfile: values => account.saveCheckoutProfile(values),
  onPaid: (paidItems, promoApplied, payment) => {
    if (payment.sessionId?.startsWith('cs_live_') && payment.number) {
      announceCommerce('purchase', paidItems.map(item => {
        const product = products.find(candidate => candidate.id === item.productId);
        const variant = product?.variants?.find(candidate => candidate.id === item.variantId);
        const analytics = analyticsItem(product, variant, item.qty);
        return analytics && { ...analytics,
          ...(Number.isInteger(item.unitPriceCents) ? { price: item.unitPriceCents / 100 } : {}) };
      }), { transaction_id: payment.number,
        value: Math.max(0, (payment.subtotalCents - payment.discountCents) / 100),
        shipping: payment.deliveryCents / 100 });
    }
    if (promoApplied) account.couponPaid();
    void account.refreshPromo().then(render).catch(() => {});
    void account.refreshOrders();
    for (const item of paidItems) {
      const line = cart.find(entry => (entry.productId || entry.id) === item.productId &&
        (entry.variantId || '') === (item.variantId || ''));
      if (line) line.qty -= Math.max(0, Number(item.qty) || 0);
    }
    cart = cart.filter(item => item.qty > 0);
    checkoutGroup = 'all';
    try { sessionStorage.removeItem('catmandog-checkout-group'); } catch {}
    persist();
    return cart.length > 0;
  },
  getItems: () => checkoutCart().map(item => {
    const parent = products.find(product => product.id === (item.productId || item.id));
    const sku = cartSku(item, products);
    const offer = parent?.gift ? giftOffer(parent, item.giftConfig) : null;
    return { productId: parent?.id, variantId: item.variantId, name: sku?.name || parent?.name || '',
      variant: offer?.label || item.variantLabel || item.size, image: offer?.image || sku?.image || parent?.image,
      qty: item.qty, price: cartUnitPrice(item), fulfillment: fulfillmentState(sku) };
  }),
  isReady: () => checkoutCart().length > 0 && checkoutCart().every(item => {
    const sku = cartSku(item, products);
    return cartUnitPrice(item) !== null && sku?.serverPriceConfirmed !== false && canBuy(sku);
  }),
  getCheckoutContext: () => ({ group: checkoutGroup === 'stock' && checkoutCart().length < cart.length ? 'stock' : 'all',
    hasSupplier: checkoutCart().some(item => fulfillmentState(cartSku(item, products)) === 'supplier'),
    hasRemaining: checkoutGroup === 'stock' && basketGroups(cart, products).supplier.length > 0,
    pricesConfirmed: checkoutCart().every(item => cartSku(item, products)?.serverPriceConfirmed === true) }),
  getPromo: checkoutPromo,
  refreshPromo: () => account.refreshPromo(),
  applyPromo: code => account.applyPromo(code),
  findOrder: number => {
    const pet = account.store.activePet();
    const order = account.store.get().orders.find(item => item.number === number && item.petId === pet?.id);
    if (!order) return null;
    return { ...order, items: order.items.map(item => {
      return { ...item, variantId: orderVariantId(products, item) };
    }) };
  },
  productLabel: item => {
    const parent = products.find(product => product.id === item.productId);
    const variant = item.variantId && parent ? resolveVariant(parent, item.variantId) : parent;
    return `${variant?.name || parent?.name || item.name || 'Товар'}${item.size ? ' · ' + item.size : ''}`;
  }
});
function persist(){try{localStorage.setItem('catmandog-cart',JSON.stringify(cart));localStorage.setItem('catmandog-favorites',JSON.stringify(favorites));}catch{}updateHeader();cartActivity.sync(activityStage());}
function activityStage(){const path=route().path;return path==='/checkout/preview'?'review':path==='/checkout'?'checkout':'cart';}
function hideToast(){document.querySelector('#toast').classList.remove('visible');lastCartAddition=null;}
function notify(text,{cartAction=false}={}){
  const el=document.querySelector('#toast');
  el.classList.toggle('toast-cart',cartAction);
  if(cartAction){
    el.innerHTML=`<span class="toast-check">${icon('check')}</span><span class="toast-message">${escape(text)}</span><button class="toast-undo" type="button">Отменить</button><a class="toast-link" href="#/cart">В корзину</a><button class="toast-close" type="button" aria-label="Закрыть уведомление">${icon('close')}</button>`;
  }else el.textContent=text;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(hideToast,cartAction?5500:2800);
}
function updateHeader(){const count=cart.reduce((n,x)=>n+x.qty,0);document.querySelector('#cart-link').innerHTML=icon('bag')+(count?`<span class="cart-count">${count}</span>`:'');document.querySelector('#cart-link').setAttribute('aria-label',locale()==='es'?`Cesta: ${count} ${count===1?'producto':'productos'}`:`Корзина: ${itemCount(count)}`);}
function route(){const category=seoCategoryForPath(location.pathname);const product=seoProductForPath(location.pathname);const pick=seoPickForPath(location.pathname);const cleanPath=product?`/product/${product.id}`:pick?`/picks/${pick.pet}`:(category||location.pathname==='/catalogo')?'/catalog':location.pathname==='/pet'?'/pet':location.pathname==='/revista'?'/journal':location.pathname.startsWith('/revista/')?location.pathname.replace(/^\/revista\//u,'/journal/'):'/';const raw=location.hash.slice(1)||`${cleanPath}${location.search}`;const [path,query]=raw.split('?');const params=new URLSearchParams(query);if(category&&!location.hash){params.set('pet',category.pet);params.set('group',category.group);}if(['Игрушки','Аксессуары'].includes(params.get('category')))params.set('category','Игрушки и аксессуары');if(['Лотки','Лотки и гигиена'].includes(params.get('category')))params.set('category','Наполнитель');return {path,params};}
document.addEventListener('click', event => {
  const returnLink = event.target.closest('[data-product-return]');
  if (returnLink) {
    const id = route().path.split('/')[2];
    const product = products.find(item => item.id === id || item.variants?.some(variant => variant.id === id));
    const origin = productOrigin(product?.id);
    if (origin && returnLink.getAttribute('href') === origin.url) requestProductReturn(origin);
    return;
  }
  const target = event.target.closest('a[href], button[data-configure]');
  if (!target) return;
  const href = target.getAttribute('href') || '';
  const id = target.dataset.configure || target.dataset.productId ||
    (href.startsWith('/producto/') ? seoProductForPath(new URL(href, location.origin).pathname)?.id : null) ||
    (href.startsWith('#/product/') ? href.slice('#/product/'.length).split('?')[0] : null);
  if (!id || route().path === `/product/${id}`) return;
  const sourcePath = route().path;
  if (!['/', '/catalog', '/favorites', '/picks/cat', '/picks/dog'].includes(sourcePath) &&
      !sourcePath.startsWith('/product/')) return;
  rememberProductOrigin(id, { url: location.pathname + location.search + location.hash,
    path: sourcePath, scrollY: window.scrollY });
}, true);
const journalHref = id => locale()==='es' ? `/revista${id?`/${encodeURIComponent(id)}`:''}` : `#/journal${id?`/${encodeURIComponent(id)}`:''}`;
let lastCommerceView = '';
const cartCommerceItems = lines => lines.map(item => {
  const product = products.find(candidate => candidate.id === (item.productId || item.id));
  return analyticsItem(product, cartSku(item, products), item.qty);
});
function announceView() {
  const { path, params } = route();
  const key = `${location.pathname}${location.search}${location.hash}`;
  if (key === lastCommerceView) return;
  cartActivity.sync(activityStage(), true);
  lastCommerceView = key;
  if (path === '/catalog') {
    const list = filteredProducts(params).slice(0, 20).map(product => analyticsItem(product));
    announceCommerce('view_item_list', list, { item_list_id: params.get('group') || params.get('pet') || 'all' });
  } else if (path.startsWith('/product/')) {
    const id = path.split('/')[2];
    const product = products.find(item => item.id === id || item.variants?.some(variant => variant.id === id));
    if (product) announceCommerce('view_item', [analyticsItem(product, resolveVariant(product, selectedVariantId || (product.id !== id ? id : null)))]);
  } else if (path === '/cart') {
    announceCommerce('view_cart', cartCommerceItems(cart));
  } else if (path === '/checkout/preview') {
    announceCommerce('add_shipping_info', cartCommerceItems(checkoutCart()));
  }
}
function imageStyle(index){if(typeof index==='string')return `background-image:url('${index}');background-size:cover;background-position:center`; const tile=index%8;return `--px:${(tile%4)*100/3}%;--py:${Math.floor(tile/4)*100}%;--product-sheet:url('https://img.catmandog.es/assets/products-cats-${Math.floor(index/8)+1}.png')`;}
function categoryImageStyle(name){if(name==='Лакомства')return "--category-sheet:url('https://img.catmandog.es/assets/category-treats-v2.webp');--category-size:cover;--category-radius:0;--px:center;--py:center";const tile=({Корм:0,Наполнитель:1,'Игрушки и аксессуары':2,'Миски и поилки':4,Переноски:5,'Окна и балконы':6,Уход:7})[name]??0;return `--px:${(tile%4)*100/3}%;--py:${Math.floor(tile/4)*100}%;--category-sheet:url('https://img.catmandog.es/assets/categories-open.png')`;}
const categoryLabel = name => name === 'Наполнитель' ? 'Наполнители и лотки' : name;
function imageBlock(index,extra=''){
  if(index && typeof index==='object'){
    const studio=index.presentation==='editorial'||
      /(?:\/assets\/(?:launch-studio-[^/]+|[^/]+\/editorial)\/|\/media\/(?:launch-studio|churu-formats|confirmed-demand)-[^/]+\/|\/media\/yagu\/[^/]+-studio-v\d+\.webp)/u.test(index.src);
    const alt=String(index.alt||'').replace(/\s*-\s*студийное изображение(?: рецептуры)?$/iu,'');
    return `<div class="product-image real-product-image ${studio?'editorial-product-image ':''}${extra}"><img src="${escape(index.src)}" alt="${escape(alt)}" loading="lazy" decoding="async"></div>`;
  }
  return `<div class="product-image ${extra}" style="${imageStyle(index)}"></div>`;
}
function crumbs(title){
  const path = route().path;
  if (!path.startsWith('/product/'))
    return `<div class="breadcrumbs"><a href="/">Главная</a><span>/</span><span>${escape(title)}</span></div>`;
  const id = path.split('/')[2];
  const product = products.find(item => item.id === id || item.variants?.some(variant => variant.id === id));
  const origin = productOrigin(product?.id);
  const destination = origin?.url || `/#/catalog?pet=${product?.pet === 'dog' ? 'dog' : 'cat'}`;
  const previousProduct = origin?.path?.startsWith('/product/')
    ? products.find(item => item.id === origin.path.split('/')[2]) : null;
  const source = origin?.path === '/picks/cat' ? 'Подборка для кошек' :
    origin?.path === '/picks/dog' ? 'Подборка для собак' :
      origin?.path === '/favorites' ? 'Избранное' : origin?.path === '/' ? 'Главная' :
        previousProduct?.name || 'Каталог';
  const back = locale() === 'es' ? `Volver ${source === 'Главная' ? 'al inicio' : source === 'Каталог' ? 'al catálogo' : source === 'Избранное' ? 'a favoritos' : previousProduct ? 'al producto' : 'a la selección'}` :
    locale() === 'uk' ? `Назад ${source === 'Главная' ? 'на головну' : source === 'Каталог' ? 'до каталогу' : source === 'Избранное' ? 'до обраного' : previousProduct ? 'до товару' : 'до добірки'}` :
      `Назад ${source === 'Главная' ? 'на главную' : source === 'Каталог' ? 'в каталог' : source === 'Избранное' ? 'в избранное' : previousProduct ? 'к товару' : 'к подборке'}`;
  const sourceCrumb = source === 'Главная' ? '' : `<span>/</span><a href="${escape(destination)}" data-product-return>${escape(translate(source))}</a>`;
  const navigationLabel = { ru: 'Путь по каталогу', es: 'Ruta del catálogo', uk: 'Шлях каталогом' }[locale()] || 'Путь по каталогу';
  return `<nav class="product-navigation" aria-label="${navigationLabel}"><div class="breadcrumbs"><a href="/#/">Главная</a>${sourceCrumb}<span>/</span><span>${escape(title)}</span></div><a class="product-back-link" href="${escape(destination)}" data-product-return>${icon('arrow')}<span>${escape(back)}</span></a></nav>`;
}
function card(p){
  const family=hasVariants(p)&&p.variants.length>1;
  const pricing=catalogPrice(p);
  const sku=resolveVariant(p);
  const sourcingStates=snapshots(p).map(variant=>variant.saleStatus || variant.serverSourcingAvailability).filter(Boolean);
  const copy={ru:{stock:'В наличии',available:'Доступно к заказу',supplier:'Под заказ',mixed:'Доступно и под заказ',unavailable:'Недоступно'},es:{stock:'Disponible',available:'Disponible para pedir',supplier:'Por encargo',mixed:'Disponible y por encargo',unavailable:'No disponible'},uk:{stock:'У наявності',available:'Доступно для замовлення',supplier:'Під замовлення',mixed:'Доступно та під замовлення',unavailable:'Недоступно'}}[locale()]||{stock:'В наличии',available:'Доступно к заказу',supplier:'Под заказ',mixed:'Доступно и под заказ',unavailable:'Недоступно'};
  const status=sourcingStates.includes('available')&&(sourcingStates.includes('preorder')||sourcingStates.includes('source_on_demand'))?'mixed':sourcingStates.includes('available')?'available':sourcingStates.includes('preorder')?'supplier':sourcingStates.includes('on_hand')&&sourcingStates.includes('source_on_demand')?'mixed':sourcingStates.includes('on_hand')?'stock':sourcingStates.includes('source_on_demand')?'supplier':sourcingStates.length?'unavailable':null;
  const availabilityTag=status?`<span class="product-availability-tag product-availability-${status}">${escape(copy[status])}</span>`:'';
  const configure=family||p.gift||!canBuy(sku);
  const actionLabel=family?'Выбрать вариант':p.gift?'Выбрать набор':!canBuy(sku)?'К товару':'В корзину';
  const caption=pricing.amount===null?'':family&&pricing.min!==pricing.max
    ? ({ Фасовка:'Цена зависит от фасовки', Упаковка:'Цена зависит от упаковки', Размер:'Цена зависит от размера', Цвет:'Цена зависит от цвета' }[p.optionLabel] || 'Цена зависит от варианта')
    : 'Цена с IVA';
  const displayPrice=pricing.amount===null?'Цена уточняется':pricing.min!==pricing.max?`${money(pricing.min)} - ${money(pricing.max)}`:`${p.gift==='personal'?'от ':''}${money(pricing.amount)}`;
  return `<article class="product-card ${p.isReal?'real-product-card':''}"><a class="product-card-open" href="${escape(productHref(p.id))}" data-product-id="${escape(p.id)}" aria-label="Открыть товар: ${escape(p.name)}"></a><div class="product-media">${imageBlock(p.image)}${p.tag?.trim()?`<span class="product-tag">${escape(p.tag)}</span>`:''}${availabilityTag}<button class="icon-button favorite ${favorites.includes(p.id)?'selected':''}" data-favorite="${escape(p.id)}" aria-label="${favorites.includes(p.id)?'Убрать из избранного':'В избранное'}: ${escape(p.name)}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button></div><div class="product-info"><small>${escape(p.brand||'CatManDog')}${p.weight?` · ${escape(p.weight)}`:''}${family?` · ${variantCount(p.variants.length)}`:''}</small><div class="product-title"><h3>${escape(p.name)} <span class="product-open-cue">${icon('arrow')}</span></h3></div><span class="retail-label" ${caption?'':'aria-hidden="true"'}>${caption}</span><div class="product-price"><div class="product-price-values"><span>${displayPrice}</span>${!pricing.demo&&!family&&p.old?`<span class="old-price">${money(p.old)}</span>`:''}</div><button class="product-card-action" ${configure?'data-configure':'data-add'}="${escape(p.id)}" aria-label="${actionLabel}: ${escape(p.name)}">${actionLabel}${icon(configure?'arrow':'bag')}</button></div></div></article>`;
}
function goodTogether(product){
  const suggestions=recommendForProduct(product,catalogProducts,{cart});
  if(!suggestions.length)return '';
  return `<section class="section recommendations"><div class="section-head"><h2>Хорошо вместе</h2><a class="text-link" href="#/catalog?pet=${escape(product.pet==='dog'?'dog':'cat')}">Все товары</a></div><div class="product-grid">${suggestions.map(item=>`<div class="recommendation-item"><p class="recommendation-reason">${escape(item.reason)}</p>${card(item.product)}</div>`).join('')}</div></section>`;
}
const journalVisuals={home:{src:'https://img.catmandog.es/assets/journal-home-v2.webp',alt:'Кошка и собака отдыхают вместе на мягкой лежанке'},play:{src:'https://img.catmandog.es/assets/journal-play-v2.webp',alt:'Кошка играет с перьевой удочкой'},travel:{src:'https://img.catmandog.es/assets/journal-travel-v2.webp',alt:'Кошка сидит в открытой переноске'}};
function articlePhoto(a){const visual=journalVisuals[a.id];return visual?`<div class="article-photo"><img src="${visual.src}" alt="${visual.alt}" loading="lazy" decoding="async"></div>`:a.image==='hero'?'<div class="article-photo"><img src="https://img.catmandog.es/assets/hero-happy.png" alt="Кошка и собака дома" loading="lazy"></div>':imageBlock(a.image,'article-photo');}
function articleCard(a){return `<a class="article-card" href="${journalHref(a.id)}">${articlePhoto(a)}<div class="article-meta"><span>${a.section}</span><span>${a.time}</span></div><h3>${a.title}</h3><p>${a.summary}</p><span class="article-card-cue">Читать статью ${icon('arrow')}</span></a>`;}
function journal(){
  const sections=['Все материалы',...new Set(displayArticles.map(item=>item.section))];
  const selected=displayArticles.filter(item=>journalCategory==='Все материалы'||item.section===journalCategory);
  return `<div class="page">${crumbs('Журнал')}<div class="journal-top"><span class="eyebrow">Журнал о питомцах</span><h1 class="page-title">Хорошая жизнь вместе</h1><p class="journal-intro">Истории и практические советы для дома, игры и путешествий с питомцем</p><div class="journal-filters" role="group" aria-label="Темы журнала">${sections.map(section=>`<button type="button" class="pill ${journalCategory===section?'active':''}" data-journal-category="${escape(section)}" aria-pressed="${journalCategory===section}">${escape(section)}</button>`).join('')}</div></div><div class="journal-grid">${selected.map(articleCard).join('')}</div></div>`;
}
function article(id){
  const current=displayArticles.find(item=>item.id===id);
  if(!current)return notFound();
  const related=displayArticles.filter(item=>item.id!==id).slice(0,2);
  return `<div class="page">${crumbs('Журнал')}<article class="editorial-article"><header class="editorial-header"><div class="editorial-kicker"><span>${escape(current.section)}</span><span>${escape(current.time)}</span></div><h1>${escape(current.title)}</h1><p class="editorial-deck">${escape(current.summary)}</p><p class="editorial-byline">CatManDog <span>·</span> ${current.wordCount} слов</p></header><div class="editorial-cover">${articlePhoto(current)}</div><div class="editorial-layout"><nav class="editorial-sidebar" aria-label="Содержание статьи"><h2>В этой статье</h2><ol>${current.sections.map(section=>`<li><button type="button" data-article-jump="${escape(section.id)}">${escape(section.title)}</button></li>`).join('')}</ol></nav><div class="editorial-body"><p class="editorial-intro">${escape(current.intro)}</p>${current.sections.map(section=>`<section class="editorial-section" id="${escape(section.id)}"><h2>${escape(section.title)}</h2>${section.paragraphs.map(paragraph=>`<p>${escape(paragraph)}</p>`).join('')}</section>`).join('')}<aside class="editorial-takeaway"><h2>${escape(current.takeaway.title)}</h2><ul>${current.takeaway.items.map(item=>`<li>${escape(item)}</li>`).join('')}</ul></aside><div class="editorial-sources"><h2>Источники</h2><p>Материал подготовлен на основе открытых рекомендаций. Если речь идёт о здоровье питомца, обратитесь к ветеринарному врачу.</p><ul>${current.sources.map(source=>`<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)} ${icon('arrow')}</a></li>`).join('')}</ul></div><div class="editorial-share"><span>Поделиться статьёй</span><div><button type="button" data-article-share="telegram" data-article-id="${escape(id)}">Telegram ${icon('arrow')}</button><button type="button" data-article-share="whatsapp" data-article-id="${escape(id)}">WhatsApp ${icon('arrow')}</button><button type="button" data-article-share="copy" data-article-id="${escape(id)}">Скопировать ссылку ${icon('copy')}</button></div></div><a class="text-link editorial-back" href="${journalHref()}">${icon('arrow')} Все статьи</a></div></div></article><section class="editorial-related"><div class="section-head"><h2>Читайте дальше</h2><a class="text-link" href="${journalHref()}">Весь журнал</a></div><div class="journal-grid">${related.map(articleCard).join('')}</div></section></div>`;
}
function favoritePage(){
  const selected=products.filter(item=>favorites.includes(item.id));
  return `<div class="page">${crumbs('Избранное')}<h1 class="page-title">Избранное${selected.length?` <span class="muted">(${selected.length})</span>`:''}</h1>${selected.length?`<div class="product-grid">${selected.map(card).join('')}</div>`:empty('Пока здесь пусто','Сохраняйте понравившиеся товары сердечком, чтобы вернуться к ним позже','В каталог','#/catalog')}</div>`;
}
function service(){return `<section class="service" aria-label="Наш подход"><div class="service-item">${icon('leaf')}<div><h3>Выбрано с заботой</h3><p>Продуманные вещи для маленьких и больших ежедневных ритуалов</p></div></div><div class="service-item">${icon('truck')}<div><h3>Удобно каждый день</h3><p>Всё необходимое для вашего питомца - в одном месте</p></div></div><div class="service-item">${icon('heart')}<div><h3>Всегда рядом</h3><p>Помогаем разобраться, выбрать и сделать жизнь вместе лучше</p></div></div></section>`;}
const categoryKey = p => ['Лотки', 'Лотки и гигиена'].includes(p.category) ? 'Наполнитель' : p.category;
function homeCatalogProducts(){
  let list = catalogProducts.filter(p => matchesPet(p,homePet) && (!homeGroup || homeGroupForProduct(p) === homeGroup));
  if(homeBrand) list = list.filter(p => p.brand === homeBrand);
  if(homePrice) list = list.filter(p => matchesHomePrice(p,homePrice));
  if(homeFeature) list = list.filter(p => matchesHomeFeature(p,homeGroup,homeFeature));
  if(homeGroup) return list;
  // Show a few products from each group while no category is selected
  const groups = homeGroupsForPet(homePet,list).map(group => list.filter(p => homeGroupForProduct(p) === group.id));
  const ordered = [];
  for(let i=0; groups.some(group => group[i]); i++) groups.forEach(group => {if(group[i]) ordered.push(group[i]);});
  return ordered;
}
function homeFacet(label,key,value,options){
  return `<label class="home-facet"><span>${label}</span><select data-home-facet="${key}" aria-label="${label}"><option value="">${key==='brand'?'Все бренды':key==='price'?'Любая цена':'Все варианты'}</option>${options.map(option=>`<option value="${escape(option.value)}" ${option.value===value?'selected':''}>${escape(option.label)}</option>`).join('')}</select><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></label>`;
}
function homeCatalogUrl(){
  if(homeGroup&&!homeBrand&&!homePrice&&!homeFeature){
    const landing=seoCategoryPath(homePet,homeGroup);
    if(landing&&locale()==='es')return landing;
  }
  const params = new URLSearchParams({pet:homePet});
  if(homeGroup)params.set('group',homeGroup);
  if(homeBrand)params.set('brand',homeBrand);
  if(homePrice)params.set('maxPrice',homePrice);
  if(homeFeature)params.set('feature',homeFeature);
  return '#/catalog?'+params.toString();
}
function homeCatalog(){
  const list = homeCatalogProducts();
  const shown = list.slice(0,homeVisible);
  const groups = homeGroupsForPet(homePet,catalogProducts);
  const groupProducts = homeGroup ? catalogProducts.filter(p=>matchesPet(p,homePet)&&homeGroupForProduct(p)===homeGroup) : [];
  const brands = [...new Set(groupProducts.map(p=>p.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ru'));
  const prices = homePriceOptions(groupProducts);
  const features = homeFeatureOptions(homeGroup,groupProducts);
  const hasFacets = brands.length>1 || prices.length>0 || features.length>0;
  const emptyAction = homePet==='dog'&&!catalogProducts.some(p=>matchesPet(p,'dog'))
    ? 'data-home-pet="cat"'
    : groupProducts.length && (homeBrand || homePrice || homeFeature) ? 'data-home-clear' : `data-home-group="${escape(homeGroup)}"`;
  const emptyLabel = emptyAction==='data-home-clear'?'Сбросить фильтры':homePet==='dog'?'Посмотреть товары для кошек':'Показать все товары';
  return `<div class="section-head selection-head"><h2 id="home-catalog-title">Каталог товаров</h2><div class="tabs" role="group" aria-label="Для кого товары">${[['cat','Для кошек'],['dog','Для собак']].map(([value,label])=>`<button class="tab ${homePet===value?'active':''}" data-home-pet="${value}" aria-pressed="${homePet===value}">${label}</button>`).join('')}</div><a href="${homeCatalogUrl()}" class="text-link">Смотреть всё</a></div>
  ${catalogUnavailable?'<p class="food-catalog-note">Каталог временно недоступен. Обновите страницу позже.</p>':''}
  ${groups.length?`<div class="home-catalog-filters" role="group" aria-label="Категории для ${homePet==='cat'?'кошек':'собак'}">${groups.map(group=>`<button class="home-category ${homeGroup===group.id?'active':''}" data-home-group="${escape(group.id)}" aria-pressed="${homeGroup===group.id}">${escape(group.label)}</button>`).join('')}</div>`:''}
  ${homeGroup&&hasFacets?`<div class="home-catalog-facets" role="group" aria-label="Фильтры категории">${brands.length>1?homeFacet('Бренд','brand',homeBrand,brands.map(brand=>({value:brand,label:brand}))):''}${prices.length?homeFacet('Цена','price',homePrice,prices.map(price=>({value:String(price),label:`До ${money(price)}`}))):''}${features.length?homeFacet('Особенности','feature',homeFeature,features.map(feature=>({value:feature.id,label:feature.label}))):''}${homeBrand||homePrice||homeFeature?'<button class="home-facet-reset" data-home-clear>Сбросить фильтры</button>':''}</div>`:''}
  <p class="home-catalog-count" role="status">Показано ${shown.length} из ${list.length}</p>
  <div class="product-grid" id="selection-grid">${shown.length?shown.map(card).join(''):`<div class="home-catalog-empty"><p>${homePet==='dog'&&!catalogProducts.some(p=>matchesPet(p,'dog'))?'Для собак ничего не нашлось':homeGroup?'В этой категории пока ничего не нашлось':'Пока здесь нет товаров'}</p><button class="text-link" ${emptyAction}>${emptyLabel}</button></div>`}</div>
  ${shown.length<list.length?'<div class="home-catalog-more"><button class="button button-secondary" data-home-more>Посмотреть ещё</button></div>':''}`;
}
function refreshHomeCatalog(attribute,value){
  const section = document.querySelector('#home-catalog');
  if(!section) return;
  const y = scrollY;
  section.innerHTML = homeCatalog();
  const control = [...section.querySelectorAll('button,select')].find(b=>b.hasAttribute(attribute)&&b.getAttribute(attribute)===value);
  control?.focus({preventScroll:true});
  window.scrollTo(0,y);
}
app.addEventListener('click', handleCatPickClick);
app.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button || !button.closest('#home-catalog'))return;
  if(button.hasAttribute('data-home-pet')){
    homePet=button.dataset.homePet;
    homeGroup='';homeBrand='';homePrice='';homeFeature='';homeVisible=8;
    refreshHomeCatalog('data-home-pet',homePet);
  }else if(button.hasAttribute('data-home-group')){
    homeGroup=homeGroup===button.dataset.homeGroup?'':button.dataset.homeGroup;
    homeBrand='';homePrice='';homeFeature='';homeVisible=8;
    refreshHomeCatalog('data-home-group',button.dataset.homeGroup);
  }else if(button.hasAttribute('data-home-clear')){
    homeBrand='';homePrice='';homeFeature='';homeVisible=8;
    refreshHomeCatalog('data-home-group',homeGroup);
  }
});
app.addEventListener('change',event=>{
  if(!event.target.hasAttribute('data-home-facet'))return;
  const facet=event.target.dataset.homeFacet;
  if(facet==='brand')homeBrand=event.target.value;
  if(facet==='price')homePrice=event.target.value;
  if(facet==='feature')homeFeature=event.target.value;
  homeVisible=8;
  refreshHomeCatalog('data-home-facet',facet);
});
function homeUseful(){
  const symbols = {
    clinics: '<path d="M40 71c13-16 22-26 22-39a22 22 0 0 0-44 0c0 13 9 23 22 39Z"/><path d="M40 21v22M29 32h22"/>',
    travel: '<rect x="13" y="24" width="54" height="43" rx="7"/><path d="M30 24v-8a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8M13 43h54M28 39v8m24-8v8"/>',
    account: '<path d="M21 31 18 17l15 9c5-3 9-3 14 0l15-9-3 14c5 5 8 11 8 17 0 15-11 24-27 24S13 63 13 48c0-6 3-12 8-17Z"/><path d="M30 46h.01M50 46h.01M37 56h6m-3 0v4"/>'
  };
  const items = [
    { key:'clinics', href:'#/useful/clinics', title:'Ветклиники Валенсии', description:'Контакты, карта и маршрут' },
    { key:'travel', href:'#/useful/travel', title:'Чек-лист поездки', description:'Подготовка под маршрут и транспорт' },
    { key:'account', href:'#/account', title:'Кабинет питомца', description:'Профиль и сохранённые планы' }
  ];
  return `<section class="section use-home" aria-labelledby="use-home-title"><div class="section-head use-home-head"><div><h2 id="use-home-title">Полезное для жизни вместе</h2><p>Найти помощь рядом, собраться в дорогу и сохранить важное для питомца</p></div><a class="text-link" href="#/useful">Открыть инструменты ${icon('arrow')}</a></div><div class="use-home-items">${items.map(item=>`<a class="use-home-item" href="${item.href}"><span class="use-home-circle"><svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[item.key]}</svg></span><span class="use-home-copy"><strong>${item.title}</strong><span class="use-home-description">${item.description}</span></span><span class="use-home-open" aria-hidden="true">${icon('arrow')}</span></a>`).join('')}</div></section>`;
}
function home(){return `<section class="hero"><img src="https://img.catmandog.es/assets/hero-happy.png" alt="Золотистый ретривер и серая кошка на диване" fetchpriority="high"><div class="hero-copy"><h1>Хорошая<br>жизнь<br>С хвостиком</h1><p>Всё, что нужно для счастливой жизни кошек, собак и их людей</p><a class="button" href="#/catalog">Найти своё ${icon('arrow')}</a><span class="hero-note">С заботой о каждом хвосте</span></div></section><section class="section"><div class="section-head"><h2>Их любимые вещи</h2><a class="text-link" href="#/catalog">Весь каталог</a></div><div class="categories">${categories.filter(c=>c!=='Подарочные наборы').map((c,i)=>`<a class="category" href="#/catalog?category=${encodeURIComponent(c)}"><div class="category-image" style="${categoryImageStyle(c)}"></div><span>${categoryLabel(c)}</span></a>`).join('')}</div></section>${homeShortcuts(catalogProducts,icon,escape,locale())}<section class="section home-catalog" id="home-catalog" aria-labelledby="home-catalog-title">${homeCatalog()}</section>${service()}<section class="section journal-section"><div class="section-head journal-section-head"><div><span class="eyebrow">Идеи для жизни вместе</span><h2>Журнал о питомцах</h2><p class="journal-intro">Про уютный дом, игры и поездки с питомцем</p></div><a class="text-link" href="${journalHref()}">Весь журнал</a></div><div class="journal-grid">${displayArticles.map(articleCard).join('')}</div></section>${homeUseful()}<section class="brand-story"><h2>Они делают нашу жизнь лучше<br>А мы - их</h2><div><p>CatManDog - про жизнь вместе Про утренние прогулки, тёплые носы и вещи, которые помогают заботиться каждый день</p><a class="text-link" href="#/about">Ближе познакомиться</a></div></section>`;}
function foodFilters(params){return `<div class="food-filters"><div class="food-types" aria-label="Тип корма">${[['','Весь корм'],['dry','Сухой'],['wet','Влажный']].map(([value,label])=>`<button class="pill ${(params.get('foodType')||'')===value?'active':''}" data-food-type="${value}" aria-pressed="${(params.get('foodType')||'')===value}">${label}</button>`).join('')}</div><label class="food-brand">Бренд <select id="food-brand"><option value="">Все бренды</option>${[...new Set(catalogProducts.filter(p=>p.isReal&&p.category==='Корм').map(p=>p.brand))].sort((a,b)=>a.localeCompare(b)).map(brand=>`<option value="${escape(brand)}" ${params.get('brand')===brand?'selected':''}>${escape(brand)}</option>`).join('')}</select></label></div>`;}
function filteredProducts(params){let list=catalogProducts.filter(p=>(!params.get('pet')||p.pet===params.get('pet')||p.pet==='both')&&(!params.get('category')||categoryKey(p)===params.get('category'))&&(params.get('maxPrice')||displayedMinPrice(p)===null||displayedMinPrice(p)<=priceLimit));if(params.get('group'))list=list.filter(p=>homeGroupForProduct(p)===params.get('group'));if(params.get('group')&&params.get('brand'))list=list.filter(p=>p.brand===params.get('brand'));if(params.get('group')&&params.get('feature'))list=list.filter(p=>matchesHomeFeature(p,params.get('group'),params.get('feature')));if(params.get('maxPrice'))list=list.filter(p=>matchesHomePrice(p,params.get('maxPrice')));if(params.get('category')==='Корм')list=list.filter(p=>(!params.get('foodType')||p.foodType===params.get('foodType'))&&(!params.get('brand')||p.brand===params.get('brand')));const q=params.get('q')||'';if(q)list=list.filter(p=>{const fields=snapshots(p).flatMap(v=>[v.name,v.label||'',v.manufacturerSku||v.model||'']);return matchesCatalogSearch(p,q,locale()==='es'?[translate(p.name),translate(p.category),translate(p.description||''),...fields,...fields.map(translate)]:fields)});switch(params.get('sort')){case 'low':list.sort((a,b)=>(displayedMinPrice(a)??Infinity)-(displayedMinPrice(b)??Infinity));break;case 'high':list.sort((a,b)=>displayedMinPrice(a)!==null&&displayedMinPrice(b)!==null?displayedMinPrice(b)-displayedMinPrice(a):displayedMinPrice(a)!==null?-1:displayedMinPrice(b)!==null?1:0);break;case 'name':list.sort((a,b)=>translate(a.name).localeCompare(translate(b.name),intlLocale()));}return list;}
function catalogSelection(params){
  const group=homeGroups.find(item=>item.id===params.get('group'));
  if(!group)return '';
  const feature=homeFeatureOptions(group.id,catalogProducts).find(item=>item.id===params.get('feature'))?.label;
  return `<div class="catalog-applied"><span>Выбрано: ${escape(group.label)}${params.get('brand')?` · ${escape(params.get('brand'))}`:''}${params.get('maxPrice')?` · до ${money(Number(params.get('maxPrice')))}`:''}${feature?` · ${escape(feature)}`:''}</span><a href="#/catalog?pet=${escape(params.get('pet')||'cat')}">Сбросить</a></div>`;
}
function catalog(){const {params}=route();const landing=!location.hash?seoCategoryForPath(location.pathname):null;const list=filteredProducts(params);const title=landing?.title||homeGroups.find(group=>group.id===params.get('group'))?.label||categoryLabel(params.get('category'))||(params.get('pet')==='cat'?'Для кошек':params.get('pet')==='dog'?'Для собак':'Всё для хорошей жизни');const shownPriceLimit=params.get('maxPrice')?Number(params.get('maxPrice')):priceLimit;const homeSelection=catalogSelection(params);return `<div class="page">${crumbs('Каталог')}<h1 class="page-title">${escape(title)}</h1><p class="lead">${landing?.intro ? escape(landing.intro) : (params.get('category')==='Корм'?(params.get('pet')==='dog'?'Корм для собак - от повседневных рационов до особенных потребностей':'Корм для кошек - от ежедневного рациона до особенных потребностей'):params.get('category')==='Лакомства'?'Кремовые лакомства, снеки и топперы для кошек':params.get('category')==='Игрушки и аксессуары'?'Игрушки, когтеточки, коврики и другие вещи для игры и занятий':params.get('category')==='Миски и поилки'?'Свежая вода каждый день - фонтаны, сменные фильтры и любимые миски':params.get('category')==='Окна и балконы'?'Сетки, крепления и места для отдыха - для его маленького мира у окна':'От любимого корма до новой игрушки Нужные вещи, выбранные с заботой')}</p><div class="catalog-toolbar"><div class="pet-tabs">${[['','Все питомцы'],['cat','Для кошек'],['dog','Для собак']].map(([value,label])=>`<button class="pill ${(params.get('pet')||'')===value?'active':''}" data-pet="${value}">${label}</button>`).join('')}</div><form class="catalog-search search-combo" data-search-form="catalog" role="search"><label class="visually-hidden" for="catalog-search">Поиск по каталогу</label><div class="search-combo-field">${icon('search')}<input id="catalog-search" data-search-input type="search" value="${escape(params.get('q')||'')}" placeholder="Название товара или бренд" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="catalog-search-suggestions" aria-expanded="false"></div><div class="search-suggestions" id="catalog-search-suggestions" hidden></div></form><select id="sort" aria-label="Сортировка товаров"><option value="popular">По умолчанию</option><option value="low" ${params.get('sort')==='low'?'selected':''}>Сначала дешевле</option><option value="high" ${params.get('sort')==='high'?'selected':''}>Сначала дороже</option><option value="name" ${params.get('sort')==='name'?'selected':''}>По названию</option></select></div><div class="catalog-layout"><aside class="filters" aria-label="Фильтры товаров"><h3>Категории</h3>${['Все товары',...categories].map((c,i)=>`<button class="filter-category ${(!params.get('category')&&!params.get('group')&&i===0)||params.get('category')===c?'active':''}" data-category="${i?c:''}">${categoryLabel(c)}</button>`).join('')}<div class="filter-price"><h3>Цена</h3><label for="price-range">До <span id="price-label">${money(shownPriceLimit)}</span></label><input id="price-range" type="range" min="1" max="${catalogPriceMax}" value="${shownPriceLimit}" step="1"><button class="text-link" style="background:none" data-reset>Сбросить фильтры</button></div></aside><div>${params.get('category')==='Корм'?foodFilters(params):''}${homeSelection}<p class="results-count" id="results-count">${itemCount(list.length)}${params.get('q')?` · Поиск: «${escape(params.get('q'))}»`:''}</p><div class="product-grid" id="catalog-grid">${list.length?list.map(card).join(''):params.get('pet')==='dog'?empty('Пока ничего не нашлось','Попробуйте другую категорию или измените запрос','Сбросить фильтры','#/catalog?pet=dog'):params.get('category')&&categories.includes(params.get('category'))&&!catalogProducts.some(p=>categoryKey(p)===params.get('category'))?empty('В этой категории нет товаров','Посмотрите другие товары для вашего питомца','Открыть каталог','#/catalog'):empty('Пока ничего не нашлось','Попробуйте другую категорию или измените запрос','Сбросить фильтры','#/catalog')}</div></div></div></div>`;}
function searchSuggestions(form){
  const input=form.querySelector('[data-search-input]');
  const panel=form.querySelector('.search-suggestions');
  if(!input||!panel)return;
  const suggestions=catalogSuggestions(catalogProducts,input.value,p=>translate(p.name));
  panel.innerHTML=suggestions.map(item=>`<a class="search-suggestion" href="${item.kind==='brand'?`#/catalog?q=${encodeURIComponent(item.query)}`:productHref(item.id)}"><span>${escape(item.label)}</span><small>${item.kind==='brand'?'Все товары бренда':escape(item.brand)}</small>${icon('arrow')}</a>`).join('');
  panel.hidden=!suggestions.length;
  input.setAttribute('aria-expanded',String(!!suggestions.length));
}
function closeSearchSuggestions(form){
  const panel=form?.querySelector('.search-suggestions');
  if(panel)panel.hidden=true;
  form?.querySelector('[data-search-input]')?.setAttribute('aria-expanded','false');
}
function updateCatalogSearch(query){
  const params=route().params;
  const value=query.trim();
  if(value)params.set('q',value);else params.delete('q');
  history.replaceState(null,'',`${location.pathname}${location.search}#/catalog${params.size?'?'+params.toString():''}`);
  const list=filteredProducts(params);
  const grid=document.querySelector('#catalog-grid');
  if(grid)grid.innerHTML=list.length?list.map(card).join(''):empty('Пока ничего не нашлось','Попробуйте другое название или бренд','Сбросить фильтры','#/catalog');
  const count=document.querySelector('#results-count');
  if(count)count.textContent=`${itemCount(list.length)}${value?` · Поиск: «${value}»`:''}`;
}
function empty(title,text,label,link){return `<div class="empty-state"><h2>${title}</h2><p>${text}</p><a class="button" href="${link}">${label}</a></div>`;}
function detail(id,preserveSelection=false){const p=products.find(p=>p.id===id)||products.find(p=>hasVariants(p)&&p.variants.some(v=>v.id===id));if(!p)return notFound();if(p.storefrontRetired)return `<div class="page">${crumbs('Каталог')}${empty('Товар больше не представлен','Мы обновили ассортимент - посмотрите актуальные товары для вашего питомца','В каталог','#/catalog')}</div>`;if(!preserveSelection){selectedVariantId=hasVariants(p)?(route().params.get('variant')||(p.id!==id?id:p.defaultVariantId)||p.variants[0].id):null;detailQuantity=1;}const selected=resolveVariant(p,selectedVariantId);if(!selected)return notFound();selectedSize=selected.sizes?.[0]||selected.label||'';if(hasVariants(p)||(p.isReal&&!canBuy(p))){return accessoryDetail(p,{crumbs,imageBlock,escape,icon,favorites,goodTogether,money,translate,variantId:selectedVariantId,quantity:detailQuantity,language:locale()});}if(p.gift){giftState=normalizeGift({season:route().params.get('season')});return giftDetail(p,giftState,giftHelpers);}return `<div class="page">${crumbs(p.name)}<div class="detail-grid">${imageBlock(p.image,'detail-image')}<div class="detail-copy"><span class="eyebrow">${p.line}</span><h1>${p.name}</h1><div class="detail-price">${money(p.price)} ${p.old?`<span class="old-price">${money(p.old)}</span>`:''}</div>${p.isReal?`<p class="retail-note">Цена с IVA${p.packageWeightKg ? ` · ${money(p.price/p.packageWeightKg)} / кг` : ''}</p>`:''}<p>${p.description}</p><span class="size-label">${p.optionLabel||'Размер'}</span><div class="size-options" aria-label="Вариант товара">${p.sizes.map((s,i)=>`<button class="size ${i===0?'active':''}" data-size="${s}" aria-pressed="${i===0}">${s}</button>`).join('')}</div><div class="buy-row"><div class="quantity"><button data-detail-qty="-1" aria-label="Уменьшить количество">${icon('minus')}</button><span id="detail-qty">1</span><button data-detail-qty="1" aria-label="Увеличить количество">${icon('plus')}</button></div><button class="button" data-buy="${p.id}">Добавить в корзину ${icon('bag')}</button><button class="icon-button favorite-detail ${favorites.includes(p.id)?'selected':''}" data-favorite="${p.id}" aria-label="В избранное" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button></div><div class="detail-service">${icon('check')} Выбирайте то, что подходит именно вашему питомцу<br>Доставка и возврат: <a class="text-link" href="#/info/delivery">подробнее</a></div>${customerDetails(p.details, translate, escape, p.category)}</div></div></div>${goodTogether(p)}`;}
function cartPage() {
  return renderLiveBasket({ cart, products, promo: checkoutPromo(), grouping: basketGrouping,
    escape, icon, money, imageBlock });
}
function availabilityPage() {
  const variantId = route().params.get('variant');
  const product = products.find(item => snapshots(item).some(variant => variant.id === variantId));
  const variant = product && resolveVariant(product, variantId);
  if (!product || !variant || variant.saleStatus !== 'unavailable') return notFound();
  const human = account.store.get().human || {};
  const state = availabilityRequestState?.variantId === variantId ? availabilityRequestState : null;
  return detail(product.id) + availabilityRequestPage(product, variant, { language:locale(), escape, icon,
    defaults:state?.values || { name:human.name, email:human.email, phone:human.phone },
    sent:state?.sent, error:state?.error });
}
function about(){return `<div class="page">${crumbs('О нас')}<section class="about-hero"><h1>Они - часть семьи<br>Мы - на вашей стороне</h1><p>CatManDog объединяет вещи и идеи для хорошей жизни с кошками и собаками С заботой о них и с пониманием вас</p></section><div class="prose"><h2>Меньше случайного Больше нужного</h2><p>Нам близок простой подход: окружающие вещи должны быть удобными, продуманными и приятными в повседневной жизни От миски на кухне до переноски для нового путешествия</p><h2>Магазин, в котором помогают выбрать</h2><p>Мы собираем всё необходимое в понятные категории и рассказываем о назначении каждого товара А в журнале делимся идеями для дома, прогулок, игр и жизни вместе</p><a class="button" href="#/catalog">Найти своё ${icon('arrow')}</a></div></div>${service()}`;}
function info(id){
  if(id==='delivery')return `<div class="page">${crumbs('Доставка и возврат')}<div class="prose"><h1>Доставка и возврат</h1><h2>Где доставляем</h2><p>Доставляем по Валенсии и ближайшим адресам в радиусе 20 км от пункта отправления CatManDog, а также отправляем заказы по материковой Испании. Способ и итоговую стоимость доставки покажем при оформлении заказа.</p><h2>Местная доставка по Валенсии и рядом</h2><p>Доставка стоит 3,99 € при сумме товаров после скидки меньше 49 €. От 49 € доставка бесплатная. Купон на доставку может сделать её бесплатной и для меньшего заказа.</p><p>Для товаров с обычной доставкой можно выбрать интервал: 10:00-14:00, 14:00-18:00 или 18:00-22:00. Прошедшие интервалы текущего дня не показываем. Точное время подтвердим после заказа. Для товара под заказ срок согласуем отдельно.</p><h2>Доставка по материковой Испании</h2><p>При сумме товаров после скидки меньше 49 € доставка стоит 9,99 €, от 49 € - 3,99 €, от 99 € - бесплатно. Отправляем перевозчиком. Срок сообщим после передачи посылки.</p><h2>Если нужна помощь</h2><p>Для вопросов о заказе подготовлена форма поддержки. Запрос на возврат можно начать через отдельную форму. ${checkout.isSupportEnabled() ? 'После проверки обращение можно отправить команде' : 'Пока формы показывают предпросмотр и не отправляют данные.'}</p><p><a class="text-link" href="#/support">Помощь с заказом</a> · <a class="text-link" href="#/returns">Запрос на возврат</a> · <a class="text-link" href="/purchase-terms.html">Условия покупки и возврата</a></p></div></div>`;
  if(id==='contact')return `<div class="page">${crumbs('Контакты')}<div class="prose"><h1>Давайте поговорим</h1><p>Если у вас есть вопрос о товаре или заказе, откройте форму поддержки. ${checkout.isSupportEnabled() ? 'После проверки обращение можно отправить команде' : 'Пока обращение можно подготовить, отправка появится после подключения поддержки.'}</p><a class="button outline" href="#/support">Помощь с заказом ${icon('arrow')}</a></div></div>`;
  if(id==='privacy')return `<div class="page">${crumbs('Конфиденциальность')}<div class="prose"><h1>Конфиденциальность</h1><p>Информация о данных аккаунта, входе через Google, заказах и обращениях находится на отдельной странице.</p><p><a class="text-link" href="/privacy.html">Открыть информацию о конфиденциальности</a></p></div></div>`;
  return notFound();
}
function notFound(){return `<div class="page">${empty('Эта страница убежала','Но все любимые вещи по-прежнему на месте','На главную','#/')}</div>`;}
function restoreProductReturnScroll(){
  if (catalogLoading) return;
  const y = takeProductReturnScroll(location.pathname + location.search + location.hash);
  if (y !== null) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
}
function render(){if(catalogLoading){app.innerHTML=`<div class="page" role="status">${{ru:'Загружаем каталог',uk:'Завантажуємо каталог',es:'Cargando catálogo'}[locale()] || 'Загружаем каталог'}</div>`;return;}const {path}=route();let html;if(path==='/pet'||path==='/join'||path.startsWith('/account')||path==='/coupon')html=account.page(path,route().params);else if(path.startsWith('/useful'))html=useful.page(path,route().params);else if(path==='/')html=home();else if(path==='/catalog')html=catalog();else if(path==='/gifts')html=giftLanding(giftHelpers);else if(path==='/active-home')html=activeHomeLanding(giftHelpers);else if(path.startsWith('/picks/'))html=homeShortcutLanding(catalogProducts,path.split('/')[2],{...giftHelpers,language:locale()})||notFound();else if(path.startsWith('/product/'))html=detail(path.split('/')[2]);else if(path==='/availability-request')html=availabilityPage();else if(path==='/cart')html=cartPage();else if(path==='/checkout')html=checkout.page();else if(path==='/checkout/preview')html=checkout.previewPage();else if(path==='/checkout/confirmation')html=checkout.resultPage('accepted',route().params);else if(path==='/checkout/payment-error')html=checkout.resultPage('failed',route().params);else if(path==='/checkout/status')html=checkout.resultPage('status',route().params);else if(path==='/support')html=checkout.servicePage('support',route().params);else if(path==='/returns')html=checkout.servicePage('return',route().params);else if(path==='/favorites')html=favoritePage();else if(path==='/journal')html=journal();else if(path.startsWith('/journal/'))html=article(path.split('/')[2]);else if(path==='/about')html=about();else if(path.startsWith('/info/'))html=info(path.split('/')[2]);else html=notFound();app.innerHTML=html;if(path==='/availability-request')app.querySelector('.availability-request-dialog')?.focus({preventScroll:true});document.title=`${(path.startsWith('/account') && account.store.activePet() ? 'Кабинет ' + account.store.activePet().name : null) || ({'/useful':'Полезное','/useful/clinics':'Ветклиники Валенсии','/useful/travel':'В дорогу вместе','/account':'Кабинет с хвостиком','/coupon':'Купон на 10%','/join':'Знакомство с питомцем','/pet':'Профиль питомца','/':'Хорошая жизнь с хвостиком','/catalog':'Каталог','/gifts':'Подарочные наборы','/active-home':'Дом для активного кота','/picks/cat':'Подборка для кошек','/picks/dog':'Подборка для собак','/cart':'Корзина','/checkout':'Оформление заказа','/checkout/preview':'Проверка заказа','/checkout/confirmation':'Подтверждение заказа','/checkout/payment-error':'Ошибка оплаты','/checkout/status':'Статус заказа','/support':'Помощь с заказом','/returns':'Возврат','/availability-request':'Сообщить о поступлении','/journal':'Журнал','/favorites':'Избранное','/about':'О нас'})[path]||'Для хорошей жизни'} · CatManDog`;if(path.startsWith('/journal/'))document.title=`${displayArticles.find(item=>item.id===path.split('/')[2])?.title||translate('Журнал')} · CatManDog`;if(path.startsWith('/product/')){const id=path.split('/')[2];const product=products.find(item=>item.id===id||item.variants?.some(variant=>variant.id===id));if(product)document.title=`${product.name} · CatManDog`;}document.title = locale()==='ru' ? document.title : translate(document.title.split(' · CatManDog')[0])+' · CatManDog';const categoryPage=!location.hash?seoCategoryForPath(location.pathname):null;if(categoryPage)document.title=`${categoryPage.title} · CatManDog`;const productPage=!location.hash?seoProductForPath(location.pathname):null;if(productPage?.title)document.title=`${productPage.title} · CatManDog`;const pickPage=!location.hash?seoPickForPath(location.pathname):null;if(pickPage)document.title=`${pickPage.title} · CatManDog`;document.querySelector('nav').classList.remove('open');document.querySelector('#mobile-toggle').setAttribute('aria-expanded','false');document.querySelectorAll('.header nav a').forEach(a=>a.setAttribute('aria-current',a.getAttribute('href')===location.hash?'page':'false'));updateHeader();account.afterRender();announceView();analytics.pageView();restoreProductReturnScroll();}
function setParam(key,value){const {params}=route();if(key==='category'||key==='pet'){['foodType','brand','group','feature','maxPrice'].forEach(name=>params.delete(name));}value?params.set(key,value):params.delete(key);location.hash=`/catalog${params.size?'?'+params.toString():''}`;}
function add(id,size,qty=1,config,variantId){
  const p=products.find(p=>p.id===id);if(!p)return;
  if(hasVariants(p)&&!variantId){if(p.variants.length>1){location.assign(productHref(id));return;}variantId=resolveVariant(p).id;}
  const selected=resolveVariant(p,variantId);if(!canBuy(selected)){notify('Цена или наличие выбранного варианта уточняются');return;}
  const offer=p.gift?giftOffer(p,config):null;
  size=offer?.label||selected.label||size||selected.sizes[0];
  const next={id:p.id,productId:p.id,variantId:hasVariants(p)?selected.id:null,size,qty,...(hasVariants(p)?{variantLabel:selected.label}:{}),...(offer?{giftConfig:offer.config}:{})};
  if(hasVariants(p))cart=cart.filter(item=>!(item.productId===p.id&&item.needsVariantSelection));
  const item=cart.find(x=>sameCartSku(x,next)&&(!offer||JSON.stringify(normalizeGift(x.giftConfig))===JSON.stringify(offer.config)));
  const beforeQty=item?.qty||0;
  if(item)item.qty=Math.min(99,item.qty+qty);else cart.push(next);
  lastCartAddition={item:next,beforeQty,afterQty:item?.qty||next.qty};
  persist();
  if (!p.gift) announceCommerce('add_to_cart', [analyticsItem(p, selected, qty)]);
  notify(offer?.preorder?'Новогодний предзаказ добавлен в корзину':'Товар добавлен в корзину',{cartAction:true});
}
function undoCartAddition(){
  const addition=lastCartAddition;
  if(!addition)return;
  const index=cart.findIndex(item=>sameCartSku(item,addition.item)&&JSON.stringify(item.giftConfig||null)===JSON.stringify(addition.item.giftConfig||null));
  if(index<0||cart[index].qty!==addition.afterQty){hideToast();notify('Корзина уже изменилась');return;}
  if(addition.beforeQty)cart[index].qty=addition.beforeQty;else cart.splice(index,1);
  hideToast();persist();if(route().path==='/cart')render();notify('Добавление отменено');
}
function selectVariant(variantId){const id=route().path.split('/')[2];const p=products.find(p=>p.id===id)||products.find(p=>hasVariants(p)&&p.variants.some(v=>v.id===id));if(!p||!p.variants?.some(v=>v.id===variantId))return;selectedVariantId=variantId;const y=scrollY;app.innerHTML=detail(p.id,true);scrollTo(0,y);document.querySelector(`[data-variant="${CSS.escape(variantId)}"]`)?.focus();}
function updateGiftDetail(){
  const p=products.find(p=>p.id===route().path.split('/')[2]);if(!p?.gift)return;
  const offer=giftOffer(p,giftState);
  document.querySelector('#gift-options').innerHTML=giftOptions(p,giftState,giftHelpers);
  document.querySelector('#gift-summary').innerHTML=giftSummary(p,giftState,giftHelpers);
  document.querySelector('#gift-price').textContent=money(offer.price);
  document.querySelector('#gift-status').textContent=offer.preorder?'Новогодний предзаказ':'Для кошек · подарочная упаковка';
  document.querySelector('#gift-picture').innerHTML=imageBlock(offer.image,'detail-image');
  document.querySelector('#gift-buy').innerHTML=(offer.preorder?'Предзаказать набор':'Добавить набор')+' '+icon('bag');
  document.querySelector('#gift-order-note').textContent=offer.preorder?'Предзаказ подарочного набора пока недоступен. Дату отправки сообщим при запуске':'Упаковка входит в цену. Оформление заказов пока недоступно';
}
app.addEventListener('click',event=>{const link=event.target.closest('a[href^="#/account/"]');if(link)checkout.capture(link.closest('[data-checkout-form]'));});
app.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;account.click(button);useful.click(button);if(button.hasAttribute('data-configure'))location.assign(productHref(button.dataset.configure));if(button.hasAttribute('data-gift-season')){giftState=normalizeGift({...giftState,season:button.dataset.giftSeason});updateGiftDetail();}if(button.hasAttribute('data-gift-preset')){giftState=applyGiftPreset(giftState,button.dataset.giftPreset);updateGiftDetail();}if(button.hasAttribute('data-gift-buy'))add(button.dataset.giftBuy,null,detailQuantity,giftState);if(button.hasAttribute('data-add'))add(button.dataset.add);if(button.hasAttribute('data-buy'))add(button.dataset.buy,selectedSize,detailQuantity,undefined,selectedVariantId);if(button.hasAttribute('data-variant'))selectVariant(button.dataset.variant);if(button.hasAttribute('data-favorite')){const id=button.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];persist();if(route().path==='/favorites'){render();return;}document.querySelectorAll(`[data-favorite="${id}"]`).forEach(b=>{b.classList.toggle('selected',favorites.includes(id));b.setAttribute('aria-pressed',String(favorites.includes(id)));b.setAttribute('aria-label',`${favorites.includes(id)?'Убрать из избранного':'В избранное'}: ${products.find(p=>p.id===id).name}`);});notify(favorites.includes(id)?'Сохранено в избранном':'Удалено из избранного');}if(button.hasAttribute('data-home-more')){homeVisible+=8;refreshHomeCatalog('data-home-more','');}if(button.hasAttribute('data-food-type'))setParam('foodType',button.dataset.foodType);if(button.hasAttribute('data-pet'))setParam('pet',button.dataset.pet);if(button.hasAttribute('data-category'))setParam('category',button.dataset.category);if(button.hasAttribute('data-reset')){priceLimit=catalogPriceMax;location.hash='/catalog';render();}if(button.hasAttribute('data-size')){selectedSize=button.dataset.size;document.querySelectorAll('[data-size]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});}if(button.hasAttribute('data-detail-qty')){detailQuantity=Math.max(1,Math.min(99,detailQuantity+Number(button.dataset.detailQty)));document.querySelector('#detail-qty').textContent=detailQuantity;}if(button.hasAttribute('data-cart-qty')){const i=Number(button.dataset.cartQty);cart[i].qty+=Number(button.dataset.delta);if(cart[i].qty<1)cart.splice(i,1);else cart[i].qty=Math.min(99,cart[i].qty);persist();render();}if(button.hasAttribute('data-remove')){const removed=cart.splice(Number(button.dataset.remove),1)[0];if(removed)announceCommerce('remove_from_cart',cartCommerceItems([removed]));persist();render();notify('Товар удалён из корзины');}if(button.hasAttribute('data-journal-category')){journalCategory=button.dataset.journalCategory;render();}if(button.id==='checkout'&&!button.disabled){checkoutGroup=button.dataset.liveCheckoutGroup==='stock'?'stock':'all';try{sessionStorage.setItem('catmandog-checkout-group',checkoutGroup);}catch{}announceCommerce('begin_checkout',checkoutCart().map(item=>{const product=products.find(p=>p.id===(item.productId||item.id));return analyticsItem(product,cartSku(item,products),item.qty);}));location.hash='/checkout';}});
app.addEventListener('change',event=>{if(event.target.hasAttribute('data-gift-choice')){const field=event.target.dataset.giftChoice;giftState=normalizeGift({...giftState,[field]:event.target.value,...(field==='accessorySize'?{}:{preset:'custom'})});updateGiftDetail();document.querySelector(`[data-gift-choice="${field}"]`)?.focus();}if(event.target.id==='sort')setParam('sort',event.target.value);});
app.addEventListener('input',event=>{if(event.target.hasAttribute('data-gift-text')){giftState=normalizeGift({...giftState,[event.target.dataset.giftText]:event.target.value});document.querySelector('#gift-message-count').textContent=giftState.message.length+'/160';}if(event.target.id==='price-range'){priceLimit=Number(event.target.value);document.querySelector('#price-label').textContent=money(priceLimit);const params=route().params;if(params.has('maxPrice')){params.delete('maxPrice');history.replaceState(null,'',location.pathname+location.search+'#/catalog'+(params.size?'?'+params.toString():''));}const applied=document.querySelector('.catalog-applied');if(applied)applied.outerHTML=catalogSelection(params);const list=filteredProducts(params);document.querySelector('#catalog-grid').innerHTML=list.length?list.map(card).join(''):empty('Пока ничего не нашлось','Попробуйте изменить фильтры','Все товары','#/catalog');document.querySelector('#results-count').textContent=`${itemCount(list.length)}`;}});
document.querySelector('#account-link').innerHTML=icon('paw');document.querySelector('#search-close').innerHTML=icon('close');document.querySelector('#search-toggle').innerHTML=icon('search');document.querySelector('#favorites-link').innerHTML=icon('heart');document.querySelector('#mobile-toggle').innerHTML=icon('menu');
document.querySelector('#toast').addEventListener('click',event=>{if(event.target.closest('.toast-undo')){undoCartAddition();return;}if(event.target.closest('.toast-close, .toast-link'))hideToast();});
document.querySelector('#search-toggle').addEventListener('click',()=>{const panel=document.querySelector('#search-form');panel.hidden=!panel.hidden;if(!panel.hidden){document.querySelector('#site-search').focus();searchSuggestions(panel);}else closeSearchSuggestions(panel);});
document.querySelector('#search-close').addEventListener('click',()=>{const panel=document.querySelector('#search-form');panel.hidden=true;closeSearchSuggestions(panel);document.querySelector('#search-toggle').focus();});
document.addEventListener('input',event=>{const input=event.target.closest('[data-search-input]');if(!input)return;const form=input.closest('[data-search-form]');searchSuggestions(form);if(form.dataset.searchForm==='catalog')updateCatalogSearch(input.value);});
document.addEventListener('submit',event=>{const form=event.target.closest('[data-search-form]');if(!form)return;event.preventDefault();const q=form.querySelector('[data-search-input]').value.trim();closeSearchSuggestions(form);if(form.dataset.searchForm==='site'){priceLimit=catalogPriceMax;form.hidden=true;location.hash=`/catalog${q?'?q='+encodeURIComponent(q):''}`;}else updateCatalogSearch(q);});
document.addEventListener('keydown',event=>{const input=event.target.closest('[data-search-input]');if(input&&event.key==='ArrowDown'){const first=input.closest('[data-search-form]').querySelector('.search-suggestion');if(first){event.preventDefault();first.focus();}}const choice=event.target.closest('.search-suggestion');if(choice&&['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();const options=[...choice.closest('.search-suggestions').querySelectorAll('.search-suggestion')];options[(options.indexOf(choice)+(event.key==='ArrowDown'?1:-1)+options.length)%options.length]?.focus();}});
document.addEventListener('click',event=>{const choice=event.target.closest('.search-suggestion');if(choice){closeSearchSuggestions(choice.closest('[data-search-form]'));document.querySelector('#search-form').hidden=true;}else if(!event.target.closest('[data-search-form], #search-toggle'))document.querySelectorAll('[data-search-form]').forEach(closeSearchSuggestions);});
document.querySelector('#mobile-toggle').addEventListener('click',()=>{const open=document.querySelector('nav').classList.toggle('open');document.querySelector('#mobile-toggle').setAttribute('aria-expanded',String(open));});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(route().path==='/availability-request'){const variantId=route().params.get('variant');const product=products.find(item=>snapshots(item).some(variant=>variant.id===variantId));if(product){location.assign(`${productHref(product.id)}?variant=${encodeURIComponent(variantId)}`);return;}}account.escapeChoices();document.querySelector('#search-form').hidden=true;document.querySelectorAll('[data-search-form]').forEach(closeSearchSuggestions);document.querySelector('nav').classList.remove('open');document.querySelector('#mobile-toggle').setAttribute('aria-expanded','false');}});
window.addEventListener('hashchange',()=>{if((seoProductForPath(location.pathname)||seoPickForPath(location.pathname))&&location.hash){location.replace('/'+location.hash);return;}document.querySelector('#search-form').hidden=true;render();account.handleLink();window.scrollTo(0,0);});
render();
account.initialize();
checkout.initialize();
if (['http:','https:'].includes(location.protocol)) {
  fetch('/api/catalog', { credentials: 'same-origin' }).then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!data) throw new Error('Каталог недоступен');
      if (!applyServerCatalog(products, catalogProducts, data.variants)) throw new Error('Некорректный каталог');
      for (const product of catalogProducts) {
        const category = categoryKey(product);
        if (category && !categories.includes(category)) categories.push(category);
      }
      const previousMax = catalogPriceMax;
      catalogPriceMax = Math.max(100, Math.ceil(Math.max(...catalogProducts.map(p => catalogPrice(p).max ?? 0)) / 10) * 10);
      if (priceLimit === previousMax) priceLimit = catalogPriceMax;
      cart = normalizeCart(cart, products);
      catalogLoading = false;
      render();
    }).catch(() => {
      catalogUnavailable = true;
      applyServerCatalog(products, catalogProducts, []);
      catalogLoading = false;
      render();
    });
}

app.addEventListener('change',event=>{if(event.target.id==='food-brand')setParam('brand',event.target.value);});
app.addEventListener('change',event=>account.change(event.target));
app.addEventListener('click',event=>account.dismissChoices(event.target));

app.addEventListener('submit',event=>{if(event.target.matches('[data-account-form]')){event.preventDefault();account.submit(event.target);}});

app.addEventListener('submit', event => { if(event.target.matches('[data-use-form]')) { event.preventDefault(); useful.submit(event.target); } });
app.addEventListener('change', event => useful.change(event.target));
app.addEventListener('submit', event => {
  if (!event.target.matches('[data-checkout-form], [data-service-form]')) return;
  event.preventDefault();
  checkout.submit(event.target);
});
app.addEventListener('click', event => {
  const button = event.target.closest('[data-request-availability]');
  if (button) location.hash = `/availability-request?variant=${encodeURIComponent(button.dataset.requestAvailability)}`;
});
app.addEventListener('submit', async event => {
  const form = event.target.closest('[data-availability-request]');
  if (!form) return;
  event.preventDefault();
  const variantId = form.dataset.availabilityRequest;
  const values = Object.fromEntries(new FormData(form).entries());
  const button = form.querySelector('[type="submit"]');
  if (!values.email?.trim() && !values.phone?.trim()) {
    form.querySelector('.checkout-error').textContent = locale() === 'es'
      ? 'Indica tu email o teléfono' : locale() === 'uk'
        ? 'Вкажіть email або телефон' : 'Укажите email или телефон';
    return;
  }
  button.disabled = true;
  try {
    const response = await fetch('/api/availability-requests', { method:'POST', credentials:'same-origin',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ variantId, name:values.name, email:values.email, phone:values.phone,
        size:values.size,
        consent:values.consent === 'on', locale:locale() }) });
    const result = await response.json();
    if (!response.ok || !result.accepted) throw new Error(result.error || 'Не удалось отправить запрос');
    availabilityRequestState = { variantId, sent:true, values };
  } catch (error) {
    availabilityRequestState = { variantId, error:error.message, values };
  }
  render();
});
app.addEventListener('change', event => {
  if (event.target.name === 'live-delivery-grouping') {
    basketGrouping = event.target.value === 'separate' ? 'separate' : 'together';
    try { localStorage.setItem('catmandog-delivery-grouping', JSON.stringify(basketGrouping)); } catch {}
    render();
    return;
  }
  checkout.change(event.target);
});
app.addEventListener('input', event => { if (event.target.closest('[data-service-form]')) checkout.invalidateService(); });
app.addEventListener('change', event => { if (event.target.closest('[data-service-form]')) checkout.invalidateService(); });
app.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button) checkout.click(button);
});
app.addEventListener('click',async event=>{
  const productLink=event.target.closest('.product-card-open');
  if(productLink){
    const id=productLink.dataset.productId;
    const product=products.find(item=>item.id===id);
    if(product)announceCommerce('select_item',[analyticsItem(product)],{item_list_id:route().params.get('group')||route().params.get('pet')||'home'});
  }
  const jump=event.target.closest('[data-article-jump]');
  if(jump){document.getElementById(jump.dataset.articleJump)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});return;}
  const share=event.target.closest('[data-article-share]');
  if(!share)return;
  const selected=displayArticles.find(item=>item.id===share.dataset.articleId);
  if(!selected)return;
  if(!['http:','https:'].includes(location.protocol)||['localhost','127.0.0.1'].includes(location.hostname)){notify('Ссылки для публикации появятся после запуска сайта');return;}
  const articleUrl=new URL(journalHref(selected.id),location.origin+'/').toString();
  if(share.dataset.articleShare==='telegram')window.open(`https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(selected.title)}`,'_blank','noopener,noreferrer');
  if(share.dataset.articleShare==='whatsapp')window.open(`https://wa.me/?text=${encodeURIComponent(`${selected.title} ${articleUrl}`)}`,'_blank','noopener,noreferrer');
  if(share.dataset.articleShare==='copy'){
    try{await navigator.clipboard.writeText(articleUrl);notify('Ссылка скопирована');}
    catch{notify('Не удалось скопировать ссылку');}
  }
});
