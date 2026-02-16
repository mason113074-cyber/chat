import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { count: contactsCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data: contactIds } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', user.id);
  const ids = (contactIds ?? []).map((c) => c.id);
  const { count: conversationsCount } =
    ids.length > 0
      ? await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .in('contact_id', ids)
      : { count: 0 };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">總覽</h1>
      <p className="mt-1 text-gray-600">歡迎使用 CustomerAIPro 後台</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Link
          href="/dashboard/contacts"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-indigo-200 hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-gray-900">客戶聯絡人</h2>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {contactsCount ?? 0}
          </p>
          <p className="mt-1 text-sm text-gray-500">查看與管理聯絡人</p>
        </Link>
        <Link
          href="/dashboard/conversations"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-indigo-200 hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-gray-900">對話紀錄</h2>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {conversationsCount ?? 0}
          </p>
          <p className="mt-1 text-sm text-gray-500">查看所有對話</p>
        </Link>
      </div>
    </div>
  );
}
