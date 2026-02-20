'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

type EmptyStateProps = {
  variant: 'no-contacts' | 'no-filtered' | 'no-conversation-selected';
  onClearFilters?: () => void;
};

export function EmptyState({ variant, onClearFilters }: EmptyStateProps) {
  const t = useTranslations('conversations');
  const tDashboard = useTranslations('dashboard');

  if (variant === 'no-contacts') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mb-4">
            <span className="text-4xl">💬</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('emptyNoContacts')}
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md">
            {t('emptyNoContactsDesc')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {tDashboard('viewLineSettings')}
            </Link>
            <a
              href="https://line.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t('sendTestMessage')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'no-filtered') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('emptyNoFiltered')}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t('emptyNoFilteredDesc')}
          </p>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">💬</span>
        </div>
        <p className="text-gray-600">{t('selectConversation')}</p>
      </div>
    </div>
  );
}
