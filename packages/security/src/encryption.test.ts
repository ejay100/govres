/**
 * GOVRES — Encryption Module Tests
 * Tests for AES-256-GCM, RSA-PSS signing, pseudonymization, key wrapping
 */

import { describe, it, expect } from 'vitest';
import {
  encryptField,
  decryptField,
  deriveKey,
  generateSigningKeyPair,
  signData,
  verifySignature,
  pseudonymize,
  generateSecureToken,
  wrapKey,
  unwrapKey,
} from './encryption';
import crypto from 'crypto';

const MASTER_KEY = 'test-master-key-govres-2025';

// ─── deriveKey ──────────────────────────────────────────

describe('deriveKey', () => {
  it('returns a 32-byte Buffer', () => {
    const salt = crypto.randomBytes(32);
    const key = deriveKey('passphrase', salt);
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it('is deterministic for same passphrase and salt', () => {
    const salt = Buffer.from('fixed-salt-value-for-testing!!!!');
    const a = deriveKey('pass', salt);
    const b = deriveKey('pass', salt);
    expect(a.equals(b)).toBe(true);
  });

  it('differs for different passphrases', () => {
    const salt = crypto.randomBytes(32);
    const a = deriveKey('pass1', salt);
    const b = deriveKey('pass2', salt);
    expect(a.equals(b)).toBe(false);
  });
});

// ─── encryptField / decryptField ────────────────────────

describe('encryptField / decryptField', () => {
  it('round-trips plaintext', () => {
    const plaintext = 'Kwame Asante — GhanaCard GHA-123456789';
    const encrypted = encryptField(plaintext, MASTER_KEY);
    const decrypted = decryptField(encrypted, MASTER_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it('returns correct payload structure', () => {
    const encrypted = encryptField('test', MASTER_KEY);
    expect(encrypted).toHaveProperty('ciphertext');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('tag');
    expect(encrypted).toHaveProperty('salt');
    expect(encrypted.version).toBe(1);
  });

  it('produces different ciphertext on each call (random IV/salt)', () => {
    const a = encryptField('same', MASTER_KEY);
    const b = encryptField('same', MASTER_KEY);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('fails decryption with wrong key', () => {
    const encrypted = encryptField('secret', MASTER_KEY);
    expect(() => decryptField(encrypted, 'wrong-key')).toThrow();
  });

  it('handles empty string', () => {
    const encrypted = encryptField('', MASTER_KEY);
    expect(decryptField(encrypted, MASTER_KEY)).toBe('');
  });

  it('handles Unicode', () => {
    const unicode = '₵ GH₵ 日本語 🇬🇭';
    const encrypted = encryptField(unicode, MASTER_KEY);
    expect(decryptField(encrypted, MASTER_KEY)).toBe(unicode);
  });
});

// ─── RSA-PSS Signing ───────────────────────────────────

describe('signData / verifySignature', () => {
  it('generates a valid key pair', () => {
    const { publicKey, privateKey } = generateSigningKeyPair();
    expect(publicKey).toContain('BEGIN PUBLIC KEY');
    expect(privateKey).toContain('BEGIN PRIVATE KEY');
  });

  it('round-trips sign → verify', () => {
    const { publicKey, privateKey } = generateSigningKeyPair();
    const data = 'GBDC-MINT-1000000-2025-06-01';
    const sig = signData(data, privateKey);
    expect(verifySignature(data, sig, publicKey)).toBe(true);
  });

  it('fails verification with tampered data', () => {
    const { publicKey, privateKey } = generateSigningKeyPair();
    const sig = signData('original', privateKey);
    expect(verifySignature('tampered', sig, publicKey)).toBe(false);
  });

  it('fails verification with wrong public key', () => {
    const kp1 = generateSigningKeyPair();
    const kp2 = generateSigningKeyPair();
    const sig = signData('data', kp1.privateKey);
    expect(verifySignature('data', sig, kp2.publicKey)).toBe(false);
  });
});

// ─── pseudonymize ───────────────────────────────────────

describe('pseudonymize', () => {
  it('returns a 64-character hex string', () => {
    const hash = pseudonymize('GHA-123456789', 'hmac-secret');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic', () => {
    const a = pseudonymize('data', 'key');
    const b = pseudonymize('data', 'key');
    expect(a).toBe(b);
  });

  it('changes with different HMAC key', () => {
    const a = pseudonymize('data', 'key1');
    const b = pseudonymize('data', 'key2');
    expect(a).not.toBe(b);
  });
});

// ─── generateSecureToken ────────────────────────────────

describe('generateSecureToken', () => {
  it('returns a 64-character hex string by default (32 bytes)', () => {
    const token = generateSecureToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('respects custom byte count', () => {
    const token = generateSecureToken(16);
    expect(token).toMatch(/^[a-f0-9]{32}$/);
  });

  it('generates unique tokens', () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).not.toBe(b);
  });
});

// ─── wrapKey / unwrapKey ────────────────────────────────

describe('wrapKey / unwrapKey', () => {
  it('round-trips a data key', () => {
    const dataKey = crypto.randomBytes(32);
    const envelope = wrapKey(dataKey, MASTER_KEY);
    const recovered = unwrapKey(envelope, MASTER_KEY);
    expect(recovered.equals(dataKey)).toBe(true);
  });

  it('envelope has correct structure', () => {
    const envelope = wrapKey(crypto.randomBytes(32), MASTER_KEY);
    expect(envelope).toHaveProperty('keyId');
    expect(envelope).toHaveProperty('encryptedKey');
    expect(envelope.algorithm).toBe('aes-256-gcm');
    expect(envelope.purpose).toBe('data');
    expect(new Date(envelope.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('fails with wrong master key', () => {
    const envelope = wrapKey(crypto.randomBytes(32), MASTER_KEY);
    expect(() => unwrapKey(envelope, 'wrong-key')).toThrow();
  });
});
