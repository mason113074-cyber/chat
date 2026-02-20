import { SkeletonCard, SkeletonConversationItem } from './SkeletonCard';

export default function DashboardLoading() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">總覽</h1>
      <p className="mt-1 text-gray-600">歡迎使用 CustomerAI Pro 後台</p>

      {/* Statistics Cards Skeleton */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Recent Conversations Skeleton */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">最近對話</h2>
          <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
        </div>

        <div className="space-y-3">
          <SkeletonConversationItem />
          <SkeletonConversationItem />
          <SkeletonConversationItem />
          <SkeletonConversationItem />
          <SkeletonConversationItem />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="mt-8 flex flex-wrap gap-4">
        <div className="h-10 w-32 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-10 w-24 rounded-lg bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}
