'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import {
  SearchBar,
  StatusTabs,
  FilterBar,
  TagFilter,
  BatchToolbar,
  EmptyState,
  ConversationListItem,
  ConversationPanel,
  type ConversationStatus,
  type StatusFilter,
  type DateRangeFilter,
  type SortBy,
  type TagWithCount,
  type Conversation,
} from './components';

type Contact = {
  id: string;
  name: string | null;
  line_user_id: string;
  tags: string[];
  notes?: string | null;
  status?: 'pending' | 'resolved';
  conversationStatus: ConversationStatus;
  lastMessage: string;
  lastMessageTime: string;
  conversationCount: number;
  firstInteraction: string | null;
  lastInteraction: string | null;
};

export default function ConversationsPage() {
  const t = useTranslations('conversations');
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
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ total: number; ai_handled: number; needs_human: number; resolved: number; closed: number } | null>(null);

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

  async function takeoverConversation(contactId: string) {
    try {
      const res = await fetch(`/api/conversations/${contactId}/takeover`, { method: 'PUT' });
      if (!res.ok) return;
      await changeStatus(contactId, 'needs_human');
      if (selectedContactId === contactId) {
        await loadConversations(contactId);
      }
    } catch {
      // ignore
    }
  }

  async function handbackConversation(contactId: string) {
    try {
      const res = await fetch(`/api/conversations/${contactId}/handback`, { method: 'PUT' });
      if (!res.ok) return;
      await changeStatus(contactId, 'ai_handled');
      if (selectedContactId === contactId) {
        await loadConversations(contactId);
      }
    } catch {
      // ignore
    }
  }

  async function sendHumanReply(message: string) {
    if (!selectedContactId) return;
    const res = await fetch(`/api/conversations/${selectedContactId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) return;
    const json = await res.json().catch(() => ({}));
    const inserted = json.item as Conversation | undefined;
    if (inserted) {
      setConversations((prev) => [...prev, inserted]);
    } else {
      await loadConversations(selectedContactId);
    }
    setContacts((prev) =>
      prev.map((c) =>
        c.id === selectedContactId
          ? {
              ...c,
              conversationStatus: 'needs_human',
              lastMessage: message,
              lastMessageTime: new Date().toISOString(),
              lastInteraction: new Date().toISOString(),
            }
          : c
      )
    );
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
          lastInteraction: created_at,
          firstInteraction: contact.firstInteraction ?? created_at,
          conversationCount: (contact.conversationCount ?? 0) + 1,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  useEffect(() => {
    if (selectedContactId) {
      loadConversations(selectedContactId);
    }
  }, [selectedContactId]);

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
                notes: null,
                status: 'pending',
                conversationStatus: 'ai_handled',
                lastMessage: '尚無對話',
                lastMessageTime: '',
                conversationCount: 0,
                firstInteraction: null,
                lastInteraction: null,
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
    setError(null);
    const supabase = createClient();
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError(t('loadTimeout'));
          return false;
        }
        return prev;
      });
    }, 10000);

    try {
    // Get all contacts with tags, status, and their latest conversation
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, name, line_user_id, tags, notes, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!contactsData) {
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
        const [{ data: lastMsg }, { data: firstMsg }, { count: convCount }] = await Promise.all([
          supabase
            .from('conversations')
            .select('message, created_at')
            .eq('contact_id', contact.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('conversations')
            .select('created_at')
            .eq('contact_id', contact.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('contact_id', contact.id),
        ]);

        return {
          id: contact.id,
          name: contact.name,
          line_user_id: contact.line_user_id,
          tags: (contact.tags as string[] | null) ?? [],
          notes: (contact.notes as string | null) ?? null,
          status: (contact.status === 'resolved' ? 'resolved' : 'pending') as 'pending' | 'resolved',
          conversationStatus: latestStatusByContact.get(contact.id) ?? 'ai_handled',
          lastMessage: lastMsg?.message || '尚無對話',
          lastMessageTime: lastMsg?.created_at || '',
          conversationCount: convCount ?? 0,
          firstInteraction: firstMsg?.created_at ?? null,
          lastInteraction: lastMsg?.created_at ?? null,
        };
      })
    );

    contactsWithMessages.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    setContacts(contactsWithMessages);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadFailed'));
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  async function loadConversations(contactId: string) {
    const supabase = createClient();
    
    const { data } = await supabase
      .from('conversations')
      .select('id, message, role, created_at, status, resolved_by')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });

    setConversations(data || []);
  }

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-3 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-xl font-semibold mb-2">{t('loadFailed')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => { setError(null); setLoading(true); loadContacts(); }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            {t('reload')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: Search + filters + contact list */}
      <div className="lg:hidden">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('pageTitle')}</h1>
        <div className="mb-3">
          <SearchBar value={searchInput} onChange={setSearchInput} />
        </div>
        <div className="mb-3 overflow-x-auto">
          <StatusTabs
            activeFilter={statusFilter}
            counts={counts}
            onChange={setStatusFilter}
            compact
          />
        </div>
        <div className="mb-3">
          <FilterBar
            dateRange={dateRangeFilter}
            sortBy={sortBy}
            onDateRangeChange={setDateRangeFilter}
            onSortChange={setSortBy}
          />
        </div>
        {(tagList.length > 0 || selectedTagFilters.size > 0) && (
          <div className="mb-4 p-3 rounded-xl border border-gray-200 bg-white">
            <TagFilter
              tags={tagList}
              selectedTags={selectedTagFilters}
              onToggle={(tag) => {
                setSelectedTagFilters((prev) => {
                  const next = new Set(prev);
                  if (next.has(tag)) next.delete(tag);
                  else next.add(tag);
                  return next;
                });
              }}
              onClearAll={() => setSelectedTagFilters(new Set())}
            />
          </div>
        )}
        {filteredContacts.length === 0 ? (
          contacts.length === 0 ? (
            <EmptyState variant="no-contacts" />
          ) : (
            <EmptyState
              variant="no-filtered"
              onClearFilters={() => {
                setSearchInput('');
                setSearchQuery('');
                setStatusFilter('all');
                setDateRangeFilter('all');
                setSelectedTagFilters(new Set());
              }}
            />
          )
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{t('foundConversations', { count: filteredContacts.length })}</p>
            <BatchToolbar
              selectedCount={selectedIds.size}
              loading={batchLoading}
              onResolve={() => runBatch('resolve')}
              onUnresolve={() => runBatch('unresolve')}
              onDelete={handleBatchDelete}
              onAddTag={handleBatchAddTag}
              onCancel={() => setSelectedIds(new Set())}
            />
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
                aria-label={t('selectAll')}
              />
              <span className="text-xs text-gray-500">{t('selectAll')}</span>
            </div>
            {sortedContacts.map((contact) => (
              <ConversationListItem
                key={contact.id}
                contact={contact}
                isSelected={false}
                isChecked={selectedIds.has(contact.id)}
                searchQuery={searchQuery}
                onSelect={() => {
                  window.location.href = `/dashboard/conversations/${contact.id}`;
                }}
                onToggleCheck={() => toggleSelect(contact.id)}
                onChangeStatus={(newStatus) => changeStatus(contact.id, newStatus)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Two-column layout */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('pageTitle')}</h1>
        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          <div className="w-80 flex-shrink-0">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900">{t('contacts')}</h2>
              </div>
              <div className="p-3 border-b border-gray-100">
                <SearchBar value={searchInput} onChange={setSearchInput} />
              </div>
              <div className="p-3 border-b border-gray-100">
                <StatusTabs
                  activeFilter={statusFilter}
                  counts={counts}
                  onChange={setStatusFilter}
                />
                <div className="mt-2">
                  <FilterBar
                    dateRange={dateRangeFilter}
                    sortBy={sortBy}
                    onDateRangeChange={setDateRangeFilter}
                    onSortChange={setSortBy}
                  />
                </div>
              </div>
              <div className="p-3 border-b border-gray-100">
                <TagFilter
                  tags={tagList}
                  selectedTags={selectedTagFilters}
                  onToggle={(tag) => {
                    setSelectedTagFilters((prev) => {
                      const next = new Set(prev);
                      if (next.has(tag)) next.delete(tag);
                      else next.add(tag);
                      return next;
                    });
                  }}
                  onClearAll={() => setSelectedTagFilters(new Set())}
                />
              </div>
              <BatchToolbar
                selectedCount={selectedIds.size}
                loading={batchLoading}
                onResolve={() => runBatch('resolve')}
                onUnresolve={() => runBatch('unresolve')}
                onDelete={handleBatchDelete}
                onAddTag={handleBatchAddTag}
                onCancel={() => setSelectedIds(new Set())}
              />
              {successMessage && (
                <div className="px-3 py-2 bg-green-50 text-green-800 text-sm border-b border-green-100">
                  {successMessage}
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                {filteredContacts.length > 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
                    {t('foundConversations', { count: filteredContacts.length })}
                  </div>
                )}
                {filteredContacts.length === 0 ? (
                  <div className="p-6 text-center">
                    {contacts.length === 0 ? (
                      <EmptyState variant="no-contacts" />
                    ) : (
                      <EmptyState
                        variant="no-filtered"
                        onClearFilters={() => {
                          setSearchInput('');
                          setSearchQuery('');
                          setStatusFilter('all');
                          setDateRangeFilter('all');
                          setSelectedTagFilters(new Set());
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    <div className="flex items-center gap-3 p-3 border-b border-gray-100 bg-gray-50/80" role="row">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label={t('selectAll')}
                      />
                      <span className="text-xs text-gray-500">{t('selectAll')}</span>
                    </div>
                    {sortedContacts.map((contact) => (
                      <ConversationListItem
                        key={contact.id}
                        contact={contact}
                        isSelected={selectedContactId === contact.id}
                        isChecked={selectedIds.has(contact.id)}
                        searchQuery={searchQuery}
                        onSelect={() => setSelectedContactId(contact.id)}
                        onToggleCheck={() => toggleSelect(contact.id)}
                        onChangeStatus={(newStatus) => changeStatus(contact.id, newStatus)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden h-full flex flex-col">
              <ConversationPanel
                selectedContact={selectedContact ?? null}
                conversations={conversations}
                onTakeover={async () => {
                  if (!selectedContactId) return;
                  await takeoverConversation(selectedContactId);
                }}
                onHandback={async () => {
                  if (!selectedContactId) return;
                  await handbackConversation(selectedContactId);
                }}
                onSendHumanReply={sendHumanReply}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
