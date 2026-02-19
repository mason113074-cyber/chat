'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useToast } from '@/components/Toast';

const STEPS = [
  { id: 1, title: '基本資訊', short: '步驟 1' },
  { id: 2, title: '連接 LINE', short: '步驟 2' },
  { id: 3, title: 'AI 風格', short: '步驟 3' },
  { id: 4, title: '完成', short: '步驟 4' },
] as const;

const INDUSTRIES = ['餐飲', '零售', '美業', '教育', '電商', '其他'] as const;

const TONE_CORE_RULES =
  '\n\n⚠ 核心限制：只根據知識庫內容回答，不編造資訊；不確定時回覆：「這個問題我需要轉交給專人處理」；不承諾折扣、退款等金錢事項。';

const TONE_PRESETS = [
  {
    id: 'friendly',
    label: '親切友善 🤗',
    prompt:
      '你是這位商家的客服小幫手。請像朋友一樣親切回覆客戶，適度使用 emoji，讓對話溫暖、易懂。' +
      TONE_CORE_RULES,
  },
  {
    id: 'professional',
    label: '專業正式 👔',
    prompt:
      '你是這位商家的專業客服。請用專業、有條理的語氣回覆，清楚傳達資訊，保持禮貌與效率。' +
      TONE_CORE_RULES,
  },
  {
    id: 'brief',
    label: '簡潔快速 ⚡',
    prompt:
      '你是這位商家的客服。請用最簡短的方式回覆重點，不贅述，方便客戶快速得到答案。' +
      TONE_CORE_RULES,
  },
] as const;

