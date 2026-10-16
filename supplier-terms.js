// Local sourcing review only - confidential data is kept outside public catalogue modules
let supplierTerms = null;
export async function loadSupplierTerms() {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
  const results = await Promise.allSettled(['rc', 'ownat'].map(async brand => {
    const response = await fetch(`./research/supplier-cats/${brand}-storefront-terms.json`, { cache: 'no-store' });
    return response.ok ? response.json() : null;
  }));
  supplierTerms = { products: {} };
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value?.products) {
      Object.assign(supplierTerms.products, result.value.products);
    }
  }
}
export function hasSupplierTerms(product) {
  return !!supplierTerms?.products?.[product.id];
}
export function supplierTermsDetail(product, sku, { escape, money }) {
  if (!hasSupplierTerms(product)) return '';
  const terms = supplierTerms.products[product.id].variants[sku.id];
  const heading = '<details class="supplier-terms"><summary>Условия поставщика</summary>';
  if (!terms) return heading + '<p>Для выбранной фасовки цены в переданном тарифе нет</p></details>';
  const pack = terms.packLabel.replace(/gr\b/g, 'г').replace(/kg\b/g, 'кг');
  const date = terms.effectiveDate.split('-').reverse().join('/');
  const ownat = terms.brand === 'Ownat';
  const packPrice = terms.unitsPerSalesPack > 1
    ? `<p>Закупка коробки: <strong>${money(terms.priceExTax)}</strong><br>За одну внутреннюю упаковку: <strong>${money(terms.pricePerInnerUnitExTax)}</strong> - расчёт из стоимости коробки<br>Единица заказа у поставщика - коробка, цена на сайте относится к одной внутренней упаковке</p>`
    : `<p>${ownat ? 'Рекомендованная цена продажи магазину' : 'Закупочная цена по тарифу'}: <strong>${money(terms.priceExTax)}</strong> за упаковку${ownat ? '<br>Без IVA - не индивидуальная договорная цена' : ''}</p>`;
  const promo = terms.promotion;
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
  const promotion = promo && today >= promo.start && today <= promo.end
    ? `<p>Акция ${promo.start.split('-').reverse().join('/')} - ${promo.end.split('-').reverse().join('/')}<br>Скидка магазину 20% на коробку - расчётная цена <strong>${money(promo.promotionalBoxExTax)}</strong> без налогов<br>При наличии товара, не суммируется с другими предложениями<br>В промо также указана скидка владельцу 20% на пауч</p>` : '';
  return `${heading}<p>${ownat ? 'Ownat' : 'Royal Canin'}<br>${ownat ? 'Артикул' : 'Артикул NAV'}: ${escape(terms.supplierCode)}<br>EAN ${terms.unitsPerSalesPack > 1 ? 'коробки' : 'упаковки'}: ${escape(terms.ean)}<br>Фасовка поставщика: ${escape(pack)}</p>${packPrice}<p>${ownat ? `Рекомендованная розничная цена: <strong>${money(terms.recommendedRetailSpainIncTax)}</strong> с IVA<br>Материковая Испания, прайс за февраль 2026` : `Налоги не включены<br>Тариф действует с ${date}`}<br>Доставка, минимальная сумма заказа и условия оплаты в тарифе не указаны<br>Наличие требует подтверждения</p>${promotion}<p>Сопоставление: ${escape(terms.matchStatus)}</p></details>`;
}
