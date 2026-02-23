'use client';

import { useTranslations } from 'next-intl';
import { QuickReplies } from '@/app/components/QuickReplies';
import { useSettings } from './SettingsContext';
import { EXAMPLE_QUESTIONS_KEYS } from './settings-types';

function PreviewInner() {
  const t = useTranslations('settings');
  const {
    storeName,
    welcomeText,
    quickReplies,
    handlePreviewReply,
    lastPreviewQuestionRef,
    previewQuestionDisplay,
    previewQuestionKey,
    previewLoading,
    previewAnswer,
  } = useSettings();

  return (
    <>
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-2">
        <span className="font-medium text-base truncate">{storeName || t('storeNamePlaceholder')}</span>
        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="線上" />
      </div>
      <div className="h-[380px] overflow-y-auto p-4 space-y-3 bg-white [&_.quick-reply-btn]:text-base [&_.quick-reply-btn]:font-medium [&_.quick-reply-btn]:text-gray-800">
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-gray-200 text-gray-900 px-4 py-2.5 text-base font-medium leading-snug">
            {welcomeText}
          </div>
        </div>
        <QuickReplies items={quickReplies} onSelect={(query) => handlePreviewReply(query)} />
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-indigo-500 text-white px-4 py-2.5 text-base font-medium leading-snug">
            {lastPreviewQuestionRef.current || previewQuestionDisplay || t(previewQuestionKey)}
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-gray-200 text-gray-900 px-4 py-2.5 text-base font-medium leading-snug">
            {previewLoading && (
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-500 animate-typing-dot" />
                <span className="w-2 h-2 rounded-full bg-gray-500 animate-typing-dot" />
                <span className="w-2 h-2 rounded-full bg-gray-500 animate-typing-dot" />
              </span>
            )}
            {!previewLoading && previewAnswer === 'updated' && (
              <span className="text-gray-600">{t('previewStale')}</span>
            )}
            {!previewLoading && previewAnswer === 'pending' && (
              <span className="text-gray-600">{t('testing')}</span>
            )}
            {!previewLoading && previewAnswer !== null && previewAnswer !== 'pending' && previewAnswer !== 'updated' && (
              <span className="whitespace-pre-wrap">{previewAnswer}</span>
            )}
            {!previewLoading && previewAnswer === null && (
              <span className="text-gray-600">{t('previewNote')}</span>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 p-2">
        <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-base text-gray-600">
          {t('inputPlaceholder')}
        </div>
      </div>
    </>
  );
}

export function SettingsLivePreviewDesktop() {
  const t = useTranslations('settings');
  const { handlePreviewReply, previewLoading } = useSettings();

  return (
    <div className="hidden lg:block lg:w-2/5 lg:sticky lg:top-24 self-start">
      <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 shadow-sm border border-indigo-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('livePreview')}</h2>
        <div className="mx-auto max-w-sm h-[500px] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <PreviewInner />
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-gray-700">{t('exampleQuestions')}</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS_KEYS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handlePreviewReply(q)}
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 font-medium hover:bg-gray-50"
              >
                {t(q)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handlePreviewReply()}
            disabled={previewLoading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('previewAiReply')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsLivePreviewMobile() {
  const t = useTranslations('settings');
  const { previewOpen, setPreviewOpen, handlePreviewReply, previewLoading } = useSettings();

  return (
    <div className="mt-8 lg:hidden">
      <button
        type="button"
        onClick={() => setPreviewOpen((o) => !o)}
        className="w-full rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-3 text-left font-medium text-gray-900"
      >
        {previewOpen ? t('collapsePreview') : t('expandPreview')}
      </button>
      {previewOpen && (
        <div className="mt-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 shadow-sm border border-indigo-100">
          <div className="mx-auto max-w-sm h-[500px] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <PreviewInner />
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-gray-700">{t('exampleQuestions')}</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS_KEYS.map((q) => (
                <button key={q} type="button" onClick={() => handlePreviewReply(q)} className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 font-medium hover:bg-gray-50">
                  {t(q)}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => handlePreviewReply()} disabled={previewLoading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {t('previewAiReply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
