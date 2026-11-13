import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAlbetRows } from '../server/supplier-receipt-parser.js';

const row = (...cells) => ({ y: 1, words: cells.map(([x, text]) => ({ x, text })) });
const fixture = () => [[
  row([10, 'ALBET COMERCIAL SLU']),
  row([10, 'ALBARÁN']),
  row([10, 'VMW 64286 13/11/2026 ORD-1117878']),
  row([70, '940001'], [110, '8859387700674'], [190, 'CHURU 12x(4x14g)'],
    [420, '1'], [570, '13-11-2027'], [635, '21,12'], [670, '0'],
    [760, '21,12'], [810, '10']),
  row([70, '949577'], [110, '8859387700698'], [190, 'CHURU - 20x14gr'],
    [420, '1'], [570, '13-11-2027'], [635, '8,34'], [670, '0'],
    [760, '8,34'], [810, '10']),
  row([70, '931040'], [110, '4002633757241'], [190, 'LEONARDO FRESH DUCK 4kg'],
    [420, '1'], [570, '13-11-2027'], [635, '30,10'], [670, '0'],
    [760, '30,10'], [810, '10']),
  row([20, '59,56'], [320, '1%'], [350, '0,60'], [620, '58,96'],
    [710, '5,90'], [810, '0,82']),
  row([650, 'Total (€)'], [810, '65,68'])
]];

test('Albet parser reads packaging, quantities and tax total', () => {
  const parsed = parseAlbetRows(fixture());
  assert.equal(parsed.documentNumber, 'VMW 64286');
  assert.equal(parsed.documentDate, '2026-11-13');
  assert.equal(parsed.items[0].retailUnits, 12);
  assert.equal(parsed.items[0].physicalPieces, 48);
  assert.equal(parsed.items[1].retailUnits, 1);
  assert.equal(parsed.items[1].physicalPieces, 20);
  assert.equal(parsed.items[2].physicalPieces, 1);
  assert.equal(parsed.totals.totalCents, 6568);
});

test('Albet parser rejects a PDF whose totals do not reconcile', () => {
  const pages = fixture();
  pages[0].at(-1).words.at(-1).text = '65,69';
  assert.throws(() => parseAlbetRows(pages), /Суммы накладной не сходятся/);
});
