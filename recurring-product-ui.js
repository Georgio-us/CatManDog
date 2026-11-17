export function recurringProductCard({ item, sku, product, imageBlock, escape, money,
  selected = false, input = '', language = 'ru' }) {
  const copy = {
    ru: { article: 'Артикул', barcode: 'Штрихкод', code: 'Код товара',
      quantity: 'Количество', price: 'Цена на витрине', pending: 'Цена уточняется', variant: 'Вариант товара' },
    es: { article: 'Referencia', barcode: 'Código de barras', code: 'Código de producto',
      quantity: 'Cantidad', price: 'Precio en la tienda', pending: 'Precio por confirmar', variant: 'Formato' },
    uk: { article: 'Артикул', barcode: 'Штрихкод', code: 'Код товару',
      quantity: 'Кількість', price: 'Ціна на сайті', pending: 'Ціна уточнюється', variant: 'Варіант товару' }
  }[language] || null;
  const words = copy || { article: 'Артикул', barcode: 'Штрихкод', code: 'Код товара',
    quantity: 'Количество', price: 'Цена на витрине', pending: 'Цена уточняется', variant: 'Вариант товара' };
  const name = item.name || product?.name || sku?.name || 'Товар';
  const label = item.label || sku?.label || item.variantLabel || item.size || '';
  const supplierCode = String(sku?.id || '').match(/^yagu-(\d+)-(?:catalog-pack|studio)$/)?.[1] || '';
  const article = sku?.manufacturerSku || sku?.article || sku?.sku || supplierCode;
  const ean = sku?.ean || '';
  const code = article ? `${words.article} ${article}` : ean ? `${words.barcode} ${ean}` :
    item.variantId ? `${words.code} ${item.variantId}` : '';
  const quantity = Math.max(1, Number(item.qty) || 1);
  const price = Number.isFinite(item.displayPrice) && item.displayPrice > 0
    ? money(item.displayPrice) : words.pending;
  const image = sku?.image || product?.image;
  const tag = input ? 'label' : 'div';
  return `<${tag} class="recurring-product-card${input && selected ? ' is-selected' : ''}">
    ${input}<span class="recurring-product-photo">${image ? imageBlock(image, '', true) : '<span class="recurring-product-missing" aria-hidden="true"></span>'}</span>
    <span class="recurring-product-details"><strong>${escape(name)}</strong>
      <span class="recurring-product-variant">${escape(label || words.variant)}</span>
      ${code ? `<small>${escape(code)}</small>` : ''}<small>${words.quantity}: ${quantity}</small></span>
    <span class="recurring-product-price"><small>${words.price}</small><strong>${price}</strong></span>
  </${tag}>`;
}
