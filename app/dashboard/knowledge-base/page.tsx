'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/Toast';

const CATEGORIES = [
  { value: 'general', label: '其他' },
  { value: '常見問題', label: '常見問題' },
  { value: '產品資訊', label: '產品資訊' },
  { value: '退換貨政策', label: '退換貨政策' },
  { value: '營業資訊', label: '營業資訊' },
] as const;

const CATEGORY_COLOR: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  常見問題: 'bg-indigo-100 text-indigo-700',
  產品資訊: 'bg-emerald-100 text-emerald-700',
  退換貨政策: 'bg-amber-100 text-amber-700',
  營業資訊: 'bg-purple-100 text-purple-700',
};

type Item = {
  id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Stats = { total: number; activeCount: number; lastUpdated: string | null; byCategory: Record<string, number> };

const PREVIEW_LEN = 100;

function parseTxt(content: string): { title: string; content: string; category: string }[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: { title: string; content: string; category: string }[] = [];
  for (const line of lines) {
    const idx = line.indexOf('|||');
    if (idx >= 0) {
      const title = line.slice(0, idx).trim();
      const content = line.slice(idx + 3).trim();
      if (title) out.push({ title, content, category: 'general' });
    }
  }
  return out;
}

function parseCsv(content: string): { title: string; content: string; category: string }[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const titleIdx = headers.indexOf('title');
  const contentIdx = headers.indexOf('content');
  const categoryIdx = headers.indexOf('category');
  if (titleIdx < 0 || contentIdx < 0) return [];
  const out: { title: string; content: string; category: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].match(/("([^"]*)")|([^,]+)/g)?.map((c) => c.replace(/^"|"$/g, '').trim()) ?? lines[i].split(',');
    const title = (row[titleIdx] ?? '').trim();
    const content = (row[contentIdx] ?? '').trim();
    const category = categoryIdx >= 0 && row[categoryIdx] ? (row[categoryIdx] ?? 'general').trim() : 'general';
    if (title) out.push({ title, content, category });
  }
  return out;
}

