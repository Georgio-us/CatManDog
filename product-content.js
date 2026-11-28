export function customerFacts(details) {
  return (details || []).filter(detail => {
    const text = String(detail).trim();
    return text && !/^Упаковка\s*:/iu.test(text) &&
      !/^Для (кошек|собак)$/iu.test(text) &&
      !/^Используйте по инструкции на упаковке производителя$/iu.test(text) &&
      !/^Свежая вода (всегда )?должна быть /iu.test(text) &&
      !/^Норму кормления /iu.test(text) &&
      !/^Фасовку выберите перед добавлением в корзину$/iu.test(text) &&
      !/^(Сухой|Влажный) корм( для кошек)?$/iu.test(text) &&
      !/^(Сухой )?полнорационный (сухой )?корм$/iu.test(text);
  });
}

export function orderedVariants(product) {
  const variants = product.variants || [];
  const weight = variant => {
    const stored = Number(variant.packageWeightKg);
    if (Number.isFinite(stored) && stored > 0) return stored;
    const match = String(variant.label || '').match(/^(\d+(?:[,.]\d+)?)\s*(кг|kg|г|g)(?:\s|$)/iu);
    if (!match) return null;
    return Number(match[1].replace(',', '.')) * (/^(г|g)$/iu.test(match[2]) ? 0.001 : 1);
  };
  if (!variants.every(variant => weight(variant) > 0)) return variants;
  return [...variants].sort((a, b) => weight(a) - weight(b));
}
