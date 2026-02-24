import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Redis so incr throws → forces fallback to memory; then we assert memory limit is enforced
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    incr: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
    expire: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('checkRateLimit', () => {
  const MAX_PER_WINDOW = 20;
  const identifier = 'test-rate-limit-fail-open';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'fake-token';
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('when Redis is configured but fails, falls back to memory and enforces limit (no fail-open)', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');

    const results: { allowed: boolean }[] = [];
    for (let i = 0; i < MAX_PER_WINDOW + 5; i++) {
      const r = await checkRateLimit(identifier);
      results.push({ allowed: r.allowed });
    }

    expect(results[MAX_PER_WINDOW - 1].allowed).toBe(true);
    expect(results[MAX_PER_WINDOW].allowed).toBe(false);
    expect(results[MAX_PER_WINDOW + 4].allowed).toBe(false);
  });
});
