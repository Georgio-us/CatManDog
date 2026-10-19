import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SESSION_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normalizedEmail = value => String(value || '').trim().toLowerCase();
export const validEmail = value => value.length <= 160 && emailPattern.test(value);
export const tokenDigest = value => createHash('sha256').update(value).digest('hex');

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 200) throw new Error('Пароль должен содержать от 12 до 200 символов');
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [salt, expectedHex] = String(stored || '').split(':');
  if (!salt || !expectedHex || !/^[a-f0-9]{128}$/.test(expectedHex)) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await scrypt(String(password), salt, expected.length);
  return timingSafeEqual(actual, expected);
}

export function cookieToken(req) {
  const match = String(req.headers.cookie || '').match(/(?:^|;\s*)cmd_session=([^;]+)/);
  return match?.[1] || null;
}

export async function currentCustomer(db, req) {
  const token = cookieToken(req);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { rows } = await db.query(`SELECT c.id,c.email,c.name,c.phone FROM customer_sessions s
    JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=$1 AND s.expires_at>now()`, [tokenDigest(token)]);
  return rows[0] || null;
}

export async function createSession(db, customerId) {
  const token = randomBytes(32).toString('hex');
  await db.query('INSERT INTO customer_sessions(id,customer_id,token_hash,expires_at) VALUES($1,$2,$3,$4)',
    [randomUUID(), customerId, tokenDigest(token), new Date(Date.now() + SESSION_AGE_MS)]);
  return token;
}

export function sessionCookie(token, secure) {
  return `cmd_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_AGE_MS / 1000}${secure ? '; Secure' : ''}`;
}

export function clearSessionCookie(secure) {
  return `cmd_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function isAdmin(req) {
  const expected = process.env.ADMIN_TOKEN;
  const supplied = String(req.headers.authorization || '').replace(/^Bearer /i, '');
  if (!expected || expected.length < 32 || !supplied) return false;
  const a = Buffer.from(tokenDigest(expected), 'hex');
  const b = Buffer.from(tokenDigest(supplied), 'hex');
  return timingSafeEqual(a, b);
}

export function newId() { return randomUUID(); }
