import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendForProduct } from '../recommendations.js';

const product = (id, name, category, extra = {}) => ({
  id, name, category, pet: 'cat', brand: 'Acana', price: 12,
  priceStatus: 'confirmed', availabilityStatus: 'available', isReal: true, ...extra
});

test('food recommendations prefer matching brand after age and needs', () => {
  const dry = product('dry', 'Acana Sterilised Kitten Chicken', 'Корм', { foodType: 'dry' });
  const wrongNeed = product('wrong', 'Acana Kitten Chicken', 'Корм', { foodType: 'wet' });
  const fallback = product('fallback', 'Royal Canin Sterilised Kitten Turkey', 'Корм', { foodType: 'wet', brand: 'Royal Canin' });
  const sameBrand = product('same', 'Acana Sterilised Kitten Salmon', 'Корм', { foodType: 'wet' });
  const list = [dry, wrongNeed, fallback, sameBrand];
  assert.equal(recommendForProduct(dry, list)[0].product.id, 'same');
  assert.equal(recommendForProduct(dry, list.filter(item => item.id !== 'same'))[0].product.id, 'fallback');
  assert.equal(recommendForProduct(dry, [dry, wrongNeed]).length, 0);
  const grainFree = product('gf', 'Acana Grain Free Sterilised Kitten Chicken', 'Корм', { foodType: 'dry' });
  assert.equal(recommendForProduct(grainFree, [grainFree, sameBrand]).length, 0);
});

test('another flavour stays within the brand and the current basket is excluded', () => {
  const dry = product('dry', 'Acana Adult Chicken', 'Корм', { foodType: 'dry' });
  const sameBrand = product('same', 'Acana Adult Fish', 'Корм', { foodType: 'dry' });
  const otherBrand = product('other', 'Advance Adult Turkey', 'Корм', { foodType: 'dry', brand: 'Advance' });
  assert.deepEqual(recommendForProduct(dry, [dry, sameBrand, otherBrand]).map(item => item.product.id), ['same']);
  assert.deepEqual(recommendForProduct(dry, [dry, sameBrand, otherBrand], { cart: [{ productId: 'same' }] }), []);
});

test('veterinary diets do not automatically pair with food, treats or ingestible care', () => {
  const vet = product('vet', 'Hill’s Prescription Diet i/d Kitten', 'Корм', { foodType: 'dry', brand: 'Hill’s', segment: 'veterinary' });
  const wet = product('wet', 'Hill’s Kitten Chicken', 'Корм', { foodType: 'wet', brand: 'Hill’s' });
  const treat = product('treat', 'Churu Kitten', 'Лакомства', { brand: 'Churu' });
  const oil = product('oil', 'Лососевое масло', 'Уход', { brand: 'Beaphar' });
  const bowl = product('bowl', 'Миска', 'Миски и поилки', { brand: 'Moderna' });
  assert.deepEqual(recommendForProduct(vet, [vet, wet, treat, oil, bowl]).map(item => item.product.id), ['bowl']);
  const approvedOil = { ...oil, id: 'approved-oil', recommendation: { veterinaryCompatibleWith: ['vet'] } };
  assert.deepEqual(recommendForProduct(vet, [vet, oil, approvedOil, bowl]).map(item => item.product.id), ['approved-oil', 'bowl']);
});

test('toys can lead to another toy and an appropriate treat', () => {
  const mouse = product('mouse', 'Игрушка-мышка', 'Игрушки и аксессуары');
  const scratcher = product('scratcher', 'Когтеточка-башня', 'Игрушки и аксессуары');
  const churu = product('churu', 'Churu - курица', 'Лакомства', { brand: 'Churu' });
  assert.deepEqual(recommendForProduct(mouse, [mouse, scratcher, churu]).map(item => item.product.id), ['scratcher', 'churu']);
});

test('device consumables require an explicit compatible model', () => {
  const fountain = product('yagu-7845778', 'EBI Cascade - питьевой фонтан', 'Миски и поилки', { brand: 'EBI' });
  const filter = product('yagu-7815320', 'EBI Mango / Cascade - сменный фильтр', 'Миски и поилки', { brand: 'EBI' });
  const otherFilter = product('other-filter', 'Фильтр для другой поилки', 'Миски и поилки', { brand: 'EBI' });
  assert.deepEqual(recommendForProduct(fountain, [fountain, filter, otherFilter]).map(item => item.product.id), [filter.id]);
});

test('a bowl uses food already in the basket to choose a matching complement', () => {
  const bowl = product('bowl', 'Миска', 'Миски и поилки', { brand: 'Moderna' });
  const dry = product('dry', 'Hill’s Kitten Chicken', 'Корм', { foodType: 'dry', brand: 'Hill’s' });
  const wet = product('wet', 'Hill’s Kitten Turkey', 'Корм', { foodType: 'wet', brand: 'Hill’s' });
  const adult = product('adult', 'Hill’s Adult Chicken', 'Корм', { foodType: 'wet', brand: 'Hill’s' });
  const result = recommendForProduct(bowl, [bowl, dry, wet, adult], { cart: [{ productId: 'dry' }] });
  assert.deepEqual(result.map(item => item.product.id), ['wet']);
});

test('a feeder does not guess a diet without food in the basket', () => {
  const feeder = product('feeder', 'Автокормушка', 'Миски и поилки');
  const dry = product('dry', 'Acana Adult Chicken', 'Корм', { foodType: 'dry' });
  assert.deepEqual(recommendForProduct(feeder, [feeder, dry]), []);
});
