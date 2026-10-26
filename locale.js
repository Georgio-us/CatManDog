import { es, esPatterns } from './locales/es.js?v=es-locale-3';
import { esProductText } from './locales/product-es.js';
import { esDetails } from './locales/details-es.js';

const storageKey = 'catmandog-language';
const saved = (() => { try { return localStorage.getItem(storageKey); } catch { return null; } })();
const language = saved === 'ru' || saved === 'es' ? saved : 'es';
const translatedNodes = new WeakMap();
const translatedAttributes = new WeakMap();
const attributes = ['aria-label', 'title', 'placeholder', 'alt'];

export const locale = () => language;
export const intlLocale = () => language === 'es' ? 'es-ES' : 'ru-RU';
export function setLocale(value) {
  if (value !== 'ru' && value !== 'es') return;
  try { localStorage.setItem(storageKey, value); } catch { /* Private browsing */ }
  location.reload();
}

export function translate(value) {
  if (language !== 'es' || typeof value !== 'string' || !/[А-Яа-яЁё]/.test(value)) return value;
  const whitespace = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const source = whitespace?.[2] ?? value;
  let result = es[source] ?? esProductText[source] ?? esDetails[source];
  if (result === undefined) {
    result = source;
    for (const [pattern, replacement] of esPatterns) {
      if (pattern.test(result)) result = result.replace(pattern, replacement);
    }
    // Action labels contain a product name after the colon. Translate that
    // name separately while keeping the label's original internal value.
    const action = result.match(/^([^:]+: )(.+)$/u);
    if (action && /[А-Яа-яЁё]/u.test(action[2])) {
      const name = translate(action[2]);
      if (name !== action[2]) result = action[1] + name;
    }
    if (/[А-Яа-яЁё]/u.test(result) && result.includes(' · ')) {
      result = result.split(' · ').map(part => translate(part)).join(' · ');
    }
    if (/[А-Яа-яЁё]/u.test(result) && result.includes(' - ')) {
      result = result.split(' - ').map(part => translate(part)).join(' - ');
    }
  }
  result = result.replace(/(^|[\s×/·-])(\d+(?:,\d+)?)\s*(кг|г|см|мл|л|шт)(?=$|[\s×/·-])/gu,
    (_, before, amount, unit) => `${before}${amount} ${{ кг: 'kg', г: 'g', см: 'cm', мл: 'ml', л: 'l', шт: 'uds.' }[unit]}`);
  return `${whitespace?.[1] ?? ''}${result}${whitespace?.[3] ?? ''}`;
}

function textNode(node) {
  const current = node.nodeValue;
  const previous = translatedNodes.get(node);
  const source = previous && previous.output === current ? previous.source : current;
  const output = translate(source);
  translatedNodes.set(node, { source, output });
  if (output !== current) node.nodeValue = output;
}

function elementAttributes(element) {
  // An <option> without an explicit value otherwise changes its form value
  // when its visible Russian label is translated.
  if (element.tagName === 'OPTION' && !element.hasAttribute('value')) {
    element.setAttribute('value', element.textContent.trim());
  }
  if (language === 'es' && element.tagName === 'A' && element.getAttribute('href') === '/privacy.html') {
    element.setAttribute('href', '/privacy-es.html');
  }
  const previous = translatedAttributes.get(element) || {};
  for (const name of attributes) {
    const current = element.getAttribute(name);
    if (current === null) continue;
    const stored = previous[name];
    const source = stored && stored.output === current ? stored.source : current;
    const output = translate(source);
    previous[name] = { source, output };
    if (output !== current) element.setAttribute(name, output);
  }
  translatedAttributes.set(element, previous);
}

function translateTree(root) {
  if (language !== 'es' || !root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    if (!root.parentElement?.closest('script, style, [data-no-translate]')) textNode(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE || root.matches('script, style, [data-no-translate]')) return;
  elementAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentElement?.closest('script, style, [data-no-translate]')) textNode(node);
    } else if (!node.closest('script, style, [data-no-translate]')) elementAttributes(node);
  }
}

export function installLocale() {
  document.documentElement.lang = language;
  if (language === 'es') {
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = translate(description.content);
  }
  const switcher = document.querySelector('#language-switcher');
  if (switcher) {
    for (const button of switcher.querySelectorAll('[data-locale]')) {
      const active = button.dataset.locale === language;
      button.setAttribute('aria-pressed', String(active));
      button.addEventListener('click', () => setLocale(button.dataset.locale));
    }
  }
  if (language !== 'es') return;
  translateTree(document.body);
  const observer = new MutationObserver(changes => {
    for (const change of changes) {
      if (change.type === 'characterData') translateTree(change.target);
      else if (change.type === 'attributes') elementAttributes(change.target);
      else for (const node of change.addedNodes) translateTree(node);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
}
