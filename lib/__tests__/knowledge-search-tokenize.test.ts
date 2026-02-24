import { describe, expect, it } from 'vitest';
import { tokenizeQuery } from '@/lib/knowledge-search';

describe('tokenizeQuery', () => {
  it('produces CJK 2-grams and synonym 退款 for "我想退錢，請問流程怎麼走？"', () => {
    const tokens = tokenizeQuery('我想退錢，請問流程怎麼走？');
    expect(tokens).toContain('退款');
    expect(tokens).toContain('流程');
  });

  it('produces CJK 2-grams for "請問營業時間是幾點？" including 營業 and 時間', () => {
    const tokens = tokenizeQuery('請問營業時間是幾點？');
    expect(tokens).toContain('營業');
    expect(tokens).toContain('時間');
  });

  it('preserves English tokens for "refund policy and order A123456"', () => {
    const tokens = tokenizeQuery('refund policy and order A123456');
    expect(tokens).toContain('refund');
    expect(tokens).toContain('policy');
    expect(tokens).toContain('order');
    expect(tokens).toContain('A123456');
  });
});
