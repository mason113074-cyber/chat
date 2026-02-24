'use client';

import { useTranslations } from 'next-intl';
import { ContextualHelp } from '@/components/help/ContextualHelp';
import { useSettings } from './SettingsContext';

type Props = { open: boolean; onClose: () => void };

export function SettingsLineModal({ open, onClose }: Props) {
  const t = useTranslations('settings');
  const {
    lineChannelId,
    setLineChannelId,
    lineChannelSecret,
    setLineChannelSecret,
    lineAccessToken,
    setLineAccessToken,
    lineSaving,
    handleLineSave,
    webhookUrl,
    toast,
  } = useSettings();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">{t('lineTokenSettings')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('lineTokenDesc')}</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Channel ID</label>
            <input
              type="text"
              value={lineChannelId}
              onChange={(e) => setLineChannelId(e.target.value)}
              placeholder="1234567890"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">Channel Secret</label>
              <ContextualHelp topic="lineChannelSecret" position="bottom" />
            </div>
            <input
              type="password"
              value={lineChannelSecret}
              onChange={(e) => setLineChannelSecret(e.target.value)}
              placeholder="- - - - - - - - - - - - - - - - "
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-400">{t('lineSecretHint')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Channel Access Token</label>
            <textarea
              value={lineAccessToken}
              onChange={(e) => setLineAccessToken(e.target.value)}
              placeholder="- - - - - - - - - - - - - - - - "
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 resize-none"
            />
            <p className="mt-1 text-xs text-gray-400">{t('lineTokenHint')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 truncate">
                {webhookUrl}
              </code>
              <button
                type="button"
                onClick={() => {
                  if (webhookUrl) {
                    navigator.clipboard.writeText(webhookUrl);
                    toast.show(t('webhookCopied'), 'success');
                  }
                }}
                className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('copy')}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">{t('lineIntegrationHint')}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={async () => {
              await handleLineSave();
              onClose();
            }}
            disabled={lineSaving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {lineSaving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
