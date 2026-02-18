/**
 * Generic cache layer: in-memory + Upstash Redis.
 * Used to reduce DB queries and API calls (e.g. user settings, knowledge base).
 */

import { Redis } from '@upstash/redis';

const DEFAULT_TTL = 300; // 5 minutes (seconds)
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

export interface CacheOptions {
  ttl?: number; // seconds
  forceRefresh?: boolean;
}

/** Lazy Redis initialization - only when env vars exist */
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

/**
 * Get value from cache; on miss run fetcher, store and return.
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL, forceRefresh = false } = options;

  if (forceRefresh) {
    const value = await fetcher();
    await setCached(key, value, ttl);
    return value;
  }

  // 1. Check memory cache first
  const memCached = getFromMemory(key);
  if (memCached !== null) {
    return memCached as T;
  }

  // 2. Check Redis (Upstash may auto-deserialize JSON; string primitives come back as "hello" not '"hello"')
  try {
    const redisClient = getRedis();
    if (redisClient) {
      const raw = await redisClient.get(key);
      if (raw !== null && raw !== undefined) {
        try {
          let cached: T;
          if (typeof raw === 'string') {
            try {
              cached = JSON.parse(raw) as T;
            } catch {
              cached = raw as T; // already deserialized by Upstash (e.g. string primitive)
            }
          } else {
            cached = raw as T;
          }
          setToMemory(key, cached, ttl);
          return cached;
        } catch {
          // unexpected format, treat as miss
        }
      }
    }
  } catch (error) {
    console.warn(`[Cache] Redis get failed for ${key}:`, error);
  }

  // 3. Cache miss - fetch and store
  const value = await fetcher();
  await setCached(key, value, ttl);
  return value;
}

/**
 * Set cache entry (memory + Redis).
 */
export async function setCached(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  setToMemory(key, value, ttl);

  try {
    const redisClient = getRedis();
    if (redisClient) {
      await redisClient.set(key, JSON.stringify(value), { ex: ttl });
    }
  } catch (error) {
    console.warn(`[Cache] Redis set failed for ${key}:`, error);
  }
}

/**
 * Delete a single cache key.
 */
export async function deleteCached(key: string): Promise<void> {
  memoryCache.delete(key);

  try {
    const redisClient = getRedis();
    if (redisClient) {
      await redisClient.del(key);
    }
  } catch (error) {
    console.warn(`[Cache] Redis delete failed for ${key}:`, error);
  }
}

/**
 * Delete all keys matching pattern (Redis glob, e.g. "user:*").
 * Memory cache: keys matched by glob-style regex.
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
  try {
    const redisClient = getRedis();
    if (redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
  } catch (error) {
    console.warn(`[Cache] Redis delete pattern failed for ${pattern}:`, error);
  }

  const regex = new RegExp(
    '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
  );
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
}

// Memory cache helpers
function getFromMemory(key: string): unknown | null {
  const cached = memoryCache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return cached.value;
}

function setToMemory(key: string, value: unknown, ttl: number): void {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttl * 1000,
  });
}

/**
 * Remove expired entries from in-memory cache (call periodically).
 */
export function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, cache] of memoryCache.entries()) {
    if (now > cache.expiresAt) {
      memoryCache.delete(key);
    }
  }
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryCache, 5 * 60 * 1000);
}