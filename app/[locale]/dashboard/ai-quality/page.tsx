'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function AIQualityPage() {
  const t = useTranslations('settings');
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState<{
    totalConversations: number;
    aiHandledRate: number;
    avgConfidenceScore: number;
    feedbackStats: { positiveRate: number; total: number };
    confidenceDistribution: { range: string; count: number }[];
    topLowConfidenceQuestions: { conversation_id: string; question: string; confidence: number }[];
  } | null>(null);
  const [addingToKb, setAddingToKb] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/analytics/ai-quality?period=${period}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      });
    return () => { cancelled = true; };
  }, [period]);

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">{t('aiQuality')}</h1>
        <p className="mt-4 text-gray-500">{t('loading')}</p>
      </div>
    );
  }

  const maxCount = Math.max(1, ...data.confidenceDistribution.map((d) => d.count));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('aiQuality')}</h1>
      <div className="mt-4 flex gap-2">
        {(['7d', '30d', '90d'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded px-3 py-1 text-sm ${period === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {p === '7d' ? t('period7d') : p === '30d' ? t('period30d') : t('period90d')}
          </button>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">{t('totalConversations')}</p>
          <p className="text-2xl font-bold">{data.totalConversations}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">{t('aiHandledRate')}</p>
          <p className="text-2xl font-bold">{data.aiHandledRate.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">{t('avgConfidence')}</p>
          <p className="text-2xl font-bold">{(data.avgConfidenceScore * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">{t('satisfactionRate')}</p>
          <p className="text-2xl font-bold">{data.feedbackStats.positiveRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-400">({data.feedbackStats.total} 則回饋)</p>
        </div>
      </div>
      <div className="mt-6 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">{t('confidenceDistribution')}</h2>
        <div className="mt-3 space-y-2">
          {data.confidenceDistribution.map((d) => (
            <div key={d.range} className="flex items-center gap-2">
              <span className="w-16 text-sm">{d.range}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-indigo-500 rounded-full h-4 shrink-0"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm w-8">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded-xl border bg-white p-4">
        <h2 className="font-semibold">{t('lowConfidenceQuestions')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('lowConfidenceDesc')}</p>
        <ul className="mt-3 space-y-2">
          {data.topLowConfidenceQuestions.length === 0 ? (
            <li className="text-gray-400">{t('noData') ?? '尚無數據'}</li>
          ) : (
            data.topLowConfidenceQuestions.map((q, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate flex-1">{q.question}</span>
                <span className="text-orange-600 shrink-0">{(q.confidence * 100).toFixed(0)}%</span>
                <button
                  type="button"
                  disabled={addingToKb === q.conversation_id}
                  onClick={async () => {
                    if (!('conversation_id' in q)) return;
                    setAddingToKb(q.conversation_id);
                    try {
                      const res = await fetch('/api/knowledge-base/from-conversation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          conversation_id: q.conversation_id,
                          title: q.question.slice(0, 100) || '低信心回覆',
                        }),
                      });
                      if (res.ok) {
                        setData((d) =>
                          d
                            ? {
                                ...d,
                                topLowConfidenceQuestions: d.topLowConfidenceQuestions.filter(
                                  (x) => x.conversation_id !== q.conversation_id
                                ),
                              }
                            : d
                        );
                      }
                    } finally {
                      setAddingToKb(null);
                    }
                  }}
                  className="shrink-0 rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800 hover:bg-indigo-200 disabled:opacity-50"
                >
                  {addingToKb === q.conversation_id ? '處理中…' : '納入知識庫'}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}