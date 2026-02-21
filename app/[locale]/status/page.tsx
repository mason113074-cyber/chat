import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '服務狀態',
  description: 'CustomerAIPro 服務運作狀態',
};

type Status = 'operational' | 'degraded' | 'outage' | 'maintenance';

const STATUS_LABEL: Record<Status, string> = {
  operational: '正常運作',
  degraded: '部分異常',
  outage: '服務中斷',
  maintenance: '維護中',
};

export default function StatusPage() {
  const status: Status = 'operational';
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">服務狀態</h1>
        <p className="text-gray-600 mb-8">CustomerAIPro 系統運作狀態與歷史公告</p>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span
              className={`h-3 w-3 rounded-full ${
                status === 'operational'
                  ? 'bg-green-500'
                  : status === 'degraded'
                    ? 'bg-amber-500'
                    : status === 'outage'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
              }`}
            />
            <span className="font-semibold text-gray-900">{STATUS_LABEL[status]}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">所有系統正常運作中。若有異常將在此公告。</p>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">服務項目</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 官網與登入</li>
            <li>• Dashboard 與 API</li>
            <li>• LINE Webhook 與 AI 回覆</li>
            <li>• 知識庫與分析</li>
          </ul>
        </div>

        <p className="mt-8 text-xs text-gray-400">最後更新：{new Date().toLocaleDateString('zh-TW')}</p>
      </div>
    </div>
  );
}
