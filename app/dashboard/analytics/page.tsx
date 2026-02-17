'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

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

function LineChart({ data, width = 400, height = 200 }: { data: TrendPoint[]; width?: number; height?: number }) {
  if (data.length === 0) return <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">尚無數據</div>;
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
          <title>{`${d.date}：${d.count} 則對話`}</title>
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

export default function AnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [topContacts, setTopContacts] = useState<TopContact[]>([]);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, trendsRes, hourlyRes, questionsRes, contactsRes, qualityRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch(`/api/analytics/trends?days=${days}`),
        fetch(`/api/analytics/hourly?days=${days}`),
        fetch(`/api/analytics/top-questions?days=${days}&limit=10`),
        fetch(`/api/analytics/top-contacts?days=${days}&limit=10`),
        fetch(`/api/analytics/quality?days=${days}`),
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
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const hasAnyData = overview && (
    overview.thisMonth.totalConversations > 0 ||
    overview.thisMonth.aiReplies > 0 ||
    overview.thisMonth.newContacts > 0 ||
    trends.some((d) => d.count > 0)
  );

  const changeEl = (val: number | null, label: string) => {
    if (val === null) return <span className="text-gray-400 text-sm">—</span>;
    const up = val > 0;
    const isImprovement = label === '平均回覆速度' && val < 0;
    const good = label === '平均回覆速度' ? isImprovement : up;
    return (
      <span className={`text-sm ${good ? 'text-green-600' : 'text-red-600'}`}>
        {val > 0 ? '↑' : val < 0 ? '↓' : ''} {Math.abs(val)}% {label === '平均回覆速度' && val !== 0 ? (isImprovement ? '（較快）' : '（較慢）') : ''}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">數據分析</h1>
        <div className="flex gap-2">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${days === d ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              最近 {d} 天
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center text-gray-500">載入中...</div>
      ) : !hasAnyData ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-600">開始使用後就能看到分析數據</p>
          <Link href="/dashboard/conversations" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            前往對話紀錄
          </Link>
        </div>
      ) : (
        <>
          {/* 4 stat cards - overview uses "本月" */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-lg">💬</span>
                <span className="text-sm">本月對話總量</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.thisMonth.totalConversations ?? 0}</p>
              {overview && changeEl(overview.change.totalConversations, '')}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-lg">🤖</span>
                <span className="text-sm">本月 AI 回覆數</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.thisMonth.aiReplies ?? 0}</p>
              {overview && changeEl(overview.change.aiReplies, '')}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-lg">⏱</span>
                <span className="text-sm">平均回覆速度</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {overview?.thisMonth.avgReplySeconds != null ? `${overview.thisMonth.avgReplySeconds} 秒` : '—'}
              </p>
              {overview && changeEl(overview.change.avgReplySeconds, '平均回覆速度')}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-lg">👥</span>
                <span className="text-sm">本月新客戶數</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{overview?.thisMonth.newContacts ?? 0}</p>
              {overview && changeEl(overview.change.newContacts, '')}
            </div>
          </div>

          {/* Trend line chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">對話量趨勢</h2>
            <div className="h-[220px] w-full">
              <LineChart data={trends} width={700} height={220} />
            </div>
          </div>

          {/* Hourly bar chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">時段分布（0–23 時）</h2>
            <div className="h-[220px] w-full">
              <BarChart data={hourly} width={700} height={220} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top questions */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <h2 className="border-b border-gray-100 px-4 py-3 text-lg font-semibold text-gray-900">熱門問題 Top 10</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600">
                      <th className="px-4 py-2">排名</th>
                      <th className="px-4 py-2">關鍵字</th>
                      <th className="px-4 py-2">次數</th>
                      <th className="px-4 py-2">佔比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topQuestions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">尚無數據</td>
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
              <h2 className="border-b border-gray-100 px-4 py-3 text-lg font-semibold text-gray-900">客戶活躍度排行</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600">
                      <th className="px-4 py-2">排名</th>
                      <th className="px-4 py-2">客戶</th>
                      <th className="px-4 py-2">LINE ID</th>
                      <th className="px-4 py-2">對話數</th>
                      <th className="px-4 py-2">最後互動</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topContacts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">尚無數據</td>
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900">AI 回覆品質概覽</h2>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-sm text-gray-500">平均回覆字數</p>
                <p className="text-xl font-bold text-gray-900">{quality?.avgReplyLength != null ? quality.avgReplyLength : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">目前使用模型</p>
                <p className="text-xl font-bold text-gray-900">{quality?.aiModel || '—'}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
