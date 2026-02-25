'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useToast } from '@/components/Toast';
import { getAppUrl } from '@/lib/app-url';
import { useBots, type BotItem } from './hooks/use-bots';
import { BotListEmpty } from './components/bot-list-empty';
import { BotList } from './components/bot-list';
import { BotFormDialog } from './components/bot-form-dialog';
import { BotDeleteDialog } from './components/bot-delete-dialog';

export default function BotsSettingsPage() {
  const t = useTranslations('bots');
  const locale = useLocale();
  const toast = useToast();
  const { bots, isLoading, isError, mutate } = useBots();
  const [formOpen, setFormOpen] = useState(false);
  const [editBot, setEditBot] = useState<BotItem | null>(null);
  const [deleteBot, setDeleteBot] = useState<BotItem | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const handleCopy = useCallback(
    (url: string) => {
      navigator.clipboard
        .writeText(url)
        .then(() => toast.show(t('copySuccess'), 'success'))
        .catch(() => toast.show(t('copyFailed'), 'error'));
    },
    [toast, t]
  );

  const handleTest = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/settings/bots/${id}/test`, { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.show((data.error as string) || t('testFailed'), 'error');
          return;
        }
        const name = data.botInfo?.displayName ?? 'LINE Bot';
        toast.show(t('testSuccess') + ' ' + t('testSuccessDesc', { name }), 'success');
      } catch {
        toast.show(t('networkError'), 'error');
      }
    },
    [toast, t]
  );

  const handleEdit = useCallback((bot: BotItem) => {
    setEditBot(bot);
    setFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((bot: BotItem) => {
    setDeleteBot(bot);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteBot) return;
    setDeleteConfirming(true);
    try {
      const res = await fetch(`/api/settings/bots/${deleteBot.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.show((data.error as string) || 'Delete failed', 'error');
        return;
      }
      toast.show(t('deleteSuccess'), 'success');
      setDeleteBot(null);
      mutate();
    } catch {
      toast.show(t('networkError'), 'error');
    } finally {
      setDeleteConfirming(false);
    }
  }, [deleteBot, toast, t, mutate]);

  const openAddDialog = useCallback(() => {
    setEditBot(null);
    setFormOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex gap-2">
          <li>
            <Link href="/dashboard" className="hover:text-gray-700">
              Dashboard
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/dashboard/settings" className="hover:text-gray-700">
              {t('breadcrumbSettings')}
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">{t('breadcrumbBots')}</li>
        </ol>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {t('viewTutorial')}
          </Link>
          <button
            type="button"
            onClick={openAddDialog}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            + {t('addBot')}
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {isError.message}
        </div>
      )}

      {bots.length === 0 ? (
        <BotListEmpty
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          addLabel={'+ ' + t('addBot')}
          onAdd={openAddDialog}
        />
      ) : (
        <BotList
          bots={bots}
          origin={origin || getAppUrl()}
          onCopy={handleCopy}
          onTest={handleTest}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onNameSaved={mutate}
          locale={locale}
          t={t}
        />
      )}

      <BotFormDialog
        open={formOpen}
        editBot={editBot}
        onClose={() => {
          setFormOpen(false);
          setEditBot(null);
        }}
        onSuccess={() => {
          mutate();
          toast.show(editBot ? t('updateSuccess') : t('saveSuccess'), 'success');
        }}
        t={t}
      />

      <BotDeleteDialog
        open={!!deleteBot}
        bot={deleteBot}
        onClose={() => setDeleteBot(null)}
        onConfirm={handleDeleteConfirm}
        confirming={deleteConfirming}
        locale={locale}
        t={t}
      />
    </div>
  );
}
