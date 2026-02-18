/**
 * Idempotency layer for LINE webhook: prevent duplicate processing of the same event.
 * Uses Vercel KV (Upstash Redis) when configured; falls back to in-memory store for local dev.
 */

const IDEMPOTENCY_TTL = 3600; // 1 hour (seconds)
const PREFIX = 'line:event:';

// In-memory fallback when KV is not configured (e.g. local dev)
const memoryStore = new Map<string, number>();

function getMemoryKey(key: string): string {
  return PREFIX + key;
}

function memoryGet(key: string): boolean {
  const fullKey = getMemoryKey(key);
  const expiresAt = memoryStore.get(fullKey);
  if (expiresAt == null) return false;
  if (Date.now() > expiresAt) {
    memoryStore.delete(fullKey);
    return false;
  }
  return true;
}

function memorySet(key: string): void {
  memoryStore.set(getMemoryKey(key), Date.now() + IDEMPOTENCY_TTL * 1000);
}

async function kvGet(key: string): Promise<boolean> {
  try {
    const { kv } = await import('@vercel/kv');
    const value = await kv.get(key);
    return value != null;
  } catch {
    return false;
  }
}

async function kvSet(key: string): Promise<void> {
  try {
    const { kv } = await import('@vercel/kv');
    await kv.set(key, '1', { ex: IDEMPOTENCY_TTL });
  } catch (e) {
    console.error('[idempotency] KV set failed:', e);
  }
}

/** Whether Vercel KV is configured (env KV_REST_API_URL + KV_REST_API_TOKEN). */
function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Returns true if this event was already processed (duplicate); false if new.
 */
export async function isProcessed(eventId: string): Promise<boolean> {
  const key = PREFIX + eventId;
  if (isKvConfigured()) {
    return kvGet(key);
  }
  return memoryGet(eventId);
}

/**
 * Mark this event as processed so future duplicates are skipped.
 */
export async function markAsProcessed(eventId: string): Promise<void> {
  const key = PREFIX + eventId;
  if (isKvConfigured()) {
    await kvSet(key);
    return;
  }
  memorySet(eventId);
}
