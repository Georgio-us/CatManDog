import { createUsefulUI } from './useful.js?v=es-locale-4';
import { createAccountUI } from './account.js?v=es-locale-4';
import { hasVariants, snapshots, resolveVariant, confirmedPrice, storefrontPrice, isDemoPrice, canBuy, catalogPrice, normalizeCart, cartSku, sameCartSku } from './variants.js';
import { accessoryDetail } from './accessory-ui.js?v=rc-availability-2';
import { availabilityScenarioDetail, availabilityScenarioFeedback } from './availability-scenario.js?v=4';
import { provisionalPriceLabel } from './retail-research.js?v=es-locale-4';
import { recommendForProduct } from './recommendations.js?v=dog-first-wave-1';
import { homeGroups, homeGroupsForPet, homeGroupForProduct, homeFeatureOptions, matchesHomeFeature, matchesHomePrice, homePriceOptions, matchesPet } from './home-catalog.js?v=variant-pricing-1';
import { loadSupplierTerms } from './supplier-terms.js';
import { categories, products, catalogProducts, articles } from './data.js?v=retail-reference-1';
import { normalizeGift, giftOffer, cartUnitPrice as legacyCartUnitPrice, giftOptions, giftSummary, giftDetail, applyGiftPreset, giftLanding } from './gifts.js?v=es-locale-4';
import { checkoutTotals, FREE_DELIVERY_FROM, DELIVERY_FEE } from './checkout-model.js';
import { createCheckoutUI } from './checkout-ui.js?v=es-locale-4';
import { orderVariantId } from './order-progress.js';
import { applyServerCatalog } from './server-prices.js?v=rc-availability-1';

import { homeDirections, activeHomeLanding } from './collections.js?v=cat-assortment-1';
import { installLocale, intlLocale, locale, translate } from './locale.js?v=terms-1';
import { articlesEs } from './journal-content-es.js?v=es-1';
import { seoCategoryForPath, seoCategoryPath } from './seo-categories.js';
import { analyticsItem, announceCommerce } from './analytics-events.js';
import { installAnalytics } from './analytics-consent.js';

