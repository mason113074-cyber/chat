import { createClient } from '@/lib/supabase/server';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

type DailyTrend = {
  date: string;
  aiResolved: number;
  humanRequired: number;
  totalConversations: number;
};

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildLinePath(values: number[], width: number, height: number, padding = 24) {
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const max = Math.max(1, ...values);
  const x = (idx: number) => padding + (idx / Math.max(1, values.length - 1)) * innerW;
  const y = (v: number) => padding + innerH - (v / max) * innerH;
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  return { path, x, y, max };
}

function emotionFromMessage(message: string): '😊' | '😐' | '😠' {
  const text = message.toLowerCase();
  if (/(謝謝|感謝|太棒|很好|滿意|讚|great|thanks|helpful|good)/i.test(text)) return '😊';
  if (/(爛|生氣|不滿|投訴|退款|退費|糟糕|angry|bad|complaint|refund)/i.test(text)) return '😠';
  return '😐';
}

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
  const trendStart = new Date();
  trendStart.setDate(trendStart.getDate() - 6);
  trendStart.setHours(0, 0, 0, 0);

  // Base dashboard queries
  const [
    { count: contactsCount },
    { data: contactsWithConversations },
    { count: newContactsCount },
    { data: recentConversations },
    { data: allContactRows },
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
      .select('id, message, role, resolved_by, status, created_at, contacts!inner(name, line_user_id, id)')
      .eq('contacts.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id),
  ]);

  const contactIds = (allContactRows ?? []).map((c) => c.id);

  const {
    data: trendAssistantRows,
  } = contactIds.length > 0
    ? await supabase
        .from('conversations')
        .select('contact_id, created_at, status, is_resolved, resolved_by')
        .in('contact_id', contactIds)
        .eq('role', 'assistant')
        .gte('created_at', trendStart.toISOString())
        .order('created_at', { ascending: true })
    : { data: [] as Array<{ contact_id: string; created_at: string; status: string | null; is_resolved: boolean | null; resolved_by: string | null }> };

  const {
    data: todayRows,
  } = contactIds.length > 0
    ? await supabase
        .from('conversations')
        .select('contact_id, role, created_at, status, is_resolved')
        .in('contact_id', contactIds)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: true })
    : { data: [] as Array<{ contact_id: string; role: string; created_at: string; status: string | null; is_resolved: boolean | null }> };

  const {
    data: latestAssistantRows,
  } = contactIds.length > 0
    ? await supabase
        .from('conversations')
        .select('contact_id, status, created_at')
        .in('contact_id', contactIds)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
    : { data: [] as Array<{ contact_id: string; status: string | null; created_at: string }> };

  const conversationsCount = (contactsWithConversations || []).reduce(
    (total, contact) => total + ((contact.conversations as Conversation[]) || []).length,
    0
  );
  const todayConversationsCount = (contactsWithConversations || []).reduce((total, contact) => {
    const conversations = (contact.conversations as Conversation[]) || [];
    const todayConvs = conversations.filter((conv) => new Date(conv.created_at) >= today);
    return total + todayConvs.length;
  }, 0);

  const trendMap = new Map<string, DailyTrend>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(trendStart);
    d.setDate(d.getDate() + i);
    const key = toDateKey(d);
    trendMap.set(key, { date: key, aiResolved: 0, humanRequired: 0, totalConversations: 0 });
  }

  let aiResolvedTotal = 0;
  let humanRequiredTotal = 0;
  for (const row of trendAssistantRows ?? []) {
    const key = toDateKey(new Date(row.created_at));
    const point = trendMap.get(key);
    if (!point) continue;
    point.totalConversations += 1;
    const needsHuman =
      row.status === 'needs_human' ||
      row.is_resolved === false ||
      row.resolved_by === 'human';
    if (needsHuman) {
      point.humanRequired += 1;
      humanRequiredTotal += 1;
    } else {
      point.aiResolved += 1;
      aiResolvedTotal += 1;
    }
  }
  const dailyTrend = Array.from(trendMap.values());
  const resolutionRate =
    aiResolvedTotal + humanRequiredTotal > 0
      ? Math.round((aiResolvedTotal / (aiResolvedTotal + humanRequiredTotal)) * 100)
      : 0;

  // Today realtime metrics
  const latestStatusByContact = new Map<string, string>();
  for (const row of latestAssistantRows ?? []) {
    if (!latestStatusByContact.has(row.contact_id)) {
      latestStatusByContact.set(row.contact_id, row.status ?? 'ai_handled');
    }
  }
  let queuedConversations = 0;
  let processingConversations = 0;
  for (const id of contactIds) {
    const status = latestStatusByContact.get(id) ?? 'ai_handled';
    if (status === 'needs_human') queuedConversations += 1;
    if (status === 'ai_handled') processingConversations += 1;
  }

  const unresolvedToday = (todayRows ?? []).filter(
    (r) => r.role === 'assistant' && (r.status === 'needs_human' || r.is_resolved === false)
  ).length;
  const todayPairs: number[] = [];
  const groupedToday = new Map<string, Array<{ role: string; created_at: string }>>();
  for (const row of todayRows ?? []) {
    const list = groupedToday.get(row.contact_id) ?? [];
    list.push({ role: row.role, created_at: row.created_at });
    groupedToday.set(row.contact_id, list);
  }
  for (const list of groupedToday.values()) {
    for (let i = 0; i < list.length - 1; i++) {
      const curr = list[i];
      const next = list[i + 1];
      if (curr.role === 'user' && next.role === 'assistant') {
        const diff = new Date(next.created_at).getTime() - new Date(curr.created_at).getTime();
        if (diff >= 0) todayPairs.push(diff / 1000);
      }
    }
  }
  const avgReplySecondsToday =
    todayPairs.length > 0 ? Math.round(todayPairs.reduce((a, b) => a + b, 0) / todayPairs.length) : 0;

  type ConversationRow = {
    id: string;
    message: string;
    created_at: string;
    role?: string;
    status?: string | null;
    resolved_by?: string | null;
    contacts: { name: string | null; line_user_id: string; id: string } | null;
  };

  const isEmpty = (contactsCount ?? 0) === 0 && conversationsCount === 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      <p className="mt-1 text-gray-600">{t('welcome')}</p>

      {/* Welcome empty state: 3 steps */}
      {isEmpty && (
        <div className="mt-8 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-8">
          <h2 className="text-xl font-bold text-gray-900">{t('welcomeEmptyTitle')}</h2>
          <p className="mt-2 text-gray-600">{t('welcomeEmptyDesc')}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-indigo-100 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">1</div>
              <h3 className="mt-3 font-semibold text-gray-900">{t('stepConnectLine')}</h3>
              <p className="mt-1 text-sm text-gray-600">{t('stepConnectLineDesc')}</p>
              <Link href="/dashboard/settings" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">{t('goToSettings')} →</Link>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">2</div>
              <h3 className="mt-3 font-semibold text-gray-900">{t('stepUploadKb')}</h3>
              <p className="mt-1 text-sm text-gray-600">{t('stepUploadKbDesc')}</p>
              <Link href="/dashboard/knowledge-base" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">{t('goToKnowledgeBase')} →</Link>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">3</div>
              <h3 className="mt-3 font-semibold text-gray-900">{t('stepSendTest')}</h3>
              <p className="mt-1 text-sm text-gray-600">{t('stepSendTestDesc')}</p>
              <p className="mt-3 text-sm text-gray-500">{t('viewLineSettings')}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* 7-day trend + AI resolution */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">{t('trend7d')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('trend7dDesc')}</p>
          <div className="mt-4">
            {(() => {
              const width = 700;
              const height = 240;
              const aiValues = dailyTrend.map((d) => d.aiResolved);
              const humanValues = dailyTrend.map((d) => d.humanRequired);
              const max = Math.max(1, ...aiValues, ...humanValues);
              const aiPath = buildLinePath(aiValues, width, height, 28);
              const humanPath = buildLinePath(humanValues, width, height, 28);
              const yGuide = [0, Math.ceil(max / 2), max];
              return (
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[240px]">
                  {yGuide.map((v) => {
                    const y = aiPath.y(v);
                    return (
                      <g key={v}>
                        <line x1={28} x2={width - 28} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="3 3" />
                        <text x={6} y={y + 4} fontSize="10" fill="#6b7280">{v}</text>
                      </g>
                    );
                  })}
                  <path d={aiPath.path} fill="none" stroke="#4f46e5" strokeWidth="2.5" />
                  <path d={humanPath.path} fill="none" stroke="#f97316" strokeWidth="2.5" />
                  {dailyTrend.map((d, i) => (
                    <g key={d.date}>
                      <circle cx={aiPath.x(i)} cy={aiPath.y(d.aiResolved)} r="3.5" fill="#4f46e5" />
                      <circle cx={humanPath.x(i)} cy={humanPath.y(d.humanRequired)} r="3.5" fill="#f97316" />
                      <text x={aiPath.x(i)} y={height - 8} textAnchor="middle" fontSize="10" fill="#6b7280">
                        {d.date.slice(5)}
                      </text>
                    </g>
                  ))}
                </svg>
              );
            })()}
          </div>
          <div className="mt-3 flex items-center gap-6 text-sm">
            <span className="inline-flex items-center gap-2 text-indigo-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-600" />
              {t('aiResolved')}
            </span>
            <span className="inline-flex items-center gap-2 text-orange-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
              {t('humanRequired')}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">{t('aiResolutionRate')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('aiResolutionRateDesc')}</p>
          <div className="mt-5 flex items-center gap-4">
            <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
              <circle cx="48" cy="48" r="38" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="48"
                cy="48"
                r="38"
                fill="none"
                stroke="#22c55e"
                strokeWidth="10"
                strokeDasharray={`${(resolutionRate / 100) * 238.76} 238.76`}
                transform="rotate(-90 48 48)"
              />
            </svg>
            <div>
              <p className="text-3xl font-bold text-gray-900">{resolutionRate}%</p>
              <p className="text-sm text-gray-500">{t('resolutionRatio', { ai: aiResolvedTotal, human: humanRequiredTotal })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today realtime status */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">{t('realtimeToday')}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">{t('queuedConversations')}</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{queuedConversations}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">{t('processingConversations')}</p>
            <p className="mt-2 text-2xl font-bold text-indigo-600">{processingConversations}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">{t('avgReplySecondsToday')}</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{avgReplySecondsToday}s</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">{t('unresolvedToday')}</p>
            <p className="mt-2 text-2xl font-bold text-rose-600">{unresolvedToday}</p>
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
                className="group block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
                title={conv.message}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{emotionFromMessage(conv.message)}</span>
                      <p className="font-medium text-gray-900">
                        {conv.contacts?.name || t('unnamedCustomer')}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          conv.role === 'assistant'
                            ? conv.resolved_by === 'human'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {conv.role === 'assistant'
                          ? conv.resolved_by === 'human'
                            ? t('sourceHuman')
                            : t('sourceAi')
                          : t('sourceUser')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {conv.message.length > 50
                        ? conv.message.substring(0, 50) + '...'
                        : conv.message}
                    </p>
                    <p className="mt-1 hidden text-xs text-gray-400 group-hover:block">
                      {t('hoverPreview')}: {conv.message.length > 120 ? `${conv.message.slice(0, 120)}...` : conv.message}
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
