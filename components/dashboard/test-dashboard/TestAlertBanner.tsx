'use client';

import { memo } from 'react';

interface TestAlertBannerProps {
  failedCount: number;
  totalCount: number;
  onDismiss: () => void;
}

export const TestAlertBanner = memo(function TestAlertBanner({
  failedCount,
  totalCount,
  onDismiss,
}: TestAlertBannerProps) {
  const severity = failedCount >= 3 ? 'critical' : 'warning';
  const bgColor =
    severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
  const textColor = severity === 'critical' ? 'text-red-800' : 'text-amber-800';
  const iconColor = severity === 'critical' ? 'text-red-600' : 'text-amber-600';

  return (
    <div className={`mb-6 rounded-lg border p-4 ${bgColor}`} role="alert">
      <div className="flex items-start gap-3">
        <svg
          className={`h-6 w-6 shrink-0 ${iconColor}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-semibold ${textColor}`}>
            {severity === 'critical'
              ? 'Critical Issues Detected'
              : 'Warning: Test Failures Detected'}
          </h3>
          <p className={`mt-1 text-sm ${textColor}`}>
            {failedCount} out of {totalCount} tests failed. Please review the failed tests below
            and take corrective action.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className={`shrink-0 rounded-lg p-1 transition-colors hover:bg-white/50 ${textColor}`}
          aria-label="Dismiss alert"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
});
