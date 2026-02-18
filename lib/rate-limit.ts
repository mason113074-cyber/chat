/**
 * Rate limiting (e.g. for LINE webhook) using fixed 60s window.
 * Uses Upstash Redis when configured; in-memory fallback otherwise.
 */

import { Redis } from '@upstash/redis';

const RATE_LIMIT_WINDOW = 60; // 60 秒
const MAX_REQUESTS_PER_WINDOW = 20; // 每分鐘最多 20 次
const PREFIX = 'ratelimit:line:';

const memoryCounts = new Map<string, { count: number; windowStart: number }>();

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

async function redisCheck(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const client = getRedis();
  if (!client) throw new Error('Redis not configured');
  const key = `${PREFIX}${identifier}`;
  const now = Date.now();
  const windowStart = Math.floor(now / (RATE_LIMIT_WINDOW * 1000));
  const rateLimitKey = `${key}:${windowStart}`;

  const current = await client.incr(rateLimitKey);

  if (current === 1) {
    await client.expire(rateLimitKey, RATE_LIMIT_WINDOW);
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
  if (isRedisConfigured()) {
    try {
      return await redisCheck(identifier);
    } catch (e) {
      console.error('[rate-limit] Redis failed, allowing request', e);
      return {
        allowed: true,
        remaining: MAX_REQUESTS_PER_WINDOW,
        resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW * 1000),
      };
    }
  }
  return memoryCheck(identifier);
}
