'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Zap } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AutomationsPage() {
  const t = useTranslations('automations');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/workflows', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setWorkflows(json.workflows ?? []);
        }
      } catch (e) {
        console.error('Fetch workflows:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: t('newWorkflowName'), description: '' }),
      });
      if (res.ok) {
        const w = await res.json();
        window.location.href = `/dashboard/automations/${w.id}`;
      } else {
        const json = await res.json();
        alert(json.error ?? '建立失敗');
      }
    } catch (e) {
      alert('建立失敗');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('deleteConfirm', { name }))) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) setWorkflows((prev) => prev.filter((w) => w.id !== id));
      else alert('刪除失敗');
    } catch {
      alert('刪除失敗');
    }
  };

  const handleToggleActive = async (w: Workflow) => {
    try {
      const res = await fetch(`/api/workflows/${w.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !w.is_active }),
      });
      if (res.ok) setWorkflows((prev) => prev.map((x) => (x.id === w.id ? { ...x, is_active: !x.is_active } : x)));
      else alert('更新失敗');
    } catch {
      alert('更新失敗');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-500">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-gray-600">{t('subtitle')}</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          {t('newWorkflow')}
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
          <Zap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('emptyTitle')}</h3>
          <p className="mt-2 text-gray-600">{t('emptyDesc')}</p>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5" />
            {t('newWorkflow')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{w.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{w.description || t('noDescription')}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {t('lastUpdated')} {new Date(w.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer shrink-0 ml-2">
                  <input
                    type="checkbox"
                    checked={w.is_active}
                    onChange={() => handleToggleActive(w)}
                    className="sr-only peer"
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-indigo-600 peer-focus:ring-2 peer-focus:ring-indigo-500" />
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/dashboard/automations/${w.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4" />
                  {t('edit')}
                </Link>
                <button
                  onClick={() => handleDelete(w.id, w.name)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
