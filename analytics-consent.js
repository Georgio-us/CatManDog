import { INTERNAL_BROWSER_KEY, isInternalBrowser } from './analytics-audience.js';

const CONSENT_KEY = 'catmandog-analytics-consent-v1';
const MEASUREMENT_ID = 'G-CTTBQ7PJP9';
const COMMERCE_EVENTS = new Set(['view_item_list', 'select_item', 'view_item', 'add_to_cart', 'remove_from_cart',
  'view_cart', 'begin_checkout', 'add_shipping_info', 'add_payment_info', 'purchase']);
const VISIT_SESSION_KEY = 'catmandog-visit-session-v2';
export const VISIT_IDLE_MS = 10 * 60 * 1000;
const CART_ID_KEY = 'catmandog-observed-cart-v1';
const validCartId = value => /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value || '');

export function takeVisitSession(storage, now, createId, campaignId = null) {
  let previous = null;
  try { previous = JSON.parse(storage.getItem(VISIT_SESSION_KEY) || 'null'); }
  catch { /* Missing or malformed storage starts a fresh visit */ }
  const elapsed = now - Number(previous?.lastSeen);
  const active = validCartId(previous?.id) && Number.isFinite(elapsed) &&
    elapsed >= 0 && elapsed < VISIT_IDLE_MS;
  const newCampaign = campaignId && previous?.campaignId && campaignId !== previous.campaignId;
  const isNew = !active || !!newCampaign;
  const id = isNew ? createId() : previous.id;
  storage.setItem(VISIT_SESSION_KEY, JSON.stringify({ id, lastSeen: now,
    campaignId: isNew ? campaignId : (campaignId || previous?.campaignId || null) }));
  return { id, isNew };
}

export function publicPageLocation(location) {
  const path = location.pathname;
  if (location.hash) {
    const route = location.hash.slice(1).split('?')[0];
    if (/^\/(?:catalog|journal(?:\/[a-z0-9-]+)?|product\/[a-z0-9-]+|picks\/(?:cat|dog)|cart|checkout|account\/(?:login|register))$/i.test(route)) {
      return `${location.origin}/#${route}`;
    }
    if (route === '/') return `${location.origin}/`;
    return null;
  }
  if (path === '/' || path === '/catalogo' || path === '/revista' ||
      path === '/selecciones/gatos' || path === '/selecciones/perros' ||
      /^\/producto\/[a-z0-9-]+$/i.test(path) ||
      /^\/(?:revista|catalogo\/(?:gatos|perros))\/[a-z0-9/-]+$/i.test(path)) {
    return `${location.origin}${path}`;
  }
  return null;
}

export function visitSource(referrer, origin) {
  if (!referrer) return 'direct';
  try {
    const url = new URL(referrer);
    if (url.origin === origin) return 'internal';
    const host = url.hostname.toLowerCase();
    if (/(^|\.)(?:google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.com|ecosia\.org)$/.test(host)) return 'search';
    if (/(^|\.)(?:instagram\.com|facebook\.com|fb\.com|tiktok\.com|pinterest\.com|youtube\.com|x\.com)$/.test(host)) return 'social';
    return 'other';
  } catch { return 'direct'; }
}

export function visitPlatform(search, referrer) {
  const platform = value => {
    const name = String(value || '').toLowerCase();
    if (['instagram', 'ig', 'l.instagram.com'].includes(name)) return 'instagram';
    if (['facebook', 'fb', 'm.facebook.com'].includes(name)) return 'facebook';
    if (['tiktok', 'youtube', 'pinterest', 'telegram', 'tg'].includes(name))
      return name === 'tg' ? 'telegram' : name;
    return null;
  };
  try {
    const tagged = platform(new URLSearchParams(search).get('utm_source'));
    if (tagged) return tagged;
    const host = new URL(referrer).hostname.toLowerCase();
    if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    if (/(^|\.)(facebook\.com|fb\.com)$/.test(host)) return 'facebook';
    if (/(^|\.)(t\.me|telegram\.org)$/.test(host)) return 'telegram';
    for (const name of ['tiktok', 'youtube', 'pinterest'])
      if (host === `${name}.com` || host.endsWith(`.${name}.com`)) return name;
  } catch { /* Referrer can be empty or unavailable */ }
  return null;
}

