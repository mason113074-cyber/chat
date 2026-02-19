'use client';

import { useTranslations } from 'next-intl';

type BatchToolbarProps = {
  selectedCount: number;
  loading: boolean;
  onResolve: () => void;
  onUnresolve: () => void;
  onDelete: () => void;
  onAddTag: () => void;
  onCancel: () => void;
};

export function BatchToolbar({
  selectedCount,
  loading,
  onResolve,
  onUnresolve,
  onDelete,
  onAddTag,
  onCancel,
}: BatchToolbarProps) {
  const t = useTranslations('conversations');
  if (selectedCount === 0) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700">
        {t('selectedCount', { count: selectedCount })}
      </span>
      <button
        type="button"
        onClick={onResolve}
        disabled={loading}
        className="rounded px-2 py-1 text-xs font-medium bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
      >
        {t('batchResolve')}
      </button>
      <button
        type="button"
        onClick={onUnresolve}
        disabled={loading}
        className="rounded px-2 py-1 text-xs font-medium bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
      >
        {t('batchUnresolve')}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={loading}
        className="rounded px-2 py-1 text-xs font-medium bg-white border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {t('batchDelete')}
      </button>
      <button
        type="button"
        onClick={onAddTag}
        disabled={loading}
        className="rounded px-2 py-1 text-xs font-medium bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
      >
        {t('batchAddTag')}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
      >
        {t('cancelSelection')}
      </button>
    </div>
  );
}
