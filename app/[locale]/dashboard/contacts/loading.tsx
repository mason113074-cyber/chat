import { SkeletonTableRow } from '../SkeletonCard';

export default function ContactsLoading() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
      <p className="mt-1 text-gray-600">來自 LINE 與其他管道之聯絡人</p>

      <div className="mt-8">
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  LINE User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  對話數量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  最後互動時間
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <SkeletonTableRow />
              <SkeletonTableRow />
              <SkeletonTableRow />
              <SkeletonTableRow />
              <SkeletonTableRow />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