export function consentCopy(language) {
  return language === 'uk' ? {
    title: 'Аналітика сайту',
    description: 'З вашого дозволу ми використовуємо Google Analytics і зберігаємо склад та етап кошика, щоб розуміти, де покупці зупиняються. Власник також може отримати анонімне сповіщення про відвідування. До вашої згоди аналітика не завантажується.',
    accept: 'Прийняти', reject: 'Відхилити', settings: 'Налаштування аналітики',
    privacy: 'Конфіденційність'
  } : language === 'ru' ? {
    title: 'Аналитика сайта',
    description: 'С вашего разрешения мы используем Google Analytics и сохраняем состав и этап корзины, чтобы понимать, где покупатели останавливаются. Владелец также может получить анонимное уведомление о посещении. До согласия аналитика не загружается.',
    accept: 'Принять', reject: 'Отклонить', settings: 'Настройки аналитики',
    privacy: 'Конфиденциальность'
  } : {
    title: 'Analítica del sitio',
    description: 'Con tu permiso, usamos Google Analytics y guardamos el contenido y la etapa de la cesta para saber dónde se detienen los compradores. El propietario también puede recibir un aviso anónimo de la visita. No activamos la analítica antes de tu consentimiento.',
    accept: 'Aceptar', reject: 'Rechazar', settings: 'Preferencias de analítica',
    privacy: 'Privacidad'
  };
}

