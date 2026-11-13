import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
const money = value => {
  const raw = String(value || '').trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) fail('Не удалось прочитать сумму в накладной');
  return Math.round(Number(raw) * 100);
};
const number = value => Number(String(value || '').replace(/\s/g, '').replace(',', '.'));
const isoDate = value => {
  const match = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(String(value || '').trim());
  if (!match) fail('Не удалось прочитать дату накладной');
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (date.getUTCDate() !== Number(day) || date.getUTCMonth() + 1 !== Number(month))
    fail('Некорректная дата накладной');
  return `${year}-${month}-${day}`;
};

export async function pdfTextRows(buffer) {
  const data = new Uint8Array(buffer);
  if (data.length < 100 || String.fromCharCode(...data.subarray(0, 5)) !== '%PDF-')
    fail('Накладная должна быть файлом PDF');
  let document;
  let loadingTask;
  try {
    loadingTask = getDocument({ data, useSystemFonts: true, isEvalSupported: false });
    document = await loadingTask.promise;
  }
  catch { fail('Не удалось прочитать PDF накладной'); }
  try {
    if (document.numPages > 15) fail('Накладная слишком длинная');
    const pages = [];
    for (let pageNo = 1; pageNo <= document.numPages; pageNo++) {
      const page = await document.getPage(pageNo);
      const content = await page.getTextContent();
      const words = content.items.filter(item => item.str?.trim()).map(item => ({
        x: item.transform[4], y: item.transform[5], text: item.str.trim() }));
      const lines = [];
      for (const word of words.sort((a, b) => b.y - a.y || a.x - b.x)) {
        let line = lines.find(row => Math.abs(row.y - word.y) <= 1.8);
        if (!line) { line = { y: word.y, words: [] }; lines.push(line); }
        line.words.push(word);
      }
      pages.push(lines.map(line => ({ y: line.y,
        words: line.words.sort((a, b) => a.x - b.x) })));
      page.cleanup();
    }
    return pages;
  } finally {
    await loadingTask.destroy();
  }
}

const text = (line, from = -Infinity, to = Infinity) =>
  line.words.filter(word => word.x >= from && word.x < to).map(word => word.text).join(' ').trim();
const find = (lines, pattern) => lines.find(line => pattern.test(text(line)));

export function parseAlbetRows(pages) {
  const lines = pages.flat();
  if (!find(lines, /ALBET COMERCIAL SLU/i) || !find(lines, /ALBAR[ÁA]N/i))
    fail('Этот PDF не похож на накладную Albet');
  const header = find(lines, /^VMW\s+\d+\s+\d{2}\/\d{2}\/\d{4}/i);
  const heading = header && text(header, 0, 300).match(/^(VMW)\s+(\d+)\s+(\d{2}\/\d{2}\/\d{4})\s+([^\s]+)/i);
  if (!heading) fail('Не удалось прочитать номер накладной Albet');
  const productLines = lines.filter(line => /^\d{6}$/.test(text(line, 60, 100)) &&
    /^\d{8,14}$/.test(text(line, 100, 180)) && text(line, 180, 415));
  if (!productLines.length || productLines.length > 100)
    fail('Не удалось прочитать товары накладной Albet');
  const items = productLines.map((line, index) => {
    const quantity = number(text(line, 410, 450));
    const description = text(line, 180, 415);
    const lineCostCents = money(text(line, 750, 803));
    const unitPriceCents = money(text(line, 628, 661));
    const expiry = text(line, 560, 630);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99999 ||
      !/^\d{2}-\d{2}-\d{4}$/.test(expiry)) fail('Ошибка в строке товара Albet');
    const churuPack = description.match(/(\d+)\s*x\s*\(\s*(\d+)\s*x\s*\d+\s*g\s*\)/i);
    const casePack = description.match(/(?:caja|box)\s*(\d+)\s*(?:un|pcs)/i);
    const plainPack = description.match(/(?:-|\b)(\d+)\s*x\s*\d+\s*(?:g|gr)\b/i);
    const retailUnitsPerPurchaseUnit = churuPack ? Number(churuPack[1]) :
      casePack ? Number(casePack[1]) : 1;
    const piecesPerRetailUnit = churuPack ? Number(churuPack[2]) :
      plainPack && retailUnitsPerPurchaseUnit === 1 ? Number(plainPack[1]) : 1;
    return { lineNumber: index + 1, supplierCode: text(line, 60, 100),
      ean: text(line, 100, 180), description, purchaseQuantity: quantity,
      retailUnitsPerPurchaseUnit, piecesPerRetailUnit,
      retailUnits: quantity * retailUnitsPerPurchaseUnit,
      physicalPieces: quantity * retailUnitsPerPurchaseUnit * piecesPerRetailUnit,
      unitPriceCents, lineCostCents,
      lineDiscountPercent: number(text(line, 661, 689)) || 0,
      vatPercent: number(text(line, 803, 840)), expirationDate: isoDate(expiry) };
  });
  const totalsRow = lines.find(line => text(line, 0, 120).match(/^\d+[,.]\d{2}$/) &&
    text(line, 300, 380).includes('%') && text(line, 790, 840));
  const grandRow = lines.find(line => /Total\s*\(€\)/i.test(text(line, 620, 790)) &&
    /^\d+[,.]\d{2}$/.test(text(line, 790, 840)));
  if (!totalsRow || !grandRow) fail('Не удалось прочитать итог накладной Albet');
  const subtotalCents = money(text(totalsRow, 0, 120));
  const discountCents = money(text(totalsRow, 340, 390));
  const taxableBaseCents = money(text(totalsRow, 600, 650));
  const ivaCents = money(text(totalsRow, 690, 747));
  const recargoCents = money(text(totalsRow, 790, 840));
  const totalCents = money(text(grandRow, 790, 840));
  if (items.reduce((sum, item) => sum + item.lineCostCents, 0) !== subtotalCents ||
    subtotalCents - discountCents !== taxableBaseCents ||
    taxableBaseCents + ivaCents + recargoCents !== totalCents)
    fail('Суммы накладной не сходятся, приёмка остановлена');
  return { supplier: 'Albet', documentNumber: `${heading[1]} ${heading[2]}`,
    documentDate: isoDate(heading[3]), supplierOrder: heading[4],
    totals: { subtotalCents, discountCents, taxableBaseCents,
      ivaCents, recargoCents, totalCents }, items };
}

export async function parseSupplierDeliveryPdf(buffer) {
  const pages = await pdfTextRows(buffer);
  const textPreview = pages.flat().map(line => text(line)).join('\n');
  if (/ALBET COMERCIAL SLU/i.test(textPreview)) return parseAlbetRows(pages);
  fail('Для этого поставщика автоматический разбор накладной пока не настроен');
}

export async function extractProofAmounts(buffer) {
  const pages = await pdfTextRows(buffer);
  const amounts = [];
  for (const line of pages.flat()) {
    const value = text(line);
    if (!/(?:total|importe|paid|pagado|abonado|transferencia)/i.test(value)) continue;
    for (const match of value.matchAll(/(?:^|\s)(\d{1,6}(?:[.,]\d{2}))\s*€?/g))
      amounts.push(money(match[1]));
  }
  return [...new Set(amounts)].slice(0, 30);
}
