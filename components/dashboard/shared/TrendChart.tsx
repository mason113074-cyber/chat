'use client';

import type { TrendPoint } from '../test-dashboard/types';

interface TrendChartProps {
  trend: TrendPoint[];
  title?: string;
}

export function TrendChart({ trend, title = 'Success Rate Trend' }: TrendChartProps) {
  if (!trend || trend.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg bg-gray-50 text-gray-500 text-sm">
        No trend data available
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-gray-700">{title}</h3>
      <div className="relative">
        <div className="flex items-end gap-0.5 border-b-2 border-l-2 border-gray-300 pb-2 pl-2 h-40">
          {trend.map((point, idx) => {
            const height = Math.max(4, parseFloat(point.successRate));
            const isRecent = idx >= trend.length - 7;
            return (
              <div key={`${point.timestamp}-${idx}`} className="group relative flex-1 min-w-0">
                <div
                  className={`w-full rounded-t transition-opacity hover:opacity-80 cursor-pointer ${
                    height >= 95
                      ? 'bg-gradient-to-t from-green-500 to-green-400'
                      : height >= 80
                        ? 'bg-gradient-to-t from-amber-500 to-amber-400'
                        : 'bg-gradient-to-t from-red-500 to-red-400'
                  } ${isRecent ? 'shadow-md' : ''}`}
                  style={{ height: `${height}%` }}
                />
                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity pointer-events-none group-hover:opacity-100">
                  <div className="mb-1 font-semibold">
                    {new Date(point.timestamp).toLocaleDateString('zh-TW')}
                  </div>
                  <div>Success Rate: {point.successRate}%</div>
                  <div>
                    Passed: {point.passed}/{point.total}
                  </div>
                  <div className="mt-1 text-[10px] text-gray-300">
                    Triggered: {point.triggeredBy}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between px-2 text-xs text-gray-500">
          <span>
            {trend[0]
              ? new Date(trend[0].timestamp).toLocaleDateString('zh-TW', {
                  month: 'short',
                  day: 'numeric',
                })
              : ''}
          </span>
          <span className="font-medium">Most Recent</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-gradient-to-t from-green-500 to-green-400" />
          <span>Excellent (≥95%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-gradient-to-t from-amber-500 to-amber-400" />
          <span>Good (80-94%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-gradient-to-t from-red-500 to-red-400" />
          <span>Poor (&lt;80%)</span>
        </div>
      </div>
    </div>
  );
}
