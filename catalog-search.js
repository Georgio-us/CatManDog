export function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

const units = { кг: 'kg', г: 'g', л: 'l', мл: 'ml' };

function tokens(value) {
  return normalizeSearch(value)
    .replace(/(\d)[,.](\d)/g, '$1.$2')
    .replace(/(\d+(?:\.\d+)?)\s*(kg|ml|кг|мл|g|l|г|л)(?!\p{L})/gu, (_, amount, unit) => amount + (units[unit] || unit))
    .match(/\d+(?:\.\d+)?(?:kg|ml|g|l)?|\p{L}+/gu) || [];
}

function nearWord(a, b) {
  if (a.length < 4 || /^\d/.test(a) || /^\d/.test(b) || Math.abs(a.length - b.length) > 1) return false;
  if (a.length !== b.length) {
    const [short, long] = a.length < b.length ? [a, b] : [b, a];
    const index = [...short].findIndex((letter, i) => letter !== long[i]);
    return index < 0 || short.slice(index) === long.slice(index + 1);
  }
  const differences = [...a].map((letter, i) => letter !== b[i] ? i : -1).filter(i => i >= 0);
  if (differences.length === 1) return true;
  const [i, j] = differences;
  return differences.length === 2 && j === i + 1 && a[i] === b[j] && a[j] === b[i];
}

function scoreWords(query, words, fuzzyWords = []) {
  let score = 0;
  let typos = 0;
  for (const word of query) {
    if (words.includes(word)) score += 4;
    else if (!/^\d/.test(word) && word.length >= 3 && words.some(w => w.startsWith(word))) score += 2;
    else if (typos === 0 && fuzzyWords.some(w => nearWord(word, w))) { typos++; score++; }
    else return -Infinity;
  }
  return score - typos * 10;
}

export function searchCatalog(entries, value, { alternatives = false } = {}) {
  const query = tokens(value);
  if (!query.length) return [];
  const hits = [];
  for (const entry of entries) {
    let best = null;
    const title = tokens(entry.title);
    const brand = tokens(entry.brand);
    const details = tokens(entry.details);
    const phrase = title.join(' ').startsWith(query.join(' '));
    for (const variant of entry.variants) {
      const identity = [...title, ...brand, ...tokens(variant.label)];
      const words = [...identity, ...details];
      const score = scoreWords(query, words, identity);
      if (!Number.isFinite(score)) continue;
      const primary = Number.isFinite(scoreWords(query, identity));
      const exact = Number.isFinite(scoreWords(query, words));
      const rank = score + (primary ? 8 : 0) + (phrase ? 6 : 0);
      if (!best || rank > best.rank || (rank === best.rank && variant.available && !best.variant.available)) best = { entry, variant, rank, exact, primary };
    }
    if (best) hits.push(best);
  }
  hits.sort((a, b) => b.rank - a.rank || Number(b.variant.available) - Number(a.variant.available));
  if (hits.some(hit => hit.exact && hit.primary)) return hits.filter(hit => hit.exact && hit.primary);
  if (hits.some(hit => hit.exact)) return hits.filter(hit => hit.exact);
  if (hits.length || !alternatives) return hits;
  const anchor = query.filter(word => word.length >= 3 && !/^\d/.test(word));
  return entries.flatMap(entry => {
    const words = tokens([entry.title, entry.brand, entry.details].join(' '));
    const rank = anchor.filter(word => words.includes(word)).length;
    const variant = entry.variants.find(item => item.available);
    return rank && variant ? [{ entry, variant, rank, alternative: true }] : [];
  }).sort((a, b) => b.rank - a.rank);
}