const AI_MODELS = [
  { id: 'gpt-4o', label: 'gpt-4o', desc: '最強大，回覆品質最高' },
  { id: 'gpt-4o-mini', label: 'gpt-4o-mini', desc: '性價比最高，推薦' },
  { id: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo', desc: '最便宜，速度最快' },
] as const;

type OnboardingStatus = {
  store_name: string | null;
  industry: string | null;
  onboarding_completed: boolean;
  line_channel_id: string | null;
  system_prompt: string | null;
  ai_model: string | null;
};

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [storeName, setStoreName] = useState('');
  const [industry, setIndustry] = useState<string>('');
  const [lineChannelId, setLineChannelId] = useState('');
  const [lineChannelSecret, setLineChannelSecret] = useState('');
  const [lineChannelAccessToken, setLineChannelAccessToken] = useState('');
  const [lineVerifyLoading, setLineVerifyLoading] = useState(false);
  const [lineVerifyResult, setLineVerifyResult] = useState<{ success: boolean; error?: string; displayName?: string } | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedToneId, setSelectedToneId] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [testMessage, setTestMessage] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testReply, setTestReply] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setStoreName(data.store_name ?? '');
        setIndustry(data.industry ?? '');
        setSystemPrompt(data.system_prompt ?? '');
        setAiModel(data.ai_model ?? 'gpt-4o-mini');
        if (data.onboarding_completed) {
          router.replace('/dashboard');
          return;
        }
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const applyTone = (presetId: string) => {
    const preset = TONE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedToneId(presetId);
      setSystemPrompt(preset.prompt);
    }
  };

  const handleSaveStep1 = async () => {
    if (!storeName.trim()) {
      setError('請填寫商店名稱');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: storeName.trim(),
          industry: industry || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '儲存失敗');
        return;
      }
      setStep(2);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyLine = async () => {
    if (!lineChannelId.trim() || !lineChannelSecret.trim() || !lineChannelAccessToken.trim()) {
      setLineVerifyResult({ success: false, error: '請填寫 Channel ID、Secret 與 Access Token' });
      return;
    }
    setLineVerifyResult(null);
    setLineVerifyLoading(true);
    try {
      const res = await fetch('/api/line/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: lineChannelId.trim(),
          channelSecret: lineChannelSecret.trim(),
          channelAccessToken: lineChannelAccessToken.trim(),
        }),
      });
      const data = await res.json();
      setLineVerifyResult({
        success: data.success === true,
        error: data.error ?? null,
        displayName: data.displayName ?? null,
      });
    } finally {
      setLineVerifyLoading(false);
    }
  };

  const handleSaveStep3 = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: systemPrompt.trim() || null,
          ai_model: aiModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '儲存失敗');
        return;
      }
      setStep(4);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error ?? '儲存失敗';
        setError(msg);
        alert('儲存失敗，請稍後再試');
        return;
      }
      toast.show('設定完成！', 'success');
      // Full page navigation so middleware runs with updated onboarding_completed
      window.location.href = '/dashboard';
      return;
    } catch (err) {
      console.error('Onboarding complete error:', err);
      setError('網路錯誤，請稍後再試');
      alert('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const handleTestMessage = async () => {
    if (!testMessage.trim()) return;
    setTestLoading(true);
    setTestReply(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage.trim() }),
      });
      const data = await res.json();
      setTestReply(data.content ?? data.error ?? '無回覆');
    } finally {
      setTestLoading(false);
    }
  };

  const goToStep = (s: number) => {
    if (s < 1 || s > 4) return;
    if (s < step || (s === 2 && step > 2) || (s === 3 && step > 3)) setStep(s);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => goToStep(s.id)}
                className={`flex flex-1 flex-col items-center rounded-lg px-2 py-3 transition ${
                  step === s.id
                    ? 'bg-indigo-600 text-white shadow'
                    : s.id < step
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span className="text-lg font-semibold">
                  {s.id < step ? '✅' : s.id}
                </span>
                <span className="mt-1 hidden text-xs sm:inline">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-1 flex-1 max-w-[20px] rounded ${
                    s.id < step ? 'bg-indigo-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content with slide feel */}
      <div className="overflow-hidden rounded-2xl bg-white/90 p-6 shadow-lg ring-1 ring-gray-200/80 backdrop-blur sm:p-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="transition-opacity duration-300">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              歡迎使用 CustomerAIPro！
            </h1>
            <p className="mt-2 text-gray-600">
              只需 3 分鐘，完成設定就能開始用 AI 回覆客戶
            </p>
            <div className="mt-8 space-y-4">
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">
                  商店名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  id="storeName"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="例如：小明早餐店"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  產業類型
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">請選擇</option>
                  {INDUSTRIES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={handleSaveStep1}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? '儲存中...' : '下一步'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="transition-opacity duration-300">
            <h2 className="text-xl font-bold text-gray-900">連接 LINE Bot</h2>
            <p className="mt-1 text-gray-600">
              到{' '}
              <a
                href="https://developers.line.biz/console/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline"
              >
                LINE Developers
              </a>{' '}
              建立 Messaging API Channel，取得以下資訊並貼上。
            </p>
            <ul className="mt-4 list-inside list-disc text-sm text-gray-600">
              <li>Channel ID</li>
              <li>Channel Secret</li>
              <li>Channel Access Token（需發行 Long-lived token）</li>
            </ul>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Channel ID</label>
                <input
                  type="text"
                  value={lineChannelId}
                  onChange={(e) => setLineChannelId(e.target.value)}
                  placeholder="1234567890"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Channel Secret</label>
                <input
                  type="password"
                  value={lineChannelSecret}
                  onChange={(e) => setLineChannelSecret(e.target.value)}
                  placeholder="xxxxxxxx"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Channel Access Token</label>
                <textarea
                  rows={3}
                  value={lineChannelAccessToken}
                  onChange={(e) => setLineChannelAccessToken(e.target.value)}
                  placeholder="Bearer 或貼上 token"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleVerifyLine}
                  disabled={lineVerifyLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {lineVerifyLoading ? '驗證中...' : '驗證連線'}
                </button>
                {lineVerifyResult && (
                  <span
                    className={
                      lineVerifyResult.success
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {lineVerifyResult.success ? (
                      <>✅ 驗證成功{lineVerifyResult.displayName ? `（${lineVerifyResult.displayName}）` : ''}</>
                    ) : (
                      <>❌ {lineVerifyResult.error}</>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                上一步
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-600 hover:bg-gray-50"
                >
                  跳過，稍後設定
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
                >
                  下一步
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="transition-opacity duration-300">
            <h2 className="text-xl font-bold text-gray-900">設定 AI 回覆風格</h2>
            <p className="mt-1 text-gray-600">選擇預設語氣或自訂 System Prompt</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {TONE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyTone(preset.id)}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    selectedToneId === preset.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-gray-900">{preset.label}</span>
                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">{preset.prompt}</p>
                </button>
              ))}
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">自訂 System Prompt</label>
              <textarea
                rows={5}
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value);
                  setSelectedToneId(null);
                }}
                placeholder="例如：你是專業客服，用簡潔有禮的方式回覆..."
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">AI 模型</label>
              <div className="mt-2 space-y-2">
                {AI_MODELS.map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="ai_model"
                      value={m.id}
                      checked={aiModel === m.id}
                      onChange={() => setAiModel(m.id)}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-gray-900">{m.label}</span>
                    <span className="text-sm text-gray-500">{m.desc}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                上一步
              </button>
              <button
                type="button"
                onClick={handleSaveStep3}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? '儲存中...' : '下一步'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="transition-opacity duration-300">
            <h2 className="text-xl font-bold text-gray-900">完成設定</h2>
            <p className="mt-1 text-gray-600">以下是您的設定摘要，可發送測試訊息確認 AI 回覆。</p>
            <dl className="mt-6 space-y-2 rounded-lg bg-gray-50 p-4">
              <div>
                <dt className="text-sm text-gray-500">商店名稱</dt>
                <dd className="font-medium text-gray-900">{storeName || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">LINE 連線狀態</dt>
                <dd className="font-medium text-gray-900">
                  {status?.line_channel_id ? '✅ 已連接' : '尚未連接'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">AI 語氣</dt>
                <dd className="text-sm text-gray-900">
                  {systemPrompt ? systemPrompt.slice(0, 80) + (systemPrompt.length > 80 ? '...' : '') : '未設定'}
                </dd>
              </div>
            </dl>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">發送測試訊息</label>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="輸入測試內容"
                  className="min-w-[200px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleTestMessage}
                  disabled={testLoading || !testMessage.trim()}
                  className="rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {testLoading ? '發送中...' : '發送測試訊息'}
                </button>
              </div>
              {testReply !== null && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                  <span className="text-gray-500">AI 回覆：</span> {testReply}
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                上一步
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? '處理中...' : '開始使用 Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
