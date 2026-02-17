'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

type ConversationStatus = 'ai_handled' | 'needs_human' | 'resolved' | 'closed';

type Contact = {
  id: string;
  name: string | null;
  line_user_id: string;
  tags: string[];
  status?: 'pending' | 'resolved';
  conversationStatus: ConversationStatus;
  lastMessage: string;
  lastMessageTime: string;
};

/** Highlight matching substring in text (case-insensitive). */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${q})`, 'gi');
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

type TagWithCount = { tag: string; count: number };

const TAG_COLORS = [
  'bg-indigo-100 text-indigo-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
];
function tagColor(tag: string): string {
  const i = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return TAG_COLORS[Math.abs(i) % TAG_COLORS.length];
}

const STATUS_BADGE: Record<ConversationStatus, { label: string; className: string; pulse?: boolean }> = {
  ai_handled: { label: 'AI 已處理', className: 'bg-green-100 text-green-800' },
  needs_human: { label: '需人工處理', className: 'bg-orange-100 text-orange-800', pulse: true },
  resolved: { label: '已解決', className: 'bg-blue-100 text-blue-800' },
  closed: { label: '已關閉', className: 'bg-gray-100 text-gray-700' },
};

function StatusBadge({ status }: { status: ConversationStatus }) {
  const conf = STATUS_BADGE[status] ?? STATUS_BADGE.ai_handled;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${conf.className} ${conf.pulse ? 'animate-pulse opacity-90' : ''}`}
    >
      {conf.label}
    </span>
  );
}

type Conversation = {
  id: string;
  message: string;
  role: string;
  created_at: string;
};

type StatusFilter = 'all' | 'ai_handled' | 'needs_human' | 'resolved' | 'closed';
type DateRangeFilter = 'all' | 'today' | '7' | '30';
type SortBy = 'newest' | 'oldest' | 'unread_first' | 'name_az';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'newest', label: '最新訊息優先' },
  { value: 'oldest', label: '最舊訊息優先' },
  { value: 'unread_first', label: '未讀優先' },
  { value: 'name_az', label: '按客戶名稱 A-Z' },
];

