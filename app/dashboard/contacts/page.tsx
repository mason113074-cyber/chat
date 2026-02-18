'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import { TAG_COLORS } from '@/lib/contact-tags';
import { EmptyState } from '@/components/EmptyState';

type Tag = { id: string; name: string; color: string };
type ContactTag = { id: string; name: string; color: string; assigned_by: string };
type Contact = {
  id: string;
  name: string | null;
  line_user_id: string;
  created_at: string;
  conversationCount: number;
  lastInteraction: string | null;
  tags: ContactTag[];
};

const ITEMS_PER_PAGE = 20;

const COLOR_CLASS: Record<string, string> = {
  red: 'bg-red-100 text-red-800',
  orange: 'bg-orange-100 text-orange-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  pink: 'bg-pink-100 text-pink-800',
  gray: 'bg-gray-100 text-gray-800',
};
function tagClass(color: string): string {
  return COLOR_CLASS[color] ?? COLOR_CLASS.gray;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('gray');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('gray');
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchContacts = useCallback(async () => {
    const res = await fetch('/api/contacts');
    if (res.ok) {
      const json = await res.json();
      setContacts(json.contacts ?? []);
    }
  }, []);
  const fetchTags = useCallback(async () => {
    const res = await fetch('/api/contacts/tags');
    if (res.ok) {
      const json = await res.json();
      setTags(json.tags ?? []);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const timeoutId = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError('載入超時，請重新整理頁面或聯繫客服');
          return false;
        }
        return prev;
      });
    }, 10000);
    Promise.all([fetchContacts(), fetchTags()])
      .catch((err) => {
        setError(err instanceof Error ? err.message : '載入失敗');
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
  }, [fetchContacts, fetchTags]);

  const filteredContacts =
    selectedTagIds.size === 0
      ? contacts
      : contacts.filter((c) => selectedTagIds.size > 0 && [...selectedTagIds].every((tid) => c.tags.some((t) => t.id === tid)));

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / ITEMS_PER_PAGE));
  const paginatedContacts = filteredContacts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedTagIds]);

  function toggleTagFilter(tagId: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  async function addTagToContact(contactId: string, tagId: string) {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact?.tags.some((t) => t.id === tagId)) return;
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== contactId) return c;
        const tag = tags.find((t) => t.id === tagId);
        if (!tag) return c;
        return { ...c, tags: [...c.tags, { ...tag, assigned_by: 'manual' }] };
      })
    );
    const res = await fetch(`/api/contacts/${contactId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_id: tagId }),
    });
    if (!res.ok) {
      await fetchContacts();
    }
  }

  async function removeTagFromContact(contactId: string, tagId: string) {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, tags: c.tags.filter((t) => t.id !== tagId) } : c))
    );
    const res = await fetch(`/api/contacts/${contactId}/tags/${tagId}`, { method: 'DELETE' });
    if (!res.ok) {
      await fetchContacts();
    }
  }

  async function createTag() {
    const name = newTagName.trim();
    if (!name) return;
    const res = await fetch('/api/contacts/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color: newTagColor }),
    });
    if (res.ok) {
      const tag = await res.json();
      setTags((prev) => [...prev, tag]);
      setNewTagName('');
      setNewTagColor('gray');
    }
  }

  async function updateTag(tagId: string, name: string, color: string) {
    const res = await fetch(`/api/contacts/tags/${tagId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), color }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTags((prev) => prev.map((t) => (t.id === tagId ? updated : t)));
      setContacts((prev) =>
        prev.map((c) => ({
          ...c,
          tags: c.tags.map((t) => (t.id === tagId ? { ...t, name: updated.name, color: updated.color } : t)),
        }))
      );
      setEditingTagId(null);
    }
  }

  async function deleteTag(tagId: string) {
    const res = await fetch(`/api/contacts/tags/${tagId}`, { method: 'DELETE' });
    if (res.ok) {
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      setContacts((prev) =>
        prev.map((c) => ({ ...c, tags: c.tags.filter((t) => t.id !== tagId) }))
      );
      setSelectedTagIds((prev) => {
        const next = new Set(prev);
        next.delete(tagId);
        return next;
      });
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenPopoverId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-3 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠</div>
          <h2 className="text-xl font-semibold mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
          <p className="mt-1 text-gray-600">共 {filteredContacts.length} 位聯絡人</p>
        </div>
        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          管理標籤
        </button>
      </div>

      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">標籤篩選：</span>
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTagFilter(t.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${tagClass(t.color)} ${
                selectedTagIds.has(t.id) ? 'ring-2 ring-offset-1 ring-gray-400' : ''
              }`}
            >
              {t.name}
            </button>
          ))}
          {selectedTagIds.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTagIds(new Set())}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              清除篩選
            </button>
          )}
        </div>
      )}

      <div className="mt-8">
        {!contacts.length ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 shadow-sm">
            <EmptyState
              icon="👥"
              title="還沒有客戶"
              description="當客戶透過 LINE 發送第一則訊息後，會自動建立聯絡人並顯示於此。"
            />
          </div>
        ) : (
          <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">名稱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">LINE User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">標籤</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">對話數量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">最後互動時間</th>
                  <th className="px-6 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        href={`/dashboard/conversations/${c.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {c.name || '未命名客戶'}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 font-mono">{c.line_user_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tagClass(t.color)}`}
                          >
                            {t.name}
                          </span>
                        ))}
                        {c.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{c.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{c.conversationCount}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {c.lastInteraction ? new Date(c.lastInteraction).toLocaleString('zh-TW') : '—'}
                    </td>
                    <td className="px-6 py-4 relative">
                      <div className="relative inline-block" ref={openPopoverId === c.id ? popoverRef : undefined}>
                      <button
                        type="button"
                        onClick={() => setOpenPopoverId((id) => (id === c.id ? null : c.id))}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-200"
                        aria-label="標籤"
                      >
                        🏷️
                      </button>
                      {openPopoverId === c.id && (
                        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                          <div className="max-h-48 overflow-y-auto px-2">
                            {tags.map((t) => {
                              const assigned = c.tags.some((x) => x.id === t.id);
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => (assigned ? removeTagFromContact(c.id, t.id) : addTagToContact(c.id, t.id))}
                                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${tagClass(t.color)}`}
                                >
                                  {assigned ? '✅' : '○'} {t.name}
                                </button>
                              );
                            })}
                          </div>
                          <div className="border-t border-gray-100 mt-2 pt-2 px-2 space-y-2">
                            <p className="text-xs font-medium text-gray-500">+ 新增標籤</p>
                            <input
                              type="text"
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              placeholder="標籤名稱"
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                            <select
                              value={newTagColor}
                              onChange={(e) => setNewTagColor(e.target.value)}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            >
                              {TAG_COLORS.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => createTag()}
                              className="w-full rounded bg-indigo-600 px-2 py-1 text-sm text-white hover:bg-indigo-700"
                            >
                              新增標籤
                            </button>
                          </div>
                        </div>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一頁
              </button>
              <span className="text-sm text-gray-600">
                第 {page} / 共 {totalPages} 頁（顯示 {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, filteredContacts.length)}）
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一頁
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {/* Manage tags modal */}
      {manageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setManageOpen(false)}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">管理標籤</h2>
              <button type="button" onClick={() => setManageOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {tags.map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                  {editingTagId === t.id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <select
                        value={editingColor}
                        onChange={(e) => setEditingColor(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        {TAG_COLORS.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => updateTag(t.id, editingName, editingColor)} className="text-sm text-indigo-600">儲存</button>
                      <button type="button" onClick={() => setEditingTagId(null)} className="text-sm text-gray-500">取消</button>
                    </>
                  ) : (
                    <>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium flex-1 ${tagClass(t.color)}`}>{t.name}</span>
                      <button type="button" onClick={() => { setEditingTagId(t.id); setEditingName(t.name); setEditingColor(t.color); }} className="text-sm text-indigo-600">編輯</button>
                      <button type="button" onClick={() => deleteTag(t.id)} className="text-sm text-red-600">刪除</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
