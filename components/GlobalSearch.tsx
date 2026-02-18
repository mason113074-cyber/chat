'use client';

import { useRouter } from '@/i18n/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const PAGE_NAV_ITEMS: { label: string; href: string }[] = [
  { label: '對話紀錄', href: '/dashboard/conversations' },
  { label: '客戶管理', href: '/dashboard/contacts' },
  { label: '知識庫', href: '/dashboard/knowledge-base' },
  { label: '數據分析', href: '/dashboard/analytics' },
  { label: '帳單管理', href: '/dashboard/billing' },
  { label: '設定', href: '/dashboard/settings' },
];

type SearchConversation = {
  id: string;
  contact_id: string;
  contact_name: string;
  content_preview: string;
  created_at: string;
};
type SearchContact = {
  id: string;
  name: string | null;
  line_user_id: string;
  tags: string[];
};
type SearchKnowledge = {
  id: string;
  title: string;
  category: string;
  content_preview: string;
};

type FlatItem =
  | { type: 'page'; href: string; label: string; globalIndex: number }
  | {
      type: 'conversation';
      id: string;
      href: string;
      contact_name: string;
      content_preview: string;
      globalIndex: number;
    }
  | {
      type: 'contact';
      id: string;
      href: string;
      name: string;
      line_user_id: string;
      tags: string[];
      globalIndex: number;
    }
  | {
      type: 'knowledge';
      id: string;
      href: string;
      title: string;
      category: string;
      content_preview: string;
      globalIndex: number;
    };

function fuzzyMatch(label: string, q: string): boolean {
  if (!q.trim()) return true;
  return label.toLowerCase().includes(q.trim().toLowerCase());
}

export function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<{
    conversations: SearchConversation[];
    contacts: SearchContact[];
    knowledge: SearchKnowledge[];
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredPages = useMemo(() => {
    return PAGE_NAV_ITEMS.filter((p) => fuzzyMatch(p.label, query));
  }, [query]);

  const flatItems = useMemo((): FlatItem[] => {
    const items: FlatItem[] = [];
    let idx = 0;
    filteredPages.forEach((p) => {
      items.push({ type: 'page', href: p.href, label: p.label, globalIndex: idx++ });
    });
    if (results) {
      results.conversations.forEach((c) => {
        items.push({
          type: 'conversation',
          id: c.id,
          href: `/dashboard/conversations/${c.contact_id}`,
          contact_name: c.contact_name,
          content_preview: c.content_preview,
          globalIndex: idx++,
        });
      });
      results.contacts.forEach((c) => {
        items.push({
          type: 'contact',
          id: c.id,
          href: `/dashboard/conversations/${c.id}`,
          name: c.name ?? '未命名',
          line_user_id: c.line_user_id,
          tags: c.tags,
          globalIndex: idx++,
        });
      });
      results.knowledge.forEach((k) => {
        items.push({
          type: 'knowledge',
          id: k.id,
          href: '/dashboard/knowledge-base',
          title: k.title,
          category: k.category,
          content_preview: k.content_preview,
          globalIndex: idx++,
        });
      });
    }
    return items;
  }, [filteredPages, results]);

  const totalCount = flatItems.length;

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults(null);
    setSelectedIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setResults({ conversations: [], contacts: [], knowledge: [] });
          } else {
            setResults({
              conversations: data.conversations ?? [],
              contacts: data.contacts ?? [],
              knowledge: data.knowledge ?? [],
            });
          }
        })
        .catch(() =>
          setResults({ conversations: [], contacts: [], knowledge: [] })
        )
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    setSelectedIndex((i) => (totalCount === 0 ? 0 : Math.min(i, totalCount - 1)));
  }, [totalCount]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i < totalCount - 1 ? i + 1 : i));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (item) {
          onClose();
          router.push(item.href);
        }
      }
    },
    [totalCount, selectedIndex, flatItems, onClose, router]
  );

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  const handleSelect = useCallback(
    (item: FlatItem) => {
      onClose();
      router.push(item.href);
    },
    [onClose, router]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 pt-[20vh] px-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="全域搜尋"
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-xl rounded-xl border border-gray-200 bg-white shadow-2xl animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜尋對話、聯絡人、知識庫..."
            className="w-full rounded-lg border-0 bg-transparent py-2 text-lg text-gray-900 placeholder-gray-400 focus:ring-0"
            autoComplete="off"
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <span>搜尋中...</span>
            </div>
          )}
          {!loading && totalCount === 0 && (
            <p className="py-8 text-center text-gray-500">找不到符合的結果</p>
          )}
          {!loading && totalCount > 0 && (
            <>
              {filteredPages.length > 0 && (
                <div className="px-2 pb-2">
                  <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    📄 頁面導航
                  </p>
                  {filteredPages.map((p) => {
                    const item = flatItems.find(
                      (i) => i.type === 'page' && i.href === p.href && i.label === p.label
                    ) as FlatItem | undefined;
                    const idx = item?.globalIndex ?? -1;
                    return (
                      <button
                        key={p.href + p.label}
                        type="button"
                        onClick={() => handleSelect(item!)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${
                          selectedIndex === idx ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">📄</span>
                        <span className="font-medium text-gray-900">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {results && results.conversations.length > 0 && (
                <div className="border-t border-gray-100 px-2 py-2">
                  <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    💬 對話
                  </p>
                  {results.conversations.map((c) => {
                    const item = flatItems.find(
                      (i) => i.type === 'conversation' && i.id === c.id
                    ) as FlatItem | undefined;
                    const idx = item?.globalIndex ?? -1;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelect(item!)}
                        className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left ${
                          selectedIndex === idx ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">💬</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{c.contact_name}</p>
                          <p className="truncate text-sm text-gray-500">
                            {c.content_preview}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {results && results.contacts.length > 0 && (
                <div className="border-t border-gray-100 px-2 py-2">
                  <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    👥 聯絡人
                  </p>
                  {results.contacts.map((c) => {
                    const item = flatItems.find(
                      (i) => i.type === 'contact' && i.id === c.id
                    ) as FlatItem | undefined;
                    const idx = item?.globalIndex ?? -1;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelect(item!)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${
                          selectedIndex === idx ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">👥</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{c.name ?? '未命名'}</p>
                          <p className="text-sm text-gray-500">{c.line_user_id}</p>
                          {c.tags.length > 0 && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              {c.tags.join(', ')}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {results && results.knowledge.length > 0 && (
                <div className="border-t border-gray-100 px-2 py-2">
                  <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    📚 知識庫
                  </p>
                  {results.knowledge.map((k) => {
                    const flatItem = flatItems.find(
                      (i) => i.type === 'knowledge' && i.id === k.id
                    );
                    const idx = flatItem?.globalIndex ?? -1;
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => flatItem && handleSelect(flatItem)}
                        className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left ${
                          selectedIndex === idx ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg">📚</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{k.title}</p>
                          <p className="text-xs text-gray-500">{k.category}</p>
                          <p className="truncate text-sm text-gray-500">
                            {k.content_preview}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
        <div className="border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-400">
          ESC 關閉 · ↑↓ 選擇 · Enter 跳轉
        </div>
      </div>
    </div>
  );
}
