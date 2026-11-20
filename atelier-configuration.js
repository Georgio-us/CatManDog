// Supplier option IDs for SH-W-F75-G, checked against the live product page on 20 Nov 2026.
export const atelierShelfId = 'cats-atelier-sh-w-f75-g';
export const atelierFabrics = [
  ['41','DOT Beige','#c9b9ab'], ['42','DOT Black','#292728'],
  ['43','DOT Blue-Gray','#87919a'], ['44','DOT Bottle Green','#193f38'],
  ['45','DOT Brick Brown','#9e4e30'], ['46','DOT Cream','#e6ddd1'],
  ['47','DOT Dark Chocolate','#493a38'], ['48','DOT Dark Gray','#666368'],
  ['49','DOT Dark Pastel Pink','#a46c6f'], ['50','DOT Deep Navy Blue','#172846'],
  ['51','DOT Gray','#a6a7a9'], ['52','DOT Light Silver-Gray','#d9dad7'],
  ['53','DOT Mint','#a3b8b6'], ['54','DOT Mustard','#c79519'],
  ['55','DOT Pastel Pink','#d9b5ab']
];
export const atelierWoods = [
  ['57','White','#ede9e3'], ['62','Wenge','#332d2b'],
  ['58','Oak (golden)','#b87932'], ['98','Natural (pine)','#e6c798']
];

export function atelierSelection(productId, options) {
  if (productId !== atelierShelfId) {
    if (options != null) throw new Error('Для этого товара нет выбора отделки');
    return null;
  }
  const fabric = atelierFabrics.find(([id]) => id === String(options?.fabric || ''));
  const wood = atelierWoods.find(([id]) => id === String(options?.wood || ''));
  if (!fabric || !wood || Object.keys(options).some(key => !['fabric','wood'].includes(key)))
    throw new Error('Выберите ткань чехла и отделку дерева');
  return { options: { fabric: fabric[0], wood: wood[0] },
    label: `${fabric[1]} · ${wood[1]}` };
}

export function atelierOptionsMarkup(productId, options, language, escape) {
  if (productId !== atelierShelfId) return '';
  const labels = {
    ru: ['Цвет тканевого чехла','Отделка дерева','Выбранное исполнение'],
    es: ['Color de la funda','Acabado de la madera','Acabado elegido'],
    uk: ['Колір тканинного чохла','Оздоблення дерева','Обране виконання']
  }[language] || ['Цвет тканевого чехла','Отделка дерева','Выбранное исполнение'];
  const select = (name, choices, label) => `<label class="atelier-option-label">${escape(label)}<select data-atelier-option="${name}" aria-label="${escape(label)}">${choices.map(([id,text]) => `<option value="${id}" ${options[name] === id ? 'selected' : ''}>${escape(text)}</option>`).join('')}</select></label>`;
  const swatches = (choices, name) => `<div class="atelier-swatches" aria-hidden="true">${choices.map(([id,text,color]) => `<span class="atelier-swatch ${options[name] === id ? 'selected' : ''}" data-atelier-swatch="${name}:${id}" style="--swatch:${color}" title="${escape(text)}"></span>`).join('')}</div>`;
  return `<div class="atelier-options">${select('fabric',atelierFabrics,labels[0])}${swatches(atelierFabrics,'fabric')}${select('wood',atelierWoods,labels[1])}${swatches(atelierWoods,'wood')}<p class="atelier-selection-summary"><strong>${escape(labels[2])}:</strong> <span id="atelier-selection-summary">${escape(atelierSelection(productId,options).label)}</span></p></div>`;
}
