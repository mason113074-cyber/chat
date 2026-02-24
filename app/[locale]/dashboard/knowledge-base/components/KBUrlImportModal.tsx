'use client';

export interface KBUrlImportModalProps {
  urlImportOpen: boolean;
  urlInput: string;
  setUrlInput: React.Dispatch<React.SetStateAction<string>>;
  urlDepth: number;
  setUrlDepth: React.Dispatch<React.SetStateAction<number>>;
  urlAutoCategories: boolean;
  setUrlAutoCategories: React.Dispatch<React.SetStateAction<boolean>>;
  urlPreview: { title: string; content: string; category: string; sourceUrl?: string }[];
  urlLoading: boolean;
  handleUrlPreview: () => void;
  handleUrlImportConfirm: () => void;
  setUrlImportOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setUrlPreview: React.Dispatch<React.SetStateAction<{ title: string; content: string; category: string; sourceUrl?: string }[]>>;
  getCategoryLabel: (category: string) => string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function KBUrlImportModal({
  urlImportOpen,
  urlInput,
  setUrlInput,
  urlDepth,
  setUrlDepth,
  urlAutoCategories,
  setUrlAutoCategories,
  urlPreview,
  urlLoading,
  handleUrlPreview,
  handleUrlImportConfirm,
  setUrlImportOpen,
  setUrlPreview,
  getCategoryLabel,
  t,
}: KBUrlImportModalProps) {
  if (!urlImportOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">{t('importFromUrl')}</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('urlLabel')}</label>
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('crawlDepth')}</label>
              <select
                value={urlDepth}
                onChange={(e) => setUrlDepth(Number(e.target.value))}
                aria-label={t('crawlDepth')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value={1}>{t('depthOnePage')}</option>
                <option value={3}>{t('depthSubPages')}</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mt-6">
              <input type="checkbox" checked={urlAutoCategories} onChange={(e) => setUrlAutoCategories(e.target.checked)} />
              {t('autoCategory')}
            </label>
          </div>
          {urlPreview.length > 0 && (
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('importPreviewDesc', { count: urlPreview.length })}</p>
              <div className="max-h-52 overflow-y-auto space-y-2">
                {urlPreview.map((row, idx) => (
                  <div key={`${row.title}-${idx}`} className="rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm">
                    <p className="font-medium text-gray-900">{row.title}</p>
                    <p className="text-xs text-gray-600">
                      {getCategoryLabel(row.category)}{row.sourceUrl ? ` · ${row.sourceUrl}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { setUrlImportOpen(false); setUrlPreview([]); }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleUrlPreview}
            disabled={urlLoading || !urlInput.trim()}
            className="rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            {urlLoading ? t('loading') : t('preview')}
          </button>
          <button
            type="button"
            onClick={handleUrlImportConfirm}
            disabled={urlLoading || !urlInput.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {urlLoading ? t('importing') : t('confirmImport')}
          </button>
        </div>
      </div>
    </div>
  );
}
