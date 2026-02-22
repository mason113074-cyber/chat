import { describe, expect, it } from 'vitest';
import { tokenizeQuery } from '@/lib/knowledge-search';

describe('tokenizeQuery', () => {
  it('produces CJK 2-grams for "我想退錢，請問流程怎麼走？" including 退錢 and 流程', () => {
    const tokens = tokenizeQuery('我想退錢，請問流程怎麼走？');
    expect(tokens).toContain('退錢');
    expect(tokens).toContain('流程');
  });

  it('produces CJK 2-grams for "請問營業時間是幾點？" including 營業 and 時間', () => {
    const tokens = tokenizeQuery('請問營業時間是幾點？');
    expect(tokens).toContain('營業');
    expect(tokens).toContain('時間');
  });

  it('preserves English tokens for "order #A123456 refund process"', () => {
    const tokens = tokenizeQuery('order #A123456 refund process');
    expect(tokens).toContain('order');
    expect(tokens).toContain('refund');
    expect(tokens).toContain('process');
  });
});
