'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { StatusBadge } from './StatusBadge';
import { tagColor } from './TagFilter';
import type { ConversationStatus } from './StatusBadge';

export type Contact = {
  id: string;
  name: string | null;
  line_user_id: string;
  tags: string[];
  conversationStatus: ConversationStatus;
  lastMessage: string;
  lastMessageTime: string;
};

type ConversationListItemProps = {
  contact: Contact;
  isSelected: boolean;
  isChecked: boolean;
  searchQuery: string;
  onSelect: () => void;
  onToggleCheck: () => void;
  onChangeStatus: (newStatus: ConversationStatus) => void;
};

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${q})`, 'gi');
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function ConversationListItem({
  contact,
  isSelected,
  isChecked,
  searchQuery,
  onSelect,
  onToggleCheck,
  onChangeStatus,
}: ConversationListItemProps) {
  const t = useTranslations('conversations');
  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const displayName = contact.name || t('unnamedCustomer');
  const truncatedMessage =
    contact.lastMessage.length > 50
      ? contact.lastMessage.substring(0, 50) + '...'
      : contact.lastMessage;
  return (
    <div
      className={`
        flex items-start gap-3 rounded-xl border border-gray-200 p-4 shadow-sm
        ${contact.conversationStatus === 'needs_human' ? 'bg-orange-50' : 'bg-white'}
        ${isSelected ? 'ring-2 ring-indigo-500' : ''}
      `}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onToggleCheck}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        aria-label={t('selectContact', { name: displayName })}
      />
      <button type="button" onClick={onSelect} className="flex-1 min-w-0 text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-900">
                {highlightMatch(displayName, searchQuery)}
              </p>
              <StatusBadge status={contact.conversationStatus} />
            </div>
            <p className="mt-1 text-sm text-gray-600 line-clamp-1">
              {highlightMatch(truncatedMessage, searchQuery)}
            </p>
            {contact.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {contact.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
                {contact.tags.length > 3 && (
                  <span className="text-xs text-gray-400">+{contact.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
          {contact.lastMessageTime && (
            <p className="text-xs text-gray-500 whitespace-nowrap">
              {new Date(contact.lastMessageTime).toLocaleString('zh-TW', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </button>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenStatusMenu(!openStatusMenu);
          }}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-200"
          aria-label={t('changeStatus')}
        >
          ⋯
        </button>
        {openStatusMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenStatusMenu(false)}
              aria-hidden
            />
            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  onChangeStatus('resolved');
                  setOpenStatusMenu(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                {t('markAsResolved')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeStatus('needs_human');
                  setOpenStatusMenu(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                {t('markAsNeedsHuman')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeStatus('closed');
                  setOpenStatusMenu(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                {t('closeConversation')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeStatus('ai_handled');
                  setOpenStatusMenu(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                {t('reopenConversation')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
