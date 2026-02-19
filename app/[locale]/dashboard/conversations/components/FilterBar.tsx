'use client';

import { useTranslations } from 'next-intl';

export type DateRangeFilter = 'all' | 'today' | '7' | '30';
export type SortBy = 'newest' | 'oldest' | 'unread_first' | 'name_az';

type FilterBarProps = {
  dateRange: DateRangeFilter;
  sortBy: SortBy;
  onDateRangeChange: (range: DateRangeFilter) => void;
  onSortChange: (sort: SortBy) => void;
};

const DATE_RANGES: Array<{ value: DateRangeFilter; key: string }> = [
  { value: 'today', key: 'dateToday' },
  { value: '7', key: 'date7Days' },
  { value: '30', key: 'date30Days' },
  { value: 'all', key: 'dateAll' },
];

const SORT_OPTIONS: Array<{ value: SortBy; key: string }> = [
  { value: 'newest', key: 'sortNewest' },
  { value: 'oldest', key: 'sortOldest' },
  { value: 'unread_first', key: 'sortUnread' },
  { value: 'name_az', key: 'sortNameAZ' },
];

export function FilterBar(props: FilterBarProps) {
  const { dateRange, sortBy, onDateRangeChange, onSortChange } = props;
  const t = useTranslations('conversations');
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {DATE_RANGES.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => onDateRangeChange(range.value)}
            className={
              dateRange === range.value
                ? 'rounded px-2 py-1 text-xs font-medium bg-indigo-600 text-white'
                : 'rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          >
            {t(range.key)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500 shrink-0">{t('sortBy')}</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortBy)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          aria-label={t('sortBy')}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.key)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
