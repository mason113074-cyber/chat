'use client';

import { useState, useEffect } from 'react';

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
- 適時使用 emoji 讓對話更友善`;

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

export default function SettingsPage() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // AI 測試相關狀態
  const [testMessage, setTestMessage] = useState('');
  const [testReply, setTestReply] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState('');

  // 載入用戶的 system_prompt
  useEffect(() => {
    async function loadSystemPrompt() {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('無法載入設定');
        }
        const data = await response.json();
        if (data.systemPrompt) {
          setSystemPrompt(data.systemPrompt);
        }
      } catch (error) {
        console.error('載入設定失敗:', error);
        showToast('載入設定失敗', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadSystemPrompt();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt }),
      });

      if (!response.ok) {
        throw new Error('儲存失敗');
      }

      showToast('✅ 已儲存', 'success');
    } catch (error) {
      console.error('儲存失敗:', error);
      showToast('儲存失敗，請稍後再試', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    showToast('已重置為預設值', 'success');
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
        const errorData = await response.json();
        throw new Error(errorData.error || '測試失敗');
      }

      const data = await response.json();
      setTestReply(data.reply);
    } catch (error) {
      console.error('AI 測試失敗:', error);
      setTestError(error instanceof Error ? error.message : '測試失敗，請稍後再試');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">AI 助理設定</h1>
      <p className="mt-1 text-gray-600">管理您的 AI 客服助理設定與行為</p>

      {/* Toast 通知 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {/* AI Model Information Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI 模型資訊</h2>
              <p className="mt-1 text-sm text-gray-600">目前使用的 AI 模型與狀態</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              ✅ 運作中
            </span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">模型</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">GPT-4o-mini</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">提供商</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">OpenAI</p>
            </div>
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
                onClick={() => handleToneSelect('friendly')}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                😊 親切友善
              </button>
              <button
                onClick={() => handleToneSelect('professional')}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                💼 專業正式
              </button>
              <button
                onClick={() => handleToneSelect('concise')}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
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
                  <span className="animate-spin mr-2">⏳</span>
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
                  <span className="animate-spin mr-2">⏳</span>
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
    </div>
  );
}
