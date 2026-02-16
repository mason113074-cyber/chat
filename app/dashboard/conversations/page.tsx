import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function ConversationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, contact_id, message, role, created_at, contacts(name, line_user_id)')
    .order('created_at', { ascending: false })
    .limit(200);

  type Row = {
    id: string;
    contact_id: string;
    message: string;
    role: string;
    created_at: string;
    contacts: { name: string | null; line_user_id: string } | null;
  };
  const byContact = new Map<
    string,
    { name: string; line_user_id: string; lastMessage: string; lastAt: string }
  >();
  for (const row of (conversations ?? []) as unknown as Row[]) {
    const contactId = row.contact_id;
    if (!byContact.has(contactId)) {
      const contact = row.contacts;
      byContact.set(contactId, {
        name: contact?.name ?? '—',
        line_user_id: contact?.line_user_id ?? '',
        lastMessage: row.message.substring(0, 80) + (row.message.length > 80 ? '…' : ''),
        lastAt: row.created_at,
      });
    }
  }

  const threads = Array.from(byContact.entries()).map(([contactId, info]) => ({
    contactId,
    ...info,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">對話紀錄</h1>
      <p className="mt-1 text-gray-600">依聯絡人顯示最近對話</p>

      <div className="mt-8 space-y-4">
        {threads.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            尚無對話紀錄。當客戶透過 LINE 與 Bot 對話後，會顯示於此。
          </div>
        ) : (
          threads.map((t) => (
            <Link
              key={t.contactId}
              href="#"
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {t.name} <span className="font-mono text-xs text-gray-500">({t.line_user_id})</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                    {t.lastMessage}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(t.lastAt).toLocaleString('zh-TW')}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
