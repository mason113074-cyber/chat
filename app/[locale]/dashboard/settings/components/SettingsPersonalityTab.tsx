'use client';

import { useTranslations } from 'next-intl';
import { useSettings } from './SettingsContext';

export function SettingsPersonalityTab() {
  const t = useTranslations('settings');
  const {
    maxReplyLength,
    setMaxReplyLength,
    replyTemperature,
    setReplyTemperature,
    replyFormat,
    setReplyFormat,
    replyDelaySeconds,
    setReplyDelaySeconds,
    showTypingIndicator,
    setShowTypingIndicator,
    autoDetectLanguage,
    setAutoDetectLanguage,
    supportedLanguages,
    setSupportedLanguages,
    fallbackLanguage,
    setFallbackLanguage,
    systemPrompt,
    setSystemPrompt,
    handleSave,
    handleReset,
    handleToneSelect,
    isSaving,
  } = useSettings();

  return (
    <>
      {/* Sprint 1: 回覆控制 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('replyControl')}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="max-reply-length" className="block text-sm font-medium text-gray-700">{t('maxReplyLength')}</label>
            <p className="text-xs text-gray-500">{t('maxReplyLengthDesc')}</p>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="max-reply-length"
                type="range"
                min={50}
                max={1000}
                step={50}
                value={maxReplyLength}
                onChange={(e) => setMaxReplyLength(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
              />
              <span className="text-sm font-medium text-gray-600 w-16">{maxReplyLength}</span>
            </div>
          </div>
          <div>
            <label htmlFor="reply-temperature" className="block text-sm font-medium text-gray-700">{t('replyTemperature')}</label>
            <p className="text-xs text-gray-500">{t('replyTemperatureDesc')}</p>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="reply-temperature"
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={replyTemperature}
                onChange={(e) => setReplyTemperature(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
              />
              <span className="text-sm font-medium text-gray-600 w-12">{replyTemperature.toFixed(1)}</span>
            </div>
          </div>
          <div>
            <label htmlFor="reply-format" className="block text-sm font-medium text-gray-700">{t('replyFormat')}</label>
            <select
              id="reply-format"
              value={replyFormat}
              onChange={(e) => setReplyFormat(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="plain">{t('replyFormatPlain')}</option>
              <option value="bullet">{t('replyFormatBullet')}</option>
              <option value="concise">{t('replyFormatConcise')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sprint 3: 回覆延遲 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('replyDelay')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('replyDelayDesc')}</p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="reply-delay" className="block text-sm font-medium text-gray-700">{t('replyDelaySeconds')}</label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="reply-delay"
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={replyDelaySeconds}
                onChange={(e) => setReplyDelaySeconds(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
              />
              <span className="text-sm font-medium text-gray-600 w-14">{t('replyDelaySecondsValue', { seconds: replyDelaySeconds })}</span>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showTypingIndicator}
              onChange={(e) => setShowTypingIndicator(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">{t('showTypingIndicator')}</span>
          </label>
          <p className="text-xs text-gray-500">{t('showTypingIndicatorDesc')}</p>
        </div>
      </div>

      {/* Sprint 4: 多語言 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('multiLanguage')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('autoDetectLanguageDesc')}</p>
        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoDetectLanguage}
              onChange={(e) => setAutoDetectLanguage(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">{t('autoDetectLanguage')}</span>
          </label>
          {autoDetectLanguage && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('supportedLanguages')}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      ['zh-TW', 'langZhTW'],
                      ['en', 'langEn'],
                      ['ja', 'langJa'],
                      ['ko', 'langKo'],
                      ['th', 'langTh'],
                      ['vi', 'langVi'],
                    ] as const
                  ).map(([lang, key]) => (
                    <label key={lang} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={supportedLanguages.includes(lang)}
                        onChange={(e) => {
                          if (e.target.checked) setSupportedLanguages((p) => [...p, lang]);
                          else setSupportedLanguages((p) => p.filter((l) => l !== lang));
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{t(key)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="fallback-language" className="block text-sm font-medium text-gray-700">{t('fallbackLanguage')}</label>
                <select
                  id="fallback-language"
                  value={fallbackLanguage}
                  onChange={(e) => setFallbackLanguage(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="zh-TW">{t('langZhTW')}</option>
                  <option value="en">{t('langEn')}</option>
                  <option value="ja">{t('langJa')}</option>
                  <option value="ko">{t('langKo')}</option>
                  <option value="th">{t('langTh')}</option>
                  <option value="vi">{t('langVi')}</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* System Prompt Editor (AI 回覆風格) */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('aiReplyStyle')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('aiReplyStyleDesc')}</p>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">{t('quickToneSelect')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleToneSelect('friendly')}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
            >
              {t('toneFriendly')}
            </button>
            <button
              type="button"
              onClick={() => handleToneSelect('professional')}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
            >
              {t('toneProfessional')}
            </button>
            <button
              type="button"
              onClick={() => handleToneSelect('concise')}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
            >
              {t('toneConcise')}
            </button>
          </div>
        </div>
        <div className="mt-4">
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full min-h-[200px] resize-y rounded-lg border border-gray-300 bg-white text-gray-900 p-4 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20"
            placeholder={t('systemPromptPlaceholder')}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>{systemPrompt.length} {t('characters')}</span>
            {systemPrompt.length > 2000 && (
              <span className="text-amber-600 font-medium">⚠ {t('promptTooLong')}</span>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2" role="status" aria-label={t('saving')}>⏳</span>
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            {t('resetDefault')}
          </button>
        </div>
      </div>
    </>
  );
}
