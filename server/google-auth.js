import { OAuth2Client } from 'google-auth-library';
import { normalizedEmail, validEmail } from './auth.js';

const verifier = new OAuth2Client();
const clientIdPattern = /^[0-9]+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/;

export function googleClientId() {
  const id = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  return clientIdPattern.test(id) ? id : null;
}

export async function verifyGoogleCredential(credential, verify = options => verifier.verifyIdToken(options)) {
  const audience = googleClientId();
  if (!audience) throw new Error('Google-вход не настроен');
  if (typeof credential !== 'string' || credential.length < 100 || credential.length > 10000)
    throw new Error('Токен Google недействителен');
  const ticket = await verify({ idToken: credential, audience });
  const payload = ticket.getPayload();
  const email = normalizedEmail(payload?.email);
  if (!payload?.sub || typeof payload.sub !== 'string' || payload.sub.length > 255 ||
      !validEmail(email) || payload.email_verified !== true)
    throw new Error('Google не подтвердил email');
  return { sub: payload.sub, email, name: String(payload.name || '').trim().slice(0, 100),
    hostedDomain: String(payload.hd || '').trim().toLowerCase() };
}

export function googleOwnsEmail(identity) {
  return identity.email.endsWith('@gmail.com') ||
    Boolean(identity.hostedDomain && identity.email.endsWith(`@${identity.hostedDomain}`));
}
