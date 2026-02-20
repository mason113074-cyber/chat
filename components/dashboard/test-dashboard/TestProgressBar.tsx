'use client';

import { memo } from 'react';
import type { TestDashboardTranslations } from './types';

interface TestProgressBarProps {
  progress: number;
  translations: TestDashboardTranslations;
}

export const TestProgressBar = memo(function TestProgressBar({
  progress,
  translations,
}: TestProgressBarProps) {
  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Test Progress</span>
        <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-label={translations.runningTests ?? 'Test progress'}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {translations.runningTests ?? 'Running comprehensive system health checks...'}
      </p>
    </div>
  );
});
