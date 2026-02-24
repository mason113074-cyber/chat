/**
 * B1: Envelope encryption for bot secrets/tokens.
 * AES-256-GCM with random iv/nonce + auth tag.
 * Master key from env: ENCRYPTION_MASTER_KEY.
 * Supports encryption_version for future key rotation.
 */

import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const DEFAULT_VERSION = 1;

function getMasterKey(version: number): Buffer {
  const raw = process.env.ENCRYPTION_MASTER_KEY;
  if (!raw || raw.length < 32) {
    throw new Error('ENCRYPTION_MASTER_KEY must be set and at least 32 chars (or 64-char hex)');
  }
  if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return Buffer.from(raw.slice(0, KEY_LENGTH), 'utf8');
}

/**
 * Encrypt plaintext. Returns base64 string: iv(12) + tag(16) + ciphertext.
 * Version is stored in DB separately (encryption_version column).
 */
export function encrypt(plaintext: string, version: number = DEFAULT_VERSION): string {
  const key = getMasterKey(version);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, enc]);
  return combined.toString('base64');
}

/**
 * Decrypt payload. Use same version as stored in encryption_version.
 */
export function decrypt(encoded: string, version: number = DEFAULT_VERSION): string {
  const key = getMasterKey(version);
  const combined = Buffer.from(encoded, 'base64');
  if (combined.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid encrypted payload');
  }
  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

export const ENVELOPE_DEFAULT_VERSION = DEFAULT_VERSION;
