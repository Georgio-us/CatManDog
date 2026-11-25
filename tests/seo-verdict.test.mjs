import test from 'node:test';
import assert from 'node:assert/strict';
import { editorialFingerprint, seoVerdict } from '../scripts/seo-verdict.mjs';

const product = { id: 'sku-1', path: '/producto/sku-1', indexable: true };
const copy = { source: 'https://maker.example/item', description: 'Проверенный товар для кошек',
  details: ['Вес', 'Состав', 'Фасовка'], esDescription: 'Producto verificado para gatos',
  esDetails: ['Peso', 'Composición', 'Formato'], ukDescription: 'Перевірений товар для котів',
  ukDetails: ['Вага', 'Склад', 'Фасування'] };
const variant = { variant_id: 'sku-1-pack', availableForCart: true, price_accepted: true,
  priceCents: 999, image_path: '/item.webp', description: copy.description };
const review = { productId: product.id, reviewedAt: '2026-11-25', sourceUrl: copy.source,
  saleUnit: '1 pack', variantIds: [variant.variant_id], editorialSha256: editorialFingerprint(copy),
  imageIdentityVerified: true, imageEvidenceUrl: 'https://maker.example/item-photo',
  imagePaths: { [variant.variant_id]: variant.image_path } };
const input = { product, variants: [variant], copy, review, technical: [], liveChecked: true,
  translations: { es: copy.esDescription, uk: copy.ukDescription,
    details: copy.details.map((_, index) => ({ es: copy.esDetails[index], uk: copy.ukDetails[index] })) } };

test('SEO verdict passes only with live technical and explicit product evidence', () => {
  assert.equal(seoVerdict(input).status, 'прошло');
  const missing = seoVerdict({ ...input, review: undefined });
  assert.equal(missing.status, 'проверить');
  assert.match(missing.reasons.join(' '), /Нет явной записи/);
  const stale = seoVerdict({ ...input, review: { ...review, editorialSha256: 'old' } });
  assert.equal(stale.status, 'проверить');
  assert.match(stale.reasons.join(' '), /Текст изменился/);
  const changedImage = seoVerdict({ ...input, variants: [{ ...variant, image_path: '/other.webp' }] });
  assert.equal(changedImage.status, 'проверить');
  assert.match(changedImage.reasons.join(' '), /фото изменилось/);
});

test('SEO verdict identifies confirmed defects without calling unavailable evidence a defect', () => {
  const broken = seoVerdict({ ...input, variants: [{ ...variant, price_accepted: false }] });
  assert.equal(broken.status, 'ошибка');
  assert.match(broken.reasons.join(' '), /розничной цены/);
  const unreachable = seoVerdict({ ...input, liveChecked: false,
    liveUnavailable: 'Не удалось подтвердить живую страницу: timeout' });
  assert.equal(unreachable.status, 'проверить');
  assert.match(unreachable.reasons.join(' '), /timeout/);
  const catalogDown = seoVerdict({ ...input, variants: [], catalogUnavailable: 'Каталог недоступен',
    liveChecked: false });
  assert.equal(catalogDown.status, 'проверить');
  assert.doesNotMatch(catalogDown.reasons.join(' '), /нет вариантов/i);
});
