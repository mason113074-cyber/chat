'use client';

export interface KBImportModalProps {
  importOpen: boolean;
  importPreview: { title: string; content: string; category: string }[];
  importing: boolean;
  handleImportConfirm: () => void;
  setImportOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setImportPreview: React.Dispatch<React.SetStateAction<{ title: string; content: string; category: string }[]>>;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function KBImportModal({
  importOpen,
  importPreview,
  importing,
  handleImportConfirm,
  setImportOpen,
  setImportPreview,
  t,
}: KBImportModalProps) {
  if (!importOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">{t('importPreview')}</h2>
        <p className="mt-2 text-sm text-gray-600">{t('importPreviewDesc', { count: importPreview.length })}</p>
        <div className="mt-4 max-h-60 overflow-y-auto rounded border border-gray-200 p-2 text-sm">
          {importPreview.slice(0, 20).map((row, i) => (
            <div key={i} className="border-b border-gray-100 py-1 last:border-0">
              <span className="font-medium">{row.title}</span>
              {row.content && <span className="text-gray-500"> — {row.content.slice(0, 40)}...</span>}
            </div>
          ))}
          {importPreview.length > 20 && <p className="text-gray-400">{t('importRemaining', { count: importPreview.length - 20 })}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => { setImportOpen(false); setImportPreview([]); }} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
            {t('cancel')}
          </button>
          <button type="button" onClick={handleImportConfirm} disabled={importing} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">
            {importing ? t('importing') : t('confirmImport')}
          </button>
        </div>
      </div>
    </div>
  );
}
