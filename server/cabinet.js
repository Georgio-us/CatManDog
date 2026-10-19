import { randomUUID } from 'node:crypto';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clean = (value, length) => String(value ?? '').trim().slice(0, length);
const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
const list = (value, max) => Array.isArray(value) ? value.slice(0, max) : [];
const petId = value => uuid.test(String(value || '')) ? String(value) : fail('Некорректный питомец');
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : '';

function petFields(value) {
  const id = petId(value?.id || randomUUID());
  const name = clean(value?.name, 40);
  if (!name || !['cat', 'dog'].includes(value?.species)) fail('Укажите имя и вид питомца');
  return { id, name, species: value.species,
    profile: { birthday: date(value.birthday), age: clean(value.age, 40), breed: clean(value.breed, 80),
      preferences: list(value.preferences, 20).map(item => clean(item, 60)).filter(Boolean),
      notes: clean(value.notes, 400), color: value.color === 'peach' ? 'peach' : 'sage' } };
}

export function normalizeCabinet(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Некорректные данные кабинета');
  const rawPets = list(input.pets, 12);
  if (Array.isArray(input.pets) && input.pets.length > 12) fail('Слишком много питомцев');
  const pets = rawPets.map(petFields);
  const ids = new Set(pets.map(p => p.id));
  if (ids.size !== pets.length) fail('Питомец повторяется');
  const human = input.human && typeof input.human === 'object' ? input.human : {};
  const reminders = list(input.reminders, 100).map(item => ({
    id: petId(item.id), petId: petId(item.petId), title: clean(item.title, 120),
    date: date(item.date), productId: clean(item.productId, 180), done: item.done === true
  })).filter(item => ids.has(item.petId) && item.title && item.date);
  const trips = list(input.trips, 50).map(item => ({
    id: petId(item.id), petId: petId(item.petId), place: clean(item.place, 80), date: date(item.date),
    destination: clean(item.destination, 40), transport: clean(item.transport, 40),
    checked: list(item.checked, 80).map(v => clean(v, 80)).filter(Boolean)
  })).filter(item => ids.has(item.petId) && item.place && item.date);
  const map = (source, transform) => Object.fromEntries(Object.entries(
    source && typeof source === 'object' && !Array.isArray(source) ? source : {})
    .filter(([key]) => key === 'guest' || ids.has(key))
    .map(([key, value]) => [key, transform(value)]));
  const data = {
    activePetId: ids.has(input.activePetId) ? input.activePetId : pets[0]?.id || null,
    human: { name: clean(human.name, 80), email: clean(human.email, 160),
      telegram: clean(human.telegram, 33), orderUpdates: human.orderUpdates === true,
      reminders: human.reminders === true, offers: human.offers === true },
    reminders, trips,
    clinics: map(input.clinics, value => clean(value, 80)),
    tripDrafts: map(input.tripDrafts, value => ({
      id: uuid.test(String(value?.id || '')) ? value.id : undefined,
      place: clean(value?.place, 80), date: date(value?.date),
      destination: clean(value?.destination, 40), transport: clean(value?.transport, 40),
      checked: list(value?.checked, 80).map(v => clean(v, 80)).filter(Boolean)
    }))
  };
  return { pets, data };
}

export async function loadCabinet(db, customer) {
  const [petResult, cabinetResult] = await Promise.all([
    db.query('SELECT id,name,species,profile FROM pets WHERE customer_id=$1 ORDER BY created_at', [customer.id]),
    db.query('SELECT data,revision FROM customer_cabinet WHERE customer_id=$1', [customer.id])
  ]);
  const pets = petResult.rows.map(p => ({ id: p.id, name: p.name, species: p.species, ...p.profile }));
  const saved = cabinetResult.rows[0];
  const data = saved?.data || {};
  return { revision: saved?.revision || 0, cabinet: {
    version: 1, pets, activePetId: pets.some(p => p.id === data.activePetId) ? data.activePetId : pets[0]?.id || null,
    human: { name: customer.name || '', email: customer.email, telegram: '',
      orderUpdates: true, reminders: false, offers: false, ...data.human },
    orders: [], reminders: data.reminders || [], promo: '', referral: '', referredBy: '',
    clinics: data.clinics || {}, trips: data.trips || [], tripDrafts: data.tripDrafts || {}
  } };
}

export async function saveCabinet(db, customer, body) {
  const revision = Number(body?.revision);
  if (!Number.isSafeInteger(revision) || revision < 0) fail('Обновите кабинет и повторите');
  const normalized = normalizeCabinet(body.cabinet);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM customers WHERE id=$1 FOR UPDATE', [customer.id]);
    const current = await client.query('SELECT revision FROM customer_cabinet WHERE customer_id=$1', [customer.id]);
    if ((current.rows[0]?.revision || 0) !== revision)
      throw Object.assign(new Error('Кабинет изменился на другом устройстве. Обновите страницу'), { status: 409 });
    for (const pet of normalized.pets) {
      const result = await client.query(`INSERT INTO pets(id,customer_id,name,species,profile)
        VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,
        species=EXCLUDED.species,profile=EXCLUDED.profile,updated_at=now()
        WHERE pets.customer_id=EXCLUDED.customer_id RETURNING id`,
      [pet.id, customer.id, pet.name, pet.species, pet.profile]);
      if (!result.rowCount) fail('Питомец принадлежит другому аккаунту');
    }
    await client.query('DELETE FROM pets WHERE customer_id=$1 AND NOT(id=ANY($2::uuid[]))',
      [customer.id, normalized.pets.map(p => p.id)]);
    await client.query(`INSERT INTO customer_cabinet(customer_id,data,revision) VALUES($1,$2,$3)
      ON CONFLICT(customer_id) DO UPDATE SET data=EXCLUDED.data,revision=EXCLUDED.revision,updated_at=now()`,
    [customer.id, normalized.data, revision + 1]);
    await client.query('COMMIT');
    return { revision: revision + 1 };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
