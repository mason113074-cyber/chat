'use client';

import { useTranslations } from 'next-intl';
import type { Stats } from './kb-types';

type Props = {
  stats: Stats | null;
  locale: string;
  getCategoryLabel: (cat: string) => string;
};

export function KBStatsCards({ stats, locale, getCategoryLabel }: Props) {
  const t = useTranslations('knowledgeBase');
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <p className="text-sm text-gray-500">{t('statTotal')}</p>
        <p className="text-xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <p className="text-sm text-gray-500">{t('statActive')}</p>
        <p className="text-xl font-bold text-gray-900">{stats.activeCount}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <p className="text-sm text-gray-500">{t('statLastUpdated')}</p>
        <p className="text-lg font-bold text-gray-900">
          {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString(locale === 'zh-TW' ? 'zh-TW' : 'en') : '—'}
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <p className="text-sm text-gray-500">{t('statByCategory')}</p>
        <p className="text-sm text-gray-700">
          {Object.entries(stats.byCategory)
            .map(([k, v]) => `${getCategoryLabel(k)}: ${v}`)
            .join('、') || '—'}
        </p>
      </div>
    </div>
  );
}
