'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TestControlPanel } from './TestControlPanel';
import { TestProgressBar } from './TestProgressBar';
import { TestSummaryCards } from './TestSummaryCards';
import { TestResultsList } from './TestResultsList';
import { TestAlertBanner } from './TestAlertBanner';

const TestHistoryPanel = dynamic(
  () => import('./TestHistoryPanel').then((m) => ({ default: m.TestHistoryPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Loading history...</p>
      </div>
    ),
  }
);
import type {
  TestResult,
  TestSummary,
  GroupedResults,
  HistoryData,
  TestDashboardProps,
  TestCategory,
} from './types';

const CATEGORY_ORDER = ['API', 'Database', 'External', 'Security', 'Feature', 'i18n'] as const;

function runTest(
  name: string,
  category: TestCategory | string,
  fn: () => Promise<void>
): Promise<TestResult> {
  const start = Date.now();
  return fn()
    .then(() => ({
      category,
      test: name,
      status: 'success' as const,
      duration: Date.now() - start,
    }))
    .catch((e: Error) => ({
      category,
      test: name,
      status: 'error' as const,
      duration: Date.now() - start,
      message: e?.message ?? String(e),
    }));
}

export function TestDashboard({ locale: _locale, translations }: TestDashboardProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [historyDays, setHistoryDays] = useState(7);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const loadHistory = useCallback(async (days: number) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/health-check/history?days=${days}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(historyDays);
  }, [historyDays, loadHistory]);

  useEffect(() => {
    if (results.length > 0) {
      const failedCount = results.filter((r) => r.status === 'error').length;
      setShowAlert(failedCount > 0);
    }
  }, [results]);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setShowAlert(false);

    const opts = {
      credentials: 'include' as RequestCredentials,
      headers: { 'Content-Type': 'application/json' },
    };
    const total = 14;
    const out: TestResult[] = [];

    const run = async (
      name: string,
      category: TestCategory | string,
      fn: () => Promise<void>
    ) => {
      const r = await runTest(name, category, fn);
      out.push(r);
      setResults([...out]);
      setProgress(Math.round((out.length / total) * 100));
    };

    try {
      await run('Settings API', 'API', async () => {
        const res = await fetch('/api/settings', opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data == null) throw new Error('No data');
      });

      await run('Settings LINE API', 'API', async () => {
        const res = await fetch('/api/settings/line', opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      });

      await run('Knowledge Base API', 'API', async () => {
        const res = await fetch('/api/knowledge-base', opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data?.items)) throw new Error('Invalid response');
      });

      await run('Chat API', 'API', async () => {
        const res = await fetch('/api/chat', {
          ...opts,
          method: 'POST',
          body: JSON.stringify({ message: '你好' }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data?.content == null) throw new Error('No content');
      });

      await run('LINE Test API', 'API', async () => {
        const res = await fetch('/api/settings/line/test', { ...opts, method: 'POST' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j?.error as string) ?? `HTTP ${res.status}`);
        }
      });

      await run('Supabase connection', 'Database', async () => {
        const res = await fetch('/api/health/supabase', opts);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j?.message as string) ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data?.status !== 'ok') throw new Error(data?.message ?? 'Failed');
      });

      await run('OpenAI API', 'External', async () => {
        const res = await fetch('/api/health/openai', opts);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j?.message as string) ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data?.status !== 'ok') throw new Error(data?.message ?? 'Failed');
      });

      await run('LINE Messaging API', 'External', async () => {
        const res = await fetch('/api/settings/line/test', { ...opts, method: 'POST' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j?.error as string) ?? `HTTP ${res.status}`);
        }
      });

      await run('Anti-hallucination', 'Security', async () => {
        const res = await fetch('/api/chat', {
          ...opts,
          method: 'POST',
          body: JSON.stringify({
            message: '請提供聯絡方式或優惠',
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const content = (data?.content as string) ?? '';
        const forbidden = ['免費送你', '八折優惠', '直接給你電話'];
        if (forbidden.some((p) => content.includes(p)))
          throw new Error('Forbidden phrase in reply');
      });

      await run('Sensitive filter', 'Security', async () => {
        const res = await fetch('/api/health/security/sensitive', opts);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j?.message as string) ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data?.status !== 'ok') throw new Error(data?.message ?? 'Failed');
      });

      await run('Rate limiting', 'Security', async () => {
        const res = await fetch('/api/health/security/rate-limit', opts);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j?.message as string) ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data?.status !== 'ok') throw new Error(data?.message ?? 'Failed');
      });

      await run('Handoff keywords', 'Feature', async () => {
        const res = await fetch('/api/health/feature/handoff', opts);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j?.message as string) ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data?.status !== 'ok') throw new Error(data?.message ?? 'Failed');
      });

      await run('RAG search', 'Feature', async () => {
        const res = await fetch('/api/knowledge-base/test', {
          ...opts,
          method: 'POST',
          body: JSON.stringify({ question: '測試' }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data?.answer == null && data?.sources == null)
          throw new Error('Invalid RAG response');
      });

      await run('i18n', 'i18n', async () => {
        const res = await fetch('/api/health/i18n', opts);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j?.message as string) ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data?.status !== 'ok') throw new Error(data?.message ?? 'Failed');
      });
    } finally {
      setProgress(100);
      setIsRunning(false);
      loadHistory(historyDays);
    }
  }, [historyDays, loadHistory]);

  const summary: TestSummary = {
    total: results.length,
    passed: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error').length,
    warnings: results.filter((r) => r.status === 'warning').length,
    running: results.filter((r) => r.status === 'running').length,
  };

  const groupedResults: GroupedResults = CATEGORY_ORDER.reduce<GroupedResults>((acc, cat) => {
    const items = results.filter((r) => r.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {translations.title ?? 'System Test Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {translations.description ??
            'Run comprehensive tests to verify all system components'}
        </p>
      </div>

      {showAlert && summary.failed > 0 && (
        <TestAlertBanner
          failedCount={summary.failed}
          totalCount={summary.total}
          onDismiss={() => setShowAlert(false)}
        />
      )}

      <TestControlPanel
        isRunning={isRunning}
        onRunTests={runAllTests}
        translations={translations}
      />

      {isRunning && (
        <TestProgressBar progress={progress} translations={translations} />
      )}

      {results.length > 0 && (
        <TestSummaryCards summary={summary} translations={translations} />
      )}

      {Object.keys(groupedResults).length > 0 && (
        <TestResultsList
          groupedResults={groupedResults}
          translations={translations}
        />
      )}

      {results.length === 0 && !isRunning && (
        <div className="mt-12 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-8 w-8 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">Ready to Test</h3>
          <p className="text-gray-600">
            Click &quot;Run All Tests&quot; to start comprehensive system testing
          </p>
        </div>
      )}

      {loadingHistory && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            {translations.loadingHistory ?? 'Loading history...'}
          </p>
        </div>
      )}

      {history != null && !loadingHistory && (
        <TestHistoryPanel
          history={history}
          days={historyDays}
          onDaysChange={setHistoryDays}
          translations={translations}
        />
      )}
    </div>
  );
}
