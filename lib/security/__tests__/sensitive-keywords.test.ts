import { describe, expect, it } from 'vitest';
import { isRefundOrMoneyRequest, isStructuredRefundOrReturnRequest } from '@/lib/security/sensitive-keywords';

describe('isRefundOrMoneyRequest', () => {
  it('returns true for 退款', () => {
    expect(isRefundOrMoneyRequest('我要退款，訂單 123')).toBe(true);
  });

  it('returns true for 退錢', () => {
    expect(isRefundOrMoneyRequest('我要退錢，商品有問題')).toBe(true);
  });

  it('returns true when no order number', () => {
    expect(isRefundOrMoneyRequest('我要退款，東西壞掉了')).toBe(true);
  });

  it('returns false for unrelated message', () => {
    expect(isRefundOrMoneyRequest('請問營業時間是幾點？')).toBe(false);
  });

  it('returns false for 退貨 (not in refund/money list)', () => {
    expect(isRefundOrMoneyRequest('我要退貨')).toBe(false);
  });
});

describe('isStructuredRefundOrReturnRequest', () => {
  it('returns true when both refund keyword and order context present', () => {
    expect(isStructuredRefundOrReturnRequest('我要退款，訂單 123')).toBe(true);
  });

  it('returns false when only refund keyword without order context', () => {
    expect(isStructuredRefundOrReturnRequest('我要退款，東西壞掉了')).toBe(false);
  });
});
