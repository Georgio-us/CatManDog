import test from 'node:test';
import assert from 'node:assert/strict';
import { tripChecklist, tripProgress } from '../trip-planner.js';
test('routes produce distinct relevant document and transport tasks', () => {
  const domestic = tripChecklist({ destination: 'spain', transport: 'car' });
  assert.equal(domestic.some(i => i.id === 'passport'), false);
  assert.equal(domestic.some(i => i.id === 'ticket'), false);
  assert.equal(domestic.some(i => i.id === 'car'), true);
  const europe = tripChecklist({ destination: 'eu', transport: 'renfe' });
  assert.equal(europe.some(i => i.id === 'passport'), true);
  assert.equal(europe.find(i => i.id === 'ticket').source.name.startsWith('Renfe'), true);
  const abroad = tripChecklist({ destination: 'outside', transport: 'iberia' });
  assert.equal(abroad.some(i => i.id === 'return'), true);
  assert.equal(abroad.some(i => i.id === 'passport'), false);
  assert.equal(abroad.find(i => i.id === 'flight').source.name.startsWith('Iberia'), true);
  for (const list of [domestic,europe,abroad]) assert.equal(new Set(list.map(i => i.id)).size,list.length);
});
test('obsolete and duplicate check marks cannot overstate progress', () => {
  const trip = { destination: 'spain', transport: 'car', checked: ['carrier','carrier','passport','made-up'] };
  assert.deepEqual(tripProgress(trip), { done: 1, total: 5, percent: 20 });
});
