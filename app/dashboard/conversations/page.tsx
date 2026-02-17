'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

type Contact = {
  id: string;
  name: string | null;
  line_user_id: string;
  tags: string[];
  status?: 'pending' | 'resolved';
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

type Conversation = {
  id: string;
  message: string;
  role: string;
  created_at: string;
};

type StatusFilter = 'all' | 'resolved' | 'pending';
type DateRangeFilter = 'all' | 'today' | '7' | '30';

export default function ConversationsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tagList, setTagList] = useState<TagWithCount[]>([]);
  const [selectedTagFilters, setSelectedTagFilters] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
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
      list = list.filter((c) => (c.status ?? 'pending') === statusFilter);
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

    // For each contact, get the latest message
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
          lastMessage: lastMsg?.message || '尚無對話',
          lastMessageTime: lastMsg?.created_at || '',
        };
      })
    );

    // Sort by last message time
    contactsWithMessages.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    setContacts(contactsWithMessages);

    // Load tag counts for filter
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const json = await res.json();
        setTagList(json.tags ?? []);
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
        {/* Status + Date filters */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="all">全部狀態</option>
            <option value="resolved">已解決</option>
            <option value="pending">未解決</option>
          </select>
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
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
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
                      <p className="font-medium text-gray-900">
                        {highlightMatch(contact.name || '未命名客戶', searchQuery)}
                      </p>
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
              {/* Status + Date filters */}
              <div className="p-3 border-b border-gray-100 space-y-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                >
                  <option value="all">全部狀態</option>
                  <option value="resolved">已解決</option>
                  <option value="pending">未解決</option>
                </select>
                <div className="flex flex-wrap gap-1">
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
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`
                          flex items-start gap-3 w-full text-left p-4 hover:bg-gray-50 transition-colors
                          ${selectedContactId === contact.id ? 'bg-indigo-50' : ''}
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
                        <p className="font-medium text-gray-900">
                          {highlightMatch(contact.name || '未命名客戶', searchQuery)}
                        </p>
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
