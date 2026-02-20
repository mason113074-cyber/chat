'use client';

import { useState, memo } from 'react';
import { StatusBadge } from '../shared/StatusBadge';
import { ErrorCollapse } from '../shared/ErrorCollapse';
import type { GroupedResults, TestResult } from './types';
import type { TestDashboardTranslations } from './types';

const CATEGORY_ORDER = ['API', 'Database', 'External', 'Security', 'Feature', 'i18n'] as const;

interface TestResultsListProps {
  groupedResults: GroupedResults;
  translations: TestDashboardTranslations;
}

function TestResultsListComponent({ groupedResults, translations }: TestResultsListProps) {
  return (
    <div className="mt-6 space-y-6">
      {CATEGORY_ORDER.filter((cat) => groupedResults[cat]?.length).map((category) => (
        <CategorySection
          key={category}
          category={category}
          tests={groupedResults[category] ?? []}
          translations={translations}
        />
      ))}
    </div>
  );
}

export const TestResultsList = memo(TestResultsListComponent);

interface CategorySectionProps {
  category: string;
  tests: TestResult[];
  translations: TestDashboardTranslations;
}

const CategorySection = memo(function CategorySection({
  category,
  tests,
  translations,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const passedCount = tests.filter((t) => t.status === 'success').length;
  const failedCount = tests.filter((t) => t.status === 'error').length;
  const categoryLabel =
    translations.categories?.[category] ?? category;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-900">{categoryLabel}</span>
          <span className="text-sm text-gray-500">
            ({passedCount}/{tests.length} passed)
          </span>
        </div>
        <div className="flex items-center gap-3">
          {failedCount > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              {failedCount} failed
            </span>
          )}
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="divide-y divide-gray-100 border-t border-gray-200">
          {tests.map((test, idx) => (
            <TestItem key={`${test.test}-${idx}`} test={test} translations={translations} />
          ))}
        </div>
      )}
    </div>
  );
});

interface TestItemProps {
  test: TestResult;
  translations: TestDashboardTranslations;
}

const TestItem = memo(function TestItem({ test, translations }: TestItemProps) {
  const [showError, setShowError] = useState(false);

  return (
    <div className="px-6 py-4 transition-colors hover:bg-gray-50">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <StatusBadge status={test.status} />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900">{test.test}</p>
            {test.message != null && test.status !== 'success' && (
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => setShowError(!showError)}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  {showError ? translations.collapse : translations.viewError}
                </button>
              </div>
            )}
          </div>
        </div>
        {test.duration != null && test.duration > 0 && (
          <span className="font-mono text-sm text-gray-500">{test.duration}ms</span>
        )}
      </div>
      {showError && test.message != null && <ErrorCollapse message={test.message} />}
    </div>
  );
});
