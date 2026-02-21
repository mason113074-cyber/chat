'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useToast } from '@/components/Toast';
import { QuickReplies } from '@/app/components/QuickReplies';
import { ContextualHelp } from '@/components/help/ContextualHelp';
import type { QuickReply } from '@/lib/types';

/** 已知的繁中預設快捷回覆文案（含舊版），用於載入時若介面為英文則改顯示當前語系翻譯 */
const ZH_QUICK_REPLY_SLOTS: [string[], string[], string[]] = [
  ['查詢訂單狀態', '你們的營業時間是幾點'],
  ['運費怎麼計算', '有什麼優惠活動嗎'],
  ['如何退換貨'],
];
function isZhDefaultQuickReply(slotIndex: number, text: string): boolean {
  const trimmed = (text ?? '').trim();
  const variants = ZH_QUICK_REPLY_SLOTS[slotIndex];
  return variants.some((v) => trimmed.includes(v));
}

/** 繁中系統提示常見開頭，用於判斷是否為預設/語氣範本，在英文介面下改顯示英文預設 */
const ZH_SYSTEM_PROMPT_PREFIXES = [
  '你是這位商家的專業客服',
  '你是一位親切友善的客服助理',
  '你是一位專業且友善的客服助理',
  '您好，我是專業客服顧問',
  '我是快速客服助理',
  '你是本商店的 AI 客服助理',
];
function isZhDefaultSystemPrompt(prompt: string): boolean {
  const firstLine = prompt.trim().split(/\n/)[0]?.trim() ?? '';
  return ZH_SYSTEM_PROMPT_PREFIXES.some((prefix) => firstLine.includes(prefix));
}

/** 繁中歡迎訊息預設，用於載入時若介面為英文則改顯示英文預設 */
const ZH_WELCOME_MESSAGE_PREFIXES = ['歡迎！我是 AI 客服助手', '歡迎!我是 AI 客服助手'];
function isZhDefaultWelcomeMessage(msg: string): boolean {
  const trimmed = (msg ?? '').trim();
  return ZH_WELCOME_MESSAGE_PREFIXES.some((p) => trimmed.includes(p));
}

const AI_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o', desc: 'settingsModelGpt4oDesc' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'settingsModelGpt4oMiniDesc' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', desc: 'settingsModelGpt35Desc' },
] as const;
const EXAMPLE_QUESTIONS_KEYS = ['exampleQ1', 'exampleQ2', 'exampleQ3'] as const;

