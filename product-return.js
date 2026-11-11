const originKey = 'catmandog-product-origin';
const restoreKey = 'catmandog-product-return-scroll';
const maxAgeMs = 30 * 60 * 1000;

const safePath = value => typeof value === 'string' && value.startsWith('/') &&
  !value.startsWith('//') && !/[<>"']/u.test(value);

export function rememberProductOrigin(productId, source, storage = globalThis.sessionStorage) {
  if (!productId || !safePath(source?.url)) return;
  try {
    storage.setItem(originKey, JSON.stringify({ productId, url: source.url,
      path: source.path, scrollY: Math.max(0, Number(source.scrollY) || 0),
      savedAt: Date.now() }));
  } catch { /* Browsing without session storage */ }
}

export function productOrigin(productId, storage = globalThis.sessionStorage) {
  try {
    const origin = JSON.parse(storage.getItem(originKey));
    if (origin?.productId === productId && safePath(origin.url) &&
        Date.now() - origin.savedAt < maxAgeMs) return origin;
  } catch { /* Invalid or unavailable session storage */ }
  return null;
}

export function requestProductReturn(origin, storage = globalThis.sessionStorage) {
  if (!origin || !safePath(origin.url)) return;
  try {
    storage.setItem(restoreKey, JSON.stringify({ url: origin.url,
      scrollY: Math.max(0, Number(origin.scrollY) || 0) }));
  } catch { /* Browsing without session storage */ }
}

export function takeProductReturnScroll(url, storage = globalThis.sessionStorage) {
  try {
    const saved = JSON.parse(storage.getItem(restoreKey));
    if (saved?.url !== url) return null;
    storage.removeItem(restoreKey);
    storage.removeItem(originKey);
    return Math.max(0, Number(saved.scrollY) || 0);
  } catch { return null; }
}
