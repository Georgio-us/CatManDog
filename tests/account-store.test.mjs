import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountStore } from '../account-store.js';
function memoryStorage() {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
}
const pet = name => ({ name, species: 'cat', birthday: '', age: '', breed: '', preferences: ['Влажный корм'], notes: '' });
test('personal profiles persist literally and isolate orders and reminders by pet', () => {
  const storage = memoryStorage();
  const store = createAccountStore(storage);
  const leo = store.savePet(pet('Лео.'));
  store.saveHuman({ name: 'Саша', telegram: '@cat_person' });
  const order = store.recordOrder([{ productId: 'rc-sterilised', price: 29.09, qty: 2 }]);
  store.addReminder({ title: 'Корм', date: '2027-01-01' });
  const reminder = store.get().reminders[0];
  const margo = store.savePet(pet('Марго'));
  store.toggleReminder(reminder.id);
  assert.equal(store.get().reminders[0].done, false);
  assert.equal(order.petId, leo.id);
  assert.equal(store.get().orders.filter(o => o.petId === margo.id).length, 0);
  store.switchPet(leo.id);
  store.toggleReminder(reminder.id);
  const restored = createAccountStore(storage);
  assert.equal(restored.activePet().name, 'Лео.');
  assert.equal(restored.get().human.telegram, '@cat_person');
  assert.equal(restored.get().reminders[0].done, true);
  const detached = restored.get(); detached.pets[0].name = 'Changed externally';
  assert.equal(restored.activePet().name, 'Лео.');
});
test('demo sample and personal data never leak into each other', () => {
  const storage = memoryStorage(); const store = createAccountStore(storage);
  const personal = store.savePet(pet('Барсик'));
  store.open('demo'); assert.equal(store.activePet().name, 'Лео');
  store.applyPromo('welcome10'); assert.equal(store.promo().percent, 10);
  store.switchPet('demo-margo');
  store.recordOrder([{ productId: 'leonardo-chicken', price: 2.77, qty: 1 }]);
  assert.equal(createAccountStore(storage).activePet().name, 'Марго');
  store.open('personal'); assert.equal(store.activePet().id, personal.id);
  assert.equal(store.get().orders.length, 0); assert.equal(store.promo(), null);
});
test('coupons validate and are captured in order snapshots', () => {
  const store = createAccountStore(memoryStorage()); store.savePet(pet('Лео'));
  assert.throws(() => store.applyPromo('invalid'));
  store.applyPromo(' WELCOME10 ');
  const items = [{ productId: 'sample', price: 7.77, qty: 1, variantId: 'a' }];
  const order = store.recordOrder(items); items[0].price = 999;
  assert.equal(order.discount, 10); assert.equal(store.get().orders[0].items[0].price, 7.77);
  assert.throws(() => store.recordOrder([]));
});
test('unreadable storage does not prevent the storefront from initializing', () => {
  const store = createAccountStore({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
  assert.equal(store.activePet(), null);
});

test('older account data gains tools without losing profiles and orders', () => {
  const storage = memoryStorage(); const store = createAccountStore(storage);
  const leo = store.savePet(pet('Лео')); store.recordOrder([{ productId: 'sample', price: 7.77, qty: 1 }]);
  const old = store.get(); delete old.clinics; delete old.trips; delete old.tripDrafts;
  storage.setItem('catmandog-pet-account-v1', JSON.stringify(old));
  const restored = createAccountStore(storage);
  assert.equal(restored.activePet().id, leo.id); assert.equal(restored.get().orders.length, 1);
  assert.deepEqual(restored.get().trips, []); assert.deepEqual(restored.get().clinics, {});
});
test('guest preparation follows first registration and trips stay with their pet', () => {
  const storage = memoryStorage(); const store = createAccountStore(storage);
  const draft = { place: 'Мадрид', date: '2027-01-01', destination: 'spain', transport: 'renfe', checked: ['carrier'] };
  store.assignClinic('felinaria'); store.setTripDraft(draft);
  assert.throws(() => store.saveTrip(draft));
  const leo = store.savePet(pet('Лео'));
  assert.equal(store.get().clinics[leo.id], 'felinaria'); assert.deepEqual(store.tripDraft().checked, ['carrier']);
  const saved = store.saveTrip(store.tripDraft());
  const margo = store.savePet(pet('Марго')); assert.equal(store.tripDraft(), null);
  store.assignClinic('ucv'); assert.equal(store.get().clinics[leo.id], 'felinaria');
  assert.throws(() => store.saveTrip(saved));
  store.switchPet(leo.id); store.saveTrip({ ...saved, checked: ['carrier','ticket'] });
  const restored = createAccountStore(storage);
  assert.equal(restored.get().trips.length, 1); assert.equal(restored.get().trips[0].petId, leo.id);
  assert.equal(restored.get().clinics[margo.id], 'ucv');
  assert.deepEqual(restored.tripDraft().checked, ['carrier','ticket']);
});
