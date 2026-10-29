const plain = value => String(value || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function weightGrams(value) {
  const text = String(value || '').toLowerCase().replace(',', '.').replace(/\s/g, '');
  const match = text.match(/^(\d+(?:\.\d+)?)(kg|g|кг|г)$/);
  if (!match) return null;
  return Math.round(Number(match[1]) * (match[2] === 'kg' || match[2] === 'кг' ? 1000 : 1));
}

function groupForSource(line) {
  const text = plain(line);
  if (text.includes('fresh meat')) return 'fresh';
  if (text.includes('sin cereales')) return 'gf';
  if (text.includes('alimento seco')) return 'dry';
  if (text.includes('drink')) return 'drink';
  if (text.includes('pulled meat')) return 'pulled';
  if (text.includes('extra filete')) return 'filet';
  if (text.includes('superior selection')) return 'superior';
  if (text.includes('quality selection')) return 'quality';
  if (text.includes('finest selection')) return 'finest';
  return null;
}

function groupForSite(name) {
  const text = plain(name);
  if (text.includes('fresh meat')) return 'fresh';
  if (/\b(?:kitten|senior|adult) gf\b/.test(text)) return 'gf';
  if (text.includes('extra filet')) return 'filet';
  if (text.includes('superior selection')) return 'superior';
  if (text.includes('quality selection')) return 'quality';
  if (text.includes('finest selection')) return 'finest';
  if (text.includes('pulled beef')) return 'pulled';
  return 'dry';
}

function flavor(group, value, fromSource) {
  const text = plain(value);
  const has = pattern => pattern.test(text);
  if (group === 'fresh') {
    if (has(/\bduck\b/)) return 'duck';
    if (has(/\bbeef\b/)) return 'beef';
    if (has(/\bsalmon\b/)) return 'salmon';
  }
  if (group === 'gf') {
    if (has(/\bkitten\b/)) return 'kitten';
    if (has(/\bsenior\b/)) return 'senior';
    if (has(/\bmaxi\b/)) return 'maxi';
    if (has(/\bsalmon\b/)) return 'salmon';
    if (has(/\bpoultry\b/)) return 'poultry';
  }
  if (group === 'dry') {
    if (has(/granula start/)) return 'granula';
    if (has(/\bkitten\b/)) return 'kitten';
    if (has(/\bsenior\b/)) return 'senior';
    if (has(/\bcomplete\b/)) return 'complete';
    if (has(/\blight\b/)) return 'light';
    for (const word of ['lamb', 'duck', 'fish']) if (text.includes(word)) return word;
  }
  if (group === 'pulled') {
    const recipe = fromSource ? text.replace(/^leonardo /, '').split(' extra pulled')[0] :
      text.split('pulled beef ')[1];
    return ['beef', 'chicken', 'turkey', 'lamb', 'duck'].find(word => recipe?.startsWith(word)) || null;
  }
  if (group === 'filet') {
    const aliases = { salmon:/\b(?:salmon|salmon)\b/, herring:/\b(?:arenque|herring)\b/,
      turkey:/\b(?:pavo|turkey)\b/, lamb:/\b(?:cordero|lamb)\b/,
      chicken:/\b(?:pollo|chicken)\b/, venison:/\b(?:venado|venison)\b/ };
    return Object.keys(aliases).find(key => has(aliases[key])) || null;
  }
  if (group === 'superior') {
    const aliases = { horse:/\b(?:caballo|horse)\b/, turkey:/\b(?:pavo|turkey)\b/,
      duck:/\b(?:pato|duck)\b/, chicken:/\b(?:pollo|chicken)\b/,
      beef:/\b(?:ternera|beef)\b/, lamb:/\b(?:cordero|lamb)\b/ };
    return Object.keys(aliases).find(key => has(aliases[key])) || null;
  }
  if (group === 'quality') {
    if (has(/\bkitten\b/)) return 'kitten';
    if (has(/\b(?:pescado|fish)\b/)) return 'fish';
    if (has(/\b(?:conejo|rabbit)\b/)) return 'rabbit';
    if (has(/\b(?:ave|poultry)\b/)) return 'poultry';
    if (has(/\b(?:higado|liver)\b/)) return 'liver';
    if (has(/\b(?:ternera|beef)\b/)) return 'beef';
    if (has(/\b(?:pato|duck)\b/)) return 'duck';
  }
  if (group === 'finest') {
    if (has(/\bsenior\b/)) {
      if (has(/\b(?:ternera|beef)\b/)) return 'senior-beef';
      if (has(/\b(?:pollo|chicken)\b/)) return 'senior-chicken';
    }
    if (has(/\bkitten\b/)) return 'kitten';
    if (has(/\b(?:bufalo|buffalo)\b/)) return 'buffalo';
    if (has(/\b(?:trucha|trout)\b/)) return 'trout';
    if (has(/\b(?:conejo|rabbit)\b/)) return 'rabbit';
    if (has(/\b(?:faisan|pheasant)\b/)) return 'pheasant';
    if (has(/\b(?:venado|venison)\b/)) return 'venison';
    if (has(/\b(?:gambas|shrimps)\b/)) return 'fish-shrimp';
    if (has(/\b(?:carne|meat)\b/)) return 'meat-menu';
    if (has(/\b(?:huevo|egg)\b/)) return 'poultry-egg';
    if (has(/\b(?:queso|cheese)\b/)) return 'duck-cheese';
    if (has(/\b(?:cordero|lamb)\b/)) return 'lamb-cranberry';
    if (has(/\b(?:legumbres|vegetables)\b/)) return 'beef-vegetables';
    if (has(/\b(?:pavo|turkey)\b/)) return 'pure-turkey';
    if (has(/\b(?:pollo|chicken)\b/)) return 'pure-chicken';
    if (has(/\b(?:ternera|beef)\b/)) return 'pure-beef';
  }
  return null;
}

function key(group, name, weight, fromSource) {
  const grams = weightGrams(weight);
  const recipe = group && flavor(group, name, fromSource);
  return grams && recipe ? `${group}:${recipe}:${grams}` : null;
}

export function leonardoCatalogMatches(items, variants) {
  const indexed = new Map();
  for (const site of variants) {
    const matchKey = key(groupForSite(site.name), site.name, site.label, false);
    if (!matchKey) continue;
    const group = indexed.get(matchKey) || [];
    group.push(site);
    indexed.set(matchKey, group);
  }
  const supplierCounts = new Map();
  for (const item of items) {
    const matchKey = key(groupForSource(item.line), item.name, item.weight, true);
    if (matchKey) supplierCounts.set(matchKey, (supplierCounts.get(matchKey) || 0) + 1);
  }
  return items.flatMap(item => {
    const matchKey = key(groupForSource(item.line), item.name, item.weight, true);
    const matches = indexed.get(matchKey) || [];
    if (!matchKey || supplierCounts.get(matchKey) !== 1 || matches.length !== 1) return [];
    const site = matches[0];
    if (item.ean && site.ean && item.ean !== site.ean) return [];
    return [{ itemId: item.id, variantId: site.id, key: matchKey }];
  });
}
