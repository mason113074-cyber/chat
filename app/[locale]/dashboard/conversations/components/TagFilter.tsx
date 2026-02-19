'use client';

import { useTranslations } from 'next-intl';

export type TagWithCount = { tag: string; count: number };

const TAG_COLORS = [
  'bg-indigo-100 text-indigo-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
];

export function tagColor(tag: string): string {
  const i = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return TAG_COLORS[Math.abs(i) % TAG_COLORS.length];
}

type TagFilterProps = {
  tags: TagWithCount[];
  selectedTags: Set<string>;
  onToggle: (tag: string) => void;
  onClearAll: () => void;
};

export function TagFilter({ tags, selectedTags, onToggle, onClearAll }: TagFilterProps) {
  const t = useTranslations('conversations');
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{t('tagFilter')}</span>
        {selectedTags.size > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {t('clearTagFilter')}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.length === 0 ? (
          <span className="text-xs text-gray-400">{t('noTags')}</span>
        ) : (
          tags.map(({ tag, count }) => {
            const selected = selectedTags.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggle(tag)}
                className={`
                  inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium
                  ${selected
                    ? `${tagColor(tag)} ring-1 ring-offset-1 ring-gray-300`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {tag}
                <span className="opacity-80">({count})</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
