'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useSettings } from './SettingsContext';

export function SettingsOptimizeTab() {
  const t = useTranslations('settings');
  const {
    abTests,
    setAbTests,
    abTestForm,
    setAbTestForm,
    testMessage,
    setTestMessage,
    testReply,
    isTesting,
    testError,
    handleTestAI,
  } = useSettings();

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('abTest')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('abTestDesc')}</p>
        <div className="mt-4 space-y-3">
          {abTests.map((test) => (
            <div key={test.id} className="rounded border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{test.name}</span>
                <span className="text-xs text-gray-500">
                  {test.status === 'draft' && t('abTestDraft')}
                  {test.status === 'running' && t('abTestRunning')}
                  {test.status === 'completed' && t('abTestCompleted')}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">A: {test.variant_a_prompt.slice(0, 50)}... | B: {test.variant_b_prompt.slice(0, 50)}... | {test.traffic_split}%</p>
              <div className="flex gap-2">
                {test.status === 'draft' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch('/api/settings/ab-test', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: test.id, status: 'running' }),
                        credentials: 'include',
                      });
                      if (res.ok) setAbTests((p) => p.map((x) => (x.id === test.id ? { ...x, status: 'running' } : x)));
                    }}
                    className="rounded bg-green-600 px-2 py-1 text-white text-xs"
                  >
                    {t('abTestStart')}
                  </button>
                )}
                {test.status === 'running' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch('/api/settings/ab-test', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: test.id, status: 'completed' }),
                        credentials: 'include',
                      });
                      if (res.ok) setAbTests((p) => p.map((x) => (x.id === test.id ? { ...x, status: 'completed' } : x)));
                    }}
                    className="rounded bg-amber-600 px-2 py-1 text-white text-xs"
                  >
                    {t('abTestStop')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(t('confirmDelete'))) return;
                    const res = await fetch(`/api/settings/ab-test?id=${test.id}`, { method: 'DELETE', credentials: 'include' });
                    if (res.ok) setAbTests((p) => p.filter((x) => x.id !== test.id));
                  }}
                  className="text-red-600 text-xs"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
          {abTestForm ? (
            <div className="rounded border p-3 space-y-2">
              <input
                placeholder={t('abTestName')}
                value={abTestForm.name}
                onChange={(e) => setAbTestForm((p) => p && { ...p, name: e.target.value })}
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
              />
              <textarea
                placeholder={t('abTestVariantA')}
                value={abTestForm.variantA}
                onChange={(e) => setAbTestForm((p) => p && { ...p, variantA: e.target.value })}
                rows={2}
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
              />
              <textarea
                placeholder={t('abTestVariantB')}
                value={abTestForm.variantB}
                onChange={(e) => setAbTestForm((p) => p && { ...p, variantB: e.target.value })}
                rows={2}
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
              />
              <div className="flex items-center gap-2">
                <label htmlFor="ab-test-traffic" className="text-sm">{t('abTestTrafficSplit')}</label>
                <input
                  id="ab-test-traffic"
                  type="range"
                  min={0}
                  max={100}
                  value={abTestForm.trafficSplit}
                  onChange={(e) => setAbTestForm((p) => p && { ...p, trafficSplit: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm w-12">{abTestForm.trafficSplit}%</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!abTestForm.name.trim() || !abTestForm.variantA.trim() || !abTestForm.variantB.trim()) return;
                    const res = await fetch('/api/settings/ab-test', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: abTestForm.name,
                        variant_a_prompt: abTestForm.variantA,
                        variant_b_prompt: abTestForm.variantB,
                        traffic_split: abTestForm.trafficSplit,
                      }),
                      credentials: 'include',
                    });
                    const d = await res.json();
                    if (d.test) setAbTests((p) => [...p, d.test]);
                    setAbTestForm(null);
                  }}
                  className="rounded bg-indigo-600 px-3 py-1 text-white text-sm"
                >
                  {t('save')}
                </button>
                <button type="button" onClick={() => setAbTestForm(null)} className="text-gray-500 text-sm">
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAbTestForm({ name: '', variantA: '', variantB: '', trafficSplit: 50 })}
              className="rounded border border-dashed px-3 py-2 text-sm text-gray-500 hover:border-indigo-500"
            >
              {t('abTestAdd')}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('aiReplyTest')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('aiReplyTestDesc')}</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('simulateMessage')}</label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full min-h-[100px] resize-y rounded-lg border border-gray-300 bg-white text-gray-900 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20"
              placeholder={t('simulatePlaceholder')}
            />
          </div>
          <button
            onClick={handleTestAI}
            disabled={isTesting || !testMessage.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <>
                <span className="animate-spin mr-2" role="status" aria-label={t('testing')}>⏳</span>
                {t('testing')}
              </>
            ) : (
              t('testReply')
            )}
          </button>
          {(testReply || testError) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('testResultLabel')}</label>
              <div className={`rounded-lg p-4 text-sm ${testError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-700'}`}>
                {testError || testReply}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('quickLinks')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href="/dashboard/knowledge-base" className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50">
            <span className="text-2xl">📚</span>
            <div>
              <p className="font-medium text-gray-900">{t('linkKnowledgeBase')}</p>
              <p className="text-sm text-gray-500">{t('linkKnowledgeBaseDesc')}</p>
            </div>
          </Link>
          <Link href="/dashboard/settings/bots" className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-medium text-gray-900">{t('linkBots')}</p>
              <p className="text-sm text-gray-500">{t('linkBotsDesc')}</p>
            </div>
          </Link>
          <Link href="/dashboard/analytics" className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50">
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-medium text-gray-900">{t('linkAnalytics')}</p>
              <p className="text-sm text-gray-500">{t('linkAnalyticsDesc')}</p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
