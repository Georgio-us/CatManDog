import test from 'node:test';
import assert from 'node:assert/strict';
import { googleClientId, verifyGoogleCredential, googleOwnsEmail,
  ownerGoogleEmailAlias } from '../server/google-auth.js';

test('Google credential is checked against the configured audience and verified email', async () => {
  const previous = process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_ID = '123456-example.apps.googleusercontent.com';
  try {
    assert.equal(googleClientId(), process.env.GOOGLE_CLIENT_ID);
    const credential = 'x'.repeat(150);
    const identity = await verifyGoogleCredential(credential, async options => {
      assert.deepEqual(options, { idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      return { getPayload: () => ({ sub: 'google-user-123', email: '  Pet@Example.COM ',
        email_verified: true, name: 'Марго' }) };
    });
    assert.deepEqual(identity, { sub: 'google-user-123', email: 'pet@example.com', name: 'Марго', hostedDomain: '' });
    await assert.rejects(verifyGoogleCredential(credential, async () => ({ getPayload: () => ({
      sub: 'google-user-123', email: 'pet@example.com', email_verified: false
    }) })), /не подтвердил email/);
    await assert.rejects(verifyGoogleCredential('short', async () => { throw new Error('not called'); }),
      /недействителен/);
  } finally {
    if (previous === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = previous;
  }
});

test('automatic linking is limited to Google-hosted addresses', () => {
  assert.equal(googleOwnsEmail({ email: 'person@gmail.com', hostedDomain: '' }), true);
  assert.equal(googleOwnsEmail({ email: 'person@company.es', hostedDomain: 'company.es' }), true);
  assert.equal(googleOwnsEmail({ email: 'person@example.com', hostedDomain: '' }), false);
  assert.equal(googleOwnsEmail({ email: 'person@other.es', hostedDomain: 'company.es' }), false);
});

test('shop email alias preserves the existing Google owner identity', () => {
  const owner = { google_sub: 'owner-google-id', email: 'owner@example.test',
    role: 'owner', active: true };
  assert.equal(ownerGoogleEmailAlias({ sub: owner.google_sub,
    email: 'info@catmandog.es' }, owner), true);
  assert.equal(ownerGoogleEmailAlias({ sub: 'other-google-id',
    email: 'info@catmandog.es' }, owner), false);
  assert.equal(ownerGoogleEmailAlias({ sub: owner.google_sub,
    email: 'other@catmandog.es' }, owner), false);
  assert.equal(ownerGoogleEmailAlias({ sub: owner.google_sub,
    email: 'info@catmandog.es' }, { ...owner, role: 'support' }), false);
  assert.equal(ownerGoogleEmailAlias({ sub: owner.google_sub,
    email: 'info@catmandog.es' }, { ...owner, active: false }), false);
});
