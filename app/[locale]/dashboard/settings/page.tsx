'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useToast } from '@/components/Toast';
import type { QuickReply } from '@/lib/types';
import {
  isZhDefaultQuickReply,
  isZhDefaultSystemPrompt,
  isZhDefaultWelcomeMessage,
} from './components/settings-helpers';
import {
  SettingsProvider,
  SettingsTabNav,
  SettingsGeneralTab,
  SettingsPersonalityTab,
  SettingsBehaviorTab,
  SettingsExperienceTab,
  SettingsOptimizeTab,
  SettingsIntegrationsTab,
  SettingsLineModal,
  SettingsLivePreviewDesktop,
  SettingsLivePreviewMobile,
  TAB_IDS,
  AI_MODELS,
  EXAMPLE_QUESTIONS_KEYS,
  type TabId,
} from './components';

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

  // Tab 分頁：與 URL hash 同步
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'general';
    const hash = window.location.hash.slice(1);
    return TAB_IDS.includes(hash as TabId) ? (hash as TabId) : 'general';
  });
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (TAB_IDS.includes(hash as TabId)) setActiveTab(hash as TabId);
    };
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData && typeof errorData.error === 'string' ? errorData.error : null) || '測試失敗');
      }

      const data = await response.json().catch(() => ({}));
      setTestReply(typeof data?.content === 'string' ? data.content : '');
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

  const setTab = (id: TabId) => {
    setActiveTab(id);
    if (typeof window !== 'undefined') window.location.hash = id;
  };

  const settingsContextValue = {
    storeName,
    setStoreName,
    aiModel,
    setAiModel,
    webhookUrl,
    lineModalOpen,
    setLineModalOpen,
    lineChannelId,
    setLineChannelId,
    lineChannelSecret,
    setLineChannelSecret,
    lineAccessToken,
    setLineAccessToken,
    lineSaving,
    lineTesting,
    lineTestResult,
    lineTestError,
    handleLineSave,
    handleLineTest,
    lineLoginBound,
    lineLoginDisplayName,
    lineLoginPhotoUrl,
    lineUnbinding,
    setLineUnbinding,
    setLineLoginBound,
    setLineLoginDisplayName,
    setLineLoginPhotoUrl,
    systemPrompt,
    setSystemPrompt,
    quickReplies,
    setQuickReplies,
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
    handleToneSelect,
    handleReset,
    handleSave,
    isSaving,
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
    testMessage,
    setTestMessage,
    testReply,
    setTestReply,
    isTesting,
    testError,
    setTestError,
    handleTestAI,
    abTests,
    setAbTests,
    abTestForm,
    setAbTestForm,
    handlePreviewReply,
    previewLoading,
    previewAnswer,
    previewQuestionKey,
    previewQuestionDisplay,
    lastPreviewQuestionRef,
    previewOpen,
    setPreviewOpen,
    welcomeText,
    toast: { show: toast.show },
  };

  return (
    <SettingsProvider value={settingsContextValue}>
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      <p className="mt-1 text-gray-600">{t('subtitle')}</p>

      <SettingsTabNav activeTab={activeTab} setTab={setTab} />

      <div className="mt-8 flex flex-col lg:flex-row gap-8">
        {/* Left: Form lg:w-3/5 */}
        <div className="lg:w-3/5 space-y-6">
        {activeTab === 'general' && <SettingsGeneralTab />}
        {activeTab === 'personality' && <SettingsPersonalityTab />}
        {activeTab === 'behavior' && <SettingsBehaviorTab />}

        {activeTab === 'experience' && <SettingsExperienceTab />}

        {activeTab === 'optimize' && <SettingsOptimizeTab />}

        {activeTab === 'integrations' && <SettingsIntegrationsTab />}

        {/* 各 Tab 共用儲存按鈕 */}
        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
          <button
            type="button"
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
        </div>
        </div>

        <SettingsLivePreviewDesktop />
      </div>

      <SettingsLineModal open={lineModalOpen} onClose={() => setLineModalOpen(false)} />

      <SettingsLivePreviewMobile />
    </div>
    </SettingsProvider>
  );
}
