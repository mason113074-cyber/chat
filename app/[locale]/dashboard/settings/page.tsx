'use client';

import { useState, useEffect } from 'react';
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

const AI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] as const;
const EXAMPLE_QUESTIONS = [
  '你們的營業時間是幾點？',
  '有什麼優惠活動嗎？',
  '如何退換貨？',
];

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  { id: '1', text: '📦 查詢訂單狀態', enabled: true },
  { id: '2', text: '💰 運費怎麼計算？', enabled: true },
  { id: '3', text: '🔄 如何退換貨？', enabled: true },
];

export default function SettingsPage() {
  const toast = useToast();
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [storeName, setStoreName] = useState('');
  const [aiModel, setAiModel] = useState<string>('gpt-4o-mini');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(DEFAULT_QUICK_REPLIES);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Live Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(EXAMPLE_QUESTIONS[0]);
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
        setLoadError('載入超時，請重新整理頁面或聯繫客服');
        setIsLoading(false);
      }
    }, 10000);
    async function load() {
      try {
        const response = await fetch('/api/settings', { credentials: 'include' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message = (data && typeof data.error === 'string') ? data.error : '無法載入設定';
          throw new Error(message);
        }
        if (cancelled) return;
        if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
        if (data.storeName != null) setStoreName(data.storeName || '');
        if (data.aiModel && AI_MODELS.includes(data.aiModel)) setAiModel(data.aiModel);
        if (Array.isArray(data.quickReplies) && data.quickReplies.length > 0) {
          const padded: QuickReply[] = [...data.quickReplies];
          while (padded.length < 5) padded.push({ id: `slot-${padded.length}`, text: '', enabled: true });
          setQuickReplies(padded.slice(0, 5));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('載入設定失敗:', error);
          setLoadError(error instanceof Error ? error.message : '載入設定失敗');
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
      if (!response.ok) throw new Error('儲存失敗');
      toast.show('已儲存', 'success');
    } catch (error) {
      console.error('儲存失敗:', error);
      toast.show('儲存失敗，請稍後再試', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewReply = async (questionOverride?: string) => {
    const q = questionOverride ?? previewQuestion;
    setPreviewQuestion(q);
    setPreviewLoading(true);
    setPreviewAnswer('pending');
    setLastSyncedPrompt(systemPrompt);
    setLastSyncedModel(aiModel);
    try {
      const res = await fetch('/api/settings/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
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
    toast.show('已重置為預設值', 'success');
  };

  const handleToneSelect = (tone: keyof typeof TONE_PRESETS) => {
    setSystemPrompt(TONE_PRESETS[tone]);
  };

  const handleTestAI = async () => {
    if (!testMessage.trim()) {
      setTestError('請輸入測試訊息');
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
      setTestReply(typeof data?.reply === 'string' ? data.reply : '（無回覆）');
    } catch (error) {
      console.error('AI 測試失敗:', error);
      setTestError(error instanceof Error ? error.message : '測試失敗，請稍後再試');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-3 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-xl font-semibold mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">AI 助理設定</h1>
      <p className="mt-1 text-gray-600">管理您的 AI 客服助理設定與行為</p>

      <div className="mt-8 flex flex-col lg:flex-row gap-8">
        {/* Left: Form lg:w-3/5 */}
        <div className="lg:w-3/5 space-y-6">
        {/* 商店名稱 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">商店名稱</h2>
          <p className="mt-1 text-sm text-gray-600">顯示於聊天 Widget 頂部</p>
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
          <h2 className="text-lg font-semibold text-gray-900">AI 模型</h2>
          <p className="mt-1 text-sm text-gray-600">選擇回覆使用的模型</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {AI_MODELS.map((id) => (
              <label key={id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 cursor-pointer text-gray-700 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-900">
                <input type="radio" name="ai_model" value={id} checked={aiModel === id} onChange={() => setAiModel(id)} className="text-indigo-600" />
                <span className="text-sm font-medium">{id}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 快捷回覆按鈕 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">快捷回覆按鈕</h2>
          <p className="mt-1 text-sm text-gray-600">自訂 3～5 個常見問題，會顯示在 Widget 開場時供用戶點擊（儲存時一併更新）</p>
          <div className="mt-4 space-y-3">
            {(() => {
              const padded: QuickReply[] = [...quickReplies];
              while (padded.length < 5) padded.push({ id: `slot-${padded.length}`, text: '', enabled: true });
              return padded.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    aria-label={`常見問題 ${index + 1} 啟用`}
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
                    placeholder={`常見問題 ${index + 1}`}
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
              placeholder="輸入 System Prompt..."
            />
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
                  <span className="animate-spin mr-2" role="status" aria-label="儲存中">⏳</span>
                  儲存中...
                </>
              ) : (
                '💾 儲存'
              )}
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              🔄 重置為預設
            </button>
          </div>
        </div>

        {/* AI 回覆測試區 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">🧪 AI 回覆測試</h2>
          <p className="mt-1 text-sm text-gray-600">
            測試您的 System Prompt 設定，看看 AI 會如何回應
          </p>

          <div className="mt-4 space-y-4">
            {/* 模擬客戶訊息輸入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模擬客戶訊息：
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full min-h-[100px] resize-y rounded-lg border border-gray-300 bg-white text-gray-900 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20"
                placeholder="請輸入模擬的客戶問題，例如：「你好，請問你們的服務時間？」"
              />
            </div>

            {/* 測試按鈕 */}
            <button
              onClick={handleTestAI}
              disabled={isTesting || !testMessage.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <>
                  <span className="animate-spin mr-2" role="status" aria-label="測試中">⏳</span>
                  測試中...
                </>
              ) : (
                '🚀 測試回覆'
              )}
            </button>

            {/* AI 回覆預覽 */}
            {(testReply || testError) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI 回覆預覽：
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

        {/* Feature Preview Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">即將推出</h2>
          
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📚</span>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  知識庫上傳
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  上傳您的產品手冊、FAQ 文件與服務說明，讓 AI 提供更準確的專業回答
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🔄</span>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  自動轉人工
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  設定觸發條件，當遇到特定關鍵字或複雜問題時，自動轉交給真人客服處理
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Right: Live Preview lg:w-2/5 lg:sticky lg:top-24 (hidden on mobile, use collapsible below) */}
        <div className="hidden lg:block lg:w-2/5 lg:sticky lg:top-24 self-start">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 shadow-sm border border-indigo-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Live Preview</h2>
            <div className="mx-auto max-w-sm rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden" style={{ height: '500px' }}>
              <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-2">
                <span className="font-medium text-base truncate">{storeName || '我的商店'}</span>
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
                    {previewQuestion}
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
                      <span className="text-gray-600">設定已更新，點擊重新預覽</span>
                    )}
                    {!previewLoading && previewAnswer === 'pending' && (
                      <span className="text-gray-600">正在生成預覽...</span>
                    )}
                    {!previewLoading && previewAnswer !== null && previewAnswer !== 'pending' && previewAnswer !== 'updated' && (
                      <span className="whitespace-pre-wrap">{previewAnswer}</span>
                    )}
                    {!previewLoading && previewAnswer === null && (
                      <span className="text-gray-600">點擊下方按鈕預覽 AI 回覆</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 p-2">
                <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-base text-gray-600">
                  輸入訊息（僅供預覽）
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">範例問題：</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handlePreviewReply(q)}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 font-medium hover:bg-gray-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handlePreviewReply()}
                disabled={previewLoading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                🔄 預覽 AI 回覆
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
          {previewOpen ? '▼ 收合 Live Preview' : '▶ 展開 Live Preview'}
        </button>
        {previewOpen && (
          <div className="mt-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 shadow-sm border border-indigo-100">
            <div className="mx-auto max-w-sm rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden" style={{ height: '500px' }}>
              <div className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-2">
                <span className="font-medium text-base truncate">{storeName || '我的商店'}</span>
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              </div>
              <div className="h-[380px] overflow-y-auto p-4 space-y-3 bg-white [&_.quick-reply-btn]:text-base [&_.quick-reply-btn]:font-medium [&_.quick-reply-btn]:text-gray-800">
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-gray-200 text-gray-900 px-4 py-2.5 text-base font-medium leading-snug">{welcomeText}</div>
                </div>
                <QuickReplies items={quickReplies} onSelect={(query) => handlePreviewReply(query)} />
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-indigo-500 text-white px-4 py-2.5 text-base font-medium leading-snug">{previewQuestion}</div>
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
                    {!previewLoading && previewAnswer === 'updated' && <span className="text-gray-600">設定已更新，點擊重新預覽</span>}
                    {!previewLoading && previewAnswer === 'pending' && <span className="text-gray-600">正在生成預覽...</span>}
                    {!previewLoading && previewAnswer !== null && previewAnswer !== 'pending' && previewAnswer !== 'updated' && <span className="whitespace-pre-wrap">{previewAnswer}</span>}
                    {!previewLoading && previewAnswer === null && <span className="text-gray-600">點擊下方按鈕預覽 AI 回覆</span>}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 p-2">
                <div className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-base text-gray-600">輸入訊息（僅供預覽）</div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">範例問題：</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button key={q} type="button" onClick={() => handlePreviewReply(q)} className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 font-medium hover:bg-gray-50">{q}</button>
                ))}
              </div>
              <button type="button" onClick={() => handlePreviewReply()} disabled={previewLoading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">🔄 預覽 AI 回覆</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
