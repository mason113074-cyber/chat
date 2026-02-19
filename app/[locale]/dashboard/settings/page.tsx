'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useToast } from '@/components/Toast';
import { QuickReplies } from '@/app/components/QuickReplies';
import type { QuickReply } from '@/lib/types';

const DEFAULT_SYSTEM_PROMPT = `你是一位專業且友善的客服助理。

主要職責：
- 即時回應客戶詢問，提供準確資訊
- 解答產品或服務相關問題
- 協助處理訂單查詢與售後服務
- 在必要時將複雜問題轉交給人工客服

回覆風格：
- 使用繁體中文
- 語氣親切、專業
- 回答簡潔明確
- 適時使用 emoji 讓對話更友善

⚠️ 重要限制：
- 不得承諾未經授權的折扣、賠償或退款
- 遇到退款、取消訂單等敏感問題，請回覆：「此問題需要專員處理，我已為您記錄」
- 不得提供醫療、法律、投資等專業建議
- 不確定答案時，誠實告知並提供轉接人工客服`;

const TONE_PRESETS = {
  friendly: `你是一位親切友善的客服助理 😊

主要職責：
- 用溫暖的語氣回應客戶，讓他們感到被關心
- 耐心解答各種問題，不厭其煩
- 適時給予鼓勵和正面回饋
- 用簡單易懂的語言說明

回覆風格：
- 使用繁體中文
- 語氣溫暖、親切、像朋友一樣
- 多使用 emoji 增加親和力 (每則訊息 2-3 個)
- 適時表達同理心`,

  professional: `您好，我是專業客服顧問。

主要職責：
- 提供精準、專業的產品與服務諮詢
- 以專業知識解決客戶疑問
- 維持高效率的溝通節奏
- 確保資訊準確無誤

回覆風格：
- 使用繁體中文，正式用語
- 語氣專業、有禮、條理清晰
- 避免過多 emoji，保持專業形象
- 使用完整句子，邏輯嚴謹`,

  concise: `我是快速客服助理。

職責：快速解決客戶問題

回覆原則：
- 繁體中文
- 簡短有力，直接切入重點
- 1-2 句話解決問題
- 只在必要時使用 emoji
- 避免廢話，提高效率`
};

const AI_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o', desc: 'settingsModelGpt4oDesc' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'settingsModelGpt4oMiniDesc' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', desc: 'settingsModelGpt35Desc' },
] as const;
const EXAMPLE_QUESTIONS_KEYS = ['exampleQ1', 'exampleQ2', 'exampleQ3'] as const;

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  { id: '1', text: '📦 查詢訂單狀態', enabled: true },
  { id: '2', text: '💰 運費怎麼計算？', enabled: true },
  { id: '3', text: '🔄 如何退換貨？', enabled: true },
];

