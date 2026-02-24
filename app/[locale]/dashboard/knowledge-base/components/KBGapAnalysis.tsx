'use client';

import type { GapSuggestion } from './kb-types';

export interface KBGapAnalysisProps {
  gapLoading: boolean;
  gapSuggestions: GapSuggestion[];
  adoptingId: string | null;
  loadGapAnalysis: () => void;
  adoptSuggestion: (s: GapSuggestion) => void;
  getCategoryLabel: (category: string) => string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function KBGapAnalysis({
  gapLoading,
  gapSuggestions,
  adoptingId,
  loadGapAnalysis,
  adoptSuggestion,
  getCategoryLabel,
  t,
}: KBGapAnalysisProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('gapAnalysisTitle')}</h2>
          <p className="text-sm text-gray-500">{t('gapAnalysisDesc')}</p>
        </div>
        <button
          type="button"
          onClick={loadGapAnalysis}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          {t('reload')}
        </button>
      </div>
      <div className="mt-4">
        {gapLoading ? (
          <p className="text-sm text-gray-500">{t('loading')}</p>
        ) : gapSuggestions.length === 0 ? (
          <p className="text-sm text-gray-500">{t('noData')}</p>
        ) : (
          <div className="space-y-3">
            {gapSuggestions.map((s) => (
              <div key={s.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{s.suggestedTitle}</p>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{s.questionExample}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('frequency')}: {s.frequency} · {t('fieldCategory')}: {getCategoryLabel(s.suggestedCategory)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => adoptSuggestion(s)}
                    disabled={adoptingId === s.id}
                    className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {adoptingId === s.id ? t('saving') : t('adoptSuggestion')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
