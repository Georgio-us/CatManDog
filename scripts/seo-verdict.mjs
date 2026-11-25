import { createHash } from 'node:crypto';

export const editorialFingerprint = copy => createHash('sha256').update(JSON.stringify({
  source: copy.source,
  description: copy.description,
  details: copy.details,
  esDescription: copy.esDescription,
  esDetails: copy.esDetails,
  ukDescription: copy.ukDescription,
  ukDetails: copy.ukDetails
})).digest('hex');

// SEO readiness and the owner's current work queue are separate questions.
// A closed, unbuyable page can correctly remain on the site without becoming
// an editorial task. Model-specific HeyboPet approval is not inferred from price.
export const seoWorkScope = row => {
  if (row.indexable) return { workScope: 'поддержка', scopeReason: 'Страница уже открыта' };
  if (/^(hills-|advance-)/u.test(row.id)) {
    return { workScope: 'отложено', scopeReason: 'Владелец отложил Hill’s и Advance до работы с этими брендами' };
  }
  if (['halloween-bandana', 'birthday-bandana'].includes(row.id)) {
    return { workScope: 'отложено', scopeReason: 'Владелец исключил банданы из текущей SEO-проверки' };
  }
  if (row.id === 'cmd-source-4c1d8462a78eb6de') {
    return { workScope: 'отложено', scopeReason: 'ACANA Pacifica удержана отдельно до уточнения точного SKU' };
  }
  if (row.id === 'cmd-source-694e05cdc1b2582c') {
    return { workScope: 'проверяем сейчас', scopeReason: 'Покупка доступна, но описание коробки не подходит отдельным тюбикам' };
  }
  if (row.id.startsWith('heybopet-') && row.status !== 'ошибка') {
    return { workScope: 'нужно решение', scopeReason: 'Доступность под заказ есть; одобрение этой модели HeyboPet для SEO не зафиксировано' };
  }
  if (row.status === 'ошибка') {
    return { workScope: 'отложено', scopeReason: 'Есть конкретный блокер к открытию; редакционный проход сейчас не нужен' };
  }
  return { workScope: 'проверяем сейчас', scopeReason: 'Закрытая страница без текущего коммерческого блокера' };
};

// A missing review record is unknown, not an error. A recorded contradiction is
// an error, even when the public page is technically crawlable.
export const seoVerdict = ({ product, variants, copy, translations, review, technical, liveChecked,
  knownIssue, liveUnavailable, catalogUnavailable, sitemapUnavailable, priorCopy,
  catalogIsLive = true }) => {
  const failures = [];
  const needsReview = [];
  const evidence = [];
  if (knownIssue) failures.push(`Подтверждённое расхождение: ${knownIssue}`);
  if (catalogUnavailable) needsReview.push(catalogUnavailable);
  if (sitemapUnavailable) needsReview.push(sitemapUnavailable);
  if (!catalogUnavailable && !variants.length) failures.push('У товара нет вариантов в опубликованном каталоге');
  for (const variant of variants) {
    if (!variant.availableForCart) failures.push(`${variant.variant_id}: покупка недоступна`);
    if (!variant.price_accepted || !(variant.priceCents > 0)) {
      failures.push(`${variant.variant_id}: нет принятой розничной цены`);
    }
    if (!variant.image_path) failures.push(`${variant.variant_id}: нет основного фото`);
  }
  if (!product.path?.startsWith('/producto/')) failures.push('Нет постоянного URL товара');
  if (technical?.length) failures.push(...technical.map(issue => `Опубликованная страница: ${issue}`));
  if (!copy) {
    if (priorCopy) {
      evidence.push(priorCopy);
      needsReview.push('Осталось сверить полный текст RU/ES/UK с точным первичным источником');
    } else needsReview.push('Пока не найдено предметной редакционной записи с первичным источником');
  } else {
    evidence.push(`Редакционный источник: ${copy.source}`);
    if (!/^https:\/\//u.test(copy.source || '')) needsReview.push('Не записан первичный источник');
    if (!Array.isArray(copy.details) || copy.details.length < 3 || !translations?.es
      || !translations?.uk || translations.details?.length !== copy.details.length
      || translations.details.some(detail => !detail.es || !detail.uk)) {
      needsReview.push('Не подтверждён полный комплект текста RU/ES/UK');
    }
    if (!catalogUnavailable && variants.some(variant => variant.description !== copy.description)) {
      const reason = catalogIsLive
        ? 'Описание в опубликованном каталоге не совпадает с проверенным текстом'
        : 'Описание в сохранённом снимке отличается; сверь с текущим сайтом';
      (catalogIsLive ? failures : needsReview).push(reason);
    }
    if (copy.esDescription && copy.ukDescription &&
      (translations.es !== copy.esDescription || translations.uk !== copy.ukDescription)) {
      failures.push('Переводы в интерфейсе не совпадают с проверенным текстом');
    }
    if (!needsReview.some(reason => reason.includes('текст RU/ES/UK'))
      && !failures.some(reason => reason.includes('Описание в опубликованном каталоге')
        || reason.includes('Переводы в интерфейсе'))) {
      evidence.push('Предметные тексты RU/ES/UK есть в коде и согласованы с опубликованным каталогом');
    }
  }
  if (!review) {
    needsReview.push('Нет отдельной записи сверки продаваемой единицы и точного фото с образцом');
  } else {
    if (review.productId !== product.id) failures.push('Запись проверки привязана к другому товару');
    if (!review.reviewedAt || !review.sourceUrl || !review.saleUnit) {
      needsReview.push('В записи проверки нет даты, первичного источника или продаваемой единицы');
    }
    if (copy && review.sourceUrl !== copy.source) {
      needsReview.push('Источник изменился после проверки');
    }
    if (copy && review.editorialSha256 !== editorialFingerprint(copy)) {
      needsReview.push('Текст изменился после предметной проверки');
    }
    const currentVariants = variants.map(variant => variant.variant_id).sort();
    if (!catalogUnavailable && JSON.stringify(currentVariants) !== JSON.stringify([...(review.variantIds || [])].sort())) {
      needsReview.push('Состав вариантов изменился после проверки');
    }
    if (!review.imageIdentityVerified || !/^https:\/\//u.test(review.imageEvidenceUrl || '')) {
      needsReview.push('Нет записи визуальной сверки фото с точным товаром и ссылкой на образец');
    } else if (!catalogUnavailable && variants.some(variant =>
      review.imagePaths?.[variant.variant_id] !== variant.image_path)) {
      needsReview.push('Основное фото изменилось после визуальной сверки');
    }
    if (review.note) evidence.push(review.note);
    if (review.sourceUrl) evidence.push(review.sourceUrl);
    if (review.imageEvidenceUrl) evidence.push(`Образец фото: ${review.imageEvidenceUrl}`);
    if (review.reviewedAt) evidence.push(`Проверено ${review.reviewedAt}`);
  }
  if (product.indexable && !liveChecked) {
    needsReview.push(liveUnavailable || 'Опубликованная SEO-страница ещё не проверена этим запуском');
  }
  if (!product.indexable) evidence.push('Страница пока закрыта от индексации');
  const status = failures.length ? 'ошибка' : needsReview.length ? 'проверить' : 'прошло';
  if (status === 'прошло') {
    evidence.push('Проверены точный SKU, цена, покупка, текст RU/ES/UK и идентичность фото');
    if (product.indexable) evidence.push('Живая страница: canonical, sitemap, метаданные и загрузка фото в порядке');
  }
  return { id: product.id, path: product.path, indexable: product.indexable, status,
    reasons: [...new Set([...failures, ...needsReview])], evidence };
};
