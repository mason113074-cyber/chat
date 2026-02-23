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
  if (!raw || raw.length < 16) {
    throw new Error(
      'LINE_BOT_ENCRYPTION_KEY must be set. Accepted formats: 64-char hex, 44-char base64, or 32+ ASCII bytes.'
    );
  }

  const trimmed = raw.trim();

  if (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  if (trimmed.length === 44 && /^[A-Za-z0-9+/]+=*$/.test(trimmed)) {
    const buf = Buffer.from(trimmed, 'base64');
    if (buf.length === KEY_LENGTH) {
      return buf;
    }
  }

  const buf = Buffer.from(trimmed, 'utf8');
  if (buf.length < KEY_LENGTH) {
    throw new Error(
      `LINE_BOT_ENCRYPTION_KEY as UTF-8 is only ${buf.length} bytes, need ${KEY_LENGTH}. ` +
        'Use 64-char hex (openssl rand -hex 32) or 44-char base64 (openssl rand -base64 32).'
    );
  }
  return buf.subarray(0, KEY_LENGTH);
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
