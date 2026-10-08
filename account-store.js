// Local adapter for the prototype; replace this layer when server accounts are connected
const KEY = 'catmandog-pet-account-v1';
const DEMO_KEY = 'catmandog-pet-account-demo-v1';
const MODE_KEY = 'catmandog-pet-account-mode';
const empty = () => ({ version: 1, pets: [], activePetId: null, human: { name: '', email: '', telegram: '', orderUpdates: true, reminders: false, offers: false }, orders: [], reminders: [], promo: '', referral: '', referredBy: '', clinics: {}, trips: [], tripDrafts: {} });
const id = () => crypto.randomUUID();
const day = offset => { const date = new Date(); date.setDate(date.getDate() + offset); return date.toISOString().slice(0, 10); };
const example = () => ({
  ...empty(), activePetId: 'demo-leo', referral: 'LEO-FRIEND',
  pets: [
    { id: 'demo-leo', name: 'Лео', species: 'cat', birthday: '2023-05-14', age: '', breed: 'Британская короткошёрстная', preferences: ['Сухой корм', 'Влажный корм', 'Стерилизован'], notes: 'Обожает смотреть в окно и игрушки с кошачьей мятой', color: 'sage' },
    { id: 'demo-margo', name: 'Марго', species: 'cat', birthday: '2024-09-02', age: '', breed: 'Домашняя короткошёрстная', preferences: ['Влажный корм', 'Без зерна'], notes: 'Любит хрустящие лакомства и солнечные места', color: 'peach' }
  ],
  human: { name: 'Саша', email: '', telegram: '', orderUpdates: true, reminders: true, offers: false },
  orders: [
    { id: 'demo-order-1032', petId: 'demo-leo', number: 'CMD-1032', date: day(-1), status: 'packing', items: [{ productId: 'rc-sterilised', variantId: null, size: '2 кг', qty: 1, price: 29.09 }, { productId: 'kong-scrunchie', variantId: null, size: '1 шт', qty: 1, price: 7.77 }], discount: 0 },
    { id: 'demo-order-987', petId: 'demo-leo', number: 'CMD-0987', date: day(-28), status: 'delivered', items: [{ productId: 'rc-sterilised', variantId: null, size: '2 кг', qty: 1, price: 29.09 }], discount: 0 },
    { id: 'demo-order-991', petId: 'demo-margo', number: 'CMD-0991', date: day(-19), status: 'delivered', items: [{ productId: 'leonardo-chicken', variantId: null, size: '200 г', qty: 4, price: 2.77 }], discount: 0 }
  ],
  reminders: [{ id: 'demo-reminder-1', petId: 'demo-leo', title: 'Пополнить запас корма', date: day(9), productId: 'rc-sterilised', done: false }, { id: 'demo-reminder-2', petId: 'demo-margo', title: 'Заказать влажный корм', date: day(5), productId: 'leonardo-chicken', done: false }]
});
export function createAccountStore(storage) {
  let mode = 'personal';
  try { mode = storage.getItem(MODE_KEY) === 'demo' ? 'demo' : 'personal'; } catch { /* A disabled storage must not prevent the storefront from loading */ }
  let data;
  function load() {
    try { data = JSON.parse(storage.getItem(mode === 'demo' ? DEMO_KEY : KEY)); } catch { data = null; }
    if (!data || data.version !== 1 || !Array.isArray(data.pets) || !Array.isArray(data.orders) || !Array.isArray(data.reminders)) data = mode === 'demo' ? example() : empty();
    data.clinics = data.clinics && typeof data.clinics === 'object' && !Array.isArray(data.clinics) ? data.clinics : {};
    data.trips = Array.isArray(data.trips) ? data.trips : [];
    data.tripDrafts = data.tripDrafts && typeof data.tripDrafts === 'object' && !Array.isArray(data.tripDrafts) ? data.tripDrafts : {};
    data.human = { ...empty().human, ...data.human };
    if (!data.pets.some(p => p.id === data.activePetId)) data.activePetId = data.pets[0]?.id || null;
  }
  function save() { storage.setItem(mode === 'demo' ? DEMO_KEY : KEY, JSON.stringify(data)); }
  load();
  return {
    get: () => structuredClone(data),
    mode: () => mode,
    activePet: () => structuredClone(data.pets.find(p => p.id === data.activePetId) || null),
    open(nextMode) { mode = nextMode === 'demo' ? 'demo' : 'personal'; storage.setItem(MODE_KEY, mode); load(); },
    switchPet(petId) { if (data.pets.some(p => p.id === petId)) { data.activePetId = petId; save(); } },
    savePet(values, petId) {
      if (!values.name?.trim()) throw new Error('Укажите имя питомца');
      const previous = data.pets.find(p => p.id === petId);
      const pet = { ...values, id: previous?.id || id(), color: previous?.color || (data.pets.length % 2 ? 'peach' : 'sage') };
      if (previous) data.pets[data.pets.indexOf(previous)] = pet; else data.pets.push(pet);
      if (!data.activePetId) {
        if (data.clinics.guest) { data.clinics[pet.id] = data.clinics.guest; delete data.clinics.guest; }
        if (data.tripDrafts.guest) { data.tripDrafts[pet.id] = data.tripDrafts.guest; delete data.tripDrafts.guest; }
      }
      data.activePetId = pet.id;
      if (!data.referral) data.referral = 'CAT-' + pet.id.slice(0, 8).toUpperCase();
      save(); return structuredClone(pet);
    },
    saveHuman(values) { data.human = { ...data.human, ...values }; save(); },
    setReferral(value) { data.referredBy = String(value || '').slice(0, 80); save(); },
    addReminder(values) { if (!values.title?.trim() || !values.date || !data.activePetId) throw new Error('Укажите покупку и дату'); data.reminders.push({ ...values, id: id(), petId: data.activePetId, done: false }); save(); },
    toggleReminder(reminderId) { const reminder = data.reminders.find(r => r.id === reminderId && r.petId === data.activePetId); if (reminder) { reminder.done = !reminder.done; save(); } },
    applyPromo(code) { const value = code.trim().toUpperCase(); if (!['WELCOME10', 'LEO10'].includes(value)) throw new Error('В прототипе доступны WELCOME10 и LEO10'); data.promo = value; save(); },
    promo: () => data.promo ? { code: data.promo, percent: 10 } : null,
    assignClinic(clinicId) { data.clinics[data.activePetId || 'guest'] = clinicId; save(); },
    tripDraft: () => structuredClone(data.tripDrafts[data.activePetId || 'guest'] || null),
    setTripDraft(trip) { data.tripDrafts[data.activePetId || 'guest'] = structuredClone(trip); save(); },
    saveTrip(trip) {
      if (!data.activePetId) throw new Error('Добавьте питомца, чтобы сохранить поездку в его кабинет');
      if (!trip.place?.trim() || !trip.date) throw new Error('Укажите направление и дату');
      const existing = trip.id ? data.trips.find(t => t.id === trip.id && t.petId === data.activePetId) : null;
      if (trip.id && !existing) throw new Error('Эта поездка принадлежит другому питомцу');
      const saved = { ...structuredClone(trip), id: existing?.id || id(), petId: data.activePetId };
      if (existing) data.trips[data.trips.indexOf(existing)] = saved; else data.trips.unshift(saved);
      data.tripDrafts[data.activePetId] = saved; save(); return structuredClone(saved);
    },
    recordOrder(items) {
      if (!data.activePetId || !items.length) throw new Error('Сначала добавьте питомца и товары');
      const order = { id: id(), number: 'DEMO-' + String(Date.now()).slice(-6), petId: data.activePetId, date: day(0), status: 'received', items: structuredClone(items), discount: data.promo ? 10 : 0 };
      data.orders.unshift(order); save(); return structuredClone(order);
    }
  };
}