export default function SettingsPage() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const toast = useToast();
  const defaultSystemPrompt = useMemo(() => t('defaultSystemPrompt'), [t]);
  const defaultQuickReplies = useMemo<QuickReply[]>(
    () => [
      { id: '1', text: t('exampleQ1'), enabled: true },
      { id: '2', text: t('exampleQ2'), enabled: true },
      { id: '3', text: t('exampleQ3'), enabled: true },
    ],
    [t]
  );
  const [systemPrompt, setSystemPrompt] = useState(defaultSystemPrompt);
  const [storeName, setStoreName] = useState('');
  const [aiModel, setAiModel] = useState<string>('gpt-4o-mini');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(defaultQuickReplies);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');

  // Live Preview: user bubble shows this text. Ref updated synchronously on click so bubble never shows stale example.
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestionKey, setPreviewQuestionKey] = useState<typeof EXAMPLE_QUESTIONS_KEYS[number]>(EXAMPLE_QUESTIONS_KEYS[0]);
  const [previewQuestionDisplay, setPreviewQuestionDisplay] = useState<string>('');
  const lastPreviewQuestionRef = useRef<string>('');
  const [previewAnswer, setPreviewAnswer] = useState<string | 'pending' | 'updated' | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [lastSyncedPrompt, setLastSyncedPrompt] = useState('');
  const [lastSyncedModel, setLastSyncedModel] = useState('');

  // AI 測試相關狀態
  const [testMessage, setTestMessage] = useState('');
  const [testReply, setTestReply] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState('');

  // LINE Token 設定
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [lineChannelId, setLineChannelId] = useState('');
  const [lineChannelSecret, setLineChannelSecret] = useState('');
  const [lineAccessToken, setLineAccessToken] = useState('');
  const [lineSaving, setLineSaving] = useState(false);
  const [lineTesting, setLineTesting] = useState(false);
  const [lineTestResult, setLineTestResult] = useState<'success' | 'error' | null>(null);
  const [lineTestError, setLineTestError] = useState<string | null>(null);

  // LINE 登入綁定（用 LINE 登入 / 綁定 LINE）
  const [lineLoginBound, setLineLoginBound] = useState(false);
  const [lineLoginDisplayName, setLineLoginDisplayName] = useState<string | null>(null);
  const [lineLoginPhotoUrl, setLineLoginPhotoUrl] = useState<string | null>(null);
  const [lineUnbinding, setLineUnbinding] = useState(false);

  // Sprint 1–4: 回覆控制、敏感詞、延遲、多語言
  const [maxReplyLength, setMaxReplyLength] = useState(500);
  const [replyTemperature, setReplyTemperature] = useState(0.2);
  const [replyFormat, setReplyFormat] = useState('plain');
  const [customSensitiveWords, setCustomSensitiveWords] = useState<string[]>([]);
  const [sensitiveWordReply, setSensitiveWordReply] = useState('此問題涉及敏感內容，建議聯繫人工客服。');
  const [replyDelaySeconds, setReplyDelaySeconds] = useState(0);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['zh-TW']);
  const [fallbackLanguage, setFallbackLanguage] = useState('zh-TW');

  // Sprint 5: Guidance（獨立 API）
  const [guidanceRules, setGuidanceRules] = useState<{ id: string; rule_title: string; rule_content: string; is_enabled: boolean }[]>([]);
  const [guidanceForm, setGuidanceForm] = useState<{ title: string; content: string } | null>(null);

  // Sprint 6–10
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);
  const [lowConfidenceAction, setLowConfidenceAction] = useState('handoff');
  const [handoffMessage, setHandoffMessage] = useState('這個問題需要專人為您處理，請稍候。');
  const [businessHoursEnabled, setBusinessHoursEnabled] = useState(false);
  const [businessHours, setBusinessHours] = useState({
    timezone: 'Asia/Taipei',
    schedule: {
      mon: { enabled: true, start: '09:00', end: '18:00' },
      tue: { enabled: true, start: '09:00', end: '18:00' },
      wed: { enabled: true, start: '09:00', end: '18:00' },
      thu: { enabled: true, start: '09:00', end: '18:00' },
      fri: { enabled: true, start: '09:00', end: '18:00' },
      sat: { enabled: false, start: '09:00', end: '18:00' },
      sun: { enabled: false, start: '09:00', end: '18:00' },
    },
  });
  const [outsideHoursMode, setOutsideHoursMode] = useState('auto_reply');
  const [outsideHoursMessage, setOutsideHoursMessage] = useState('感謝您的訊息！目前為非營業時間，我們將在營業時間盡快回覆您。');
  const [feedbackEnabled, setFeedbackEnabled] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('這個回覆有幫助嗎？');
  const [conversationMemoryCount, setConversationMemoryCount] = useState(5);
  const [conversationMemoryMode, setConversationMemoryMode] = useState('recent');
  const defaultWelcomeMessage = useMemo(() => t('welcomeMessagePlaceholder'), [t]);
  const [welcomeMessageEnabled, setWelcomeMessageEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(defaultWelcomeMessage);

  // Sprint 12: A/B Test
  const [abTests, setAbTests] = useState<{ id: string; name: string; variant_a_prompt: string; variant_b_prompt: string; traffic_split: number; status: string }[]>([]);
  const [abTestForm, setAbTestForm] = useState<{ name: string; variantA: string; variantB: string; trafficSplit: number } | null>(null);

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
        let loadedPrompt = data.systemPrompt;
        if (loadedPrompt && locale === 'en' && isZhDefaultSystemPrompt(loadedPrompt)) {
          loadedPrompt = t('defaultSystemPrompt');
        }
        if (loadedPrompt) setSystemPrompt(loadedPrompt);
        if (data.storeName != null) setStoreName(data.storeName || '');
        if (data.aiModel && AI_MODELS.some((m) => m.id === data.aiModel)) setAiModel(data.aiModel);
        if (data.lineLoginBound != null) setLineLoginBound(data.lineLoginBound);
        if (data.lineLoginDisplayName != null) setLineLoginDisplayName(data.lineLoginDisplayName);
        if (data.lineLoginPhotoUrl != null) setLineLoginPhotoUrl(data.lineLoginPhotoUrl);
        if (Array.isArray(data.quickReplies) && data.quickReplies.length > 0) {
          let padded: QuickReply[] = [...data.quickReplies];
          while (padded.length < 5) padded.push({ id: `slot-${padded.length}`, text: '', enabled: true });
          padded = padded.slice(0, 5);
          if (locale === 'en') {
            padded = padded.map((item, i) => {
              if (i === 0 && isZhDefaultQuickReply(0, item.text)) return { ...item, text: t('exampleQ1') };
              if (i === 1 && isZhDefaultQuickReply(1, item.text)) return { ...item, text: t('exampleQ2') };
              if (i === 2 && isZhDefaultQuickReply(2, item.text)) return { ...item, text: t('exampleQ3') };
              return item;
            });
          }
          setQuickReplies(padded);
        }
        if (typeof data.maxReplyLength === 'number') setMaxReplyLength(data.maxReplyLength);
        if (typeof data.replyTemperature === 'number') setReplyTemperature(data.replyTemperature);
        if (['plain', 'bullet', 'concise'].includes(data.replyFormat)) setReplyFormat(data.replyFormat);
        if (Array.isArray(data.customSensitiveWords)) setCustomSensitiveWords(data.customSensitiveWords);
        if (typeof data.sensitiveWordReply === 'string') setSensitiveWordReply(data.sensitiveWordReply);
        if (typeof data.replyDelaySeconds === 'number') setReplyDelaySeconds(data.replyDelaySeconds);
        if (typeof data.showTypingIndicator === 'boolean') setShowTypingIndicator(data.showTypingIndicator);
        if (typeof data.autoDetectLanguage === 'boolean') setAutoDetectLanguage(data.autoDetectLanguage);
        if (Array.isArray(data.supportedLanguages)) setSupportedLanguages(data.supportedLanguages);
        if (['zh-TW', 'en', 'ja', 'ko', 'th', 'vi'].includes(data.fallbackLanguage)) setFallbackLanguage(data.fallbackLanguage);
        if (typeof data.confidenceThreshold === 'number') setConfidenceThreshold(data.confidenceThreshold);
        if (['handoff', 'flag', 'append_disclaimer'].includes(data.lowConfidenceAction)) setLowConfidenceAction(data.lowConfidenceAction);
        if (typeof data.handoffMessage === 'string') setHandoffMessage(data.handoffMessage);
        if (typeof data.businessHoursEnabled === 'boolean') setBusinessHoursEnabled(data.businessHoursEnabled);
        if (data.businessHours && typeof data.businessHours === 'object') setBusinessHours(data.businessHours);
        if (['auto_reply', 'ai_only', 'collect_info'].includes(data.outsideHoursMode)) setOutsideHoursMode(data.outsideHoursMode);
        if (typeof data.outsideHoursMessage === 'string') setOutsideHoursMessage(data.outsideHoursMessage);
        if (typeof data.feedbackEnabled === 'boolean') setFeedbackEnabled(data.feedbackEnabled);
        if (typeof data.feedbackMessage === 'string') setFeedbackMessage(data.feedbackMessage);
        if (typeof data.conversationMemoryCount === 'number') setConversationMemoryCount(data.conversationMemoryCount);
        if (['recent', 'summary'].includes(data.conversationMemoryMode)) setConversationMemoryMode(data.conversationMemoryMode);
        if (typeof data.welcomeMessageEnabled === 'boolean') setWelcomeMessageEnabled(data.welcomeMessageEnabled);
        if (typeof data.welcomeMessage === 'string') {
          let loadedWelcome = data.welcomeMessage;
          if (loadedWelcome && locale === 'en' && isZhDefaultWelcomeMessage(loadedWelcome)) {
            loadedWelcome = t('welcomeMessagePlaceholder');
          }
          setWelcomeMessage(loadedWelcome);
        }
        try {
          const guidanceRes = await fetch('/api/settings/guidance', { credentials: 'include' });
          if (guidanceRes.ok && !cancelled) {
            const g = await guidanceRes.json();
            if (Array.isArray(g.rules)) setGuidanceRules(g.rules);
          }
        } catch {
          /* ignore */
        }
        try {
          const abRes = await fetch('/api/settings/ab-test', { credentials: 'include' });
          if (abRes.ok && !cancelled) {
            const ab = await abRes.json();
            if (Array.isArray(ab.tests)) setAbTests(ab.tests);
          }
        } catch {
          /* ignore */
        }
        try {
          const lineRes = await fetch('/api/settings/line', { credentials: 'include' });
          if (lineRes.ok && !cancelled) {
            const lineData = await lineRes.json();
            if (lineData.channel_id) setLineChannelId(lineData.channel_id);
            if (lineData.channel_secret_masked) setLineChannelSecret(lineData.channel_secret_masked);
            if (lineData.access_token_masked) setLineAccessToken(lineData.access_token_masked);
          }
        } catch {
          // LINE 設定讀取失敗不阻塞主設定載入
        }
        if (typeof window !== 'undefined' && !cancelled) {
          const params = new URLSearchParams(window.location.search);
          if (params.get('line_bind') === 'success') {
            toast.show(t('lineLoginBindSuccess'), 'success');
            window.history.replaceState({}, '', window.location.pathname);
          }
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
          maxReplyLength,
          replyTemperature,
          replyFormat,
          customSensitiveWords,
          sensitiveWordReply,
          replyDelaySeconds,
          showTypingIndicator,
          autoDetectLanguage,
          supportedLanguages,
          fallbackLanguage,
          confidenceThreshold,
          lowConfidenceAction,
          handoffMessage,
          businessHoursEnabled,
          businessHours,
          outsideHoursMode,
          outsideHoursMessage,
          feedbackEnabled,
          feedbackMessage,
          conversationMemoryCount,
          conversationMemoryMode,
          welcomeMessageEnabled,
          welcomeMessage,
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
    lastPreviewQuestionRef.current = questionText;
    setPreviewQuestionDisplay(questionText);
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
          maxReplyLength,
          replyTemperature,
          replyFormat,
          autoDetectLanguage,
          supportedLanguages,
          fallbackLanguage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data && typeof data.error === 'string' ? data.error : null) || t('previewFailed'));
      setPreviewAnswer(data.answer ?? '');
    } catch (e) {
      setPreviewAnswer(e instanceof Error ? e.message : t('previewFailed'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const welcomeText = systemPrompt.trim().split(/\n/)[0]?.trim() || t('welcomeFallback');

  const handleReset = () => {
    setSystemPrompt(t('defaultSystemPrompt'));
    toast.show(t('resetSuccess'), 'success');
  };

  const handleToneSelect = (tone: 'friendly' | 'professional' | 'concise') => {
    setSystemPrompt(t(`tonePreset${tone.charAt(0).toUpperCase() + tone.slice(1)}` as 'tonePresetFriendly' | 'tonePresetProfessional' | 'tonePresetConcise'));
  };

  const handleLineSave = async () => {
    setLineSaving(true);
    setLineTestResult(null);
    try {
      const body: Record<string, string> = {};
      if (lineChannelId && !lineChannelId.startsWith('- ')) body.channel_id = lineChannelId;
      if (lineChannelSecret && !lineChannelSecret.startsWith('- ')) body.channel_secret = lineChannelSecret;
      if (lineAccessToken && !lineAccessToken.startsWith('- ')) body.access_token = lineAccessToken;
      const res = await fetch('/api/settings/line', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.show(t('savedSuccess'), 'success');
      setLineModalOpen(false);
    } catch {
      toast.show(t('savedError'), 'error');
    } finally {
      setLineSaving(false);
    }
  };

  const handleLineTest = async () => {
    setLineTesting(true);
    setLineTestResult(null);
    setLineTestError(null);
    try {
      const res = await fetch('/api/settings/line/test', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setLineTestResult('success');
      } else {
        setLineTestResult('error');
        const apiError = typeof data?.error === 'string' ? data.error : '';
        let msg = t('connectionFailed');
        if (apiError.includes('No access token') || apiError.includes('No Access Token')) msg = t('lineTestErrorNoToken');
        else if (apiError.includes('Invalid token') || apiError.includes('Invalid Token')) msg = t('lineTestErrorInvalidToken');
        else if (apiError.includes('Connection failed') || apiError.includes('Connection Failed')) msg = t('lineTestErrorConnection');
        else if (apiError) msg = apiError;
        setLineTestError(msg);
      }
    } catch {
      setLineTestResult('error');
      setLineTestError(t('connectionFailed'));
    } finally {
      setLineTesting(false);
    }
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
      setTestError(error instanceof Error ? error.message : t('testFailed'));
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

        {/* LINE 帳號綁定：用 LINE 登入 / 綁定 LINE */}
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

        {/* Sprint 1: 回覆控制 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{t('replyControl')}</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('maxReplyLength')}</label>
              <p className="text-xs text-gray-500">{t('maxReplyLengthDesc')}</p>
              <div className="mt-2 flex items-center gap-3">
                <input
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
              <label className="block text-sm font-medium text-gray-700">{t('replyTemperature')}</label>
              <p className="text-xs text-gray-500">{t('replyTemperatureDesc')}</p>
              <div className="mt-2 flex items-center gap-3">
                <input
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
              <label className="block text-sm font-medium text-gray-700">{t('replyFormat')}</label>
              <select
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

        {/* Sprint 2: 自訂敏感詞 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{t('sensitiveWords')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('sensitiveWordsDesc')}</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('sensitiveWords')}</label>
              <textarea
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
                className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">{t('sensitiveWordCount', { count: customSensitiveWords.length })}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('sensitiveWordReply')}</label>
              <p className="text-xs text-gray-500">{t('sensitiveWordReplyDesc')}</p>
              <input
                type="text"
                value={sensitiveWordReply}
                onChange={(e) => setSensitiveWordReply(e.target.value)}
                placeholder={t('sensitiveWordReply')}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Sprint 3: 回覆延遲 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{t('replyDelay')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('replyDelayDesc')}</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('replyDelaySeconds')}</label>
              <div className="mt-2 flex items-center gap-3">
                <input
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
                  <label className="block text-sm font-medium text-gray-700">{t('fallbackLanguage')}</label>
                  <select
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

        {/* Sprint 5: Guidance */}
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
                  className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
                />
                <textarea
                  placeholder={t('ruleContentPlaceholder')}
                  value={guidanceForm.content}
                  onChange={(e) => setGuidanceForm((p) => p && { ...p, content: e.target.value })}
                  rows={2}
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

        {/* Sprint 6: 信心分數 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{t('confidenceScore')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('confidenceThresholdDesc')}</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('confidenceThreshold')}</label>
              <div className="flex items-center gap-2 mt-1">
                <input
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
              <label className="block text-sm font-medium text-gray-700">{t('lowConfidenceAction')}</label>
              <select
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
              <label className="block text-sm font-medium text-gray-700">{t('handoffMessage')}</label>
              <input
                type="text"
                value={handoffMessage}
                onChange={(e) => setHandoffMessage(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Sprint 7: 營業時間 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{t('businessHours')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('businessHoursDesc')}</p>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={businessHoursEnabled} onChange={(e) => setBusinessHoursEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">{t('enableBusinessHours')}</span>
            </label>
            {businessHoursEnabled && (
              <>
                <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('outsideHoursMode')}</label>
                    <select value={outsideHoursMode} onChange={(e) => setOutsideHoursMode(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                      <option value="auto_reply">{t('modeAutoReply')}</option>
                      <option value="ai_only">{t('modeAiOnly')}</option>
                      <option value="collect_info">{t('modeCollectInfo')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('outsideHoursMessage')}</label>
                    <textarea value={outsideHoursMessage} onChange={(e) => setOutsideHoursMessage(e.target.value)} rows={2} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
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

        {/* Sprint 8: 滿意度回饋 */}
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

        {/* Sprint 9: 對話記憶 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{t('conversationMemory')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('memoryCountDesc')}</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('memoryCount')}</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="range" min={1} max={30} value={conversationMemoryCount} onChange={(e) => setConversationMemoryCount(Number(e.target.value))} className="flex-1" />
                <span className="text-sm w-8">{conversationMemoryCount}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('memoryMode')}</label>
              <select value={conversationMemoryMode} onChange={(e) => setConversationMemoryMode(e.target.value)} className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900">
                <option value="recent">{t('modeRecent')}</option>
                <option value="summary">{t('modeSummary')}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">{t('memorySummaryNote')}</p>
            </div>
          </div>
        </div>

        {/* Sprint 10: 歡迎訊息 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{t('welcomeMessage')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('welcomeMessageDesc')}</p>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={welcomeMessageEnabled} onChange={(e) => setWelcomeMessageEnabled(e.target.checked)} className="rounded" />
              <span className="text-sm">{t('enableWelcomeMessage')}</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('welcomeMessageContent')}</label>
              <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3} placeholder={t('welcomeMessagePlaceholder')} className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400" />
              <p className="mt-1 text-xs text-gray-500">{t('characterCount', { count: welcomeMessage.length })}</p>
            </div>
          </div>
        </div>

        {/* Sprint 12: A/B 測試 */}
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
                  <label className="text-sm">{t('abTestTrafficSplit')}</label>
                  <input
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
          <h2 className="text-lg font-semibold text-gray-900">{t('aiReplyStyle')}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('aiReplyStyleDesc')}
          </p>

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

      {/* LINE Token 設定 Modal（桌面與手機皆顯示） */}
      {lineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">{t('lineTokenSettings')}</h2>
            <p className="mt-1 text-sm text-gray-600">{t('lineTokenDesc')}</p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Channel ID</label>
                <input
                  type="text"
                  value={lineChannelId}
                  onChange={(e) => setLineChannelId(e.target.value)}
                  placeholder="1234567890"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">Channel Secret</label>
                  <ContextualHelp topic="lineChannelSecret" position="bottom" />
                </div>
                <input
                  type="password"
                  value={lineChannelSecret}
                  onChange={(e) => setLineChannelSecret(e.target.value)}
                  placeholder="- - - - - - - - - - - - - - - - "
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400"
                />
                <p className="mt-1 text-xs text-gray-400">{t('lineSecretHint')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Channel Access Token</label>
                <textarea
                  value={lineAccessToken}
                  onChange={(e) => setLineAccessToken(e.target.value)}
                  placeholder="- - - - - - - - - - - - - - - - "
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 resize-none"
                />
                <p className="mt-1 text-xs text-gray-400">{t('lineTokenHint')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 truncate">
                    {webhookUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      if (webhookUrl) {
                        navigator.clipboard.writeText(webhookUrl);
                        toast.show(t('webhookCopied'), 'success');
                      }
                    }}
                    className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('copy')}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">{t('lineIntegrationHint')}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLineModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleLineSave}
                disabled={lineSaving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {lineSaving ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-indigo-500 text-white px-4 py-2.5 text-base font-medium leading-snug">{lastPreviewQuestionRef.current || previewQuestionDisplay || t(previewQuestionKey)}</div>
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
                    {!previewLoading && previewAnswer === 'updated' && <span className="text-gray-600">{t('previewStale')}</span>}
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