const app = document.querySelector('#app');
installLocale();
const analytics = installAnalytics(locale());
const displayArticles = locale() === 'es' ? articlesEs : articles;
const paths = {map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',phone:'<path d="m7 3 3 5-3 2a15 15 0 0 0 7 7l2-3 5 3-2 4C9 21 3 15 3 5l4-2Z"/>',cat:'<path d="M5 8 4 3l6 4h4l6-4-1 5c2 2 3 4 3 6 0 5-4 8-10 8S2 19 2 14c0-2 1-4 3-6Z"/><path d="M8 13h.01M16 13h.01M11 17h2m-9-1H1m19 0h3"/>',paw:'<ellipse cx="12" cy="16" rx="6" ry="5"/><ellipse cx="5" cy="8" rx="2" ry="3"/><ellipse cx="10" cy="5" rx="2" ry="3"/><ellipse cx="15" cy="5" rx="2" ry="3"/><ellipse cx="20" cy="8" rx="2" ry="3"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3"/>',gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z"/>',shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-2l2 3M4 16l2 3a7 7 0 0 0 12-2"/>',copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',heart:'<path d="M20.8 4.8a5.4 5.4 0 0 0-7.6 0L12 6l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.6a5.4 5.4 0 0 0 0-7.6Z"/>',bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M9 9V5a3 3 0 0 1 6 0v4"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',leaf:'<path d="M20 3C8 2 3 8 5 15s13 7 15-12Z"/><path d="M3 21 16 8"/>',truck:'<path d="M2 4h12v13H2zM14 9h4l4 5v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',check:'<path d="m5 12 4 4L19 6"/>'};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.heart}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const itemCount = n => locale() === 'es' ? `${n} ${n === 1 ? 'producto' : 'productos'}` : `${n} ${({one:'товар',few:'товара',many:'товаров',other:'товара'})[new Intl.PluralRules('ru-RU').select(n)]}`;
const money = value => Number.isFinite(value) ? new Intl.NumberFormat(intlLocale(),{style:'currency',currency:'EUR'}).format(value) : locale() === 'es' ? 'No disponible' : 'Недоступно';
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}}
let cart = normalizeCart(read('catmandog-cart',[]), products);
function cartUnitPrice(item){const p=products.find(p=>p.id===(item.productId||item.id));return p?.gift?legacyCartUnitPrice(item):storefrontPrice(cartSku(item,products));}
let favorites = read('catmandog-favorites',[]); if(!Array.isArray(favorites))favorites=[];favorites=favorites.filter(x=>products.some(p=>p.id===x));
let catalogPriceMax = Math.max(100, Math.ceil(Math.max(...catalogProducts.map(p => catalogPrice(p).max ?? 0)) / 10) * 10);
let catalogUnavailable = false;
const displayedMinPrice = p => catalogPrice(p).min;
let homePet='cat', homeGroup='', homeBrand='', homePrice='', homeFeature='', homeVisible=8, selectedSize='', detailQuantity=1, priceLimit=catalogPriceMax, journalCategory='Все материалы';
let selectedVariantId=null;
let giftState=normalizeGift();
const giftHelpers={money,imageBlock,icon,escape,crumbs,card};
let toastTimer;
const account = createAccountUI({ escape, icon, money, products, imageBlock, render, notify, publicStore: true,
  getCart: () => cart.map(item => ({ ...item, productId: item.productId || item.id, price: cartUnitPrice(item), name: cartSku(item, products)?.name })),
  repeatOrder: items => items.forEach(item => add(item.productId, item.size, item.qty, item.giftConfig, item.variantId))
});
const useful = createUsefulUI({ escape, icon, store: account.store, render, notify, syncChanges: account.syncChanges });
const checkout = createCheckoutUI({
  escape, icon, money, imageBlock, render,
  onPaid: () => { cart = []; persist(); },
  getItems: () => cart.map(item => {
    const parent = products.find(product => product.id === (item.productId || item.id));
    const sku = cartSku(item, products);
    const offer = parent?.gift ? giftOffer(parent, item.giftConfig) : null;
    return { productId: parent?.id, variantId: item.variantId, name: sku?.name || parent?.name || '',
      variant: offer?.label || item.variantLabel || item.size, image: offer?.image || sku?.image || parent?.image,
      qty: item.qty, price: cartUnitPrice(item) };
  }),
  isReady: () => cart.length > 0 && cart.every(item => cartUnitPrice(item) !== null && canBuy(cartSku(item, products))),
  getPromo: () => account.store.promo(),
  applyPromo: code => account.store.applyPromo(code),
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
function persist(){try{localStorage.setItem('catmandog-cart',JSON.stringify(cart));localStorage.setItem('catmandog-favorites',JSON.stringify(favorites));}catch{}updateHeader();}
function hideToast(){document.querySelector('#toast').classList.remove('visible');}
function notify(text,{cartAction=false}={}){
  const el=document.querySelector('#toast');
  el.classList.toggle('toast-cart',cartAction);
  if(cartAction){
    el.innerHTML=`<span class="toast-check">${icon('check')}</span><span class="toast-message">${escape(text)}</span><a class="toast-link" href="#/cart">В корзину</a><button class="toast-close" type="button" aria-label="Закрыть уведомление">${icon('close')}</button>`;
  }else el.textContent=text;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(hideToast,cartAction?5500:2800);
}
function updateHeader(){const count=cart.reduce((n,x)=>n+x.qty,0);document.querySelector('#cart-link').innerHTML=icon('bag')+(count?`<span class="cart-count">${count}</span>`:'');document.querySelector('#cart-link').setAttribute('aria-label',locale()==='es'?`Cesta: ${count} ${count===1?'producto':'productos'}`:`Корзина: ${itemCount(count)}`);}
function route(){const category=seoCategoryForPath(location.pathname);const cleanPath=(category||location.pathname==='/catalogo')?'/catalog':location.pathname==='/revista'?'/journal':location.pathname.startsWith('/revista/')?location.pathname.replace(/^\/revista\//u,'/journal/'):'/';const raw=location.hash.slice(1)||`${cleanPath}${location.search}`;const [path,query]=raw.split('?');const params=new URLSearchParams(query);if(category&&!location.hash){params.set('pet',category.pet);params.set('group',category.group);}if(['Игрушки','Аксессуары'].includes(params.get('category')))params.set('category','Игрушки и аксессуары');return {path,params};}
const journalHref = id => locale()==='es' ? `/revista${id?`/${encodeURIComponent(id)}`:''}` : `#/journal${id?`/${encodeURIComponent(id)}`:''}`;
let lastCommerceView = '';
function announceView() {
  const { path, params } = route();
  const key = `${location.pathname}${location.search}${location.hash}`;
  if (key === lastCommerceView) return;
  lastCommerceView = key;
  if (path === '/catalog') {
    const list = filteredProducts(params).slice(0, 20).map(product => analyticsItem(product));
    announceCommerce('view_item_list', list, { item_list_id: params.get('group') || params.get('pet') || 'all' });
  } else if (path.startsWith('/product/')) {
    const id = path.split('/')[2];
    const product = products.find(item => item.id === id || item.variants?.some(variant => variant.id === id));
    if (product) announceCommerce('view_item', [analyticsItem(product, resolveVariant(product, selectedVariantId || (product.id !== id ? id : null)))]);
  }
}
function imageStyle(index){if(typeof index==='string')return `background-image:url('${index}');background-size:cover;background-position:center`; const tile=index%8;return `--px:${(tile%4)*100/3}%;--py:${Math.floor(tile/4)*100}%;--product-sheet:url('https://img.catmandog.es/assets/products-cats-${Math.floor(index/8)+1}.png')`;}
function categoryImageStyle(name){if(name==='Лакомства')return "--category-sheet:url('https://img.catmandog.es/assets/category-treats-v2.webp');--category-size:cover;--category-radius:0;--px:center;--py:center";const tile=({Корм:0,Наполнитель:1,'Игрушки и аксессуары':2,'Миски и поилки':4,Переноски:5,'Окна и балконы':6,Уход:7})[name]??0;return `--px:${(tile%4)*100/3}%;--py:${Math.floor(tile/4)*100}%;--category-sheet:url('https://img.catmandog.es/assets/categories-open.png')`;}
const categoryLabel = name => name === 'Наполнитель' ? 'Наполнители и лотки' : name;
function imageBlock(index,extra=''){if(index && typeof index==='object')return `<div class="product-image real-product-image ${index.presentation==='editorial'?'editorial-product-image ':''}${extra}"><img src="${escape(index.src)}" alt="${escape(index.alt)}" loading="lazy" decoding="async"></div>`;return `<div class="product-image ${extra}" style="${imageStyle(index)}"></div>`;}
function crumbs(title){return `<div class="breadcrumbs"><a href="#/">Главная</a><span>/</span><span>${escape(title)}</span></div>`;}
function card(p){
  const family=hasVariants(p)&&p.variants.length>1;
  const pricing=catalogPrice(p);
  const sku=resolveVariant(p);
  const configure=family||p.gift||!canBuy(sku);
  const actionLabel=family?'Выбрать вариант':p.gift?'Выбрать набор':!canBuy(sku)?'К товару':'В корзину';
  const caption=pricing.amount===null?'Демонстрационная цена':family?(p.id.startsWith('yagu-')?'Цена зависит от размера':'Цена зависит от фасовки'):sku.serverPriceConfirmed?'Цена с IVA':p.isReal?provisionalPriceLabel(sku)||(sku.retailPrice?.type==='recommended'?'Рекомендованная розничная цена':'Ценовой ориентир'):'';
  const displayPrice=pricing.amount===null?money(7.77):pricing.min!==pricing.max?`${money(pricing.min)} - ${money(pricing.max)}`:`${p.gift==='personal'?'от ':''}${money(pricing.amount)}`;
  return `<article class="product-card ${p.isReal?'real-product-card':''}"><a class="product-card-open" href="#/product/${escape(p.id)}" aria-label="Открыть товар: ${escape(p.name)}"></a><div class="product-media">${imageBlock(p.image)}<span class="product-tag">${escape(p.tag||'')}</span><button class="icon-button favorite ${favorites.includes(p.id)?'selected':''}" data-favorite="${escape(p.id)}" aria-label="${favorites.includes(p.id)?'Убрать из избранного':'В избранное'}: ${escape(p.name)}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button></div><div class="product-info"><small>${escape(p.brand||'CatManDog')}${p.weight?` · ${escape(p.weight)}`:''}${family?` · ${(locale()==='es'?`${p.variants.length} formatos`:itemCount(p.variants.length).replace('товар','вариант'))}`:''}</small><div class="product-title"><h3>${escape(p.name)} <span class="product-open-cue">${icon('arrow')}</span></h3></div><span class="retail-label" ${caption?'':'aria-hidden="true"'}>${caption}</span><div class="product-price"><div class="product-price-values"><span>${displayPrice}</span>${!pricing.demo&&!family&&p.old?`<span class="old-price">${money(p.old)}</span>`:''}</div><button class="product-card-action" ${configure?'data-configure':'data-add'}="${escape(p.id)}" aria-label="${actionLabel}: ${escape(p.name)}">${actionLabel}${icon(configure?'arrow':'bag')}</button></div></div></article>`;
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
const categoryKey = p => p.category === 'Лотки и гигиена' ? 'Наполнитель' : p.category;
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
function home(){return `<section class="hero"><img src="https://img.catmandog.es/assets/hero-happy.png" alt="Золотистый ретривер и серая кошка на диване" fetchpriority="high"><div class="hero-copy"><h1>Хорошая<br>жизнь<br>С хвостиком</h1><p>Всё, что нужно для счастливой жизни кошек, собак и их людей</p><a class="button" href="#/catalog">Найти своё ${icon('arrow')}</a><span class="hero-note">С заботой о каждом хвосте</span></div></section><section class="section"><div class="section-head"><h2>Их любимые вещи</h2><a class="text-link" href="#/catalog">Весь каталог</a></div><div class="categories">${categories.filter(c=>c!=='Подарочные наборы').map((c,i)=>`<a class="category" href="#/catalog?category=${encodeURIComponent(c)}"><div class="category-image" style="${categoryImageStyle(c)}"></div><span>${categoryLabel(c)}</span></a>`).join('')}</div></section>${homeDirections(icon)}<section class="section home-catalog" id="home-catalog" aria-labelledby="home-catalog-title">${homeCatalog()}</section>${service()}<section class="section journal-section"><div class="section-head journal-section-head"><div><span class="eyebrow">Идеи для жизни вместе</span><h2>Журнал о питомцах</h2><p class="journal-intro">Про уютный дом, игры и поездки с питомцем</p></div><a class="text-link" href="${journalHref()}">Весь журнал</a></div><div class="journal-grid">${displayArticles.map(articleCard).join('')}</div></section>${homeUseful()}<section class="brand-story"><h2>Они делают нашу жизнь лучше<br>А мы - их</h2><div><p>CatManDog - про жизнь вместе Про утренние прогулки, тёплые носы и вещи, которые помогают заботиться каждый день</p><a class="text-link" href="#/about">Ближе познакомиться</a></div></section>`;}
function foodFilters(params){return `<div class="food-filters"><div class="food-types" aria-label="Тип корма">${[['','Весь корм'],['dry','Сухой'],['wet','Влажный']].map(([value,label])=>`<button class="pill ${(params.get('foodType')||'')===value?'active':''}" data-food-type="${value}" aria-pressed="${(params.get('foodType')||'')===value}">${label}</button>`).join('')}</div><label class="food-brand">Бренд <select id="food-brand"><option value="">Все бренды</option>${[...new Set(catalogProducts.filter(p=>p.isReal&&p.category==='Корм').map(p=>p.brand))].sort((a,b)=>a.localeCompare(b)).map(brand=>`<option value="${escape(brand)}" ${params.get('brand')===brand?'selected':''}>${escape(brand)}</option>`).join('')}</select></label></div>`;}
function filteredProducts(params){let list=catalogProducts.filter(p=>(!params.get('pet')||p.pet===params.get('pet')||p.pet==='both')&&(!params.get('category')||categoryKey(p)===params.get('category'))&&(params.get('maxPrice')||displayedMinPrice(p)===null||displayedMinPrice(p)<=priceLimit));if(params.get('group'))list=list.filter(p=>homeGroupForProduct(p)===params.get('group'));if(params.get('group')&&params.get('brand'))list=list.filter(p=>p.brand===params.get('brand'));if(params.get('group')&&params.get('feature'))list=list.filter(p=>matchesHomeFeature(p,params.get('group'),params.get('feature')));if(params.get('maxPrice'))list=list.filter(p=>matchesHomePrice(p,params.get('maxPrice')));if(params.get('category')==='Корм')list=list.filter(p=>(!params.get('foodType')||p.foodType===params.get('foodType'))&&(!params.get('brand')||p.brand===params.get('brand')));const q=(params.get('q')||'').toLocaleLowerCase(intlLocale());if(q)list=list.filter(p=>{const fields=[p.name,p.category,p.description,...snapshots(p).flatMap(v=>[v.name,v.label||'',v.manufacturerSku||v.model||''])];const searchable=locale()==='es'?[...fields,...fields.map(translate)]:fields;return searchable.join(' ').toLocaleLowerCase(intlLocale()).includes(q)});switch(params.get('sort')){case 'low':list.sort((a,b)=>(displayedMinPrice(a)??Infinity)-(displayedMinPrice(b)??Infinity));break;case 'high':list.sort((a,b)=>displayedMinPrice(a)!==null&&displayedMinPrice(b)!==null?displayedMinPrice(b)-displayedMinPrice(a):displayedMinPrice(a)!==null?-1:displayedMinPrice(b)!==null?1:0);break;case 'name':list.sort((a,b)=>translate(a.name).localeCompare(translate(b.name),intlLocale()));}return list;}
function foodPriceNote(params){const text=params.get('brand')==='Ownat'?'Ownat - рекомендованные розничные цены для Испании с IVA, февраль 2026':'Розничные цены и диапазоны с IVA по фасовкам и источникам';return `<p class="food-catalog-note">${text}</p>`;}
function catalogSelection(params){
  const group=homeGroups.find(item=>item.id===params.get('group'));
  if(!group)return '';
  const feature=homeFeatureOptions(group.id,catalogProducts).find(item=>item.id===params.get('feature'))?.label;
  return `<div class="catalog-applied"><span>Выбрано: ${escape(group.label)}${params.get('brand')?` · ${escape(params.get('brand'))}`:''}${params.get('maxPrice')?` · до ${money(Number(params.get('maxPrice')))}`:''}${feature?` · ${escape(feature)}`:''}</span><a href="#/catalog?pet=${escape(params.get('pet')||'cat')}">Сбросить</a></div>`;
}
function catalog(){const {params}=route();const landing=!location.hash?seoCategoryForPath(location.pathname):null;const list=filteredProducts(params);const title=landing?.title||homeGroups.find(group=>group.id===params.get('group'))?.label||categoryLabel(params.get('category'))||(params.get('pet')==='cat'?'Для кошек':params.get('pet')==='dog'?'Для собак':'Всё для хорошей жизни');const shownPriceLimit=params.get('maxPrice')?Number(params.get('maxPrice')):priceLimit;const homeSelection=catalogSelection(params);return `<div class="page">${crumbs('Каталог')}<h1 class="page-title">${escape(title)}</h1><p class="lead">${landing?.intro ? escape(landing.intro) : (params.get('category')==='Корм'?(params.get('pet')==='dog'?'Корм для собак - от повседневных рационов до особенных потребностей':'Корм для кошек - от ежедневного рациона до особенных потребностей'):params.get('category')==='Лакомства'?'Кремовые лакомства, снеки и топперы для кошек':params.get('category')==='Игрушки и аксессуары'?'Игрушки, когтеточки, коврики и другие вещи для игры и занятий':params.get('category')==='Миски и поилки'?'Свежая вода каждый день - фонтаны, сменные фильтры и любимые миски':params.get('category')==='Окна и балконы'?'Сетки, крепления и места для отдыха - для его маленького мира у окна':'От любимого корма до новой игрушки Нужные вещи, выбранные с заботой')}</p>${params.get('category')==='Корм'?foodPriceNote(params):['Игрушки и аксессуары','Миски и поилки'].includes(params.get('category'))?'<p class="food-catalog-note">Розничные цены и расчётные ориентиры с IVA</p>':''}<div class="catalog-toolbar"><div class="pet-tabs">${[['','Все питомцы'],['cat','Для кошек'],['dog','Для собак']].map(([value,label])=>`<button class="pill ${(params.get('pet')||'')===value?'active':''}" data-pet="${value}">${label}</button>`).join('')}</div><select id="sort" aria-label="Сортировка товаров"><option value="popular">По умолчанию</option><option value="low" ${params.get('sort')==='low'?'selected':''}>Сначала дешевле</option><option value="high" ${params.get('sort')==='high'?'selected':''}>Сначала дороже</option><option value="name" ${params.get('sort')==='name'?'selected':''}>По названию</option></select></div><div class="catalog-layout"><aside class="filters" aria-label="Фильтры товаров"><h3>Категории</h3>${['Все товары',...categories].map((c,i)=>`<button class="filter-category ${(!params.get('category')&&!params.get('group')&&i===0)||params.get('category')===c?'active':''}" data-category="${i?c:''}">${categoryLabel(c)}</button>`).join('')}<div class="filter-price"><h3>Цена</h3><label for="price-range">До <span id="price-label">${money(shownPriceLimit)}</span></label><input id="price-range" type="range" min="1" max="${catalogPriceMax}" value="${shownPriceLimit}" step="1"><button class="text-link" style="background:none" data-reset>Сбросить фильтры</button></div></aside><div>${params.get('category')==='Корм'?foodFilters(params):''}${homeSelection}<p class="results-count" id="results-count">${itemCount(list.length)}${params.get('q')?` · Поиск: «${escape(params.get('q'))}»`:''}</p><div class="product-grid" id="catalog-grid">${list.length?list.map(card).join(''):params.get('pet')==='dog'?empty('Пока ничего не нашлось','Попробуйте другую категорию или измените запрос','Сбросить фильтры','#/catalog?pet=dog'):params.get('category')&&categories.includes(params.get('category'))&&!catalogProducts.some(p=>categoryKey(p)===params.get('category'))?empty('В этой категории нет товаров','Посмотрите другие товары для вашего питомца','Открыть каталог','#/catalog'):empty('Пока ничего не нашлось','Попробуйте другую категорию или измените запрос','Сбросить фильтры','#/catalog')}</div></div></div></div>`;}
function empty(title,text,label,link){return `<div class="empty-state"><h2>${title}</h2><p>${text}</p><a class="button" href="${link}">${label}</a></div>`;}
function detail(id,preserveSelection=false){const p=products.find(p=>p.id===id)||products.find(p=>hasVariants(p)&&p.variants.some(v=>v.id===id));if(!p)return notFound();if(p.storefrontRetired)return `<div class="page">${crumbs('Каталог')}${empty('Товар больше не представлен','Мы обновили ассортимент - посмотрите актуальные товары для вашего питомца','В каталог','#/catalog')}</div>`;if(!preserveSelection){selectedVariantId=hasVariants(p)?(route().params.get('variant')||(p.id!==id?id:p.defaultVariantId)||p.variants[0].id):null;detailQuantity=1;}const selected=resolveVariant(p,selectedVariantId);if(!selected)return notFound();selectedSize=selected.sizes?.[0]||selected.label||'';if(p.id==='rc-sterilised')return availabilityScenarioDetail(p,{crumbs,imageBlock,escape,icon,favorites,money,goodTogether,variantId:selectedVariantId,quantity:detailQuantity,language:locale()});if(hasVariants(p)||(p.isReal&&!canBuy(p))){return accessoryDetail(p,{crumbs,imageBlock,escape,icon,favorites,goodTogether,money,variantId:selectedVariantId,quantity:detailQuantity,language:locale()});}if(p.gift){giftState=normalizeGift({season:route().params.get('season')});return giftDetail(p,giftState,giftHelpers);}return `<div class="page">${crumbs(p.name)}<div class="detail-grid">${imageBlock(p.image,'detail-image')}<div class="detail-copy"><span class="eyebrow">${p.line}</span><h1>${p.name}</h1><div class="detail-price">${money(p.price)} ${p.old?`<span class="old-price">${money(p.old)}</span>`:''}</div>${p.isReal?`<p class="retail-note">${p.retailPrice?.type==='recommended'?'Рекомендованная розничная цена':'Временная розничная цена'}${p.packageWeightKg ? ` · ${money(p.price/p.packageWeightKg)} / кг` : ''}<br>Наличие и окончательная цена уточняются</p>`:''}<p>${p.description}</p><span class="size-label">${p.optionLabel||'Размер'}</span><div class="size-options" aria-label="Вариант товара">${p.sizes.map((s,i)=>`<button class="size ${i===0?'active':''}" data-size="${s}" aria-pressed="${i===0}">${s}</button>`).join('')}</div><div class="buy-row"><div class="quantity"><button data-detail-qty="-1" aria-label="Уменьшить количество">${icon('minus')}</button><span id="detail-qty">1</span><button data-detail-qty="1" aria-label="Увеличить количество">${icon('plus')}</button></div><button class="button" data-buy="${p.id}">Добавить в корзину ${icon('bag')}</button><button class="icon-button favorite-detail ${favorites.includes(p.id)?'selected':''}" data-favorite="${p.id}" aria-label="В избранное" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button></div><div class="detail-service">${icon('check')} Выбирайте то, что подходит именно вашему питомцу<br>Доставка и возврат: <a class="text-link" href="#/info/delivery">подробнее</a></div><details open><summary>${p.isReal && p.category==='Корм'?'О корме':'Детали и уход'}</summary><ul>${p.details.map(d=>`<li>${d}</li>`).join('')}</ul></details>${p.isReal?`<details><summary>Информация о товаре</summary><p>Бренд: ${escape(p.brand)}<br>${p.weight?`Упаковка: ${escape(p.weight)}`:`Вариант: ${escape(p.sizes[0])}`}${(p.manufacturerSku||p.supplier?.sku)?`<br>Артикул: ${escape(p.manufacturerSku||p.supplier?.sku)}`:''}${p.ean?`<br>EAN: ${escape(p.ean)}`:''}</p>${p.supplier?`<p><a class="text-link" href="${escape(p.supplier.url)}" target="_blank" rel="noopener noreferrer">Карточка поставщика - ${escape(p.supplier.name)}</a></p>`:''}${p.productSource?`<p><a class="text-link" href="${escape(p.productSource.url)}" target="_blank" rel="noopener noreferrer">${p.productSource.kind==='manufacturer'?'Описание производителя':'Источник товара'} - ${escape(p.productSource.name)}</a></p>`:''}<p>Розничный ориентир: <a class="text-link" href="${escape(p.retailPrice.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escape(p.retailPrice.sourceName)}</a><br>Проверено 4 октября 2026</p></details>`:'<details><summary>О коллекции</summary><p>Вещи CatManDog созданы вокруг простых ежедневных ритуалов: вкусно поесть, поиграть, погулять и отдохнуть рядом с любимыми людьми</p></details>'}</div></div></div>${goodTogether(p)}`;}
function cartPage(){
  const count=cart.reduce((sum,item)=>sum+item.qty,0);
  const needsChoice=cart.some(item=>item.needsVariantSelection);
  const pending=cart.some(item=>cartUnitPrice(item)===null);
  const unavailable=cart.some(item=>!canBuy(cartSku(item,products)));
  const referenceOnly=cart.some(item=>{
    const parent=products.find(product=>product.id===(item.productId||item.id));
    const sku=cartSku(item,products);
    return parent && !parent.gift && sku && !sku.serverPriceConfirmed;
  });
  const promo=account.store.promo();
  const totals=pending?null:checkoutTotals(cart.map(item=>({price:cartUnitPrice(item),qty:item.qty})),promo);
  const subtotal=totals?.subtotal??null;
  const total=totals?.total??null;
  const pendingTotalLabel=needsChoice?'После выбора варианта':'Итог уточняется';
  const deliveryHint=totals&&!unavailable?(totals.freeDelivery
    ? `<div class="cart-delivery-hint"><strong>${promo?.freeShipping?'Доставка бесплатная по купону':'Порог бесплатной доставки достигнут'}</strong><span>${promo?.freeShipping?'Купон убрал стоимость доставки':`Вы экономите ${money(DELIVERY_FEE)} на доставке по Валенсии`}</span></div>`
    : `<div class="cart-delivery-hint"><strong>До бесплатной доставки - ${money(Math.max(0, Math.round(FREE_DELIVERY_FROM*100)-Math.round(totals.products*100))/100)}</strong><span>При сумме товаров от ${money(FREE_DELIVERY_FROM)} доставка ${money(DELIVERY_FEE)} исчезнет из итога</span></div>`):'';
  const footerNote=needsChoice?'Выберите вариант товара, чтобы увидеть итог':pending?'Цена одного из вариантов уточняется. Итог будет доступен после подтверждения.':unavailable?'Один из вариантов сейчас недоступен. Проверьте состав корзины.':referenceOnly?'Это ориентир по изученным ценам. Цены продажи ещё не подтверждены.':'';
  const rows=cart.map((item,index)=>{
    const parent=products.find(product=>product.id===(item.productId||item.id));
    const sku=cartSku(item,products);
    const product=sku||parent;
    const offer=parent.gift?giftOffer(parent,item.giftConfig):null;
    const needsVariant=hasVariants(parent)&&!sku;
    const link=`#/product/${parent.id}${item.variantId?'?variant='+encodeURIComponent(item.variantId):''}`;
    const unitPrice=needsVariant?null:cartUnitPrice(item);
    const variantText=needsVariant?'Вариант не выбран':`${parent.optionLabel||sku.optionLabel||'Вариант'}: ${offer?.label??item.variantLabel??item.size}`;
    const priceLabel=product.storefrontRetired?'Товар больше не представлен':needsVariant?'Выберите вариант для расчёта цены':isDemoPrice(product)?'Цена уточняется':product.serverPriceConfirmed?'Цена с IVA':product.isReal?provisionalPriceLabel(product)||(product.retailPrice?.type==='recommended'?'Рекомендованная розничная цена':'Розничный ориентир'):'';
    return `<article class="cart-row"><a href="${link}" aria-label="${escape(product.name)}">${imageBlock(offer?.image??product.image)}</a><div><a href="${link}"><h3>${escape(product.name)}</h3></a><p>${escape(product.brand||'CatManDog')}</p><p class="cart-variant">${escape(variantText)}</p>${needsVariant?`<a class="text-link cart-choose-variant" href="${link}">Выбрать вариант</a>`:''}${priceLabel?`<span class="retail-label">${escape(priceLabel)}</span>`:''}${offer?`<div class="cart-gift-details"><p>${offer.items.map(part=>escape(part.name)).join(' + ')}<br>Коробка и открытка включены</p>${offer.config.recipient?`<p>Для: <strong data-no-translate>${escape(offer.config.recipient)}</strong></p>`:''}${offer.config.message?`<p class="cart-greeting" data-no-translate>«${escape(offer.config.message)}»</p>`:''}${offer.preorder?'<span class="gift-status">Предзаказ · дата отправки пока не объявлена</span>':''}</div>`:''}<div class="quantity"><button data-cart-qty="${index}" data-delta="-1" aria-label="Уменьшить количество ${escape(product.name)}">${icon('minus')}</button><span>${item.qty}</span><button data-cart-qty="${index}" data-delta="1" aria-label="Увеличить количество ${escape(product.name)}">${icon('plus')}</button></div></div><div class="cart-row-right"><strong>${unitPrice===null?'После выбора варианта':money(unitPrice*item.qty)}</strong>${unitPrice===null?'':`<small class="cart-unit-price">${money(unitPrice)} / шт</small>`}<button class="remove" data-remove="${index}">Удалить</button></div></article>`;
  }).join('');
  return `<div class="page">${crumbs('Корзина')}<h1 class="page-title">Ваша корзина${count?` <span class="muted">(${count})</span>`:''}</h1>${!count?empty('Пока здесь тихо','Самое время найти что-нибудь для любимого хвостика','За покупками','#/catalog'):`<div class="cart-layout"><div>${rows}</div><aside class="cart-summary"><h2>Всё самое нужное</h2><div class="summary-line"><span>Товары (${count})</span><span>${subtotal===null?pendingTotalLabel:money(subtotal)}</span></div><div class="summary-line"><span>Доставка по Валенсии</span><span>${totals?totals.freeDelivery?'Бесплатно':money(totals.delivery):pendingTotalLabel}</span></div>${promo?`<div class="summary-line"><span>${escape(promo.code)} - ${promo.percent}%</span><span>${subtotal===null?pendingTotalLabel:money(-totals.discount)}</span></div>`:''}${deliveryHint}<div class="summary-line total"><span>${referenceOnly?'Ориентир с доставкой':'Итого с IVA'}</span><span>${total===null?pendingTotalLabel:money(total)}</span></div><button class="button" id="checkout" ${pending||unavailable||referenceOnly?'disabled':''}>Перейти к оформлению ${icon('arrow')}</button>${footerNote?`<p>${footerNote}</p>`:''}</aside></div>`}</div>`;
}
function about(){return `<div class="page">${crumbs('О нас')}<section class="about-hero"><h1>Они - часть семьи<br>Мы - на вашей стороне</h1><p>CatManDog объединяет вещи и идеи для хорошей жизни с кошками и собаками С заботой о них и с пониманием вас</p></section><div class="prose"><h2>Меньше случайного Больше нужного</h2><p>Нам близок простой подход: окружающие вещи должны быть удобными, продуманными и приятными в повседневной жизни От миски на кухне до переноски для нового путешествия</p><h2>Магазин, в котором помогают выбрать</h2><p>Мы собираем всё необходимое в понятные категории и рассказываем о назначении каждого товара А в журнале делимся идеями для дома, прогулок, игр и жизни вместе</p><a class="button" href="#/catalog">Найти своё ${icon('arrow')}</a></div></div>${service()}`;}
function info(id){
  if(id==='delivery')return `<div class="page">${crumbs('Доставка и возврат')}<div class="prose"><h1>Доставка и возврат</h1><h2>Доставка по Валенсии</h2><p>Пока доставляем только в пределах города Валенсия. Доставка стоит 3,99 € для заказа меньше 49 € после скидки. От 49 € она бесплатная. Купон на доставку может сделать её бесплатной и для меньшего заказа.</p><p>При оформлении можно выбрать доставку сегодня, если до ближайшего ориентира остаётся не менее двух часов, или указать другую дату и время. Это пожелание: точное время подтвердим после подключения системы заказов.</p><h2>Если нужна помощь</h2><p>Для вопросов о заказе подготовлена форма поддержки. Запрос на возврат можно начать через отдельную форму. ${checkout.isSupportEnabled() ? 'После проверки обращение можно отправить команде' : 'Пока формы показывают предпросмотр и не отправляют данные.'}</p><p><a class="text-link" href="#/support">Помощь с заказом</a> · <a class="text-link" href="#/returns">Запрос на возврат</a> · <a class="text-link" href="/purchase-terms.html">Условия покупки и возврата</a></p></div></div>`;
  if(id==='contact')return `<div class="page">${crumbs('Контакты')}<div class="prose"><h1>Давайте поговорим</h1><p>Если у вас есть вопрос о товаре или заказе, откройте форму поддержки. ${checkout.isSupportEnabled() ? 'После проверки обращение можно отправить команде' : 'Пока обращение можно подготовить, отправка появится после подключения поддержки.'}</p><a class="button outline" href="#/support">Помощь с заказом ${icon('arrow')}</a></div></div>`;
  if(id==='privacy')return `<div class="page">${crumbs('Конфиденциальность')}<div class="prose"><h1>Конфиденциальность</h1><p>Информация о данных аккаунта, входе через Google, заказах и обращениях находится на отдельной странице.</p><p><a class="text-link" href="/privacy.html">Открыть информацию о конфиденциальности</a></p></div></div>`;
  return notFound();
}
function notFound(){return `<div class="page">${empty('Эта страница убежала','Но все любимые вещи по-прежнему на месте','На главную','#/')}</div>`;}
function render(){const {path}=route();let html;if(path==='/join'||path.startsWith('/account'))html=account.page(path,route().params);else if(path.startsWith('/useful'))html=useful.page(path,route().params);else if(path==='/')html=home();else if(path==='/catalog')html=catalog();else if(path==='/gifts')html=giftLanding(giftHelpers);else if(path==='/active-home')html=activeHomeLanding(giftHelpers);else if(path.startsWith('/product/'))html=detail(path.split('/')[2]);else if(path==='/cart')html=cartPage();else if(path==='/checkout')html=checkout.page();else if(path==='/checkout/preview')html=checkout.previewPage();else if(path==='/checkout/confirmation')html=checkout.resultPage('accepted',route().params);else if(path==='/checkout/payment-error')html=checkout.resultPage('failed',route().params);else if(path==='/checkout/status')html=checkout.resultPage('status',route().params);else if(path==='/support')html=checkout.servicePage('support',route().params);else if(path==='/returns')html=checkout.servicePage('return',route().params);else if(path==='/favorites')html=favoritePage();else if(path==='/journal')html=journal();else if(path.startsWith('/journal/'))html=article(path.split('/')[2]);else if(path==='/about')html=about();else if(path.startsWith('/info/'))html=info(path.split('/')[2]);else html=notFound();app.innerHTML=html;document.title=`${(path.startsWith('/account') && account.store.activePet() ? 'Кабинет ' + account.store.activePet().name : null) || ({'/useful':'Полезное','/useful/clinics':'Ветклиники Валенсии','/useful/travel':'В дорогу вместе','/account':'Кабинет с хвостиком','/join':'Знакомство с питомцем','/':'Хорошая жизнь с хвостиком','/catalog':'Каталог','/gifts':'Подарочные наборы','/active-home':'Дом для активного кота','/cart':'Корзина','/checkout':'Оформление заказа','/checkout/preview':'Проверка заказа','/checkout/confirmation':'Подтверждение заказа','/checkout/payment-error':'Ошибка оплаты','/checkout/status':'Статус заказа','/support':'Помощь с заказом','/returns':'Возврат','/journal':'Журнал','/favorites':'Избранное','/about':'О нас'})[path]||'Для хорошей жизни'} · CatManDog`;if(path.startsWith('/journal/'))document.title=`${displayArticles.find(item=>item.id===path.split('/')[2])?.title||translate('Журнал')} · CatManDog`;if(path.startsWith('/product/')){const id=path.split('/')[2];const product=products.find(item=>item.id===id||item.variants?.some(variant=>variant.id===id));if(product)document.title=`${product.name} · CatManDog`;}document.title = locale()==='es' ? translate(document.title.split(' · CatManDog')[0])+' · CatManDog' : document.title;const categoryPage=!location.hash?seoCategoryForPath(location.pathname):null;if(categoryPage)document.title=`${categoryPage.title} · CatManDog`;document.querySelector('nav').classList.remove('open');document.querySelector('#mobile-toggle').setAttribute('aria-expanded','false');document.querySelectorAll('.header nav a').forEach(a=>a.setAttribute('aria-current',a.getAttribute('href')===location.hash?'page':'false'));updateHeader();account.afterRender();announceView();analytics.pageView();}
function setParam(key,value){const {params}=route();if(key==='category'||key==='pet'){['foodType','brand','group','feature','maxPrice'].forEach(name=>params.delete(name));}value?params.set(key,value):params.delete(key);location.hash=`/catalog${params.size?'?'+params.toString():''}`;}
function add(id,size,qty=1,config,variantId){
  const p=products.find(p=>p.id===id);if(!p)return;
  if(hasVariants(p)&&!variantId){if(p.variants.length>1){location.hash='/product/'+id;return;}variantId=resolveVariant(p).id;}
  const selected=resolveVariant(p,variantId);if(!canBuy(selected)){notify('Цена или наличие выбранного варианта уточняются');return;}
  const offer=p.gift?giftOffer(p,config):null;
  size=offer?.label||selected.label||size||selected.sizes[0];
  const next={id:p.id,productId:p.id,variantId:hasVariants(p)?selected.id:null,size,qty,...(hasVariants(p)?{variantLabel:selected.label}:{}),...(offer?{giftConfig:offer.config}:{})};
  if(hasVariants(p))cart=cart.filter(item=>!(item.productId===p.id&&item.needsVariantSelection));
  const item=cart.find(x=>sameCartSku(x,next)&&(!offer||JSON.stringify(normalizeGift(x.giftConfig))===JSON.stringify(offer.config)));
  if(item)item.qty=Math.min(99,item.qty+qty);else cart.push(next);
  persist();
  if (!p.gift) announceCommerce('add_to_cart', [analyticsItem(p, selected, qty)]);
  notify(offer?.preorder?'Новогодний предзаказ добавлен в корзину':'Товар добавлен в корзину',{cartAction:true});
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
  document.querySelector('#gift-order-note').textContent=offer.preorder?'Предзаказ сохраняется в демонстрационной корзине Дата отправки появится при запуске магазина':'Упаковка входит в цену Оплата и отправка заказов пока не подключены';
}
app.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;account.click(button);useful.click(button);if(button.hasAttribute('data-configure'))location.hash='/product/'+button.dataset.configure;if(button.hasAttribute('data-gift-season')){giftState=normalizeGift({...giftState,season:button.dataset.giftSeason});updateGiftDetail();}if(button.hasAttribute('data-gift-preset')){giftState=applyGiftPreset(giftState,button.dataset.giftPreset);updateGiftDetail();}if(button.hasAttribute('data-gift-buy'))add(button.dataset.giftBuy,null,detailQuantity,giftState);if(button.hasAttribute('data-add'))add(button.dataset.add);if(button.hasAttribute('data-buy'))add(button.dataset.buy,selectedSize,detailQuantity,undefined,selectedVariantId);if(button.hasAttribute('data-variant'))selectVariant(button.dataset.variant);if(button.hasAttribute('data-favorite')){const id=button.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];persist();if(route().path==='/favorites'){render();return;}document.querySelectorAll(`[data-favorite="${id}"]`).forEach(b=>{b.classList.toggle('selected',favorites.includes(id));b.setAttribute('aria-pressed',String(favorites.includes(id)));b.setAttribute('aria-label',`${favorites.includes(id)?'Убрать из избранного':'В избранное'}: ${products.find(p=>p.id===id).name}`);});notify(favorites.includes(id)?'Сохранено в избранном':'Удалено из избранного');}if(button.hasAttribute('data-home-more')){homeVisible+=8;refreshHomeCatalog('data-home-more','');}if(button.hasAttribute('data-food-type'))setParam('foodType',button.dataset.foodType);if(button.hasAttribute('data-pet'))setParam('pet',button.dataset.pet);if(button.hasAttribute('data-category'))setParam('category',button.dataset.category);if(button.hasAttribute('data-reset')){priceLimit=catalogPriceMax;location.hash='/catalog';render();}if(button.hasAttribute('data-size')){selectedSize=button.dataset.size;document.querySelectorAll('[data-size]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});}if(button.hasAttribute('data-detail-qty')){detailQuantity=Math.max(1,Math.min(99,detailQuantity+Number(button.dataset.detailQty)));document.querySelector('#detail-qty').textContent=detailQuantity;}if(button.hasAttribute('data-cart-qty')){const i=Number(button.dataset.cartQty);cart[i].qty+=Number(button.dataset.delta);if(cart[i].qty<1)cart.splice(i,1);else cart[i].qty=Math.min(99,cart[i].qty);persist();render();}if(button.hasAttribute('data-remove')){cart.splice(Number(button.dataset.remove),1);persist();render();notify('Товар удалён из корзины');}if(button.hasAttribute('data-journal-category')){journalCategory=button.dataset.journalCategory;render();}if(button.id==='checkout'&&!cart.some(x=>cartUnitPrice(x)===null||!canBuy(cartSku(x,products)))){announceCommerce('begin_checkout',cart.map(item=>{const product=products.find(p=>p.id===(item.productId||item.id));return analyticsItem(product,cartSku(item,products),item.qty);}));location.hash='/checkout';}});
app.addEventListener('click',event=>{const button=event.target.closest('[data-preview-action]');if(!button)return;const feedback=document.querySelector('[data-preview-feedback]');if(!feedback)return;feedback.textContent=availabilityScenarioFeedback(locale());feedback.hidden=false;});
app.addEventListener('change',event=>{if(event.target.hasAttribute('data-gift-choice')){const field=event.target.dataset.giftChoice;giftState=normalizeGift({...giftState,[field]:event.target.value,...(field==='accessorySize'?{}:{preset:'custom'})});updateGiftDetail();document.querySelector(`[data-gift-choice="${field}"]`)?.focus();}if(event.target.id==='sort')setParam('sort',event.target.value);});
app.addEventListener('input',event=>{if(event.target.hasAttribute('data-gift-text')){giftState=normalizeGift({...giftState,[event.target.dataset.giftText]:event.target.value});document.querySelector('#gift-message-count').textContent=giftState.message.length+'/160';}if(event.target.id==='price-range'){priceLimit=Number(event.target.value);document.querySelector('#price-label').textContent=money(priceLimit);const params=route().params;if(params.has('maxPrice')){params.delete('maxPrice');history.replaceState(null,'',location.pathname+location.search+'#/catalog'+(params.size?'?'+params.toString():''));}const applied=document.querySelector('.catalog-applied');if(applied)applied.outerHTML=catalogSelection(params);const list=filteredProducts(params);document.querySelector('#catalog-grid').innerHTML=list.length?list.map(card).join(''):empty('Пока ничего не нашлось','Попробуйте изменить фильтры','Все товары','#/catalog');document.querySelector('#results-count').textContent=`${itemCount(list.length)}`;}});
document.querySelector('#account-link').innerHTML=icon('paw');document.querySelector('#search-close').innerHTML=icon('close');document.querySelector('#search-toggle').innerHTML=icon('search');document.querySelector('#favorites-link').innerHTML=icon('heart');document.querySelector('#mobile-toggle').innerHTML=icon('menu');
document.querySelector('#toast').addEventListener('click',event=>{if(event.target.closest('.toast-close, .toast-link'))hideToast();});
document.querySelector('#search-toggle').addEventListener('click',()=>{const panel=document.querySelector('#search-form');panel.hidden=!panel.hidden;if(!panel.hidden)document.querySelector('#site-search').focus();});
document.querySelector('#search-close').addEventListener('click',()=>{document.querySelector('#search-form').hidden=true;document.querySelector('#search-toggle').focus();});
document.querySelector('#search-form').addEventListener('submit',event=>{event.preventDefault();const q=document.querySelector('#site-search').value.trim();priceLimit=catalogPriceMax;document.querySelector('#search-form').hidden=true;location.hash=`/catalog${q?'?q='+encodeURIComponent(q):''}`;});
document.querySelector('#mobile-toggle').addEventListener('click',()=>{const open=document.querySelector('nav').classList.toggle('open');document.querySelector('#mobile-toggle').setAttribute('aria-expanded',String(open));});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){account.escapeChoices();document.querySelector('#search-form').hidden=true;document.querySelector('nav').classList.remove('open');document.querySelector('#mobile-toggle').setAttribute('aria-expanded','false');}});
window.addEventListener('hashchange',()=>{render();account.handleLink();window.scrollTo(0,0);});
await loadSupplierTerms();
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
      render();
    }).catch(() => {
      catalogUnavailable = true;
      applyServerCatalog(products, catalogProducts, []);
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
app.addEventListener('change', event => checkout.change(event.target));
app.addEventListener('input', event => { if (event.target.closest('[data-service-form]')) checkout.invalidateService(); });
app.addEventListener('change', event => { if (event.target.closest('[data-service-form]')) checkout.invalidateService(); });
app.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button) checkout.click(button);
});
app.addEventListener('click',async event=>{
  const productLink=event.target.closest('.product-card-open');
  if(productLink){
    const id=productLink.getAttribute('href')?.split('/').at(-1);
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
