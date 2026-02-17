export default function SettingsLoading() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">AI 助理設定</h1>
      <p className="mt-1 text-gray-600">管理您的 AI 客服助理設定與行為</p>

      <div className="mt-8 space-y-6">
        {/* AI Model Information Card Skeleton */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="h-4 w-48 rounded bg-gray-200" />
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-200" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="h-3 w-12 rounded bg-gray-200" />
              <div className="mt-1 h-5 w-24 rounded bg-gray-200" />
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="h-3 w-12 rounded bg-gray-200" />
              <div className="mt-1 h-5 w-20 rounded bg-gray-200" />
            </div>
          </div>
        </div>

        {/* System Prompt Card Skeleton */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="mt-1 h-4 w-64 rounded bg-gray-200" />
          <div className="mt-4 rounded-lg bg-gray-50 p-4 space-y-2">
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-3 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-3 w-2/3 rounded bg-gray-200" />
          </div>
        </div>

        {/* Feature Preview Skeleton */}
        <div className="space-y-4">
          <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
          
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-3/4 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
