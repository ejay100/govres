/**
 * GOVRES — Security & Encryption Module
 * Field-level encryption, key management, HSM integration interfaces
 *
 * Regulatory context:
 *  - Ghana Data Protection Act, 2012 (Act 843)
 *  - Bank of Ghana Cyber & Information Security Directive
 *  - Payment Systems & Services Act, 2019 (Act 987) — data protection provisions
 */

import crypto from 'crypto';

/* Encryption algorithm per BoG Cyber Directive requirements */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100_000;

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  tag: string; // base64
  salt: string; // base64
  version: number;
}

export interface KeyEnvelope {
  keyId: string;
  encryptedKey: string; // base64 — encrypted with master key
  algorithm: string;
  createdAt: string;
  expiresAt: string;
  purpose: 'data' | 'attestation' | 'signing' | 'transport';
}

/**
 * Derive an AES-256 key from a passphrase using PBKDF2
 */
export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt sensitive data (PII, biometric hashes, account secrets)
 * Uses AES-256-GCM with random IV and salt
 */
export function encryptField(plaintext: string, masterKey: string): EncryptedPayload {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(masterKey, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const tag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    salt: salt.toString('base64'),
    version: 1,
  };
}

/**
 * Decrypt a field encrypted with encryptField
 */
export function decryptField(payload: EncryptedPayload, masterKey: string): string {
  const salt = Buffer.from(payload.salt, 'base64');
  const key = deriveKey(masterKey, salt);
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let plaintext = decipher.update(payload.ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');
  return plaintext;
}

/**
 * Generate a cryptographic key pair for oracle attestation signing
 * Uses RSA-PSS per GOVRES whitepaper specification
 */
export function generateSigningKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

/**
 * Sign data with RSA-PSS (for oracle attestations)
 */
export function signData(data: string, privateKeyPem: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  return sign.sign(
    { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
    'base64'
  );
}

/**
 * Verify an RSA-PSS signature
 */
export function verifySignature(data: string, signature: string, publicKeyPem: string): boolean {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  return verify.verify(
    { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
    signature,
    'base64'
  );
}

/**
 * Hash PII for pseudonymization (GDPR-style, Act 843 compliant)
 * Uses HMAC-SHA256 so it's deterministic but not reversible without the key
 */
export function pseudonymize(pii: string, hmacKey: string): string {
  return crypto.createHmac('sha256', hmacKey).update(pii).digest('hex');
}

/**
 * Generate a secure random token (for API keys, session tokens)
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Key rotation envelope — wraps a data key with a master key
 */
export function wrapKey(dataKey: Buffer, masterKey: string): KeyEnvelope {
  const keyId = crypto.randomUUID();
  const encrypted = encryptField(dataKey.toString('base64'), masterKey);

  return {
    keyId,
    encryptedKey: JSON.stringify(encrypted),
    algorithm: ALGORITHM,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90-day rotation
    purpose: 'data',
  };
}

/**
 * Unwrap a data key from its envelope
 */
export function unwrapKey(envelope: KeyEnvelope, masterKey: string): Buffer {
  const encrypted: EncryptedPayload = JSON.parse(envelope.encryptedKey);
  const keyBase64 = decryptField(encrypted, masterKey);
  return Buffer.from(keyBase64, 'base64');
}
