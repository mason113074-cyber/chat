'use client';

import { formatRelativeTime } from '../lib/format-relative-time';
import type { BotItem } from '../hooks/use-bots';

type Props = {
  open: boolean;
  bot: BotItem | null;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
  locale?: string;
  t: (key: string, values?: Record<string, string>) => string;
};

export function BotDeleteDialog({ open, bot, onClose, onConfirm, confirming, locale, t }: Props) {
  if (!open || !bot) return null;

  const createdAt = formatRelativeTime(new Date(bot.created_at), { locale: locale ?? 'zh-TW' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="bot-delete-title">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 id="bot-delete-title" className="text-lg font-semibold text-gray-900">
          {t('deleteConfirmTitle')}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{t('deleteConfirmBody')}</p>
        <dl className="mt-4 space-y-1 text-sm">
          <div>
            <dt className="inline font-medium text-gray-700">{t('deleteConfirmBotName')}：</dt>
            <dd className="inline text-gray-600">{bot.name}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-gray-700">{t('deleteConfirmCreatedAt')}：</dt>
            <dd className="inline text-gray-600">{createdAt}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-red-600">{t('deleteConfirmIrreversible')}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('deleteConfirmCancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {t('deleteConfirmSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
}
