import type { Overview, TopQuestion, TopContact, AiQuality, Resolution } from './analytics-types';

export function buildAnalyticsCsvRows(args: {
  overview: Overview | null;
  topQuestions: TopQuestion[];
  topContacts: TopContact[];
  resolution: Resolution | null;
  aiQuality: AiQuality | null;
}): string {
  const { overview, topQuestions, topContacts, resolution, aiQuality } = args;
  const rows: string[] = [];
  rows.push('section,key,value');
  rows.push(`overview,totalConversations,${overview?.thisMonth.totalConversations ?? 0}`);
  rows.push(`overview,aiReplies,${overview?.thisMonth.aiReplies ?? 0}`);
  rows.push(`overview,newContacts,${overview?.thisMonth.newContacts ?? 0}`);
  rows.push(`resolution,rate,${resolution?.resolution_rate ?? 0}`);
  rows.push(`csat,positiveRate,${aiQuality?.feedbackStats.positiveRate ?? 0}`);
  for (const item of topQuestions) {
    rows.push(`topQuestion,${item.keyword},${item.count}`);
  }
  for (const item of topContacts) {
    rows.push(`topContact,${item.name ?? item.lineUserId},${item.count}`);
  }
  return rows.join('\n');
}
