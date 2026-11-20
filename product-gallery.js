export function productGallery(product, imageBlock, escape, language = 'ru') {
  const images = [product.image, ...(product.gallery || [])].filter(image => image?.src);
  if (images.length < 2) return imageBlock(product.image, 'detail-image');
  const label = { ru:'Фотографии товара',es:'Fotos del producto',uk:'Фото товару' }[language] || 'Фотографии товара';
  const caption = image => typeof image.caption === 'object' ? image.caption[language] || image.caption.ru : image.caption || '';
  return `<div class="product-gallery" aria-label="${escape(label)}"><div data-gallery-main>${imageBlock(images[0], 'detail-image')}</div><div class="product-gallery-thumbs" role="group" aria-label="${escape(label)}">${images.map((image,index) => `<button type="button" class="product-gallery-thumb ${index === 0 ? 'active' : ''}" data-gallery-index="${index}" data-gallery-src="${escape(image.src)}" data-gallery-alt="${escape(image.alt || '')}" data-gallery-caption="${escape(caption(image))}" data-gallery-reference="${image.src.endsWith('.jpg') ? 'true' : 'false'}" aria-label="${escape(caption(image) || `${label} ${index + 1}`)}" aria-pressed="${index === 0}"><img src="${escape(image.src)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div><p class="product-gallery-caption" data-gallery-caption-display>${escape(caption(images[0]))}</p></div>`;
}
