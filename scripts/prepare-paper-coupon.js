import { createDatabase } from '../server/db.js';
import { PAPER_COUPON_CODE, PAPER_COUPON_URL, PAPER_COUPON_MAX_USES,
  PAPER_COUPON_DURATION_DAYS } from '../server/paper-campaign.js';

const expiresAt = process.argv[2]
  ? new Date(process.argv[2])
  : new Date(Date.now() + PAPER_COUPON_DURATION_DAYS * 24 * 60 * 60 * 1000);
if (process.argv.length > 3 || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
  console.error('Usage: node scripts/prepare-paper-coupon.js [2027-02-01T23:59:00Z]');
  process.exitCode = 1;
} else {
  const db = createDatabase();
  if (!db) {
    console.error('DATABASE_URL is required');
    process.exitCode = 1;
  } else {
    try {
      const { rows } = await db.query(`INSERT INTO promo_codes
        (code,kind,percent_off,free_delivery,active,max_uses,used_count,expires_at)
        VALUES($1,'paper_shared',10,false,true,$2,0,$3)
        ON CONFLICT(code) DO NOTHING RETURNING code,max_uses,expires_at`,
      [PAPER_COUPON_CODE, PAPER_COUPON_MAX_USES, expiresAt]);
      if (!rows.length) throw new Error('This code already exists; no coupon was changed');
      console.info(`Paper coupon ${rows[0].code} is ready: ${rows[0].max_uses} paid uses, expires ${rows[0].expires_at.toISOString()}`);
      console.info(`QR URL: ${PAPER_COUPON_URL}`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    } finally { await db.end(); }
  }
}