export default function KnowledgeBasePage() {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<{ title: string; content: string; category: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchList = useCallback(async () => {
    const params = new URLSearchParams();
    if (searchDebounced) params.set('search', searchDebounced);
    if (categoryFilter) params.set('category', categoryFilter);
    const res = await fetch(`/api/knowledge-base?${params}`);
    if (res.ok) {
      const j = await res.json();
      setItems(j.items ?? []);
    }
  }, [searchDebounced, categoryFilter]);

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/knowledge-base/stats');
    if (res.ok) {
      const j = await res.json();
      setStats(j);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchList(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchList, fetchStats]);

  const openAdd = () => {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('general');
    setModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormCategory(item.category || 'general');
    setModalOpen(true);
  };

  const handleSave = async () => {
    const title = formTitle.trim();
    if (!title) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/knowledge-base/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content: formContent.trim(), category: formCategory }),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchList();
          fetchStats();
          toast.show('已更新', 'success');
        }
      } else {
        const res = await fetch('/api/knowledge-base', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content: formContent.trim(), category: formCategory }),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchList();
          fetchStats();
          toast.show('已新增', 'success');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這筆知識嗎？')) return;
    const res = await fetch(`/api/knowledge-base/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchList();
      fetchStats();
      toast.show('已刪除', 'success');
    }
  };

  const handleToggleActive = async (item: Item) => {
    const res = await fetch(`/api/knowledge-base/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    if (res.ok) {
      fetchList();
      fetchStats();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const ext = file.name.toLowerCase().slice(-4);
      const parsed = ext === '.csv' ? parseCsv(text) : parseTxt(text);
      setImportPreview(parsed);
      setImportOpen(true);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleImportConfirm = async () => {
    if (importPreview.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch('/api/knowledge-base/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: importPreview }),
      });
      if (res.ok) {
        setImportOpen(false);
        setImportPreview([]);
        fetchList();
        fetchStats();
        toast.show(`已匯入 ${importPreview.length} 筆`, 'success');
      }
    } finally {
      setImporting(false);
    }
  };

  const downloadSample = (type: 'txt' | 'csv') => {
    const txtContent = '營業時間是幾點？|||我們的營業時間是週一到週五 9:00-18:00\n如何退換貨？|||請在收到商品 7 天內聯繫客服申請退換貨。';
    const csvContent = 'title,content,category\n營業時間是幾點？,我們的營業時間是週一到週五 9:00-18:00,營業資訊\n如何退換貨？,請在收到商品 7 天內聯繫客服申請退換貨。,退換貨政策';
    const blob = new Blob([type === 'txt' ? txtContent : csvContent], { type: type === 'txt' ? 'text/plain' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge_sample.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">知識庫</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-sm text-gray-500">知識條目總數</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-sm text-gray-500">啟用中</p>
            <p className="text-xl font-bold text-gray-900">{stats.activeCount}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-sm text-gray-500">最後更新</p>
            <p className="text-lg font-bold text-gray-900">
              {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('zh-TW') : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-sm text-gray-500">各分類數量</p>
            <p className="text-sm text-gray-700">
              {Object.entries(stats.byCategory)
                .map(([k, v]) => `${CATEGORIES.find((c) => c.value === k)?.label ?? k}: ${v}`)
                .join('、') || '—'}
            </p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          新增知識
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          匯入 FAQ
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); downloadSample('txt'); }}
          className="text-sm text-indigo-600 hover:underline"
        >
          下載 .txt 範例
        </a>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); downloadSample('csv'); }}
          className="text-sm text-indigo-600 hover:underline"
        >
          下載 .csv 範例
        </a>
        <input
          type="text"
          placeholder="搜尋標題或內容..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-48"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">全部分類</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-gray-500">載入中...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-600">還沒有知識庫內容。新增 FAQ 讓 AI 回覆更精準！</p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            新增知識
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border bg-white p-4 shadow-sm ${item.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-80'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${CATEGORY_COLOR[item.category] ?? CATEGORY_COLOR.general}`}>
                  {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {(item.content || '').slice(0, PREVIEW_LEN)}
                {(item.content?.length ?? 0) > PREVIEW_LEN ? '...' : ''}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {new Date(item.updated_at).toLocaleString('zh-TW')}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="text-gray-500 hover:text-indigo-600"
                  title="編輯"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-500 hover:text-red-600"
                  title="刪除"
                >
                  🗑️
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(item)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {item.is_active ? '停用' : '啟用'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">{editingId ? '編輯知識' : '新增知識'}</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">標題 *</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="例如：營業時間"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">分類</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">內容</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="輸入知識內容，AI 會參考此內容回覆客戶"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">AI 預覽</p>
                <p className="mt-1 rounded bg-gray-50 p-2 text-sm text-gray-600">
                  {formTitle || formContent ? `【${formTitle || '（無標題）'}】\n${formContent || '（無內容）'}` : '填寫標題與內容後會顯示在此'}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !formTitle.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import preview modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">匯入預覽</h2>
            <p className="mt-2 text-sm text-gray-600">共 {importPreview.length} 筆，確認後將寫入知識庫。</p>
            <div className="mt-4 max-h-60 overflow-y-auto rounded border border-gray-200 p-2 text-sm">
              {importPreview.slice(0, 20).map((row, i) => (
                <div key={i} className="border-b border-gray-100 py-1 last:border-0">
                  <span className="font-medium">{row.title}</span>
                  {row.content && <span className="text-gray-500"> — {row.content.slice(0, 40)}...</span>}
                </div>
              ))}
              {importPreview.length > 20 && <p className="text-gray-400">... 其餘 {importPreview.length - 20} 筆</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setImportOpen(false); setImportPreview([]); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleImportConfirm}
                disabled={importing}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {importing ? '匯入中...' : '確認匯入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
