'use client';

import { useTranslations } from 'next-intl';
import { useSettings } from './SettingsContext';

export function SettingsBehaviorTab() {
  const t = useTranslations('settings');
  const {
    customSensitiveWords,
    setCustomSensitiveWords,
    sensitiveWordReply,
    setSensitiveWordReply,
    guidanceRules,
    setGuidanceRules,
    guidanceForm,
    setGuidanceForm,
    confidenceThreshold,
    setConfidenceThreshold,
    lowConfidenceAction,
    setLowConfidenceAction,
    handoffMessage,
    setHandoffMessage,
    businessHoursEnabled,
    setBusinessHoursEnabled,
    businessHours,
    setBusinessHours,
    outsideHoursMode,
    setOutsideHoursMode,
    outsideHoursMessage,
    setOutsideHoursMessage,
  } = useSettings();

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('sensitiveWords')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('sensitiveWordsDesc')}</p>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="sensitive-words" className="block text-sm font-medium text-gray-700">{t('sensitiveWords')}</label>
            <textarea
              id="sensitive-words"
              value={customSensitiveWords.join('\n')}
              onChange={(e) =>
                setCustomSensitiveWords(
                  e.target.value
                    .split('\n')
                    .map((w) => w.trim())
                    .filter(Boolean)
                )
              }
              rows={4}
              placeholder="每行輸入一個敏感詞"
              className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900 placeholder:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">{t('sensitiveWordCount', { count: customSensitiveWords.length })}</p>
          </div>
          <div>
            <label htmlFor="sensitive-word-reply" className="block text-sm font-medium text-gray-700">{t('sensitiveWordReply')}</label>
            <p className="text-xs text-gray-500">{t('sensitiveWordReplyDesc')}</p>
            <input
              id="sensitive-word-reply"
              type="text"
              value={sensitiveWordReply}
              onChange={(e) => setSensitiveWordReply(e.target.value)}
              placeholder={t('sensitiveWordReply')}
              className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('guidance')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('guidanceDesc')}</p>
        <div className="mt-4 space-y-2">
          {guidanceRules.map((r) => (
            <div key={r.id} className="flex items-start gap-2 rounded border p-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{r.rule_title}</p>
                <p className="text-xs text-gray-500 truncate">{r.rule_content}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(t('confirmDelete'))) return;
                  const res = await fetch(`/api/settings/guidance?id=${r.id}`, { method: 'DELETE', credentials: 'include' });
                  if (res.ok) setGuidanceRules((p) => p.filter((x) => x.id !== r.id));
                }}
                className="text-red-600 text-sm"
              >
                {t('delete')}
              </button>
            </div>
          ))}
          {guidanceForm ? (
            <div className="rounded border p-3 space-y-2">
              <input
                placeholder={t('ruleTitlePlaceholder')}
                value={guidanceForm.title}
                onChange={(e) => setGuidanceForm((p) => p && { ...p, title: e.target.value })}
                aria-label={t('ruleTitlePlaceholder')}
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
              />
              <textarea
                placeholder={t('ruleContentPlaceholder')}
                value={guidanceForm.content}
                onChange={(e) => setGuidanceForm((p) => p && { ...p, content: e.target.value })}
                rows={2}
                aria-label={t('ruleContentPlaceholder')}
                className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!guidanceForm.title.trim()) return;
                    const res = await fetch('/api/settings/guidance', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ rule_title: guidanceForm.title, rule_content: guidanceForm.content }),
                      credentials: 'include',
                    });
                    const d = await res.json();
                    if (d.rule) setGuidanceRules((p) => [...p, d.rule]);
                    setGuidanceForm(null);
                  }}
                  className="rounded bg-indigo-600 px-3 py-1 text-white text-sm"
                >
                  {t('save')}
                </button>
                <button type="button" onClick={() => setGuidanceForm(null)} className="text-gray-500 text-sm">
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setGuidanceForm({ title: '', content: '' })}
              disabled={guidanceRules.length >= 20}
              className="rounded border border-dashed px-3 py-2 text-sm text-gray-500 hover:border-indigo-500"
            >
              {guidanceRules.length >= 20 ? t('maxRulesReached') : t('addRule')}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('confidenceScore')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('confidenceThresholdDesc')}</p>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="confidence-threshold" className="block text-sm font-medium text-gray-700">{t('confidenceThreshold')}</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                id="confidence-threshold"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-12">{(confidenceThreshold * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <label htmlFor="low-confidence-action" className="block text-sm font-medium text-gray-700">{t('lowConfidenceAction')}</label>
            <select
              id="low-confidence-action"
              value={lowConfidenceAction}
              onChange={(e) => setLowConfidenceAction(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            >
              <option value="handoff">{t('actionHandoff')}</option>
              <option value="flag">{t('actionFlag')}</option>
              <option value="append_disclaimer">{t('actionDisclaimer')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="handoff-message" className="block text-sm font-medium text-gray-700">{t('handoffMessage')}</label>
            <input
              id="handoff-message"
              type="text"
              value={handoffMessage}
              onChange={(e) => setHandoffMessage(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t('businessHours')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('businessHoursDesc')}</p>
        <div className="mt-4 space-y-4">
          <label htmlFor="business-hours-enabled" className="flex items-center gap-2">
            <input id="business-hours-enabled" type="checkbox" checked={businessHoursEnabled} onChange={(e) => setBusinessHoursEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm font-medium text-gray-700">{t('enableBusinessHours')}</span>
          </label>
          {businessHoursEnabled && (
            <>
              <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                <div>
                  <label htmlFor="outside-hours-mode" className="block text-sm font-medium text-gray-700">{t('outsideHoursMode')}</label>
                  <select id="outside-hours-mode" value={outsideHoursMode} onChange={(e) => setOutsideHoursMode(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <option value="auto_reply">{t('modeAutoReply')}</option>
                    <option value="ai_only">{t('modeAiOnly')}</option>
                    <option value="collect_info">{t('modeCollectInfo')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="outside-hours-message" className="block text-sm font-medium text-gray-700">{t('outsideHoursMessage')}</label>
                  <textarea id="outside-hours-message" value={outsideHoursMessage} onChange={(e) => setOutsideHoursMessage(e.target.value)} rows={2} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-700">{t('scheduleTitle')}</span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setBusinessHours((p) => {
                        const s = { ...p.schedule };
                        (['mon', 'tue', 'wed', 'thu', 'fri'] as const).forEach((d) => { s[d] = { enabled: true, start: '09:00', end: '18:00' }; });
                        (['sat', 'sun'] as const).forEach((d) => { s[d] = { ...s[d], enabled: false }; });
                        return { ...p, schedule: s };
                      })}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      {t('presetWeekdays')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBusinessHours((p) => {
                        const s = { ...p.schedule };
                        (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).forEach((d) => { s[d] = { enabled: true, start: '09:00', end: '18:00' }; });
                        return { ...p, schedule: s };
                      })}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      {t('presetAllDay')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBusinessHours((p) => {
                        const s = { ...p.schedule };
                        (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).forEach((d) => { s[d] = { ...s[d], enabled: false }; });
                        return { ...p, schedule: s };
                      })}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      {t('presetAllOff')}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((d) => (
                    <div key={d} className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 ${businessHours.schedule[d].enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
                      <label className="flex min-w-[4rem] cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={businessHours.schedule[d].enabled} onChange={(e) => setBusinessHours((p) => ({ ...p, schedule: { ...p.schedule, [d]: { ...p.schedule[d], enabled: e.target.checked } } }))} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm font-medium text-gray-700">{t(d)}</span>
                      </label>
                      <div className={`flex items-center gap-2 ${!businessHours.schedule[d].enabled ? 'opacity-50' : ''}`}>
                        <input type="time" value={businessHours.schedule[d].start} onChange={(e) => setBusinessHours((p) => ({ ...p, schedule: { ...p.schedule, [d]: { ...p.schedule[d], start: e.target.value } } }))} disabled={!businessHours.schedule[d].enabled} aria-label={`${t(d)} 開始時間`} className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100" />
                        <span className="text-gray-400">–</span>
                        <input type="time" value={businessHours.schedule[d].end} onChange={(e) => setBusinessHours((p) => ({ ...p, schedule: { ...p.schedule, [d]: { ...p.schedule[d], end: e.target.value } } }))} disabled={!businessHours.schedule[d].enabled} aria-label={`${t(d)} 結束時間`} className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const first = (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).find((d) => businessHours.schedule[d].enabled);
                    if (!first) return;
                    const { start, end } = businessHours.schedule[first];
                    setBusinessHours((p) => {
                      const s = { ...p.schedule };
                      (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).forEach((d) => { s[d] = { ...s[d], start, end }; });
                      return { ...p, schedule: s };
                    });
                  }}
                  className="mt-2 text-xs text-indigo-600 hover:underline"
                >
                  {t('applyToAll')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
