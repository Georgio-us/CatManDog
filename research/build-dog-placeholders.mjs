import { mkdirSync, writeFileSync } from 'node:fs';
import { dogProducts } from '../dog-products.js';

const folder = new URL('../assets/dog/placeholders/', import.meta.url);
mkdirSync(folder, { recursive: true });
const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const lines = (value, max = 25) => {
  const words = value.split(' '), result = [];
  for (const word of words) {
    const last = result.at(-1);
    if (!last || `${last} ${word}`.length > max) result.push(word);
    else result[result.length - 1] = `${last} ${word}`;
  }
  return result.slice(0, 3);
};

for (const product of dogProducts) {
  const titleLines = lines(product.name.replace(`${product.brand} `, ''), 23);
  const title = titleLines.map((line, index) => `<tspan x="84" dy="${index ? 72 : 0}">${xml(line)}</tspan>`).join('');
  const shade = product.placeholderColor;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1000" viewBox="0 0 1200 1000" role="img" aria-label="Временная иллюстрация для ${xml(product.name)}">
  <rect width="1200" height="1000" fill="#f5f2e9"/>
  <circle cx="1040" cy="185" r="330" fill="${shade}" opacity="0.12"/>
  <circle cx="990" cy="785" r="390" fill="${shade}" opacity="0.09"/>
  <path d="M700 750 C850 630 980 650 1130 580" fill="none" stroke="${shade}" stroke-width="2" opacity="0.35"/>
  <rect x="84" y="84" width="95" height="7" rx="3" fill="${shade}"/>
  <text x="84" y="150" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="700" letter-spacing="5" fill="${shade}">${xml(product.brand.toUpperCase())}</text>
  <text x="84" y="395" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#173c37">${title}</text>
  <text x="84" y="685" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#49615b">${xml(product.tag || 'Для собак')}</text>
  <path d="M84 730H1116" stroke="${shade}" stroke-width="2" opacity="0.45"/>
  <text x="84" y="790" font-family="Arial, Helvetica, sans-serif" font-size="23" letter-spacing="3" fill="#65766e">ИЗОБРАЖЕНИЕ ГОТОВИТСЯ</text>
  <g transform="translate(998 815)" fill="${shade}" opacity="0.45"><ellipse cx="0" cy="31" rx="46" ry="34"/><ellipse cx="-50" cy="-23" rx="17" ry="24" transform="rotate(-25 -50 -23)"/><ellipse cx="-17" cy="-45" rx="17" ry="24" transform="rotate(-8 -17 -45)"/><ellipse cx="20" cy="-45" rx="17" ry="24" transform="rotate(8 20 -45)"/><ellipse cx="52" cy="-20" rx="17" ry="24" transform="rotate(25 52 -20)"/></g>
</svg>`;
  writeFileSync(new URL(`${product.id}.svg`, folder), svg);
}
