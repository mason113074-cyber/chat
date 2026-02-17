export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-6 w-16 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonConversationItem() {
  return (
    <div className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-3 w-full rounded bg-gray-200" />
        </div>
        <div className="h-3 w-16 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="animate-pulse">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="h-4 w-24 rounded bg-gray-200" />
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="h-4 w-12 rounded bg-gray-200" />
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="h-4 w-28 rounded bg-gray-200" />
      </td>
    </tr>
  );
}

export function SkeletonContactList() {
  return (
    <div className="divide-y divide-gray-100">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-3 w-16 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChatMessages() {
  return (
    <div className="p-4 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          <div className="animate-pulse">
            <div className={`h-16 rounded-2xl bg-gray-200 ${i % 2 === 0 ? 'w-48' : 'w-40'}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
