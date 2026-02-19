'use client';

import { useTranslations } from 'next-intl';

export type ConversationStatus = 'ai_handled' | 'needs_human' | 'resolved' | 'closed';

const STATUS_CONFIG: Record<ConversationStatus, { key: string; className: string; pulse?: boolean }> = {
  ai_handled: { key: 'aiHandled', className: 'bg-green-100 text-green-800' },
  needs_human: { key: 'needsHumanFull', className: 'bg-orange-100 text-orange-800', pulse: true },
  resolved: { key: 'resolved', className: 'bg-blue-100 text-blue-800' },
  closed: { key: 'closed', className: 'bg-gray-100 text-gray-700' },
};

export function StatusBadge({ status }: { status: ConversationStatus }) {
  const t = useTranslations('conversations');
  const conf = STATUS_CONFIG[status] ?? STATUS_CONFIG.ai_handled;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${conf.className} ${conf.pulse ? 'animate-pulse opacity-90' : ''}`}
    >
      {t(conf.key)}
    </span>
  );
}
