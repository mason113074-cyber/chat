import { describe, expect, it } from 'vitest';
import { decideReplyAction } from '@/lib/ai/reply-decision';
import type { SensitiveKeywordDetectionResult } from '@/lib/security/sensitive-keywords';

const lowRisk: SensitiveKeywordDetectionResult = {
  hasKeyword: false,
  keywords: [],
  riskLevel: 'low',
};

const highRisk: SensitiveKeywordDetectionResult = {
  hasKeyword: true,
  keywords: ['退款'],
  riskLevel: 'high',
};

describe('decideReplyAction', () => {
  it('never AUTO for high-risk categories', () => {
    const result = decideReplyAction({
      userMessage: '我要退款，商品有問題',
      userId: 'u1',
      contactId: 'c1',
      sourcesCount: 5,
      riskDetection: highRisk,
      settings: { confidence_threshold: 0.2 },
      candidateDraft: '我們會協助您退款。',
    });

    expect(result.action).not.toBe('AUTO');
    expect(['SUGGEST', 'ASK', 'HANDOFF']).toContain(result.action);
  });

  it('returns ASK or HANDOFF when no sources and not simple', () => {
    const result = decideReplyAction({
      userMessage: '請問你們有提供海外寄送嗎？',
      userId: 'u1',
      contactId: 'c1',
      sourcesCount: 0,
      riskDetection: lowRisk,
      settings: { confidence_threshold: 0.6 },
    });

    expect(['ASK', 'HANDOFF']).toContain(result.action);
  });

  it('allows AUTO only in low-risk with source hits and enough confidence', () => {
    const result = decideReplyAction({
      userMessage: '請問門市營業時間是幾點？',
      userId: 'u1',
      contactId: 'c1',
      sourcesCount: 3,
      riskDetection: lowRisk,
      settings: { confidence_threshold: 0.6 },
      candidateDraft: '我們營業時間為每日 09:00-18:00。',
    });

    expect(result.action).toBe('AUTO');
  });

  it('downgrades to SUGGEST or ASK when confidence below threshold', () => {
    const result = decideReplyAction({
      userMessage: '請問你們可以客製化嗎？',
      userId: 'u1',
      contactId: 'c1',
      sourcesCount: 1,
      riskDetection: lowRisk,
      settings: { confidence_threshold: 0.95 },
      candidateDraft: '可以提供客製化服務。',
    });

    expect(['SUGGEST', 'ASK']).toContain(result.action);
  });

  it('asks for order number first in refund template', () => {
    const result = decideReplyAction({
      userMessage: '我要退款，東西壞掉了',
      userId: 'u1',
      contactId: 'c1',
      sourcesCount: 2,
      riskDetection: highRisk,
      settings: { confidence_threshold: 0.6 },
      candidateDraft: '我們先確認您的退款需求。',
    });

    expect(result.action).toBe('ASK');
    expect(result.askText).toContain('訂單編號');
  });

  it('refund with order number → SUGGEST with safe template (not AUTO, not HANDOFF)', () => {
    const result = decideReplyAction({
      userMessage: '我要退款，訂單 123',
      userId: 'u1',
      contactId: 'c1',
      sourcesCount: 0,
      riskDetection: lowRisk,
      settings: { confidence_threshold: 0.6 },
    });

    expect(result.action).toBe('SUGGEST');
    expect(result.category).toBe('refund');
    // 安全草稿不得包含承諾、金額或時間
    expect(result.draftText).not.toMatch(/保證|一定|絕對/);
    expect(result.draftText).not.toMatch(/\d+\s*(天|小時|工作日)/);
  });

  it('refund with order number → SUGGEST also when riskDetection is high', () => {
    const result = decideReplyAction({
      userMessage: '我要退錢，訂單 456',
      userId: 'u1',
      contactId: 'c1',
      sourcesCount: 0,
      riskDetection: highRisk,
      settings: { confidence_threshold: 0.6 },
    });

    expect(result.action).toBe('SUGGEST');
    expect(result.category).toBe('refund');
  });

  it('refund without order number → ASK even with low riskDetection', () => {
    const result = decideReplyAction({
      userMessage: '我要退款，商品壞了',
      userId: 'u1',
      contactId: 'c1',
      sourcesCount: 0,
      riskDetection: lowRisk,
      settings: { confidence_threshold: 0.6 },
    });

    expect(result.action).toBe('ASK');
    expect(result.askText).toContain('訂單編號');
  });

  it('refund with 2-char number (too short) is treated as no order number → ASK', () => {
    const result = decideReplyAction({
      userMessage: '我要退款，訂單 12',
      userId: 'u1',
      contactId: 'c1',
      sourcesCount: 0,
      riskDetection: lowRisk,
      settings: { confidence_threshold: 0.6 },
    });

    // "訂單 12" has only 2 chars after prefix → does not match ORDER_NUMBER_PATTERN → ASK
    expect(result.action).toBe('ASK');
    expect(result.askText).toContain('訂單編號');
  });
});
