import { readFile } from 'node:fs/promises';
import { directSupplierSources } from '../server/direct-supplier-sources.js';

export function sourceLinkProblems(row, directSource = null) {
  const problems = [];
  if (!row) return ['SKU отсутствует в каталоге'];
  if (row.orderable !== true || row.availableForCart !== true) problems.push('товар нельзя купить');
  if (row.pickupAvailable) return problems;
  if (row.availability !== 'source_on_demand') problems.push(`статус ${row.availability || 'не указан'} вместо source_on_demand`);
  if (row.sourcingAvailability !== 'source_on_demand') problems.push(`источник ${row.sourcingAvailability || 'не указан'} вместо source_on_demand`);
  if (!(Number(row.supplier_source_count) > 0)) problems.push('нет подтверждённой связи с источником');
  if (directSource && row.direct_supplier_verified_at !== directSource.checkedAt) {
    problems.push('дата B2B-проверки отсутствует или не совпадает');
  }
  return problems;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2);
  const ids = args.flatMap((arg, index) => arg === '--id' ? [args[index + 1]] : []).filter(Boolean);
  const file = args[args.indexOf('--catalog-file') + 1];
  if (!ids.length || (!args.includes('--live') && !args.includes('--catalog-file'))) {
    throw new Error('Укажи --id <SKU> и --live либо --catalog-file <путь>');
  }
  const catalog = args.includes('--catalog-file')
    ? JSON.parse(await readFile(file, 'utf8'))
    : await (async () => {
      const response = await fetch('https://catmandog.es/api/catalog', { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`API каталога: HTTP ${response.status}`);
      return response.json();
    })();
  let failed = false;
  for (const id of ids) {
    const row = catalog.variants?.find(variant => variant.variant_id === id);
    const directSource = directSupplierSources[id];
    const problems = sourceLinkProblems(row, directSource);
    console.log(`${problems.length ? 'ОШИБКА' : 'ПРОШЛО'} ${id}${problems.length ? ': ' + problems.join('; ') : ''}`);
    failed ||= Boolean(problems.length);
  }
  if (failed) process.exitCode = 1;
}
