/**
 * Idempotency layer for LINE webhook: prevent duplicate processing of the same event.
 * Uses Upstash Redis when configured; falls back to in-memory store for local dev.
 */

import { Redis } from '@upstash/redis';

const IDEMPOTENCY_TTL = 3600; // 1 hour (seconds)
const PREFIX = 'line:event:';

const memoryStore = new Map<string, number>();

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis !== null) return redis;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

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

async function redisGet(key: string): Promise<boolean> {
  try {
    const client = getRedis();
    if (!client) return false;
    const value = await client.get(key);
    return value != null;
  } catch {
    return false;
  }
}

async function redisSet(key: string): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.set(key, '1', { ex: IDEMPOTENCY_TTL });
  } catch (e) {
    console.error('[idempotency] Redis set failed:', e);
  }
}

/**
 * Returns true if this event was already processed (duplicate); false if new.
 */
export async function isProcessed(eventId: string): Promise<boolean> {
  const key = PREFIX + eventId;
  if (isRedisConfigured()) {
    return redisGet(key);
  }
  return memoryGet(eventId);
}

/**
 * Mark this event as processed so future duplicates are skipped.
 */
export async function markAsProcessed(eventId: string): Promise<void> {
  const key = PREFIX + eventId;
  if (isRedisConfigured()) {
    await redisSet(key);
    return;
  }
  memorySet(eventId);
}
