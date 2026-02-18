/**
 * Rate limiting (e.g. for LINE webhook) using fixed 60s window.
 * Uses Vercel KV when configured; in-memory fallback otherwise.
 */

const RATE_LIMIT_WINDOW = 60; // 60 秒
const MAX_REQUESTS_PER_WINDOW = 20; // 每分鐘最多 20 次
const PREFIX = 'ratelimit:line:';

const memoryCounts = new Map<string, { count: number; windowStart: number }>();

function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvCheck(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const { kv } = await import('@vercel/kv');
  const key = `${PREFIX}${identifier}`;
  const now = Date.now();
  const windowStart = Math.floor(now / (RATE_LIMIT_WINDOW * 1000));
  const rateLimitKey = `${key}:${windowStart}`;

  const current = await kv.incr(rateLimitKey);

  if (current === 1) {
    await kv.expire(rateLimitKey, RATE_LIMIT_WINDOW);
  }

  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - current);
  const resetAt = new Date((windowStart + 1) * RATE_LIMIT_WINDOW * 1000);

  return {
    allowed: current <= MAX_REQUESTS_PER_WINDOW,
    remaining,
    resetAt,
  };
}

function memoryCheck(identifier: string): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = Date.now();
  const windowStart = Math.floor(now / (RATE_LIMIT_WINDOW * 1000));
  const key = `${PREFIX}${identifier}:${windowStart}`;
  const entry = memoryCounts.get(key);
  const count = entry ? entry.count + 1 : 1;
  if (!entry) memoryCounts.set(key, { count, windowStart });
  else entry.count = count;

  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - count);
  const resetAt = new Date((windowStart + 1) * RATE_LIMIT_WINDOW * 1000);

  return {
    allowed: count <= MAX_REQUESTS_PER_WINDOW,
    remaining,
    resetAt,
  };
}

export async function checkRateLimit(identifier: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  if (isKvConfigured()) {
    try {
      return await kvCheck(identifier);
    } catch (e) {
      console.error('[rate-limit] KV failed, allowing request', e);
      return {
        allowed: true,
        remaining: MAX_REQUESTS_PER_WINDOW,
        resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW * 1000),
      };
    }
  }
  return memoryCheck(identifier);
}
