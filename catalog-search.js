export function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

export function matchesCatalogSearch(product, query, names = []) {
  const needle = normalizeSearch(query);
  if (!needle) return true;
  return [product.name, product.brand, product.category, product.description, ...names]
    .some(value => normalizeSearch(value).includes(needle));
}

export function catalogSuggestions(products, query, displayName = product => product.name, limit = 6) {
  const needle = normalizeSearch(query);
  if (!needle) return [];
  const brands = [...new Set(products.map(product => product.brand).filter(Boolean))]
    .filter(brand => normalizeSearch(brand).includes(needle))
    .sort((a, b) => Number(normalizeSearch(b).startsWith(needle)) - Number(normalizeSearch(a).startsWith(needle)) || a.localeCompare(b))
    .map(brand => ({ kind: 'brand', label: brand, query: brand }));
  const matches = products
    .filter(product => matchesCatalogSearch(product, needle, [displayName(product)]))
    .sort((a, b) => Number(normalizeSearch(displayName(b)).startsWith(needle)) - Number(normalizeSearch(displayName(a)).startsWith(needle)) || displayName(a).localeCompare(displayName(b)))
    .map(product => ({ kind: 'product', label: displayName(product), brand: product.brand || '', id: product.id }));
  return [...brands.slice(0, 1), ...matches].slice(0, limit);
}
