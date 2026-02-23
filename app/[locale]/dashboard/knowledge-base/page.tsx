'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useToast } from '@/components/Toast';
import { categoryLabelKey, parseTxt, parseCsv } from './components/kb-helpers';
import { DEFAULT_CATEGORIES, type Item, type Stats, type GapSuggestion } from './components/kb-types';
import {
  KBStatsCards,
  KBToolbar,
  KBKnowledgeList,
  KBTestPanel,
  KBGapAnalysis,
  KBAddEditModal,
  KBImportModal,
  KBUrlImportModal,
} from './components';

export default function KnowledgeBasePage() {
  const t = useTranslations('knowledgeBase');
  const locale = useLocale();
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
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<{ title: string; content: string; category: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [urlImportOpen, setUrlImportOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlDepth, setUrlDepth] = useState(1);
  const [urlAutoCategories, setUrlAutoCategories] = useState(true);
  const [urlPreview, setUrlPreview] = useState<{ title: string; content: string; category: string; sourceUrl?: string }[]>([]);
  const [urlLoading, setUrlLoading] = useState(false);
  const [gapLoading, setGapLoading] = useState(false);
  const [gapSuggestions, setGapSuggestions] = useState<GapSuggestion[]>([]);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test AI panel - 預設展開方便測試
  const [testPanelOpen, setTestPanelOpen] = useState(true);
  const [testQuestion, setTestQuestion] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testAnswer, setTestAnswer] = useState<string | null>(null);
  const [testSources, setTestSources] = useState<{ id: string; title: string; category: string }[]>([]);

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

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES.map((c) => c.value));
    for (const item of items) set.add(item.category || 'general');
    for (const key of Object.keys(stats?.byCategory ?? {})) set.add(key || 'general');
    if (formCategory && formCategory !== '__custom') set.add(formCategory);
    if (formCustomCategory.trim()) set.add(formCustomCategory.trim());
    return Array.from(set).filter(Boolean);
  }, [items, stats, formCategory, formCustomCategory]);

  const getCategoryLabel = useCallback(
    (category: string) => {
      const labelKey = categoryLabelKey(category);
      return labelKey ? t(labelKey) : category;
    },
    [t]
  );

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
    setFormCustomCategory('');
    setModalOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormContent(item.content);
    const category = item.category || 'general';
    if (DEFAULT_CATEGORIES.some((c) => c.value === category)) {
      setFormCategory(category);
      setFormCustomCategory('');
    } else {
      setFormCategory('__custom');
      setFormCustomCategory(category);
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    const title = formTitle.trim();
    if (!title) return;
    const effectiveCategory =
      formCategory === '__custom'
        ? formCustomCategory.trim() || 'general'
        : formCategory || 'general';
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/knowledge-base/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content: formContent.trim(), category: effectiveCategory }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setModalOpen(false);
          fetchList();
          fetchStats();
          toast.show(t('toastUpdated'), 'success');
        } else {
          toast.show((data?.error as string) ?? t('requestFailed'), 'error');
        }
      } else {
        const res = await fetch('/api/knowledge-base', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content: formContent.trim(), category: effectiveCategory }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setModalOpen(false);
          fetchList();
          fetchStats();
          toast.show(t('toastAdded'), 'success');
        } else {
          toast.show((data?.error as string) ?? t('requestFailed'), 'error');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/knowledge-base/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      fetchList();
      fetchStats();
      toast.show(t('toastDeleted'), 'success');
    } else {
      toast.show((data?.error as string) ?? t('requestFailed'), 'error');
    }
  };

  const handleToggleActive = async (item: Item) => {
    const res = await fetch(`/api/knowledge-base/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      fetchList();
      fetchStats();
    } else {
      toast.show((data?.error as string) ?? t('requestFailed'), 'error');
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
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setImportOpen(false);
        setImportPreview([]);
        fetchList();
        fetchStats();
        toast.show(t('toastImported', { count: importPreview.length }), 'success');
      } else {
        toast.show((data?.error as string) ?? t('requestFailed'), 'error');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleUrlPreview = async () => {
    const target = urlInput.trim();
    if (!target) return;
    setUrlLoading(true);
    try {
      const res = await fetch('/api/knowledge-base/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: target,
          depth: urlDepth,
          autoCategories: urlAutoCategories,
          previewOnly: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.show((data?.error as string) ?? t('requestFailed'), 'error');
        return;
      }
      setUrlPreview((data.preview ?? []) as { title: string; content: string; category: string; sourceUrl?: string }[]);
    } finally {
      setUrlLoading(false);
    }
  };

  const handleUrlImportConfirm = async () => {
    const target = urlInput.trim();
    if (!target) return;
    setUrlLoading(true);
    try {
      const res = await fetch('/api/knowledge-base/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: target,
          depth: urlDepth,
          autoCategories: urlAutoCategories,
          previewOnly: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.show((data?.error as string) ?? t('requestFailed'), 'error');
        return;
      }
      setUrlImportOpen(false);
      setUrlPreview([]);
      setUrlInput('');
      await Promise.all([fetchList(), fetchStats(), loadGapAnalysis()]);
      toast.show(t('toastImported', { count: data.imported ?? 0 }), 'success');
    } finally {
      setUrlLoading(false);
    }
  };

  const loadGapAnalysis = useCallback(async () => {
    setGapLoading(true);
    try {
      const res = await fetch('/api/knowledge-base/gap-analysis?days=30');
      if (!res.ok) return;
      const data = await res.json();
      setGapSuggestions((data.suggestions ?? []) as GapSuggestion[]);
    } finally {
      setGapLoading(false);
    }
  }, []);

  const adoptSuggestion = async (s: GapSuggestion) => {
    setAdoptingId(s.id);
    try {
      const res = await fetch('/api/knowledge-base/gap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: s.suggestedTitle,
          content: `${s.suggestedAnswer}\n\n客戶問題範例：${s.questionExample}`,
          category: s.suggestedCategory || 'general',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.show((data?.error as string) ?? t('requestFailed'), 'error');
        return;
      }
      await Promise.all([fetchList(), fetchStats(), loadGapAnalysis()]);
      toast.show(t('toastAdded'), 'success');
    } finally {
      setAdoptingId(null);
    }
  };

  useEffect(() => {
    loadGapAnalysis();
  }, [loadGapAnalysis]);

  const handleTestSubmit = async () => {
    const q = testQuestion.trim();
    if (!q) return;
    setTestLoading(true);
    setTestAnswer(null);
    setTestSources([]);
    try {
      const res = await fetch('/api/knowledge-base/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.show(data.error ?? t('testFailed'), 'error');
        return;
      }
      setTestAnswer(data.answer ?? '');
      setTestSources(data.sources ?? []);
    } catch {
      toast.show(t('requestFailed'), 'error');
    } finally {
      setTestLoading(false);
    }
  };

  const clearTestResult = () => {
    setTestAnswer(null);
    setTestSources([]);
    setTestQuestion('');
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
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

      <KBStatsCards stats={stats} locale={locale} getCategoryLabel={getCategoryLabel} />

      <KBToolbar
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categoryOptions={categoryOptions}
        getCategoryLabel={getCategoryLabel}
        onOpenAdd={openAdd}
        onImportFile={() => fileInputRef.current?.click()}
        onOpenUrlImport={() => setUrlImportOpen(true)}
        onDownloadSample={downloadSample}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
      />

      {/* List + Test panel: desktop 2-col, mobile stack */}
      <div className="lg:grid lg:grid-cols-[1fr,320px] lg:gap-8 lg:items-start">
        <div>
      <KBKnowledgeList
        items={items}
        loading={loading}
        locale={locale}
        getCategoryLabel={getCategoryLabel}
        onOpenAdd={openAdd}
        onOpenEdit={openEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />
        </div>

        <KBTestPanel
          testPanelOpen={testPanelOpen}
          setTestPanelOpen={setTestPanelOpen}
          testQuestion={testQuestion}
          setTestQuestion={setTestQuestion}
          testLoading={testLoading}
          testAnswer={testAnswer}
          testSources={testSources}
          handleTestSubmit={handleTestSubmit}
          clearTestResult={clearTestResult}
          getCategoryLabel={getCategoryLabel}
          t={t}
        />
      </div>

      <KBGapAnalysis
        gapLoading={gapLoading}
        gapSuggestions={gapSuggestions}
        adoptingId={adoptingId}
        loadGapAnalysis={loadGapAnalysis}
        adoptSuggestion={adoptSuggestion}
        getCategoryLabel={getCategoryLabel}
        t={t}
      />

      <KBUrlImportModal
        urlImportOpen={urlImportOpen}
        urlInput={urlInput}
        setUrlInput={setUrlInput}
        urlDepth={urlDepth}
        setUrlDepth={setUrlDepth}
        urlAutoCategories={urlAutoCategories}
        setUrlAutoCategories={setUrlAutoCategories}
        urlPreview={urlPreview}
        urlLoading={urlLoading}
        handleUrlPreview={handleUrlPreview}
        handleUrlImportConfirm={handleUrlImportConfirm}
        setUrlImportOpen={setUrlImportOpen}
        setUrlPreview={setUrlPreview}
        getCategoryLabel={getCategoryLabel}
        t={t}
      />

      <KBAddEditModal
        modalOpen={modalOpen}
        editingId={editingId}
        formTitle={formTitle}
        setFormTitle={setFormTitle}
        formContent={formContent}
        setFormContent={setFormContent}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formCustomCategory={formCustomCategory}
        setFormCustomCategory={setFormCustomCategory}
        categoryOptions={categoryOptions}
        saving={saving}
        handleSave={handleSave}
        setModalOpen={setModalOpen}
        getCategoryLabel={getCategoryLabel}
        t={t}
      />

      <KBImportModal
        importOpen={importOpen}
        importPreview={importPreview}
        importing={importing}
        handleImportConfirm={handleImportConfirm}
        setImportOpen={setImportOpen}
        setImportPreview={setImportPreview}
        t={t}
      />
    </div>
  );
}
