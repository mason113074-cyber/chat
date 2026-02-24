'use client';

import { useTranslations } from 'next-intl';
import type { QuickReply } from '@/lib/types';
import { useSettings } from './SettingsContext';

export function SettingsExperienceTab() {
  const t = useTranslations('settings');
  const {
    feedbackEnabled,
    setFeedbackEnabled,
    feedbackMessage,
    setFeedbackMessage,
    conversationMemoryCount,
    setConversationMemoryCount,
    conversationMemoryMode,
    setConversationMemoryMode,
    welcomeMessageEnabled,
    setWelcomeMessageEnabled,
    welcomeMessage,
    setWelcomeMessage,
    quickReplies,
    setQuickReplies,
  } = useSettings();

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('feedback')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('feedbackDesc')}</p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={feedbackEnabled} onChange={(e) => setFeedbackEnabled(e.target.checked)} className="rounded" />
            <span className="text-sm">{t('enableFeedback')}</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('feedbackMessage')}</label>
            <input type="text" value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} placeholder={t('feedbackMessagePlaceholder')} className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('conversationMemory')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('memoryCountDesc')}</p>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="memory-count" className="block text-sm font-medium text-gray-700">{t('memoryCount')}</label>
            <div className="flex items-center gap-2 mt-1">
              <input id="memory-count" type="range" min={1} max={30} value={conversationMemoryCount} onChange={(e) => setConversationMemoryCount(Number(e.target.value))} className="flex-1" />
              <span className="text-sm w-8">{conversationMemoryCount}</span>
            </div>
          </div>
          <div>
            <label htmlFor="memory-mode" className="block text-sm font-medium text-gray-700">{t('memoryMode')}</label>
            <select id="memory-mode" value={conversationMemoryMode} onChange={(e) => setConversationMemoryMode(e.target.value)} className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900">
              <option value="recent">{t('modeRecent')}</option>
              <option value="summary">{t('modeSummary')}</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">{t('memorySummaryNote')}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('welcomeMessage')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('welcomeMessageDesc')}</p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={welcomeMessageEnabled} onChange={(e) => setWelcomeMessageEnabled(e.target.checked)} className="rounded" />
            <span className="text-sm">{t('enableWelcomeMessage')}</span>
          </label>
          <div>
            <label htmlFor="welcome-message" className="block text-sm font-medium text-gray-700">{t('welcomeMessageContent')}</label>
            <textarea id="welcome-message" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3} placeholder={t('welcomeMessagePlaceholder')} className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400" />
            <p className="mt-1 text-xs text-gray-500">{t('characterCount', { count: welcomeMessage.length })}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('quickReplyButtons')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('quickReplyDesc')}</p>
        <div className="mt-4 space-y-3">
          {(() => {
            const padded: QuickReply[] = [...quickReplies];
            while (padded.length < 5) padded.push({ id: `slot-${padded.length}`, text: '', enabled: true });
            return padded.slice(0, 5).map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  aria-label={t('commonQuestionSlot', { index: index + 1 })}
                  onChange={() => {
                    setQuickReplies((prev) => {
                      const p = [...prev];
                      while (p.length < 5) p.push({ id: `slot-${p.length}`, text: '', enabled: true });
                      p[index] = { ...p[index], enabled: !p[index].enabled };
                      return p.slice(0, 5);
                    });
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQuickReplies((prev) => {
                      const p = [...prev];
                      while (p.length < 5) p.push({ id: `slot-${p.length}`, text: '', enabled: true });
                      p[index] = { ...p[index], text: v };
                      return p.slice(0, 5);
                    });
                  }}
                  placeholder={t('commonQuestionSlot', { index: index + 1 })}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20"
                />
              </div>
            ));
          })()}
        </div>
      </div>
    </>
  );
}
