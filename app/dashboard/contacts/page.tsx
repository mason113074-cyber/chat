import { createClient } from '@/lib/supabase/server';

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, line_user_id, name, tags, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">客戶聯絡人</h1>
      <p className="mt-1 text-gray-600">來自 LINE 與其他管道之聯絡人</p>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {!contacts || contacts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            尚無聯絡人。當有客戶透過 LINE 與您的 Bot 對話時，會自動出現在此。
          </div>
        ) : (
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
                  標籤
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  建立時間
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {c.name || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 font-mono">
                    {c.line_user_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {Array.isArray(c.tags) && c.tags.length > 0
                      ? c.tags.join(', ')
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {c.created_at
                      ? new Date(c.created_at).toLocaleString('zh-TW')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
