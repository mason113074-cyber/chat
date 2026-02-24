'use client';

import { useTranslations } from 'next-intl';

export interface KBToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  categoryOptions: string[];
  getCategoryLabel: (cat: string) => string;
  onOpenAdd: () => void;
  onImportFile: () => void;
  onOpenUrlImport: () => void;
  onDownloadSample: (type: 'txt' | 'csv') => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function KBToolbar(props: KBToolbarProps) {
  const t = useTranslations('knowledgeBase');
  const {
    search,
    onSearchChange,
    categoryFilter,
    onCategoryFilterChange,
    categoryOptions,
    getCategoryLabel,
    onOpenAdd,
    onImportFile,
    onOpenUrlImport,
    onDownloadSample,
    fileInputRef,
    onFileChange,
  } = props;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={onOpenAdd} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
        {t('addKnowledge')}
      </button>
      <label className="sr-only" htmlFor="kb-import-file">{t('importFaq')}</label>
      <button type="button" onClick={onImportFile} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        {t('importFaq')}
      </button>
      <button type="button" onClick={onOpenUrlImport} className="rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
        {t('importFromUrl')}
      </button>
      <input id="kb-import-file" ref={fileInputRef} type="file" accept=".txt,.csv" className="hidden" onChange={onFileChange} aria-label={t('importFaq')} />
      <a href="#" onClick={(e) => { e.preventDefault(); onDownloadSample('txt'); }} className="text-sm text-indigo-600 hover:underline">
        {t('downloadTxtSample')}
      </a>
      <a href="#" onClick={(e) => { e.preventDefault(); onDownloadSample('csv'); }} className="text-sm text-indigo-600 hover:underline">
        {t('downloadCsvSample')}
      </a>
      <label htmlFor="kb-search" className="sr-only">{t('searchPlaceholder')}</label>
      <input id="kb-search" type="text" placeholder={t('searchPlaceholder')} value={search} onChange={(e) => onSearchChange(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-48" />
      <select value={categoryFilter} onChange={(e) => onCategoryFilterChange(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" aria-label={t('allCategories')}>
        <option value="">{t('allCategories')}</option>
        {categoryOptions.map((category) => (
          <option key={category} value={category}>{getCategoryLabel(category)}</option>
        ))}
      </select>
    </div>
  );
}
