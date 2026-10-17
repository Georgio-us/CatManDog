import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogProducts } from '../data.js';
import {
  homeGroupForProduct,
  homeGroupsForPet,
  homeFeatureOptions,
  matchesHomeFeature,
  homePriceOptions,
  matchesHomePrice
} from '../home-catalog.js';

test('every current catalog product belongs to one direct category', () => {
  const groups = homeGroupsForPet('cat', catalogProducts);
  const ids = new Set(groups.map(group => group.id));
  assert.equal(catalogProducts.every(product => ids.has(homeGroupForProduct(product))), true);
  assert.equal(catalogProducts.some(product => homeGroupForProduct(product) === 'dry-food'), true);
  assert.equal(catalogProducts.some(product => homeGroupForProduct(product) === 'wet-food'), true);
  assert.equal(catalogProducts.filter(product => product.category === 'Корм' && ['dry', 'wet'].includes(product.foodType))
    .every(product => homeGroupForProduct(product) === `${product.foodType}-food`), true);
});

test('fillers, trays, scoops, bowls, drinkers and feeders do not mix', () => {
  const byName = phrase => catalogProducts.find(product => product.name.includes(phrase));
  assert.equal(homeGroupForProduct(byName('Sanicat Classic')), 'litter');
  assert.equal(homeGroupForProduct(byName('лопатка для наполнителя')), 'trays');
  assert.equal(homeGroupForProduct(byName('автоматический лоток')), 'trays');
  assert.equal(homeGroupForProduct(byName('миска для кошек')), 'bowls');
  assert.equal(homeGroupForProduct(byName('MP Comedero Sensibowl Slomo')), 'bowls');
  assert.equal(homeGroupForProduct(byName('питьевой фонтан')), 'drinkers');
  assert.equal(homeGroupForProduct(byName('автокормушка с камерой')), 'feeders');
});

test('pet categories and features follow available products', () => {
  const dogs = [
    { pet: 'dog', category: 'Корм', foodType: 'dry', name: 'Сухой корм для собак' },
    { pet: 'cat', category: 'Корм', foodType: 'wet', name: 'Влажный корм для кошек' }
  ];
  assert.deepEqual(homeGroupsForPet('dog', dogs).map(group => group.id), ['dry-food']);
  const feeders = catalogProducts.filter(product => homeGroupForProduct(product) === 'feeders');
  assert.deepEqual(homeFeatureOptions('feeders', feeders).map(feature => feature.id), ['camera', 'no-camera']);
  assert.equal(matchesHomeFeature(feeders.find(product => product.name.includes('с камерой')), 'feeders', 'camera'), true);
  assert.equal(matchesHomeFeature(feeders.find(product => product.name.includes('без камеры')), 'feeders', 'camera'), false);
});

test('price filter uses confirmed variants and excludes demo prices', () => {
  const pending = { name: 'Ожидает цену', price: 7.77, priceStatus: 'pending' };
  const priced = { name: 'Подтверждён', price: 12, priceStatus: 'confirmed' };
  const variantFamily = { variants: [pending, priced] };
  assert.equal(matchesHomePrice(pending, 20), false);
  assert.equal(matchesHomePrice(variantFamily, 20), true);
  assert.equal(matchesHomePrice(variantFamily, 10), false);
  assert.deepEqual(homePriceOptions([pending, priced, { price: 35, priceStatus: 'confirmed' }]), [20, 30]);
});
