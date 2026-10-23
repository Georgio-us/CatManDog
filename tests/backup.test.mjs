import test from 'node:test';
import assert from 'node:assert/strict';
import { backupConfiguration, backupDue } from '../server/backup.js';

test('backup scheduler skips less than seven days and retries after seven days', () => {
  const last = [{ LastModified: new Date('2026-10-16T12:00:00Z') }];
  assert.equal(backupDue([], new Date('2026-10-17T12:00:00Z')), true);
  assert.equal(backupDue(last, new Date('2026-10-23T11:59:59Z')), false);
  assert.equal(backupDue(last, new Date('2026-10-23T12:00:00Z')), true);
});

test('backup stays disabled until its private bucket and credentials are configured', () => {
  assert.equal(backupConfiguration({ BACKUP_ENABLED: 'false' }), null);
  assert.throws(() => backupConfiguration({ BACKUP_ENABLED: 'true' }), /Backup variables missing/);
});
