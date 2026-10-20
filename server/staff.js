import { randomBytes, randomUUID } from 'node:crypto';
import { tokenDigest } from './auth.js';

const SESSION_AGE_MS = 8 * 60 * 60 * 1000;
const cookieName = 'cmd_staff_session';

export function staffToken(req) {
  const match = String(req.headers.cookie || '').match(/(?:^|;\s*)cmd_staff_session=([a-f0-9]{64})(?:;|$)/);
  return match?.[1] || null;
}

export function staffCookie(token, secure) {
  return `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${SESSION_AGE_MS / 1000}${secure ? '; Secure' : ''}`;
}

export function clearStaffCookie(secure) {
  return `${cookieName}=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0${secure ? '; Secure' : ''}`;
}

export async function currentStaff(db, req) {
  const token = staffToken(req);
  if (!token) return null;
  const { rows } = await db.query(`SELECT a.id,a.email,a.name,a.role FROM staff_sessions s
    JOIN staff_accounts a ON a.id=s.staff_id
    WHERE s.token_hash=$1 AND s.expires_at>now() AND a.active=true`, [tokenDigest(token)]);
  return rows[0] || null;
}

export async function createStaffSession(db, staffId) {
  const token = randomBytes(32).toString('hex');
  await db.query(`INSERT INTO staff_sessions(id,staff_id,token_hash,expires_at)
    VALUES($1,$2,$3,$4)`, [randomUUID(), staffId, tokenDigest(token), new Date(Date.now() + SESSION_AGE_MS)]);
  return token;
}

export async function revokeStaffSession(db, req) {
  const token = staffToken(req);
  if (token) await db.query('DELETE FROM staff_sessions WHERE token_hash=$1', [tokenDigest(token)]);
}

export async function bootstrapOwner(db, identity) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1043321)');
    const existing = await client.query("SELECT id FROM staff_accounts WHERE role='owner' LIMIT 1");
    if (existing.rows.length) throw Object.assign(new Error('Владелец уже назначен'), { status: 409 });
    const id = randomUUID();
    await client.query(`INSERT INTO staff_accounts(id,google_sub,email,name,role)
      VALUES($1,$2,$3,$4,'owner')`, [id, identity.sub, identity.email, identity.name]);
    await client.query('COMMIT');
    return { id, email: identity.email, name: identity.name, role: 'owner' };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
