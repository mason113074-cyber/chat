export default function SettingsPage() {
  const systemPrompt = `你是一位專業且友善的客服助理。

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">AI 助理設定</h1>
      <p className="mt-1 text-gray-600">管理您的 AI 客服助理設定與行為</p>

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

        {/* System Prompt Display Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">AI 回覆風格</h2>
          <p className="mt-1 text-sm text-gray-600">
            目前的 AI 助理人格設定與回覆指導原則
          </p>
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {systemPrompt}
            </pre>
          </div>
          <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm text-indigo-800">
              💡 AI 回覆風格由系統管理，如需調整請聯繫管理員
            </p>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">即將推出</h2>
          
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🎨</span>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  自訂 AI 回覆風格
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  即將開放自訂 AI 助理的語氣、個性與回覆模板，打造專屬於您品牌的對話體驗
                </p>
              </div>
            </div>
          </div>

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
