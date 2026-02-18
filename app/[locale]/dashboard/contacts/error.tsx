'use client';

export default function ContactsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
      <p className="mt-1 text-gray-600">來自 LINE 與其他管道之聯絡人</p>

      <div className="mt-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-yellow-100 w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">載入失敗</h2>
          <p className="text-gray-600 mb-6">
            資料暫時無法取得，請稍後再試。如果問題持續發生，請聯繫技術支援。
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    </div>
  );
}
