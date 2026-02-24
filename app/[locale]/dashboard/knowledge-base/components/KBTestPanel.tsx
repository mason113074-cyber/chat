'use client';

import { CATEGORY_COLOR } from './kb-types';

export interface KBTestPanelProps {
  testPanelOpen: boolean;
  setTestPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  testQuestion: string;
  setTestQuestion: React.Dispatch<React.SetStateAction<string>>;
  testLoading: boolean;
  testAnswer: string | null;
  testSources: { id: string; title: string; category: string }[];
  handleTestSubmit: () => void;
  clearTestResult: () => void;
  getCategoryLabel: (category: string) => string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function KBTestPanel({
  testPanelOpen,
  setTestPanelOpen,
  testQuestion,
  setTestQuestion,
  testLoading,
  testAnswer,
  testSources,
  handleTestSubmit,
  clearTestResult,
  getCategoryLabel,
  t,
}: KBTestPanelProps) {
  return (
    <div className="mt-6 lg:mt-0 lg:sticky lg:top-24">
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-b from-indigo-50/80 to-purple-50/80 p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setTestPanelOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left font-semibold text-gray-900"
        >
          <span>{t('testAiReply')}</span>
          <span className="text-gray-500">{testPanelOpen ? '▼' : '▶'}</span>
        </button>
        {testPanelOpen && (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              data-testid="kb-test-question"
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              placeholder={t('testPlaceholder')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              disabled={testLoading}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestSubmit}
                disabled={testLoading || !testQuestion.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {testLoading ? t('testSubmitting') : t('testSubmit')}
              </button>
              {(testAnswer !== null || testSources.length > 0) && (
                <button
                  type="button"
                  onClick={clearTestResult}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {t('testClear')}
                </button>
              )}
            </div>
            {testAnswer !== null && (
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800">
                <p className="font-medium text-gray-700">{t('testAiResponse')}</p>
                <p className="mt-1 whitespace-pre-wrap">{testAnswer}</p>
              </div>
            )}
            {(testAnswer !== null || testSources.length > 0) && (
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <p className="font-medium text-gray-700">{t('testSources')}</p>
                {testSources.length === 0 ? (
                  <p className="mt-1 text-amber-700">{t('testNoSources')}</p>
                ) : (
                  <>
                    <p className="mt-1 text-gray-600">{t('testSourceCount', { count: testSources.length })}</p>
                    <div className="mt-2 space-y-2">
                      {testSources.map((s) => (
                        <div key={s.id} className="rounded border border-gray-100 bg-gray-50 px-2 py-1.5">
                          <span className="font-medium text-gray-900">{s.title}</span>
                          <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${CATEGORY_COLOR[s.category] ?? CATEGORY_COLOR.general}`}>
                            {getCategoryLabel(s.category)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
