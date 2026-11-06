import { es, esPatterns } from './locales/es.js?v=coupon-qr-1';
import { esProductText } from './locales/product-es.js';
import { esDetails } from './locales/details-es.js';
import { uk, ukPatterns } from './locales/uk.js?v=coupon-qr-1';
import { ukExtra } from './locales/uk-extra.js?v=ukrainian-public-2';
import { ukProductNames } from './locales/uk-product-names.js';
import { ukProductCopy } from './locales/uk-product-copy.js';
import { ukDetails } from './locales/uk-details.js';
import { churuFormatsEs, churuFormatsUk } from './locales/churu-formats.js';
import { seoCategoryForPath } from './seo-categories.js';

const storageKey = 'catmandog-language';
const saved = (() => { try { return localStorage.getItem(storageKey); } catch { return null; } })();
const seoPath = globalThis.location?.pathname || '';
const language = seoPath === '/revista' || seoPath.startsWith('/revista/') || !!seoCategoryForPath(seoPath)
  ? 'es' : saved === 'ru' || saved === 'es' || saved === 'uk' ? saved : 'es';
const translatedNodes = new WeakMap();
const translatedAttributes = new WeakMap();
const attributes = ['aria-label', 'title', 'placeholder', 'alt'];

export const locale = () => language;
export const intlLocale = () => ({ es: 'es-ES', ru: 'ru-RU', uk: 'uk-UA' })[language];
export function setLocale(value) {
  if (value !== 'ru' && value !== 'es' && value !== 'uk') return;
  try {
    localStorage.setItem(storageKey, value);
  } catch { /* Private browsing */ }
  if (value !== 'es' && (location.pathname === '/revista' || location.pathname.startsWith('/revista/'))) {
    location.assign(`/${location.search}#/journal${location.pathname.slice('/revista'.length)}`);
    return;
  }
  const category = seoCategoryForPath(location.pathname);
  if (value !== 'es' && category) {
    location.assign(`/${location.search}#/catalog?pet=${category.pet}&group=${category.group}`);
    return;
  }
  location.reload();
}

export function translate(value) {
  if (language === 'ru' || typeof value !== 'string' || !/[А-Яа-яЁё]/.test(value)) return value;
  const whitespace = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const source = whitespace?.[2] ?? value;
  let result = language === 'uk'
    ? uk[source] ?? ukExtra[source] ?? churuFormatsUk[source] ?? ukProductNames[source] ?? ukProductCopy(source) ?? ukDetails[source] ?? esProductText[source] ?? esDetails[source]
    : es[source] ?? churuFormatsEs[source] ?? esProductText[source] ?? esDetails[source];
  if (result === undefined) {
    result = source;
    for (const [pattern, replacement] of language === 'uk' ? ukPatterns : esPatterns) {
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
  if (language === 'es') result = result.replace(/(^|[\s×/·-])(\d+(?:,\d+)?)\s*(кг|г|см|мл|л|шт)(?=$|[\s×/·-])/gu,
    (_, before, amount, unit) => `${before}${amount} ${{ кг: 'kg', г: 'g', см: 'cm', мл: 'ml', л: 'l', шт: 'uds.' }[unit]}`);
  if (language === 'uk') result = result.replace(/(^|[\s×/·-])(\d+(?:,\d+)?)\s*(кг|г|см|мл|л|шт)(?=$|[\s×/·-])/gu,
    (_, before, amount, unit) => `${before}${amount} ${{ кг: 'кг', г: 'г', см: 'см', мл: 'мл', л: 'л', шт: 'шт.' }[unit]}`);
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
  if (language !== 'es' && element.tagName === 'A') {
    const href = element.getAttribute('href');
    if (href === '/revista' || href?.startsWith('/revista/')) {
      element.setAttribute('href', `#/journal${href.slice('/revista'.length)}`);
    }
  }
  // An <option> without an explicit value otherwise changes its form value
  // when its visible Russian label is translated.
  if (element.tagName === 'OPTION' && !element.hasAttribute('value')) {
    element.setAttribute('value', element.textContent.trim());
  }
  if (language === 'es' && element.tagName === 'A' && element.getAttribute('href') === '/privacy.html') {
    element.setAttribute('href', '/privacy-es.html');
  }
  if (language === 'es' && element.tagName === 'A' && element.getAttribute('href') === '/legal.html') {
    element.setAttribute('href', '/legal-es.html');
  }
  if (language === 'es' && element.tagName === 'A' && element.getAttribute('href') === '/purchase-terms.html') {
    element.setAttribute('href', '/purchase-terms-es.html');
  }
  if (language === 'uk' && element.tagName === 'A') {
    for (const page of ['privacy', 'legal', 'purchase-terms']) {
      if (element.getAttribute('href') === `/${page}.html`) element.setAttribute('href', `/${page}-uk.html`);
    }
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
  if (language === 'ru' || !root) return;
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
  if (language !== 'ru') {
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = translate(description.content);
  }
  const switcher = document.querySelector('#language-switcher');
  if (switcher) {
    const trigger = switcher.querySelector('.language-trigger');
    const options = switcher.querySelector('.language-options');
    const names = { es: 'Español', ru: 'Русский', uk: 'Українська' };
    const shortNames = { es: 'ES', ru: 'RU', uk: 'УКР' };
    const accessibleLabels = {
      es: `Elegir idioma. Actual: ${names[language]}`,
      ru: `Выбрать язык. Сейчас: ${names[language]}`,
      uk: `Обрати мову. Зараз: ${names[language]}`
    };
    const groupLabels = { es: 'Idioma del sitio', ru: 'Язык сайта', uk: 'Мова сайту' };
    trigger.querySelector('[data-current-language]').textContent = shortNames[language];
    trigger.setAttribute('aria-label', accessibleLabels[language]);
    options.setAttribute('aria-label', groupLabels[language]);
    const close = () => {
      options.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    };
    trigger.addEventListener('click', () => {
      const open = options.hidden;
      options.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      if (open) options.querySelector('[aria-pressed="true"]')?.focus();
    });
    for (const button of switcher.querySelectorAll('[data-locale]')) {
      const active = button.dataset.locale === language;
      button.setAttribute('aria-pressed', String(active));
      button.addEventListener('click', () => {
        close();
        if (!active) setLocale(button.dataset.locale);
        else trigger.focus();
      });
    }
    document.addEventListener('pointerdown', event => {
      if (!switcher.contains(event.target)) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || options.hidden) return;
      close();
      trigger.focus();
    });
  }
  if (language === 'ru') return;
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
