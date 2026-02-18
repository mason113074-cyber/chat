import { createClient } from '@/lib/supabase/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');
  const tCommon = await getTranslations('common');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  type Conversation = { id: string; created_at: string };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Run all dashboard queries in parallel for faster load
  const [
    { count: contactsCount },
    { data: contactsWithConversations },
    { count: newContactsCount },
    { data: recentConversations },
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('contacts')
      .select('id, conversations(id, created_at)')
      .eq('user_id', user.id),
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', weekAgo.toISOString()),
    supabase
      .from('conversations')
      .select('id, message, created_at, contacts!inner(name, line_user_id, id)')
      .eq('contacts.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const conversationsCount = (contactsWithConversations || []).reduce(
    (total, contact) => total + ((contact.conversations as Conversation[]) || []).length,
    0
  );
  const todayConversationsCount = (contactsWithConversations || []).reduce((total, contact) => {
    const conversations = (contact.conversations as Conversation[]) || [];
    const todayConvs = conversations.filter((conv) => new Date(conv.created_at) >= today);
    return total + todayConvs.length;
  }, 0);

  type ConversationRow = {
    id: string;
    message: string;
    created_at: string;
    contacts: { name: string | null; line_user_id: string; id: string } | null;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      <p className="mt-1 text-gray-600">{t('welcome')}</p>

      {/* Statistics Cards */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm text-gray-600">{t('totalCustomers')}</p>
              <p className="text-2xl font-bold text-indigo-600">
                {contactsCount ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="text-sm text-gray-600">{t('totalConversations')}</p>
              <p className="text-2xl font-bold text-indigo-600">
                {conversationsCount ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <p className="text-sm text-gray-600">{t('todayConversations')}</p>
              <p className="text-2xl font-bold text-indigo-600">
                {todayConversationsCount ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🆕</span>
            <div>
              <p className="text-sm text-gray-600">{t('weeklyNewCustomers')}</p>
              <p className="text-2xl font-bold text-indigo-600">
                {newContactsCount ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('recentConversations')}</h2>
          <Link
            href="/dashboard/conversations"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {tCommon('viewAll')}
          </Link>
        </div>

        {!recentConversations || recentConversations.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mb-4">
                <span className="text-4xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('noConversations')}
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md">
                {t('noConversationsDesc')}
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                {t('viewLineSettings')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {(recentConversations as unknown as ConversationRow[]).map((conv) => (
              <Link
                key={conv.id}
                href={conv.contacts?.id ? `/dashboard/conversations/${conv.contacts.id}` : '/dashboard/conversations'}
                className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {conv.contacts?.name || t('unnamedCustomer')}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {conv.message.length > 50
                        ? conv.message.substring(0, 50) + '...'
                        : conv.message}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(conv.created_at).toLocaleString(locale === 'zh-TW' ? 'zh-TW' : 'en', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/dashboard/conversations"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          {t('viewAllConversations')}
        </Link>
        <Link
          href="/dashboard/contacts"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          {t('manageCustomers')}
        </Link>
      </div>
    </div>
  );
}
