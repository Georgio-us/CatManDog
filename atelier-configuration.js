import { atelierOptionData } from './atelier-option-data.js';

export const atelierShelfId = 'cats-atelier-sh-w-f75-g';

const labels = {
  fabric: { ru:'Цвет тканевого чехла', es:'Color de la funda', uk:'Колір тканинного чохла' },
  baseFabric: { ru:'Цвет нижней части полки', es:'Color de la parte inferior del estante', uk:'Колір нижньої частини полиці' },
  wood: { ru:'Отделка дерева', es:'Acabado de la madera', uk:'Оздоблення дерева' },
  felt: { ru:'Цвет верхнего покрытия', es:'Color del revestimiento superior', uk:'Колір верхнього покриття' },
  platform: { ru:'Цвет платформы', es:'Color de la plataforma', uk:'Колір платформи' },
  bracket: { ru:'Цвет кронштейна', es:'Color del soporte', uk:'Колір кронштейна' }
};
const summaryLabels = { ru:'Выбранное исполнение', es:'Acabado elegido', uk:'Обране виконання' };
const swatchColors = {
  'DOT Beige':'#c9b9ab','DOT Black':'#292728','DOT Blue-Gray':'#87919a',
  'DOT Bottle Green':'#193f38','DOT Brick Brown':'#9e4e30','DOT Cream':'#e6ddd1',
  'DOT Dark Chocolate':'#493a38','DOT Dark Gray':'#666368',
  'DOT Dark Pastel Pink':'#a46c6f','DOT Deep Navy Blue':'#172846',
  'DOT Gray':'#a6a7a9','DOT Light Silver-Gray':'#d9dad7',
  'DOT Mint':'#a3b8b6','DOT Mustard':'#c79519','DOT Pastel Pink':'#d9b5ab',
  'White':'#ede9e3','Wenge':'#332d2b','Oak (golden)':'#b87932',
  'Natural (pine)':'#e6c798','Natural (beech)':'#d9bc91',
  'Beige':'#c9b9ab','Black':'#292728','Brown':'#694838',
  'Burgund':'#722a39','Cobalt blue':'#245baa','Dark grey (graphite)':'#505157',
  'Grey':'#9a9b9c','Light beige':'#e0d2bd','Orange':'#d77732',
  'Caramel (toffee)':'#a66d42','Gray':'#9a9b9c','Natural':'#d9bc91'
};

export function atelierHasOptions(productId) {
  return Boolean(atelierOptionData[productId]?.length);
}

export function atelierDefaults(productId) {
  return Object.fromEntries((atelierOptionData[productId] || []).map(group => [group.key, group.default]));
}

export function atelierSelection(productId, options) {
  const groups = atelierOptionData[productId];
  if (!groups?.length) {
    if (options != null && Object.keys(options).length) throw new Error('Для этого товара нет выбора отделки');
    return null;
  }
  const keys = groups.map(group => group.key);
  if (!options || Object.keys(options).some(key => !keys.includes(key)))
    throw new Error('Выберите все варианты исполнения товара');
  const names = [];
  const selected = {};
  for (const group of groups) {
    const choice = group.choices.find(([id]) => id === String(options[group.key] || ''));
    if (!choice) throw new Error(`Выберите ${labels[group.key].ru.toLowerCase()}`);
    selected[group.key] = choice[0];
    names.push(choice[1]);
  }
  return { options:selected, label:names.join(' · ') };
}

export function atelierOptionsMarkup(productId, options, language, escape) {
  const groups = atelierOptionData[productId];
  if (!groups?.length) return '';
  const selected = options && Object.keys(options).length ? options : atelierDefaults(productId);
  const controls = groups.map(group => {
    const name = group.key;
    const label = labels[name][language] || labels[name].ru;
    const choices = group.choices.map(([id,text]) => `<option value="${id}" ${selected[name] === id ? 'selected' : ''}>${escape(text)}</option>`).join('');
    const swatches = group.choices.every(([,text]) => swatchColors[text]) ?
      `<div class="atelier-swatches" role="group" aria-label="${escape(label)}">${group.choices.map(([id,text]) => `<button type="button" class="atelier-swatch ${selected[name] === id ? 'selected' : ''}" data-atelier-swatch="${name}:${id}" style="--swatch:${swatchColors[text]}" title="${escape(text)}" aria-label="${escape(label)}: ${escape(text)}" aria-pressed="${selected[name] === id}"></button>`).join('')}</div>` : '';
    return `<label class="atelier-option-label">${escape(label)}<select data-atelier-option="${name}" aria-label="${escape(label)}">${choices}</select></label>${swatches}`;
  }).join('');
  return `<div class="atelier-options">${controls}<p class="atelier-selection-summary"><strong>${escape(summaryLabels[language] || summaryLabels.ru)}:</strong> <span id="atelier-selection-summary">${escape(atelierSelection(productId,selected).label)}</span></p></div>`;
}