export default function SettingsPage() {
  const t = useTranslations('settings');
  const toast = useToast();
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [storeName, setStoreName] = useState('');
  const [aiModel, setAiModel] = useState<string>('gpt-4o-mini');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(DEFAULT_QUICK_REPLIES);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');

  // Live Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestionKey, setPreviewQuestionKey] = useState<typeof EXAMPLE_QUESTIONS_KEYS[number]>(EXAMPLE_QUESTIONS_KEYS[0]);
  const [previewAnswer, setPreviewAnswer] = useState<string | 'pending' | 'updated' | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [lastSyncedPrompt, setLastSyncedPrompt] = useState('');
  const [lastSyncedModel, setLastSyncedModel] = useState('');

  // AI 測試相關狀態
  const [testMessage, setTestMessage] = useState('');
  const [testReply, setTestReply] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setLoadError(t('loadTimeout'));
        setIsLoading(false);
      }
    }, 10000);
    async function load() {
      try {
        const response = await fetch('/api/settings', { credentials: 'include' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message = (data && typeof data.error === 'string') ? data.error : t('loadFailed');
          throw new Error(message);
        }
        if (cancelled) return;
        if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
        if (data.storeName != null) setStoreName(data.storeName || '');
        if (data.aiModel && AI_MODELS.some((m) => m.id === data.aiModel)) setAiModel(data.aiModel);
        if (Array.isArray(data.quickReplies) && data.quickReplies.length > 0) {
          const padded: QuickReply[] = [...data.quickReplies];
          while (padded.length < 5) padded.push({ id: `slot-${padded.length}`, text: '', enabled: true });
          setQuickReplies(padded.slice(0, 5));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('載入設定失敗:', error);
          setLoadError(error instanceof Error ? error.message : t('loadFailed'));
        }
      } finally {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; clearTimeout(timeoutId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhook/line`);
    }
  }, []);

  useEffect(() => {
    if (previewAnswer !== null && previewAnswer !== 'pending' && (systemPrompt !== lastSyncedPrompt || aiModel !== lastSyncedModel)) {
      setPreviewAnswer('updated');
    }
  }, [systemPrompt, aiModel, lastSyncedPrompt, lastSyncedModel, previewAnswer]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          storeName,
          aiModel,
          quickReplies: quickReplies.filter((r) => r.text.trim()).slice(0, 5),
        }),
      });
      if (!response.ok) throw new Error(t('savedError'));
      toast.show(t('savedSuccess'), 'success');
    } catch (error) {
      console.error('Save failed:', error);
      toast.show(t('savedError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewReply = async (questionKeyOrText?: string) => {
    const isKey = questionKeyOrText != null && (EXAMPLE_QUESTIONS_KEYS as readonly string[]).includes(questionKeyOrText);
    const key = isKey ? (questionKeyOrText as typeof EXAMPLE_QUESTIONS_KEYS[number]) : previewQuestionKey;
    const questionText = isKey ? t(questionKeyOrText as typeof EXAMPLE_QUESTIONS_KEYS[number]) : (questionKeyOrText ?? t(previewQuestionKey));
    if (isKey) setPreviewQuestionKey(key);
    setPreviewLoading(true);
    setPreviewAnswer('pending');
    setLastSyncedPrompt(systemPrompt);
    setLastSyncedModel(aiModel);
    try {
      const res = await fetch('/api/settings/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          system_prompt: systemPrompt,
          ai_model: aiModel,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data && typeof data.error === 'string' ? data.error : null) || '預覽失敗');
      setPreviewAnswer(data.answer ?? '');
    } catch (e) {
      setPreviewAnswer(e instanceof Error ? e.message : '預覽失敗');
    } finally {
      setPreviewLoading(false);
    }
  };

  const welcomeText = systemPrompt.trim().split(/\n/)[0]?.trim() || '歡迎使用 CustomerAIPro！';

  const handleReset = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    toast.show(t('resetSuccess'), 'success');
  };

  const handleToneSelect = (tone: keyof typeof TONE_PRESETS) => {
    setSystemPrompt(TONE_PRESETS[tone]);
  };

  const handleTestAI = async () => {
    if (!testMessage.trim()) {
      setTestError(t('testEmptyError'));
      return;
    }

    setIsTesting(true);
    setTestError('');
    setTestReply('');

    try {
      const response = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          systemPrompt: systemPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData && typeof errorData.error === 'string' ? errorData.error : null) || '測試失敗');
      }

      const data = await response.json().catch(() => ({}));
      setTestReply(typeof data?.reply === 'string' ? data.reply : '');
    } catch (error) {
      console.error('AI 測試失敗:', error);
      setTestError(error instanceof Error ? error.message : t('savedError'));
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-3 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-xl font-semibold mb-2">{t('loadFailed')}</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            {t('reload')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      <p className="mt-1 text-gray-600">{t('subtitle')}</p>

      <div className="mt-8 flex flex-col lg:flex-row gap-8">
        {/* Left: Form lg:w-3/5 */}
        <div className="lg:w-3/5 space-y-6">
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

        {/* 快捷回覆按鈕 */}
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

        {/* System Prompt Editor Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">AI 回覆風格</h2>
          <p className="mt-1 text-sm text-gray-600">
            自訂 AI 助理的人格設定與回覆指導原則
          </p>

          {/* 語氣快速選擇 */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">快速選擇語氣：</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleToneSelect('friendly')}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
              >
                😊 親切友善
              </button>
              <button
                type="button"
                onClick={() => handleToneSelect('professional')}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
              >
                💼 專業正式
              </button>
              <button
                type="button"
                onClick={() => handleToneSelect('concise')}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
              >
                ⚡ 簡潔快速
              </button>
            </div>
          </div>

          {/* Textarea 編輯器 */}
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

          {/* 按鈕組 */}
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

        {/* AI 回覆測試區 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{t('aiReplyTest')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('aiReplyTestDesc')}</p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('simulateMessage')}
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('testResultLabel')}
                </label>
                <div className={`rounded-lg p-4 text-sm ${
                  testError 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-gray-50 text-gray-700'
                }`}>
                  {testError || testReply}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{t('quickLinks')}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard/knowledge-base"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50"
            >
              <span className="text-2xl">📚</span>
              <div>
                <p className="font-medium text-gray-900">{t('linkKnowledgeBase')}</p>
                <p className="text-sm text-gray-500">{t('linkKnowledgeBaseDesc')}</p>
              </div>
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50"
            >
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-gray-900">{t('linkAnalytics')}</p>
                <p className="text-sm text-gray-500">{t('linkAnalyticsDesc')}</p>
              </div>
            </Link>
          </div>
        </div>
        </div>

        {/* Right: Live Preview lg:w-2/5 lg:sticky lg:top-24 (hidden on mobile, use collapsible below) */}
        <div className="hidden lg:block lg:w-2/5 lg:sticky lg:top-24 self-start">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 shadow-sm border border-indigo-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('livePreview')}</h2>
            <div className="mx-auto max-w-sm rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden" style={{ height: '500px' }}>
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
                    {t(previewQuestionKey)}
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
                      <span className="text-gray-600">{t('previewNote')}</span>
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
      </div>

      {/* Mobile: Collapsible Preview */}
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
            <div className="mx-auto max-w-sm rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden" style={{ height: '500px' }}>
              <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-2">
                <span className="font-medium text-base truncate">{storeName || t('storeNamePlaceholder')}</span>
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              </div>
              <div className="h-[380px] overflow-y-auto p-4 space-y-3 bg-white [&_.quick-reply-btn]:text-base [&_.quick-reply-btn]:font-medium [&_.quick-reply-btn]:text-gray-800">
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-gray-200 text-gray-900 px-4 py-2.5 text-base font-medium leading-snug">{welcomeText}</div>
                </div>
                <QuickReplies items={quickReplies} onSelect={(query) => handlePreviewReply(query)} />
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-indigo-500 text-white px-4 py-2.5 text-base font-medium leading-snug">{t(previewQuestionKey)}</div>
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
                    {!previewLoading && previewAnswer === 'updated' && <span className="text-gray-600">{t('previewNote')}</span>}
                    {!previewLoading && previewAnswer === 'pending' && <span className="text-gray-600">{t('testing')}</span>}
                    {!previewLoading && previewAnswer !== null && previewAnswer !== 'pending' && previewAnswer !== 'updated' && <span className="whitespace-pre-wrap">{previewAnswer}</span>}
                    {!previewLoading && previewAnswer === null && <span className="text-gray-600">{t('previewNote')}</span>}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 p-2">
                <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-base text-gray-600">{t('inputPlaceholder')}</div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">{t('exampleQuestions')}</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUESTIONS_KEYS.map((q) => (
                  <button key={q} type="button" onClick={() => handlePreviewReply(q)} className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 font-medium hover:bg-gray-50">{t(q)}</button>
                ))}
              </div>
              <button type="button" onClick={() => handlePreviewReply()} disabled={previewLoading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{t('previewAiReply')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
