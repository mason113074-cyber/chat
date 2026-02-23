'use client';

import { useTranslations } from 'next-intl';
import type { Item } from './kb-types';
import { CATEGORY_COLOR, PREVIEW_LEN } from './kb-types';

export interface KBKnowledgeListProps {
  items: Item[];
  loading: boolean;
  locale: string;
  getCategoryLabel: (cat: string) => string;
  onOpenAdd: () => void;
  onOpenEdit: (item: Item) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (item: Item) => Promise<void>;
}

export function KBKnowledgeList({
  items,
  loading,
  locale,
  getCategoryLabel,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onToggleActive,
}: KBKnowledgeListProps) {
  const t = useTranslations('knowledgeBase');

  if (loading) {
    return <p className="text-gray-500">{t('loading')}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mx-auto mb-4 text-4xl">📚</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('emptyTitle')}</h3>
        <p className="text-gray-600 mb-4">{t('emptyDesc')}</p>
        <p className="text-sm text-gray-500 mb-4">{t('downloadTxtSample')} / {t('downloadCsvSample')}</p>
        <button
          type="button"
          onClick={onOpenAdd}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t('addKnowledge')}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-xl border bg-white p-4 shadow-sm ${item.is_active ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-80'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
            <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${CATEGORY_COLOR[item.category] ?? CATEGORY_COLOR.general}`}>
              {getCategoryLabel(item.category)}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {(item.content || '').slice(0, PREVIEW_LEN)}
            {(item.content?.length ?? 0) > PREVIEW_LEN ? '...' : ''}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            {new Date(item.updated_at).toLocaleString(locale === 'zh-TW' ? 'zh-TW' : 'en')}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenEdit(item)}
              className="text-gray-500 hover:text-indigo-600"
              title="編輯"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="text-gray-500 hover:text-red-600"
              title="刪除"
            >
              🗑️
            </button>
            <button
              type="button"
              onClick={() => onToggleActive(item)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {item.is_active ? t('disable') : t('enable')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
