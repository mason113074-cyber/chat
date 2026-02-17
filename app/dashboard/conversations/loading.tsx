import { SkeletonContactList, SkeletonChatMessages, SkeletonConversationItem } from '../SkeletonCard';

export default function ConversationsLoading() {
  return (
    <div>
      {/* Mobile: Show only contact list skeleton */}
      <div className="lg:hidden">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">對話紀錄</h1>
        <div className="space-y-3">
          <SkeletonConversationItem />
          <SkeletonConversationItem />
          <SkeletonConversationItem />
          <SkeletonConversationItem />
          <SkeletonConversationItem />
        </div>
      </div>

      {/* Desktop: Two-column layout skeleton */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">對話紀錄</h1>
        
        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          {/* Left: Contact list skeleton */}
          <div className="w-80 flex-shrink-0">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900">聯絡人</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <SkeletonContactList />
              </div>
            </div>
          </div>

          {/* Right: Conversation view skeleton */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
              </div>

              <div className="flex-1 overflow-y-auto">
                <SkeletonChatMessages />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
