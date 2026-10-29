const CONSENT_KEY = 'catmandog-analytics-consent-v1';
const MEASUREMENT_ID = 'G-CTTBQ7PJP9';
const COMMERCE_EVENTS = new Set(['view_item_list', 'select_item', 'view_item', 'add_to_cart', 'begin_checkout']);

export function publicPageLocation(location) {
  const path = location.pathname;
  if (location.hash) {
    const route = location.hash.slice(1).split('?')[0];
    if (/^\/(?:catalog|journal(?:\/[a-z0-9-]+)?|product\/[a-z0-9-]+)$/i.test(route)) {
      return `${location.origin}/#${route}`;
    }
    if (route === '/') return `${location.origin}/`;
    return null;
  }
  if (path === '/' || path === '/catalogo' || path === '/revista' ||
      /^\/(?:revista|catalogo\/(?:gatos|perros))\/[a-z0-9/-]+$/i.test(path)) {
    return `${location.origin}${path}`;
  }
  return null;
}

export function consentCopy(language) {
  return language === 'ru' ? {
    title: 'Аналитика сайта',
    description: 'С вашего разрешения мы используем Google Analytics, чтобы понимать, какие страницы и товары полезны посетителям. До согласия аналитика не загружается',
    accept: 'Принять', reject: 'Отклонить', settings: 'Настройки аналитики',
    privacy: 'Конфиденциальность'
  } : {
    title: 'Analítica del sitio',
    description: 'Con tu permiso, usamos Google Analytics para entender qué páginas y productos interesan a quienes nos visitan. No cargamos la analítica antes de tu consentimiento',
    accept: 'Aceptar', reject: 'Rechazar', settings: 'Preferencias de analítica',
    privacy: 'Privacidad'
  };
}

export function installAnalytics(language) {
  const panel = document.querySelector('#analytics-consent');
  const settings = document.querySelector('#analytics-settings');
  if (!panel || !settings) return { pageView() {} };
  const copy = consentCopy(language);
  panel.querySelector('h2').textContent = copy.title;
  panel.querySelector('p').textContent = copy.description;
  panel.querySelector('[data-analytics-accept]').textContent = copy.accept;
  panel.querySelector('[data-analytics-reject]').textContent = copy.reject;
  const privacy = panel.querySelector('a');
  privacy.textContent = copy.privacy;
  privacy.href = language === 'ru' ? '/privacy.html' : '/privacy-es.html';
  settings.textContent = copy.settings;
  let choice;
  try { choice = localStorage.getItem(CONSENT_KEY); } catch { choice = null; }
  let enabled = false;
  let lastPage = null;

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

  function pageView() {
    if (!enabled) return;
    const page = publicPageLocation(window.location);
    if (!page || page === lastPage) return;
    lastPage = page;
    window.gtag('event', 'page_view', { page_location: page, page_title: 'CatManDog' });
  }

  panel.hidden = choice === 'accepted' || choice === 'rejected';
  if (choice === 'accepted') enable();
  settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('[data-analytics-accept]').focus(); });
  panel.querySelector('[data-analytics-accept]').addEventListener('click', () => {
    choice = 'accepted';
    try { localStorage.setItem(CONSENT_KEY, choice); } catch { /* No persistent storage */ }
    panel.hidden = true;
    enable();
    pageView();
  });
  panel.querySelector('[data-analytics-reject]').addEventListener('click', () => {
    choice = 'rejected';
    try { localStorage.setItem(CONSENT_KEY, choice); } catch { /* No persistent storage */ }
    panel.hidden = true;
    if (enabled) {
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) continue;
        document.cookie = `${name}=; Max-Age=0; Path=/`;
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.catmandog.es`;
      }
      window.location.reload();
    }
  });
  window.addEventListener('catmandog:commerce', ({ detail }) => {
    if (!enabled || !COMMERCE_EVENTS.has(detail?.event)) return;
    const items = detail.ecommerce?.items;
    if (!Array.isArray(items) || !items.length) return;
    const cleanItems = items.map(item => ({
      item_id: item.item_id, item_name: item.item_name, item_brand: item.item_brand,
      item_category: item.item_category, item_category2: item.item_category2,
      quantity: item.quantity, ...(Number.isFinite(item.price) ? { price: item.price } : {})
    }));
    window.gtag('event', detail.event, {
      currency: 'EUR', items: cleanItems,
      ...(typeof detail.ecommerce.item_list_id === 'string' ? { item_list_id: detail.ecommerce.item_list_id } : {})
    });
  });
  return { pageView };
}
