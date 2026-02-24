export type Overview = {
  thisMonth: {
    totalConversations: number;
    aiReplies: number;
    newContacts: number;
    avgReplySeconds: number | null;
  };
  lastMonth: { totalConversations: number; aiReplies: number; newContacts: number };
  change: {
    totalConversations: number;
    aiReplies: number;
    newContacts: number;
    avgReplySeconds: number | null;
  };
};

export type TrendPoint = { date: string; count: number };
export type HourlyPoint = { hour: number; count: number };
export type TopQuestion = { keyword: string; count: number; percentage: number };
export type TopContact = { contactId: string; name: string | null; lineUserId: string; count: number; lastAt: string | null };
export type Quality = { avgReplyLength: number | null; aiModel: string | null };

export type AiQuality = {
  totalConversations: number;
  aiHandledCount: number;
  humanHandoffCount: number;
  aiHandledRate: number;
  avgConfidenceScore: number;
  confidenceDistribution: { range: string; count: number }[];
  feedbackStats: { positive: number; negative: number; total: number; positiveRate: number };
  topLowConfidenceQuestions: { question: string; confidence: number; date: string }[];
};

export type Resolution = {
  total_conversations: number;
  ai_resolved: number;
  needs_human: number;
  resolution_rate: number;
  unresolved_questions: {
    id: string;
    contact_id: string;
    contact_name: string;
    last_message: string;
    created_at: string;
    status: string;
  }[];
};

export const DAYS_OPTIONS = [7, 14, 30, 90] as const;