export function installAnalytics(language) {
  const panel = document.querySelector('#analytics-consent');
  const settings = document.querySelector('#analytics-settings');
  if (!panel || !settings) return { pageView() {} };
  if (isInternalBrowser()) {
    panel.hidden = true;
    settings.hidden = true;
    return { pageView() {} };
  }
  window.addEventListener('storage', event => {
    if (event.key === INTERNAL_BROWSER_KEY && event.newValue === '1') window.location.reload();
  });
  const copy = consentCopy(language);
  panel.querySelector('h2').textContent = copy.title;
  panel.querySelector('p').textContent = copy.description;
  panel.querySelector('[data-analytics-accept]').textContent = copy.accept;
  panel.querySelector('[data-analytics-reject]').textContent = copy.reject;
  const privacy = panel.querySelector('a');
  privacy.textContent = copy.privacy;
  privacy.href = language === 'ru' ? '/privacy.html' : language === 'uk' ? '/privacy-uk.html' : '/privacy-es.html';
  settings.textContent = copy.settings;
  let choice;
  try { choice = localStorage.getItem(CONSENT_KEY); } catch { choice = null; }
  let enabled = false;
  let lastPage = null;
  let entryContextUsed = false;
  // Keep the entry context before the visitor browses to another route or accepts analytics.
  const entryPage = publicPageLocation(window.location);
  const entryCampaign = window.location.search ||
    (window.location.hash.includes('?') ? `?${window.location.hash.split('?').slice(1).join('?')}` : '');
  const entryPlatform = visitPlatform(entryCampaign, document.referrer);
  const entrySource = entryPlatform ? 'social' : visitSource(document.referrer, window.location.origin);
  const campaignId = new URLSearchParams(entryCampaign).get('utm_campaign');
  const entryCampaignId = /^(tg-vlc-0[12]-w1)$/.test(campaignId || '') && entryPlatform === 'telegram'
    ? campaignId : null;

  function enable() {
    if (enabled) return;
    enabled = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, { send_page_view: false });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.append(script);
  }

  function anonymousCartId() {
    try {
      let id = localStorage.getItem(CART_ID_KEY);
      if (!validCartId(id)) {
        id = crypto.randomUUID();
        localStorage.setItem(CART_ID_KEY, id);
      }
      return id;
    } catch { return null; }
  }

  function visitSession(campaignId) {
    for (const name of ['localStorage', 'sessionStorage']) {
      try { return takeVisitSession(globalThis[name], Date.now(), () => crypto.randomUUID(), campaignId); }
      catch { /* Try the other available storage */ }
    }
    return { id: crypto.randomUUID(), isNew: true };
  }

  function reportVisit(page) {
    const isEntry = !entryContextUsed;
    entryContextUsed = true;
    const session = visitSession(isEntry ? entryCampaignId : null);
    if (!session.isNew || typeof window.fetch !== 'function') return;
    const publicUrl = new URL(isEntry ? (entryPage || page) : page);
    const visit = { page: `${publicUrl.pathname}${publicUrl.hash}`,
      source: isEntry ? entrySource : 'direct',
      platform: isEntry ? entryPlatform : null,
      campaignId: isEntry ? entryCampaignId : null,
      cartId: anonymousCartId(), visitId: session.id };
    void window.fetch('/api/telemetry/visit', { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(visit) }).catch(() => {});
  }

  function pageView() {
    if (!enabled) return;
    const page = publicPageLocation(window.location);
    if (!page) return;
    reportVisit(page);
    if (page === lastPage) return;
    lastPage = page;
    window.gtag('event', 'page_view', { page_location: page, page_title: 'CatManDog' });
  }

  window.addEventListener('pageshow', pageView);
  document.addEventListener?.('visibilitychange', () => {
    if (document.visibilityState === 'visible') pageView();
  });

  panel.hidden = choice === 'accepted' || choice === 'rejected';
  if (choice === 'accepted') enable();
  settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('[data-analytics-accept]').focus(); });
  panel.querySelector('[data-analytics-accept]').addEventListener('click', () => {
    choice = 'accepted';
    try { localStorage.setItem(CONSENT_KEY, choice); } catch { /* No persistent storage */ }
    panel.hidden = true;
    enable();
    pageView();
    if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function')
      window.dispatchEvent(new CustomEvent('catmandog:analytics-consent', { detail: { accepted: true } }));
  });
  panel.querySelector('[data-analytics-reject]').addEventListener('click', () => {
    let previousId = null;
    try { previousId = localStorage.getItem(CART_ID_KEY); } catch {}
    choice = 'rejected';
    const wasEnabled = enabled;
    enabled = false;
    try { localStorage.setItem(CONSENT_KEY, choice); } catch { /* No persistent storage */ }
    try { localStorage.removeItem?.(VISIT_SESSION_KEY); } catch {}
    try { sessionStorage.removeItem?.(VISIT_SESSION_KEY); } catch {}
    panel.hidden = true;
    const pending = [];
    if (validCartId(previousId)) pending.push(window.fetch('/api/telemetry/visit', {
      method: 'DELETE', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId: previousId }) }).catch(() => {}));
    if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function')
      window.dispatchEvent(new CustomEvent('catmandog:analytics-consent', {
        detail: { accepted: false, waitUntil: promise => pending.push(promise) }
      }));
    if (wasEnabled) {
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) continue;
        document.cookie = `${name}=; Max-Age=0; Path=/`;
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.catmandog.es`;
      }
      void Promise.allSettled(pending).then(() => window.location.reload());
    }
  });
  window.addEventListener('catmandog:commerce', ({ detail }) => {
    if (!enabled || !COMMERCE_EVENTS.has(detail?.event)) return;
    if (detail.event === 'purchase' &&
        (typeof detail.ecommerce?.transaction_id !== 'string' ||
          !Number.isFinite(detail.ecommerce?.value))) return;
    const items = detail.ecommerce?.items;
    if (!Array.isArray(items) || !items.length) return;
    const cleanItems = items.map(item => ({
      item_id: item.item_id, item_name: item.item_name, item_brand: item.item_brand,
      item_category: item.item_category, item_category2: item.item_category2,
      quantity: item.quantity, ...(Number.isFinite(item.price) ? { price: item.price } : {})
    }));
    window.gtag('event', detail.event, {
      currency: 'EUR', items: cleanItems,
      ...(typeof detail.ecommerce.item_list_id === 'string' ? { item_list_id: detail.ecommerce.item_list_id } : {}),
      ...(detail.event === 'purchase' && typeof detail.ecommerce.transaction_id === 'string'
        && Number.isFinite(detail.ecommerce.value)
        ? { transaction_id: detail.ecommerce.transaction_id, value: detail.ecommerce.value,
          ...(Number.isFinite(detail.ecommerce.shipping) ? { shipping: detail.ecommerce.shipping } : {}) }
        : {})
    });
  });
  window.addEventListener('catmandog:account-analytics', ({ detail }) => {
    if (!enabled || !['sign_up', 'login'].includes(detail?.event)) return;
    if (!['email', 'google'].includes(detail?.method)) return;
    window.gtag('event', detail.event, { method: detail.method });
  });
  return { pageView };
}
