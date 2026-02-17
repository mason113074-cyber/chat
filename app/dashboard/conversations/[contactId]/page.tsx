import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const { contactId } = await params;
  const supabase = await createClient();

  // Get contact info
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, name, line_user_id')
    .eq('id', contactId)
    .single();

  if (!contact) {
    notFound();
  }

  // Get all conversations for this contact
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, message, role, created_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: true });

  return (
    <div className="max-h-screen flex flex-col">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
        <Link
          href="/dashboard/conversations"
          className="text-gray-600 hover:text-gray-900"
        >
          ← 返回
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 flex-1">
          {contact.name || '未命名客戶'}
        </h1>
      </div>

      {/* Conversation messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!conversations || conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            尚無對話內容
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`flex ${conv.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] rounded-2xl px-4 py-2
                  ${
                    conv.role === 'user'
                      ? 'bg-green-100 text-gray-900'
                      : 'bg-gray-100 text-gray-900'
                  }
                `}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {conv.message}
                </p>
                <p
                  className={`
                    mt-1 text-xs
                    ${conv.role === 'user' ? 'text-gray-600' : 'text-gray-500'}
                  `}
                >
                  {new Date(conv.created_at).toLocaleString('zh-TW', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
