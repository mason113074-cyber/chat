'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

interface DashboardTopBarProps {
  onOpenSearch: () => void;
  userEmail: string;
}

export function DashboardTopBar({ onOpenSearch, userEmail }: DashboardTopBarProps) {
  const t = useTranslations('common');
  const initial = userEmail?.charAt(0)?.toUpperCase() || '?';

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0">
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
      >
        <Search className="h-5 w-5" aria-hidden />
        <span>{t('search')}</span>
        <span className="text-xs text-gray-400 font-normal">⌘K</span>
      </button>
      <div className="flex items-center gap-3">
        <LocaleSwitcher className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900" />
        <div
          className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold"
          title={userEmail}
          aria-hidden
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
