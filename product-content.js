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
  if (product.optionLabel !== 'Фасовка' || !variants.every(variant => Number(variant.packageWeightKg) > 0)) return variants;
  return [...variants].sort((a, b) => a.packageWeightKg - b.packageWeightKg);
}
