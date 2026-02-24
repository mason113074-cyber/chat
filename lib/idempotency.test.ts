import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// No Redis env → use memory store
beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  vi.resetModules();
});

afterEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe('idempotency (memory)', () => {
  it('markAsProcessed then isProcessed returns true for same eventId and botId', async () => {
    const { isProcessed, markAsProcessed } = await import('@/lib/idempotency');

    const eventId = 'e1';
    const botId = 'b1';

    expect(await isProcessed(eventId, botId)).toBe(false);
    await markAsProcessed(eventId, botId);
    expect(await isProcessed(eventId, botId)).toBe(true);
  });

  it('different botId same eventId are independent', async () => {
    const { isProcessed, markAsProcessed } = await import('@/lib/idempotency');

    await markAsProcessed('e1', 'b1');
    expect(await isProcessed('e1', 'b1')).toBe(true);
    expect(await isProcessed('e1', 'b2')).toBe(false);
  });
});
