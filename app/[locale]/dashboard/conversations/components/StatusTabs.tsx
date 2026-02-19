'use client';

import { useTranslations } from 'next-intl';

export type StatusFilter = 'all' | 'ai_handled' | 'needs_human' | 'resolved' | 'closed';

type StatusTabsProps = {
  activeFilter: StatusFilter;
  counts: {
    total: number;
    ai_handled: number;
    needs_human: number;
    resolved: number;
    closed: number;
  } | null;
  onChange: (filter: StatusFilter) => void;
  compact?: boolean;
};

const TABS: Array<{ value: StatusFilter; key: string; colorClass?: string }> = [
  { value: 'all', key: 'allTab' },
  { value: 'ai_handled', key: 'aiHandled' },
  { value: 'needs_human', key: 'needsHumanFull', colorClass: 'text-orange-700' },
  { value: 'resolved', key: 'resolved' },
  { value: 'closed', key: 'closed' },
];

export function StatusTabs({ activeFilter, counts, onChange, compact = false }: StatusTabsProps) {
  const t = useTranslations('conversations');
  const getCount = (value: StatusFilter) => {
    if (!counts) return 0;
    if (value === 'all') return counts.total;
    return counts[value] ?? 0;
  };
  return (
    <div className="flex flex-wrap gap-1">
      {TABS.map((tab) => {
        const count = getCount(tab.value);
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`
              ${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} rounded-lg text-xs font-medium border
              ${activeFilter === tab.value
                ? 'border-indigo-600 bg-indigo-50 text-gray-900 font-semibold'
                : 'border-transparent text-gray-600 hover:bg-gray-100'
              }
              ${tab.colorClass ?? ''}
            `}
          >
            {t(tab.key)} {compact && count > 0 ? `(${count})` : count > 0 ? count : ''}
          </button>
        );
      })}
    </div>
  );
}
