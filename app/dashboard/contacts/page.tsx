import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // ✅ 使用關聯查詢一次取得所有資料，避免 N+1 問題
  const { data: contacts } = await supabase
    .from('contacts')
    .select(`
      id,
      line_user_id,
      name,
      created_at,
      conversations(id, created_at)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  type Conversation = { id: string; created_at: string };

  type ContactWithStats = {
    id: string;
    name: string | null;
    line_user_id: string;
    created_at: string;
    conversationCount: number;
    lastInteraction: string | null;
  };

  // 在前端計算每個 contact 的對話數和最後互動時間
  const contactsWithStats: ContactWithStats[] = (contacts || []).map((contact) => {
    const conversations = (contact.conversations as Conversation[]) || [];
    
    // 計算對話數量
    const conversationCount = conversations.length;
    
    // 找出最後互動時間（最新的對話）- 使用 reduce 找最大值，避免排序
    let lastInteraction: string | null = null;
    if (conversations.length > 0) {
      lastInteraction = conversations.reduce((latest, conv) => {
        return new Date(conv.created_at) > new Date(latest) ? conv.created_at : latest;
      }, conversations[0].created_at);
    }
    
    return {
      id: contact.id,
      name: contact.name,
      line_user_id: contact.line_user_id,
      created_at: contact.created_at,
      conversationCount,
      lastInteraction,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
      <p className="mt-1 text-gray-600">來自 LINE 與其他管道之聯絡人</p>

      <div className="mt-8">
        {!contactsWithStats || contactsWithStats.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mb-4">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                還沒有客戶
              </h3>
              <p className="text-sm text-gray-600 max-w-md">
                當客戶透過 LINE 發送第一則訊息後，會自動建立聯絡人並顯示於此。
              </p>
            </div>
          </div>
        ) : (
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
                {contactsWithStats.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        href={`/dashboard/conversations/${c.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {c.name || '未命名客戶'}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 font-mono">
                      {c.line_user_id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {c.conversationCount}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {c.lastInteraction
                        ? new Date(c.lastInteraction).toLocaleString('zh-TW')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
