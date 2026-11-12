const ID_KEY = 'catmandog-observed-cart-v1';
const CONSENT_KEY = 'catmandog-analytics-consent-v1';
const validId = value => /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value || '');

export function createCartActivity(getItems, getStage = () => 'cart') {
  let cartId;
  try { cartId = localStorage.getItem(ID_KEY); } catch { cartId = null; }
  if (!validId(cartId)) cartId = null;
  let queue = Promise.resolve();
  let lastSent = '';
  let retryTimer = null;
  let retryCount = 0;

  const consented = () => {
    try { return localStorage.getItem(CONSENT_KEY) === 'accepted'; }
    catch { return false; }
  };
  const currentItems = () => getItems().map(item => ({
    productId: item.productId || item.id, variantId: item.variantId || null, qty: item.qty
  }));

  function sync(stage = 'cart', touch = false) {
    if (!consented()) return;
    const items = currentItems();
    if (!cartId) {
      try {
        const stored = localStorage.getItem(ID_KEY);
        if (validId(stored)) cartId = stored;
      } catch { /* Browser storage can be unavailable */ }
    }
    if (!cartId) {
      cartId = crypto.randomUUID();
      try { localStorage.setItem(ID_KEY, cartId); } catch { /* Keep this session in memory */ }
    }
    const payload = { cartId, stage, items, ...(touch ? { touch: true } : {}) };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSent && !touch) return;
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    lastSent = serialized;
    queue = queue.catch(() => {}).then(async () => {
      const response = await fetch('/api/telemetry/cart', { method: 'POST',
        credentials: 'same-origin', keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: serialized });
      if (!response.ok) throw new Error('Не удалось сохранить состояние корзины');
      retryCount = 0;
    }).catch(error => {
      if (lastSent !== serialized || !consented()) return;
      lastSent = '';
      retryCount += 1;
      console.warn('Cart activity sync failed:', error);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        sync(getStage(), true);
      }, Math.min(60000, 2000 * 2 ** Math.min(retryCount - 1, 5)));
    });
  }

  function revoke() {
    if (!cartId) return Promise.resolve();
    const removedId = cartId;
    cartId = null;
    lastSent = '';
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    retryCount = 0;
    queue = queue.catch(() => {}).then(async () => {
      const response = await fetch('/api/telemetry/cart', {
        method: 'DELETE', credentials: 'same-origin', keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId: removedId })
      });
      if (response.ok) {
        try {
          if (localStorage.getItem(ID_KEY) === removedId) localStorage.removeItem(ID_KEY);
        } catch { /* Browser storage can be unavailable */ }
      }
    }).catch(() => {});
    return queue;
  }

  window.addEventListener('catmandog:analytics-consent', event => {
    if (event.detail?.accepted) sync(getStage());
    else event.detail?.waitUntil?.(revoke());
  });
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sync(getStage(), true);
  });
  if (!consented() && cartId) void revoke();
  return { sync, id: () => consented() ? cartId : null, revoke };
}
