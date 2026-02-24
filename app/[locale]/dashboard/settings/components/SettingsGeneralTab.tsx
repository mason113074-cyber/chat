'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useSettings } from './SettingsContext';
import { AI_MODELS } from './settings-types';

export function SettingsGeneralTab() {
  const t = useTranslations('settings');
  const {
    webhookUrl,
    toast,
    setLineModalOpen,
    handleLineTest,
    lineTesting,
    lineTestResult,
    lineTestError,
    lineLoginBound,
    lineLoginDisplayName,
    lineLoginPhotoUrl,
    lineUnbinding,
    setLineUnbinding,
    setLineLoginBound,
    setLineLoginDisplayName,
    setLineLoginPhotoUrl,
    storeName,
    setStoreName,
    aiModel,
    setAiModel,
  } = useSettings();

  return (
    <>
      {/* LINE 整合狀態 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('lineIntegration')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('lineIntegrationDesc')}</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700">{t('lineConnected')}</span>
        </div>
        <div className="mt-3 rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">{t('webhookUrl')}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-gray-700 bg-white rounded px-2 py-1.5 border border-gray-200 truncate">
              {webhookUrl || '...'}
            </code>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && webhookUrl) {
                  navigator.clipboard.writeText(webhookUrl);
                  toast.show(t('webhookCopied'), 'success');
                }
              }}
              className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('copy')}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">{t('lineIntegrationHint')}</p>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => setLineModalOpen(true)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('editLineToken')}
          </button>
          <button
            type="button"
            onClick={handleLineTest}
            disabled={lineTesting}
            className="rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            {lineTesting ? t('testing') : t('testConnection')}
          </button>
          {lineTestResult === 'success' && (
            <span className="flex items-center text-sm text-green-600 font-medium">✅ {t('connectionSuccess')}</span>
          )}
          {lineTestResult === 'error' && (
            <span className="flex flex-col items-start gap-0.5">
              <span className="flex items-center text-sm text-red-600 font-medium">❌ {t('connectionFailed')}</span>
              {lineTestError && (
                <span className="text-xs text-red-500" title={lineTestError}>{lineTestError}</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* LINE 帳號綁定 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('lineLoginBinding')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('lineLoginBindingDesc')}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {lineLoginBound ? (
            <>
              {lineLoginPhotoUrl && (
                <Image src={lineLoginPhotoUrl} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {t('lineLoginBoundAs')} {lineLoginDisplayName || t('lineLoginBound')}
              </span>
              <button
                type="button"
                disabled={lineUnbinding}
                onClick={async () => {
                  setLineUnbinding(true);
                  try {
                    const res = await fetch('/api/auth/line/unbind', { method: 'POST', credentials: 'include' });
                    if (res.ok) {
                      setLineLoginBound(false);
                      setLineLoginDisplayName(null);
                      setLineLoginPhotoUrl(null);
                      toast.show(t('lineLoginUnbound'), 'success');
                    } else {
                      toast.show(t('lineLoginUnbindFailed'), 'error');
                    }
                  } catch {
                    toast.show(t('lineLoginUnbindFailed'), 'error');
                  } finally {
                    setLineUnbinding(false);
                  }
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {lineUnbinding ? t('unbinding') : t('lineLoginUnbind')}
              </button>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href="/api/auth/line?action=bind"
              className="inline-flex items-center gap-2 rounded-lg bg-[#06C755] px-4 py-2 text-sm font-medium text-white hover:bg-[#05b34a]"
            >
              <span>{t('lineLoginBindButton')}</span>
            </a>
          )}
        </div>
      </div>

      {/* 商店名稱 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('storeName')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('storeNameDesc')}</p>
        <input
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="我的商店"
          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20"
        />
      </div>

      {/* AI Model */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('aiModel')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('aiModelDesc')}</p>
        <div className="mt-3 space-y-2">
          {AI_MODELS.map((model) => (
            <label
              key={model.id}
              className="flex items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 cursor-pointer text-gray-700 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-900"
            >
              <input
                type="radio"
                name="ai_model"
                value={model.id}
                checked={aiModel === model.id}
                onChange={() => setAiModel(model.id)}
                className="mt-0.5 text-indigo-600"
              />
              <div>
                <span className="text-sm font-medium">{model.label}</span>
                <p className="text-xs text-gray-500 mt-0.5">{t(model.desc)}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
