/**
 * Generic cache layer: in-memory + Vercel KV (Upstash Redis).
 * Used to reduce DB queries and API calls (e.g. user settings, knowledge base).
 */

const DEFAULT_TTL = 300; // 5 minutes (seconds)
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

export interface CacheOptions {
  ttl?: number; // seconds
  forceRefresh?: boolean;
}

/** Lazy KV access so build/local works without KV env. */
async function getKv(): Promise<typeof import('@vercel/kv').kv> {
  const { kv } = await import('@vercel/kv');
  return kv;
}

function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
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

  const memCached = getFromMemory(key);
  if (memCached !== null) {
    return memCached as T;
  }

  try {
    if (isKvConfigured()) {
      const kv = await getKv();
      const cached = await kv.get<T>(key);
      if (cached !== null && cached !== undefined) {
        setToMemory(key, cached, ttl);
        return cached;
      }
    }
  } catch (error) {
    console.warn(`[Cache] KV get failed for ${key}:`, error);
  }

  const value = await fetcher();
  await setCached(key, value, ttl);
  return value;
}

/**
 * Set cache entry (memory + KV).
 */
export async function setCached(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  setToMemory(key, value, ttl);

  try {
    if (isKvConfigured()) {
      const kv = await getKv();
      await kv.set(key, value, { ex: ttl });
    }
  } catch (error) {
    console.warn(`[Cache] KV set failed for ${key}:`, error);
  }
}

/**
 * Delete a single cache key.
 */
export async function deleteCached(key: string): Promise<void> {
  memoryCache.delete(key);

  try {
    if (isKvConfigured()) {
      const kv = await getKv();
      await kv.del(key);
    }
  } catch (error) {
    console.warn(`[Cache] KV delete failed for ${key}:`, error);
  }
}

/**
 * Delete all keys matching pattern (Redis glob, e.g. "user:*").
 * Memory cache: keys matched by glob-style regex.
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
  try {
    if (isKvConfigured()) {
      const kv = await getKv();
      const keys = await kv.keys(pattern);
      if (keys.length > 0) {
        await kv.del(...keys);
      }
    }
  } catch (error) {
    console.warn(`[Cache] KV delete pattern failed for ${pattern}:`, error);
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

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryCache, 5 * 60 * 1000);
}
