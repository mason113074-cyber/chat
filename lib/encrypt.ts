/**
 * AES-256-GCM encryption helper for bot secrets/tokens.
 * Key from env: LINE_BOT_ENCRYPTION_KEY (32 bytes hex or base64).
 * Do not store plaintext channel_secret or channel_access_token in DB.
 */

import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const raw = process.env.LINE_BOT_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error('LINE_BOT_ENCRYPTION_KEY must be set and at least 32 chars (or 64-char hex)');
  }
  if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return Buffer.from(raw.slice(0, KEY_LENGTH), 'utf8');
}

/**
 * Encrypt plaintext; returns "iv:tag:ciphertext" as base64 (iv 12 bytes, tag 16 bytes).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, enc]);
  return combined.toString('base64');
}

/**
 * Decrypt payload from encrypt().
 */
export function decrypt(encoded: string): string {
  const key = getEncryptionKey();
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

/**
 * Hash webhook key for storage (SHA-256 hex). Used to look up bot by URL webhookKey.
 */
export function hashWebhookKey(webhookKey: string): string {
  return crypto.createHash('sha256').update(webhookKey, 'utf8').digest('hex');
}
