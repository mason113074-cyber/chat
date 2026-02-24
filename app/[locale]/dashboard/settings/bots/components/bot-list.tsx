'use client';

import { useCallback, useState } from 'react';
import { formatRelativeTime } from '../lib/format-relative-time';
import { BotTableRow } from './bot-table-row';
import type { BotItem } from '../hooks/use-bots';

type Props = {
  bots: BotItem[];
  origin: string;
  onCopy: (url: string) => void;
  onTest: (id: string) => Promise<void>;
  onEdit: (bot: BotItem) => void;
  onDelete: (bot: BotItem) => void;
  onNameSaved: () => void;
  locale?: string;
  t: (key: string, values?: Record<string, string>) => string;
};

export function BotList({
  bots,
  origin,
  onCopy,
  onTest,
  onEdit,
  onDelete,
  onNameSaved,
  locale,
  t,
}: Props) {
  const getWebhookUrl = useCallback(
    (bot: BotItem) => `${origin}/api/webhook/line/${bot.id}/••••••••••••`,
    [origin]
  );

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                {t('colName')}
              </th>
              <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '10%' }}>
                {t('colStatus')}
              </th>
              <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '40%' }}>
                {t('colWebhookUrl')}
              </th>
              <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '15%' }}>
                {t('colCreatedAt')}
              </th>
              <th scope="col" className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '10%' }}>
                {t('colActions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bots.map((bot) => (
              <BotTableRow
                key={bot.id}
                bot={bot}
                webhookUrl={getWebhookUrl(bot)}
                onCopy={onCopy}
                onTest={onTest}
                onEdit={onEdit}
                onDelete={onDelete}
                onNameSaved={onNameSaved}
                locale={locale}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {bots.map((bot) => (
          <MobileBotCard
            key={bot.id}
            bot={bot}
            webhookUrl={getWebhookUrl(bot)}
            onCopy={onCopy}
            onTest={onTest}
            onEdit={onEdit}
            onDelete={onDelete}
            locale={locale}
            t={t}
          />
        ))}
      </div>
    </>
  );
}

function MobileBotCard({
  bot,
  webhookUrl,
  onCopy,
  onTest,
  onEdit,
  onDelete,
  locale,
  t,
}: {
  bot: BotItem;
  webhookUrl: string;
  onCopy: (url: string) => void;
  onTest: (id: string) => Promise<void>;
  onEdit: (bot: BotItem) => void;
  onDelete: (bot: BotItem) => void;
  locale?: string;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest(bot.id);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-900">{bot.name}</h3>
        <span
          className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            bot.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {bot.is_active ? t('statusActive') : t('statusInactive')}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-500 truncate" title={webhookUrl}>
        {webhookUrl}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {t('colCreatedAt')}: {formatRelativeTime(new Date(bot.created_at), { locale: locale ?? 'zh-TW' })}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onCopy(webhookUrl)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          {t('copyButton')}
        </button>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {testing ? t('testing') : t('testConnection')}
        </button>
        <button type="button" onClick={() => onEdit(bot)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
          {t('edit')}
        </button>
        <button type="button" onClick={() => onDelete(bot)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
          {t('delete')}
        </button>
      </div>
    </div>
  );
}
