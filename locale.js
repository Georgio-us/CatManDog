import { es, esPatterns } from './locales/es.js?v=live-orders-20261112';
import { esProductText } from './locales/product-es.js?v=product-content-20261110';
import { esDetails } from './locales/details-es.js?v=product-content-20261110';
import { uk, ukPatterns } from './locales/uk.js?v=live-orders-20261112';
import { ukExtra } from './locales/uk-extra.js?v=cat-merchandising-20261112';
import { ukProductNames } from './locales/uk-product-names.js?v=picks-seo-20261112';
import { ukProductCopy } from './locales/uk-product-copy.js?v=product-content-20261110';
import { ukDetails } from './locales/uk-details.js?v=product-content-20261110';
import { churuFormatsEs, churuFormatsUk } from './locales/churu-formats.js';
import { churuDogEs, churuDogUk } from './locales/churu-dog.js';
import { seoCategoryForPath } from './seo-categories.js';
import { seoPickForPath } from './seo-picks.js';
import { deliveryStatusEs, deliveryStatusUk } from './locales/delivery-status.js?v=address-check-20261112';
import { yaguExpansionEs, yaguExpansionUk } from './locales/yagu-expansion.js?v=product-content-20261110';
import { editorialEs, editorialUk } from './locales/editorial-translations.js?v=editorial-leonardo-20261111';
import { shellTranslations } from './shell-translations.js';

const storageKey = 'catmandog-language';
const saved = (() => { try { return localStorage.getItem(storageKey); } catch { return null; } })();
const seoPath = globalThis.location?.pathname || '';
const language = seoPath === '/revista' || seoPath.startsWith('/revista/') || !!seoCategoryForPath(seoPath) || !!seoPickForPath(seoPath)
  ? 'es' : saved === 'ru' || saved === 'es' || saved === 'uk' ? saved : 'es';
const translatedNodes = new WeakMap();
const translatedAttributes = new WeakMap();
const attributes = ['aria-label', 'title', 'placeholder', 'alt'];
const shellSource = new Map();
for (const [russian, spanish] of Object.entries(shellTranslations)) {
  if (!shellSource.has(spanish)) shellSource.set(spanish, russian);
}
const shellSourceEntries = [...shellSource].sort((a, b) => b[0].length - a[0].length);

export function restoreShellText(value) {
  return shellSourceEntries.reduce((text, [spanish, russian]) => text.replaceAll(spanish, russian), value);
}

function restoreSeoShell() {
  if (language === 'es') return;
  for (const root of document.querySelectorAll('.announcement, .header, #search-form, .footer')) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = root;
    do {
      if (node.nodeType === Node.TEXT_NODE) node.nodeValue = restoreShellText(node.nodeValue);
      else if (node.nodeType === Node.ELEMENT_NODE) {
        for (const name of attributes) {
          const value = node.getAttribute(name);
          if (value !== null) node.setAttribute(name, restoreShellText(value));
        }
      }
      node = walker.nextNode();
    } while (node);
  }
  const journal = document.querySelector('.footer a[href="/revista"]');
  if (journal?.textContent.trim() === 'Журнал') journal.textContent = 'Полезный журнал';
  for (const page of ['legal', 'privacy', 'purchase-terms']) {
    document.querySelectorAll(`.footer a[href="/${page}-es.html"]`)
      .forEach(link => link.setAttribute('href', `/${page}.html`));
  }
}

export const locale = () => language;
export const intlLocale = () => ({ es: 'es-ES', ru: 'ru-RU', uk: 'uk-UA' })[language];
export function setLocale(value) {
  if (value !== 'ru' && value !== 'es' && value !== 'uk') return;
  try {
    localStorage.setItem(storageKey, value);
  } catch { /* Private browsing */ }
  const pick = seoPickForPath(location.pathname);
  if (value !== 'es' && pick) {
    location.assign(`/#/picks/${pick.pet}`);
    return;
  }
  const hashPick = (location.hash || '').match(/^#\/picks\/(cat|dog)(?:\?|$)/u);
  if (value === 'es' && hashPick) {
    location.assign(hashPick[1] === 'cat' ? '/selecciones/gatos' : '/selecciones/perros');
    return;
  }
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
    ? editorialUk[source] ?? churuDogUk[source] ?? yaguExpansionUk[source] ?? deliveryStatusUk[source] ?? uk[source] ?? ukExtra[source] ?? churuFormatsUk[source] ?? ukProductNames[source] ?? ukProductCopy(source) ?? ukDetails[source] ?? esProductText[source] ?? esDetails[source]
    : editorialEs[source] ?? churuDogEs[source] ?? yaguExpansionEs[source] ?? deliveryStatusEs[source] ?? es[source] ?? churuFormatsEs[source] ?? esProductText[source] ?? esDetails[source];
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
    if (href === '/catalogo' || href?.startsWith('/catalogo?')) {
      element.setAttribute('href', `/#/catalog${href.slice('/catalogo'.length)}`);
    }
    const pick = seoPickForPath(href);
    if (pick) element.setAttribute('href', `#/picks/${pick.pet}`);
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
  restoreSeoShell();
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
  if (language === 'ru') {
    document.querySelectorAll('a[href^="/selecciones/"], a[href^="/catalogo"], a[href^="/revista"]').forEach(elementAttributes);
    return;
  }
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
