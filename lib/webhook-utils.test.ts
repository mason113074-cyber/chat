import { describe, expect, it } from 'vitest';
import { buildRateLimitIdentifier } from '@/lib/webhook-utils';

describe('buildRateLimitIdentifier', () => {
  it('returns bot:botId:lineUserId when botId is provided', () => {
    expect(
      buildRateLimitIdentifier({ botId: 'b1', ownerUserId: 'u1', lineUserId: 'L123' })
    ).toBe('bot:b1:L123');
    expect(
      buildRateLimitIdentifier({ botId: 'b2', lineUserId: 'L456' })
    ).toBe('bot:b2:L456');
  });

  it('returns user:ownerUserId:lineUserId when no botId but ownerUserId', () => {
    expect(
      buildRateLimitIdentifier({ ownerUserId: 'u1', lineUserId: 'L123' })
    ).toBe('user:u1:L123');
  });

  it('returns line:lineUserId when neither botId nor ownerUserId', () => {
    expect(
      buildRateLimitIdentifier({ lineUserId: 'L999' })
    ).toBe('line:L999');
  });
});