export default function ConversationsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tagList, setTagList] = useState<TagWithCount[]>([]);
  const [selectedTagFilters, setSelectedTagFilters] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<{ total: number; ai_handled: number; needs_human: number; resolved: number; closed: number } | null>(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const tagFilteredContacts =
    selectedTagFilters.size === 0
      ? contacts
      : contacts.filter((c) =>
          c.tags.some((t) => selectedTagFilters.has(t))
        );

  const filteredContacts = useMemo(() => {
    let list = tagFilteredContacts;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.lastMessage ?? '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter((c) => c.conversationStatus === statusFilter);
    }

    if (dateRangeFilter !== 'all') {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      let start: number;
      if (dateRangeFilter === 'today') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        start = d.getTime();
      } else if (dateRangeFilter === '7') {
        start = now - 7 * dayMs;
      } else {
        start = now - 30 * dayMs;
      }
      list = list.filter((c) => {
        const t = c.lastMessageTime ? new Date(c.lastMessageTime).getTime() : 0;
        return t >= start;
      });
    }

    return list;
  }, [tagFilteredContacts, searchQuery, statusFilter, dateRangeFilter]);

  const sortedContacts = useMemo(() => {
    let list = [...filteredContacts];
    const time = (c: Contact) => (c.lastMessageTime ? new Date(c.lastMessageTime).getTime() : 0);
    const name = (c: Contact) => c.name || '未命名';

    if (statusFilter === 'all') {
      list.sort((a, b) => {
        const aNeeds = a.conversationStatus === 'needs_human' ? 0 : 1;
        const bNeeds = b.conversationStatus === 'needs_human' ? 0 : 1;
        if (aNeeds !== bNeeds) return aNeeds - bNeeds;
        return time(b) - time(a);
      });
    } else {
      if (sortBy === 'newest') {
        list.sort((a, b) => time(b) - time(a));
      } else if (sortBy === 'oldest') {
        list.sort((a, b) => time(a) - time(b));
      } else if (sortBy === 'unread_first') {
        list.sort((a, b) => {
          const aNeeds = a.conversationStatus === 'needs_human' ? 0 : 1;
          const bNeeds = b.conversationStatus === 'needs_human' ? 0 : 1;
          if (aNeeds !== bNeeds) return aNeeds - bNeeds;
          return time(b) - time(a);
        });
      } else {
        list.sort((a, b) => name(a).localeCompare(name(b), 'zh-TW'));
      }
    }
    return list;
  }, [filteredContacts, sortBy, statusFilter]);

  const allFilteredSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedIds.has(c.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredContacts.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredContacts.forEach((c) => next.add(c.id));
        return next;
      });
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBatch(
    action: 'resolve' | 'unresolve' | 'delete' | 'add_tag' | 'remove_tag',
    tag?: string
  ) {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    setSuccessMessage(null);
    try {
      const body: { action: string; conversationIds: string[]; tag?: string } = {
        action,
        conversationIds: Array.from(selectedIds),
      };
      if (tag !== undefined) body.tag = tag;
      const res = await fetch('/api/conversations/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSuccessMessage(data.error || '操作失敗');
        return;
      }
      setSuccessMessage(data.message || '完成');
      setSelectedIds(new Set());
      await loadContacts();
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setBatchLoading(false);
    }
  }

  function handleBatchDelete() {
    const n = selectedIds.size;
    if (n === 0) return;
    if (!confirm(`確定要刪除 ${n} 個對話嗎？此操作無法復原`)) return;
    runBatch('delete');
  }

  function handleBatchAddTag() {
    const tag = window.prompt('請輸入要新增的標籤名稱');
    if (tag == null || tag.trim() === '') return;
    runBatch('add_tag', tag.trim());
  }

  async function changeStatus(contactId: string, newStatus: ConversationStatus) {
    const prev = contacts.find((c) => c.id === contactId);
    if (!prev) return;
    setContacts((prevList) =>
      prevList.map((c) => (c.id === contactId ? { ...c, conversationStatus: newStatus } : c))
    );
    if (counts) {
      const prevCount = counts[prev.conversationStatus] ?? 0;
      const nextCount = (counts[newStatus] ?? 0) + 1;
      setCounts((c) =>
        c
          ? {
              ...c,
              [prev.conversationStatus]: Math.max(0, prevCount - 1),
              [newStatus]: nextCount,
            }
          : c
      );
    }
    try {
      const res = await fetch(`/api/conversations/${contactId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setContacts((prevList) =>
          prevList.map((c) => (c.id === contactId ? { ...c, conversationStatus: prev.conversationStatus } : c))
        );
        if (counts) setCounts(counts);
      } else {
        const countsRes = await fetch('/api/conversations/counts');
        if (countsRes.ok) {
          const json = await countsRes.json();
          setCounts({
            total: json.total ?? 0,
            ai_handled: json.ai_handled ?? 0,
            needs_human: json.needs_human ?? 0,
            resolved: json.resolved ?? 0,
            closed: json.closed ?? 0,
          });
        }
      }
    } catch {
      setContacts((prevList) =>
        prevList.map((c) => (c.id === contactId ? { ...c, conversationStatus: prev.conversationStatus } : c))
      );
      if (counts) setCounts(counts);
    }
  }

  // 更新聯絡人列表並重新排序的輔助函數
  const updateContactsList = useCallback((
    contacts: Contact[],
    contactId: string,
    message: string,
    created_at: string
  ): Contact[] => {
    let contactFound = false;
    const updated = contacts.map((contact) => {
      if (contact.id === contactId) {
        contactFound = true;
        return {
          ...contact,
          lastMessage: message,
          lastMessageTime: created_at,
        };
      }
      return contact;
    });
    
    // 如果聯絡人不在列表中，跳過更新（讓新聯絡人訂閱處理）
    if (!contactFound) {
      return contacts;
    }
    
    // 重新排序，最新訊息的聯絡人排到最上面
    return updated.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
  }, []);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContactId) {
      loadConversations(selectedContactId);
    }
  }, [selectedContactId]);

  // 自動捲動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  // 訂閱對話即時更新
  useEffect(() => {
    if (!selectedContactId) return;
    
    const supabase = createClient();
    
    const channel = supabase
      .channel(`conversations:${selectedContactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `contact_id=eq.${selectedContactId}`,
        },
        (payload) => {
          const newConv = payload.new as Conversation;
          setConversations((prev) => [...prev, newConv]);
          
          // 更新聯絡人列表的最新訊息
          setContacts((prev) => updateContactsList(
            prev,
            selectedContactId,
            newConv.message,
            newConv.created_at
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContactId, updateContactsList]);

  // 訂閱新聯絡人
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;
    
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      channel = supabase
        .channel('contacts:new')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'contacts',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newContact = payload.new as {
              id: string;
              name: string | null;
              line_user_id: string;
            };
            
            setContacts((prev) => [
              {
                id: newContact.id,
                name: newContact.name,
                line_user_id: newContact.line_user_id,
                tags: [],
                status: 'pending',
                conversationStatus: 'ai_handled',
                lastMessage: '尚無對話',
                lastMessageTime: '',
              },
              ...prev,
            ]);
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // 訂閱所有聯絡人的對話更新（用於更新聯絡人列表）
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('conversations:all')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          const newConv = payload.new as Conversation & { contact_id: string };
          
          // 更新聯絡人列表
          setContacts((prev) => updateContactsList(
            prev,
            newConv.contact_id,
            newConv.message,
            newConv.created_at
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [updateContactsList]);

  async function loadContacts() {
    const supabase = createClient();
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all contacts with tags, status, and their latest conversation
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, name, line_user_id, tags, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!contactsData) {
      setLoading(false);
      return;
    }

    const contactIds = contactsData.map((c) => c.id);
    const { data: assistantRows } = await supabase
      .from('conversations')
      .select('contact_id, status, created_at')
      .eq('role', 'assistant')
      .in('contact_id', contactIds)
      .order('created_at', { ascending: false });
    const latestStatusByContact = new Map<string, ConversationStatus>();
    for (const row of assistantRows ?? []) {
      if (!latestStatusByContact.has(row.contact_id)) {
        const s = row.status ?? 'ai_handled';
        latestStatusByContact.set(
          row.contact_id,
          ['ai_handled', 'needs_human', 'resolved', 'closed'].includes(s) ? (s as ConversationStatus) : 'ai_handled'
        );
      }
    }

    const contactsWithMessages = await Promise.all(
      contactsData.map(async (contact) => {
        const { data: lastMsg } = await supabase
          .from('conversations')
          .select('message, created_at')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: contact.id,
          name: contact.name,
          line_user_id: contact.line_user_id,
          tags: (contact.tags as string[] | null) ?? [],
          status: (contact.status === 'resolved' ? 'resolved' : 'pending') as 'pending' | 'resolved',
          conversationStatus: latestStatusByContact.get(contact.id) ?? 'ai_handled',
          lastMessage: lastMsg?.message || '尚無對話',
          lastMessageTime: lastMsg?.created_at || '',
        };
      })
    );

    contactsWithMessages.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    setContacts(contactsWithMessages);

    try {
      const [tagsRes, countsRes] = await Promise.all([
        fetch('/api/tags'),
        fetch('/api/conversations/counts'),
      ]);
      if (tagsRes.ok) {
        const json = await tagsRes.json();
        setTagList(json.tags ?? []);
      }
      if (countsRes.ok) {
        const json = await countsRes.json();
        setCounts({
          total: json.total ?? 0,
          ai_handled: json.ai_handled ?? 0,
          needs_human: json.needs_human ?? 0,
          resolved: json.resolved ?? 0,
          closed: json.closed ?? 0,
        });
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function loadConversations(contactId: string) {
    const supabase = createClient();
    
    const { data } = await supabase
      .from('conversations')
      .select('id, message, role, created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });

    setConversations(data || []);
  }

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: Search + filters + contact list */}
      <div className="lg:hidden">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">對話紀錄</h1>
        {/* Search */}
        <div className="mb-3">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜尋客戶名稱或訊息內容"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="搜尋對話"
          />
        </div>
        {/* Status filter tabs */}
        <div className="mb-3 overflow-x-auto">
          <div className="flex gap-1 min-w-0 pb-1">
            {[
              { value: 'all' as const, label: '全部', count: counts?.total ?? 0 },
              { value: 'ai_handled' as const, label: 'AI 已處理', count: counts?.ai_handled ?? 0, color: 'text-green-700' },
              { value: 'needs_human' as const, label: '需人工處理', count: counts?.needs_human ?? 0, color: 'text-orange-700' },
              { value: 'resolved' as const, label: '已解決', count: counts?.resolved ?? 0 },
              { value: 'closed' as const, label: '已關閉', count: counts?.closed ?? 0 },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === tab.value
                    ? 'border-indigo-600 text-gray-900 font-semibold bg-indigo-50'
                    : 'border-transparent text-gray-600 hover:bg-gray-100'
                } ${tab.color ?? ''}`}
              >
                {tab.label} {tab.count > 0 ? `(${tab.count})` : ''}
              </button>
            ))}
          </div>
        </div>
        {/* Date filters */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {(['today', '7', '30', 'all'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRangeFilter(range)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  dateRangeFilter === range
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === 'today' ? '今天' : range === '7' ? '最近 7 天' : range === '30' ? '最近 30 天' : '全部'}
              </button>
            ))}
          </div>
        </div>
        {/* Sort */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 shrink-0">排序 ↕</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            aria-label="排序方式"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {/* Mobile tag filter */}
        {(tagList.length > 0 || selectedTagFilters.size > 0) && (
          <div className="mb-4 p-3 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">標籤篩選</span>
              {selectedTagFilters.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTagFilters(new Set())}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  全部對話
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tagList.map(({ tag, count }) => {
                const selected = selectedTagFilters.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTagFilters((prev) => {
                        const next = new Set(prev);
                        if (next.has(tag)) next.delete(tag);
                        else next.add(tag);
                        return next;
                      });
                    }}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${selected ? tagColor(tag) + ' ring-1 ring-offset-1 ring-gray-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {tag}
                    <span className="opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {filteredContacts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mb-4">
                <span className="text-4xl">💬</span>
              </div>
              {contacts.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    尚無對話紀錄
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md">
                    當客戶透過 LINE 與 Bot 對話後，對話會顯示於此。
                  </p>
                  <a
                    href="/dashboard/settings"
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    查看 LINE 設定教學
                  </a>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    沒有符合條件的對話
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">嘗試調整搜尋或篩選條件</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setSearchQuery('');
                      setStatusFilter('all');
                      setDateRangeFilter('all');
                      setSelectedTagFilters(new Set());
                    }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    清除篩選
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">找到 {filteredContacts.length} 個對話</p>
            {/* Mobile batch toolbar */}
            {selectedIds.size > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">已選 {selectedIds.size} 個對話</span>
                <button
                  type="button"
                  onClick={() => runBatch('resolve')}
                  disabled={batchLoading}
                  className="rounded px-2 py-1 text-xs font-medium bg-white border border-gray-300"
                >
                  標記為已解決
                </button>
                <button
                  type="button"
                  onClick={() => runBatch('unresolve')}
                  disabled={batchLoading}
                  className="rounded px-2 py-1 text-xs font-medium bg-white border border-gray-300"
                >
                  標記為未解決
                </button>
                <button
                  type="button"
                  onClick={handleBatchDelete}
                  disabled={batchLoading}
                  className="rounded px-2 py-1 text-xs font-medium bg-white border border-red-200 text-red-700"
                >
                  批次刪除
                </button>
                <button
                  type="button"
                  onClick={handleBatchAddTag}
                  disabled={batchLoading}
                  className="rounded px-2 py-1 text-xs font-medium bg-white border border-gray-300"
                >
                  批次新增標籤
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={batchLoading}
                  className="rounded px-2 py-1 text-xs font-medium text-indigo-600"
                >
                  取消選擇
                </button>
              </div>
            )}
            {successMessage && (
              <div className="rounded-xl bg-green-50 text-green-800 text-sm p-3 border border-green-100">
                {successMessage}
              </div>
            )}
            <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-200">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                aria-label="全選/取消全選"
              />
              <span className="text-xs text-gray-500">全選/取消全選</span>
            </div>
            {sortedContacts.map((contact) => (
              <div
                key={contact.id}
                className={`flex items-start gap-3 rounded-xl border border-gray-200 p-4 shadow-sm ${
                  contact.conversationStatus === 'needs_human' ? 'bg-orange-50' : 'bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(contact.id)}
                  onChange={() => toggleSelect(contact.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600"
                  aria-label={`選擇 ${contact.name || '未命名'}`}
                />
                <a
                  href={`/dashboard/conversations/${contact.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">
                          {highlightMatch(contact.name || '未命名客戶', searchQuery)}
                        </p>
                        <StatusBadge status={contact.conversationStatus} />
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                        {highlightMatch(
                          contact.lastMessage.length > 50
                            ? contact.lastMessage.substring(0, 50) + '...'
                            : contact.lastMessage,
                          searchQuery
                        )}
                      </p>
                      {contact.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {contact.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(t)}`}
                            >
                              {t}
                            </span>
                          ))}
                          {contact.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{contact.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {contact.lastMessageTime && (
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(contact.lastMessageTime).toLocaleString('zh-TW', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </a>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setOpenStatusMenuId((id) => (id === contact.id ? null : contact.id)); }}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-200"
                    aria-label="變更狀態"
                  >
                    ⋯
                  </button>
                  {openStatusMenuId === contact.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenStatusMenuId(null)} aria-hidden />
                      <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                        <button type="button" onClick={() => { changeStatus(contact.id, 'resolved'); setOpenStatusMenuId(null); }} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100">標記為已解決</button>
                        <button type="button" onClick={() => { changeStatus(contact.id, 'needs_human'); setOpenStatusMenuId(null); }} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100">標記為需人工</button>
                        <button type="button" onClick={() => { changeStatus(contact.id, 'closed'); setOpenStatusMenuId(null); }} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100">關閉對話</button>
                        <button type="button" onClick={() => { changeStatus(contact.id, 'ai_handled'); setOpenStatusMenuId(null); }} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100">重新開啟</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Two-column layout */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">對話紀錄</h1>
        
        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          {/* Left: Tag filter + Contact list */}
          <div className="w-80 flex-shrink-0">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900">聯絡人</h2>
              </div>
              {/* Search */}
              <div className="p-3 border-b border-gray-100">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="搜尋客戶名稱或訊息內容"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  aria-label="搜尋對話"
                />
              </div>
              {/* Status filter tabs */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {[
                    { value: 'all' as const, label: '全部', count: counts?.total ?? 0 },
                    { value: 'ai_handled' as const, label: 'AI 已處理', count: counts?.ai_handled ?? 0 },
                    { value: 'needs_human' as const, label: '需人工', count: counts?.needs_human ?? 0 },
                    { value: 'resolved' as const, label: '已解決', count: counts?.resolved ?? 0 },
                    { value: 'closed' as const, label: '已關閉', count: counts?.closed ?? 0 },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setStatusFilter(tab.value)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium border-b-2 transition-colors ${
                        statusFilter === tab.value
                          ? 'border-indigo-600 bg-indigo-50 text-gray-900 font-semibold'
                          : 'border-transparent text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {tab.label} {tab.count > 0 ? tab.count : ''}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(['today', '7', '30', 'all'] as const).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setDateRangeFilter(range)}
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        dateRangeFilter === range
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {range === 'today' ? '今天' : range === '7' ? '7 天' : range === '30' ? '30 天' : '全部'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Sort */}
              <div className="p-3 border-b border-gray-100">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">排序 ↕</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  aria-label="排序方式"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Tag filter */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">標籤篩選</span>
                  {selectedTagFilters.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTagFilters(new Set())}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      全部對話
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tagList.map(({ tag, count }) => {
                    const selected = selectedTagFilters.has(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSelectedTagFilters((prev) => {
                            const next = new Set(prev);
                            if (next.has(tag)) next.delete(tag);
                            else next.add(tag);
                            return next;
                          });
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${selected ? tagColor(tag) + ' ring-1 ring-offset-1 ring-gray-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {tag}
                        <span className="opacity-80">({count})</span>
                      </button>
                    );
                  })}
                  {tagList.length === 0 && (
                    <span className="text-xs text-gray-400">尚無標籤</span>
                  )}
                </div>
              </div>
              {/* Batch toolbar */}
              {selectedIds.size > 0 && (
                <div className="border-b border-gray-200 bg-gray-100 px-3 py-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    已選 {selectedIds.size} 個對話
                  </span>
                  <button
                    type="button"
                    onClick={() => runBatch('resolve')}
                    disabled={batchLoading}
                    className="rounded px-2 py-1 text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    標記為已解決
                  </button>
                  <button
                    type="button"
                    onClick={() => runBatch('unresolve')}
                    disabled={batchLoading}
                    className="rounded px-2 py-1 text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    標記為未解決
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    disabled={batchLoading}
                    className="rounded px-2 py-1 text-xs font-medium bg-white border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    批次刪除
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchAddTag}
                    disabled={batchLoading}
                    className="rounded px-2 py-1 text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    批次新增標籤
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    disabled={batchLoading}
                    className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                  >
                    取消選擇
                  </button>
                </div>
              )}
              {successMessage && (
                <div className="px-3 py-2 bg-green-50 text-green-800 text-sm border-b border-green-100">
                  {successMessage}
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                {filteredContacts.length > 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
                    找到 {filteredContacts.length} 個對話
                  </div>
                )}
                {filteredContacts.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="flex flex-col items-center py-8">
                      <div className="rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mb-3">
                        <span className="text-3xl">👥</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {contacts.length === 0
                          ? '尚無聯絡人對話'
                          : '沒有符合條件的對話'}
                      </p>
                      {contacts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchInput('');
                            setSearchQuery('');
                            setStatusFilter('all');
                            setDateRangeFilter('all');
                            setSelectedTagFilters(new Set());
                          }}
                          className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          清除篩選
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    <div
                      className="flex items-center gap-3 p-3 border-b border-gray-100 bg-gray-50/80"
                      role="row"
                    >
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label="全選/取消全選"
                      />
                      <span className="text-xs text-gray-500">全選/取消全選</span>
                    </div>
                    {sortedContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`
                          flex items-start gap-3 w-full text-left p-4 transition-colors
                          ${selectedContactId === contact.id ? 'bg-indigo-50' : contact.conversationStatus === 'needs_human' ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'}
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(contact.id)}
                          onChange={() => toggleSelect(contact.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          aria-label={`選擇 ${contact.name || '未命名'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedContactId(contact.id)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-900">
                              {highlightMatch(contact.name || '未命名客戶', searchQuery)}
                            </p>
                            <StatusBadge status={contact.conversationStatus} />
                          </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                          {highlightMatch(
                            contact.lastMessage.length > 40
                              ? contact.lastMessage.substring(0, 40) + '...'
                              : contact.lastMessage,
                            searchQuery
                          )}
                        </p>
                        {contact.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {contact.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(t)}`}
                              >
                                {t}
                              </span>
                            ))}
                            {contact.tags.length > 3 && (
                              <span className="text-xs text-gray-400">+{contact.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        {contact.lastMessageTime && (
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(contact.lastMessageTime).toLocaleString('zh-TW', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                        </button>
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setOpenStatusMenuId((id) => (id === contact.id ? null : contact.id)); }}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-200"
                            aria-label="變更狀態"
                          >
                            ⋯
                          </button>
                          {openStatusMenuId === contact.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenStatusMenuId(null)} aria-hidden />
                              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                <button type="button" onClick={() => { changeStatus(contact.id, 'resolved'); setOpenStatusMenuId(null); }} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100">標記為已解決</button>
                                <button type="button" onClick={() => { changeStatus(contact.id, 'needs_human'); setOpenStatusMenuId(null); }} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100">標記為需人工</button>
                                <button type="button" onClick={() => { changeStatus(contact.id, 'closed'); setOpenStatusMenuId(null); }} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100">關閉對話</button>
                                <button type="button" onClick={() => { changeStatus(contact.id, 'ai_handled'); setOpenStatusMenuId(null); }} className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100">重新開啟</button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Conversation view */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden h-full flex flex-col">
              {!selectedContactId ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">💬</span>
                    </div>
                    <p className="text-gray-600">請選擇一個對話</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-semibold text-gray-900">
                      {selectedContact?.name || '未命名客戶'}
                    </h2>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversations.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                          <span className="text-3xl">💬</span>
                        </div>
                        <p className="text-gray-600 text-sm">尚無對話內容</p>
                      </div>
                    ) : (
                      <>
                        {conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className={`flex ${conv.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`
                                max-w-[70%] rounded-2xl px-4 py-2
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
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
