export const INTERNAL_BROWSER_KEY = 'catmandog-internal-browser-v1';

export function isInternalBrowser(storage = globalThis.localStorage) {
  try { return storage?.getItem(INTERNAL_BROWSER_KEY) === '1'; }
  catch { return false; }
}

export function markInternalBrowser(storage = globalThis.localStorage) {
  try { storage?.setItem(INTERNAL_BROWSER_KEY, '1'); return true; }
  catch { return false; }
}
