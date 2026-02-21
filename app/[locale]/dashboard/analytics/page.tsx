'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';

const DAYS_OPTIONS = [7, 14, 30, 90] as const;

type Overview = {
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

type TrendPoint = { date: string; count: number };
type HourlyPoint = { hour: number; count: number };
type TopQuestion = { keyword: string; count: number; percentage: number };
type TopContact = { contactId: string; name: string | null; lineUserId: string; count: number; lastAt: string | null };
type Quality = { avgReplyLength: number | null; aiModel: string | null };
type AiQuality = {
  totalConversations: number;
  aiHandledCount: number;
  humanHandoffCount: number;
  aiHandledRate: number;
  avgConfidenceScore: number;
  confidenceDistribution: { range: string; count: number }[];
  feedbackStats: { positive: number; negative: number; total: number; positiveRate: number };
  topLowConfidenceQuestions: { question: string; confidence: number; date: string }[];
};

type Resolution = {
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

function LineChart({ data, width = 400, height = 200, noDataLabel, titleFormat }: { data: TrendPoint[]; width?: number; height?: number; noDataLabel: string; titleFormat: (date: string, count: number) => string }) {
  if (data.length === 0) return <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">{noDataLabel}</div>;
  const padding = { top: 10, right: 10, bottom: 24, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxY = Math.max(1, ...data.map((d) => d.count));
  const scaleY = (v: number) => padding.top + innerH - (v / maxY) * innerH;
  const scaleX = (i: number) => padding.left + (i / (data.length - 1 || 1)) * innerW;
  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.count)}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
        </linearGradient>
      </defs>
      {data.map((d, i) => (
        <line key={d.date} x1={scaleX(i)} y1={scaleY(d.count)} x2={scaleX(i)} y2={height - padding.bottom} stroke="url(#lineGrad)" strokeWidth={scaleX(1) - scaleX(0)} fill="none" />
      ))}
      <path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={d.date} cx={scaleX(i)} cy={scaleY(d.count)} r={4} fill="#6366f1">
          <title>{titleFormat(d.date, d.count)}</title>
        </circle>
      ))}
      {data.map((d, i) => (
        <text key={d.date} x={scaleX(i)} y={height - 6} textAnchor="middle" className="fill-gray-500 text-[10px]">
          {d.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

function BarChart({ data, width = 400, height = 200 }: { data: HourlyPoint[]; width?: number; height?: number }) {
  const maxY = Math.max(1, ...data.map((d) => d.count));
  const padding = { top: 10, right: 10, bottom: 28, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barW = innerW / 24 - 2;
  const scaleY = (v: number) => padding.top + innerH - (v / maxY) * innerH;
  const left = (i: number) => padding.left + i * (innerW / 24);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
        </linearGradient>
      </defs>
      {data.map((d, i) => (
        <g key={d.hour}>
          <rect x={left(i)} y={scaleY(d.count)} width={barW} height={innerH - (scaleY(d.count) - padding.top)} fill="url(#barGrad)" rx={2} />
          {i % 4 === 0 && (
            <text x={left(i) + barW / 2} y={height - 8} textAnchor="middle" className="fill-gray-500 text-[9px]">
              {d.hour}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function ResolutionRing({ aiResolved, needsHuman, size = 80 }: { aiResolved: number; needsHuman: number; size?: number }) {
  const total = aiResolved + needsHuman;
  const circumference = 2 * Math.PI * (size / 2 - 4);
  const greenDash = total > 0 ? (aiResolved / total) * circumference : 0;
  const orangeDash = total > 0 ? (needsHuman / total) * circumference : circumference;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={6}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke="#22c55e"
        strokeWidth={6}
        strokeDasharray={`${greenDash} ${circumference - greenDash}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke="#f97316"
        strokeWidth={6}
        strokeDasharray={`${orangeDash} ${circumference - orangeDash}`}
        strokeDashoffset={-greenDash}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const router = useRouter();
  const [days, setDays] = useState<number>(30);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [topContacts, setTopContacts] = useState<TopContact[]>([]);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [aiQuality, setAiQuality] = useState<AiQuality | null>(null);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const timeoutId = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError(t('loadTimeout'));
          return false;
        }
        return prev;
      });
    }, 10000);
    try {
      const period = days >= 90 ? '90d' : days >= 30 ? '30d' : '7d';
      const [overviewRes, trendsRes, hourlyRes, questionsRes, contactsRes, qualityRes, resolutionRes, aiQualityRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch(`/api/analytics/trends?days=${days}`),
        fetch(`/api/analytics/hourly?days=${days}`),
        fetch(`/api/analytics/top-questions?days=${days}&limit=10`),
        fetch(`/api/analytics/top-contacts?days=${days}&limit=10`),
        fetch(`/api/analytics/quality?days=${days}`),
        fetch(`/api/analytics/resolution?days=${days}`),
        fetch(`/api/analytics/ai-quality?period=${period}`),
      ]);
      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (trendsRes.ok) {
        const j = await trendsRes.json();
        setTrends(j.series ?? []);
      }
      if (hourlyRes.ok) {
        const j = await hourlyRes.json();
        setHourly(j.series ?? []);
      }
      if (questionsRes.ok) {
        const j = await questionsRes.json();
        setTopQuestions(j.items ?? []);
      }
      if (contactsRes.ok) {
        const j = await contactsRes.json();
        setTopContacts(j.items ?? []);
      }
      if (qualityRes.ok) setQuality(await qualityRes.json());
      if (resolutionRes.ok) setResolution(await resolutionRes.json());
      if (aiQualityRes.ok) setAiQuality(await aiQualityRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadFailed'));
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [days, t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const hasAnyData = overview && (
    overview.thisMonth.totalConversations > 0 ||
    overview.thisMonth.aiReplies > 0 ||
    overview.thisMonth.newContacts > 0 ||
    trends.some((d) => d.count > 0)
  );

  const avgResponseLabel = t('avgResponseTime');
  const changeEl = (val: number | null, label: string) => {
    if (val === null) return <span className="text-gray-400 text-sm">—</span>;
    const up = val > 0;
    const isImprovement = label === avgResponseLabel && val < 0;
    const good = label === avgResponseLabel ? isImprovement : up;
    return (
      <span className={`text-sm ${good ? 'text-green-600' : 'text-red-600'}`}>
        {val > 0 ? '↑' : val < 0 ? '↓' : ''} {Math.abs(val)}% {label === avgResponseLabel && val !== 0 ? (isImprovement ? t('faster') : t('slower')) : ''}
      </span>
    );
  };

  const exportCsv = () => {
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
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${days === d ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {t(`last${d}Days` as 'last7Days' | 'last14Days' | 'last30Days' | 'last90Days')}
            </button>
          ))}
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('exportCsv')}
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('exportPdf')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-3 text-gray-600">{t('loading')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-6xl mb-4">⚠</div>
            <h2 className="text-xl font-semibold mb-2">{t('loadFailed')}</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => fetchAll()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              {t('reload')}
            </button>
          </div>
        </div>
      ) : !hasAnyData ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mx-auto mb-4 text-4xl">📊</div>
          <p className="text-gray-600">{t('emptyDesc')}</p>
          <p className="mt-2 text-sm text-slate-500">{t('emptyConnectLine')}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard/settings" className="inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('goToSettings')}
            </Link>
            <Link href="/dashboard/conversations" className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {t('goToConversations')}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Suggestion banners */}
          {resolution && resolution.total_conversations > 0 && resolution.resolution_rate < 70 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap items-center gap-3">
              <span className="text-amber-700">💡</span>
              <p className="text-amber-800 text-sm">{t('suggestAddKnowledge')}</p>
              <Link href="/dashboard/knowledge-base" className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700">
                {t('goToKnowledgeBase')}
              </Link>
            </div>
          )}
          {resolution && resolution.unresolved_questions.length > 10 && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex flex-wrap items-center gap-3">
              <span className="text-red-600">⚠️</span>
              <p className="text-red-800 text-sm">{t('humanNeededCount', { count: resolution.needs_human })}</p>
              <Link href="/dashboard/conversations" className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
                {t('viewConversations')}
              </Link>
            </div>
          )}

          {/* 5 stat cards - overview uses "本月", resolution uses days */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-lg">💬</span>
                <span className="text-sm">{t('monthlyTotalConversations')}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.thisMonth.totalConversations ?? 0}</p>
              {overview && changeEl(overview.change.totalConversations, '')}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-lg">🤖</span>
                <span className="text-sm">{t('monthlyAiReplies')}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.thisMonth.aiReplies ?? 0}</p>
              {overview && changeEl(overview.change.aiReplies, '')}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-lg">⏱</span>
                <span className="text-sm">{t('avgResponseTime')}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {overview?.thisMonth.avgReplySeconds != null ? t('secondsValue', { value: overview.thisMonth.avgReplySeconds }) : '—'}
              </p>
              {overview && changeEl(overview.change.avgReplySeconds, avgResponseLabel)}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-lg">👥</span>
                <span className="text-sm">{t('monthlyNewCustomers')}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.thisMonth.newContacts ?? 0}</p>
              {overview && changeEl(overview.change.newContacts, '')}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-lg">✅</span>
                <span className="text-sm">{t('aiAutoResolutionRate')}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <ResolutionRing
                  aiResolved={resolution?.ai_resolved ?? 0}
                  needsHuman={resolution?.needs_human ?? 0}
                  size={64}
                />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{resolution?.resolution_rate ?? 0}%</p>
                  <p className="text-xs text-gray-500">{t('resolutionDetail', { aiCount: resolution?.ai_resolved ?? 0, humanCount: resolution?.needs_human ?? 0 })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Unresolved questions */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <h2 className="border-b border-gray-100 px-4 py-3 text-lg font-semibold text-gray-900">⚠️ {t('attentionNeeded')}</h2>
            <div className="overflow-x-auto">
              {!resolution?.unresolved_questions?.length ? (
                <div className="px-4 py-8 text-center text-gray-500">🎉 {t('noIssues')}</div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-600">
                        <th className="px-4 py-2">{t('customer')}</th>
                        <th className="px-4 py-2">{t('questionContent')}</th>
                        <th className="px-4 py-2">{t('time')}</th>
                        <th className="px-4 py-2">{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resolution.unresolved_questions.map((q) => (
                        <tr
                          key={q.id}
                          className="border-t border-gray-100 cursor-pointer hover:bg-gray-50"
                          onClick={() => router.push(`/dashboard/conversations/${q.contact_id}`)}
                        >
                          <td className="px-4 py-2">
                            <Link href={`/dashboard/conversations/${q.contact_id}`} className="font-medium text-indigo-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                              {q.contact_name || t('unnamed')}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-gray-700 max-w-[280px] truncate" title={q.last_message}>
                            {q.last_message.slice(0, 80)}{q.last_message.length > 80 ? '…' : ''}
                          </td>
                          <td className="px-4 py-2 text-gray-500">{new Date(q.created_at).toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <span
                              className={
                                q.status === 'needs_human'
                                  ? 'rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800'
                                  : 'rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800'
                              }
                            >
                              {q.status === 'needs_human' ? t('needsHuman') : q.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {resolution.needs_human > 20 && (
                    <div className="border-t border-gray-100 px-4 py-3 text-center">
                      <Link href="/dashboard/conversations" className="text-sm font-medium text-indigo-600 hover:underline">
                        {t('viewAll')}
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Trend line chart - responsive container */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('conversationTrend')}</h2>
            <div className="h-[220px] w-full min-w-0">
              <LineChart data={trends} width={700} height={220} noDataLabel={t('noData')} titleFormat={(date, count) => t('conversationsOnDate', { date, count })} />
            </div>
          </div>

          {/* Hourly bar chart - responsive container */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('timeDistribution')}</h2>
            <div className="h-[220px] w-full min-w-0">
              <BarChart data={hourly} width={700} height={220} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top questions */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <h2 className="border-b border-gray-100 px-4 py-3 text-lg font-semibold text-gray-900">{t('topQuestions')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600">
                      <th className="px-4 py-2">{t('rank')}</th>
                      <th className="px-4 py-2">{t('keyword')}</th>
                      <th className="px-4 py-2">{t('frequency')}</th>
                      <th className="px-4 py-2">{t('percentage')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topQuestions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">{t('noData')}</td>
                      </tr>
                    ) : (
                      topQuestions.map((q, i) => (
                        <tr key={q.keyword} className="border-t border-gray-100">
                          <td className="px-4 py-2 font-medium">{i + 1}</td>
                          <td className="px-4 py-2">{q.keyword}</td>
                          <td className="px-4 py-2">{q.count}</td>
                          <td className="px-4 py-2">{q.percentage}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top contacts */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <h2 className="border-b border-gray-100 px-4 py-3 text-lg font-semibold text-gray-900">{t('customerActivityRanking')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600">
                      <th className="px-4 py-2">{t('rank')}</th>
                      <th className="px-4 py-2">{t('customer')}</th>
                      <th className="px-4 py-2">{t('lineId')}</th>
                      <th className="px-4 py-2">{t('conversationCount')}</th>
                      <th className="px-4 py-2">{t('lastInteraction')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topContacts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">{t('noData')}</td>
                      </tr>
                    ) : (
                      topContacts.map((c, i) => (
                        <tr key={c.contactId} className="border-t border-gray-100">
                          <td className="px-4 py-2 font-medium">{i + 1}</td>
                          <td className="px-4 py-2">
                            <Link href={`/dashboard/conversations/${c.contactId}`} className="text-indigo-600 hover:underline">
                              {c.name || c.lineUserId || '—'}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-gray-600">{c.lineUserId}</td>
                          <td className="px-4 py-2">{c.count}</td>
                          <td className="px-4 py-2 text-gray-500">{c.lastAt ? new Date(c.lastAt).toLocaleDateString('zh-TW') : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* AI quality */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('aiReplyQuality')}</h2>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-sm text-gray-500">{t('avgReplyLength')}</p>
                <p className="text-xl font-bold text-gray-900">{quality?.avgReplyLength != null ? quality.avgReplyLength : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('currentModel')}</p>
                <p className="text-xl font-bold text-gray-900">{quality?.aiModel || '—'}</p>
              </div>
            </div>
          </div>

          {/* CSAT + confidence */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('csatAndFeedback')}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-sm text-gray-600">{t('satisfactionRate')}</p>
                  <p className="text-2xl font-bold text-green-700">
                    {Math.round(aiQuality?.feedbackStats.positiveRate ?? 0)}%
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-sm text-gray-600">{t('feedbackTotal')}</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {aiQuality?.feedbackStats.total ?? 0}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                👍 {aiQuality?.feedbackStats.positive ?? 0} · 👎 {aiQuality?.feedbackStats.negative ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('confidenceDistribution')}</h2>
              <div className="space-y-2">
                {(aiQuality?.confidenceDistribution ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">{t('noData')}</p>
                ) : (
                  (aiQuality?.confidenceDistribution ?? []).map((bucket) => {
                    const max = Math.max(
                      1,
                      ...(aiQuality?.confidenceDistribution ?? []).map((x) => x.count)
                    );
                    const width = Math.round((bucket.count / max) * 100);
                    return (
                      <div key={bucket.range}>
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                          <span>{bucket.range}</span>
                          <span>{bucket.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-indigo-500 shrink-0" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('lowConfidenceQuestions')}</h2>
            {(aiQuality?.topLowConfidenceQuestions ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">{t('noData')}</p>
            ) : (
              <div className="space-y-2">
                {(aiQuality?.topLowConfidenceQuestions ?? []).slice(0, 8).map((q, idx) => (
                  <div key={`${idx}-${q.date}`} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="text-sm text-gray-800">{q.question}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('confidence')}: {Math.round((q.confidence ?? 0) * 100)}% · {new Date(q.date).toLocaleString('zh-TW')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
