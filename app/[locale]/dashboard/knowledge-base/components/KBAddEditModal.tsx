'use client';

export interface KBAddEditModalProps {
  modalOpen: boolean;
  editingId: string | null;
  formTitle: string;
  setFormTitle: React.Dispatch<React.SetStateAction<string>>;
  formContent: string;
  setFormContent: React.Dispatch<React.SetStateAction<string>>;
  formCategory: string;
  setFormCategory: React.Dispatch<React.SetStateAction<string>>;
  formCustomCategory: string;
  setFormCustomCategory: React.Dispatch<React.SetStateAction<string>>;
  categoryOptions: string[];
  saving: boolean;
  handleSave: () => void;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  getCategoryLabel: (category: string) => string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function KBAddEditModal({
  modalOpen,
  editingId,
  formTitle,
  setFormTitle,
  formContent,
  setFormContent,
  formCategory,
  setFormCategory,
  formCustomCategory,
  setFormCustomCategory,
  categoryOptions,
  saving,
  handleSave,
  setModalOpen,
  getCategoryLabel,
  t,
}: KBAddEditModalProps) {
  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">{editingId ? t('editKnowledge') : t('addKnowledge')}</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('fieldTitle')} *</label>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder={t('titlePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" id="form-category-label">{t('fieldCategory')}</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              aria-labelledby="form-category-label"
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>{getCategoryLabel(category)}</option>
              ))}
              <option value="__custom">{t('customCategory')}</option>
            </select>
            {formCategory === '__custom' && (
              <input
                value={formCustomCategory}
                onChange={(e) => setFormCustomCategory(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder={t('customCategoryPlaceholder')}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('fieldContent')}</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder={t('contentPlaceholder')}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{t('aiPreview')}</p>
            <p className="mt-1 rounded bg-gray-50 p-2 text-sm text-gray-600">
              {formTitle || formContent ? `【${formTitle || t('noTitle')}】\n${formContent || t('noContent')}` : t('aiPreviewEmpty')}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
            {t('cancel')}
          </button>
          <button type="button" onClick={handleSave} disabled={saving || !formTitle.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
