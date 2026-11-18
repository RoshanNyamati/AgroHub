import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  normalizePhone,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from './auth.ts';

test('normalizePhone normalizes 10-digit Indian numbers and spaced numbers', () => {
  assert.equal(normalizePhone('9845012084'), '+919845012084');
  assert.equal(normalizePhone('+91 98450 12084'), '+919845012084');
  assert.equal(normalizePhone('91-98801-88201'), '+919880188201');
});

test('hashPassword and verifyPassword validate matching passwords and reject wrong ones', () => {
  const hash = hashPassword('farmer123');
  assert.ok(hash.includes(':'));
  assert.equal(verifyPassword('farmer123', hash), true);
  assert.equal(verifyPassword('wrongpass', hash), false);
});

test('signSessionToken and verifySessionToken round-trip AuthUser and reject tampering', () => {
  const user = {
    id: 'usr_farmer_1',
    fullName: 'Amina Patel',
    phone: '+919845012084',
    email: null,
    role: 'FARMER' as const,
    villageName: 'Willow Creek',
    authProvider: 'phone' as const,
  };
  const token = signSessionToken(user);
  const decoded = verifySessionToken(token);
  assert.deepEqual(decoded, user);

  const tampered = token.slice(0, -4) + 'abcd';
  assert.equal(verifySessionToken(tampered), null);
});
