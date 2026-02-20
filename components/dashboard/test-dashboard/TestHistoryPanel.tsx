'use client';

import { StatCard } from '../shared/StatCard';
import { TrendChart } from '../shared/TrendChart';
import type { HistoryData } from './types';
import type { TestDashboardTranslations } from './types';

interface TestHistoryPanelProps {
  history: HistoryData;
  days: number;
  onDaysChange: (days: number) => void;
  translations: TestDashboardTranslations;
}

export function TestHistoryPanel({
  history,
  days,
  onDaysChange,
  translations,
}: TestHistoryPanelProps) {
  const t = translations.history;

  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {t?.title ?? 'Health Check History'} ({history.period})
        </h2>
        <select
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label={t?.title ?? 'Health Check History'}
        >
          <option value={7}>{t?.days7 ?? 'Last 7 Days'}</option>
          <option value={30}>{t?.days30 ?? 'Last 30 Days'}</option>
          <option value={90}>{t?.days90 ?? 'Last 90 Days'}</option>
        </select>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t?.totalChecks ?? 'Total Checks'}
          value={history.totalChecks}
          variant="default"
        />
        <StatCard
          title={t?.averageSuccessRate ?? 'Avg Success Rate'}
          value={history.averageSuccessRate}
          variant="success"
        />
        <StatCard
          title={t?.failedChecks ?? 'Failed Checks'}
          value={history.failedChecks}
          variant="warning"
        />
        <StatCard
          title={t?.criticalFailures ?? 'Critical Failures'}
          value={history.criticalFailures}
          variant="error"
        />
      </div>

      <TrendChart
        trend={history.trend}
        title={t?.successRateTrend ?? 'Success Rate Trend'}
      />

      {history.recentFailures.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            {t?.recentFailures ?? 'Recent Failures'}
          </h3>
          <div className="space-y-3">
            {history.recentFailures.map((failure, idx) => (
              <div
                key={`${failure.timestamp}-${idx}`}
                className="rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-red-700">
                    {new Date(failure.timestamp).toLocaleString('zh-TW', {
                      timeZone: 'Asia/Taipei',
                    })}
                  </span>
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    {failure.failed}/{failure.total} failed
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {failure.tests.map((test, i) => (
                    <span
                      key={i}
                      className="inline-block rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-600"
                    >
                      {test}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
