'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { StatusBadge, type ConversationStatus } from './StatusBadge';

export type Conversation = {
  id: string;
  message: string;
  role: string;
  created_at: string;
  status?: string | null;
  resolved_by?: string | null;
};

type ConversationPanelProps = {
  selectedContact: {
    id: string;
    name: string | null;
    line_user_id: string;
    tags: string[];
    conversationStatus: ConversationStatus;
    conversationCount: number;
    firstInteraction: string | null;
    lastInteraction: string | null;
    notes?: string | null;
  } | null;
  conversations: Conversation[];
  onTakeover: () => Promise<void>;
  onHandback: () => Promise<void>;
  onSendHumanReply: (message: string) => Promise<void>;
};

export function ConversationPanel({
  selectedContact,
  conversations,
  onTakeover,
  onHandback,
  onSendHumanReply,
}: ConversationPanelProps) {
  const t = useTranslations('conversations');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  if (!selectedContact) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💬</span>
          </div>
          <p className="text-gray-600">{t('selectConversation')}</p>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    const message = replyText.trim();
    if (!message) return;
    setSending(true);
    try {
      await onSendHumanReply(message);
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  const isNeedsHuman = selectedContact.conversationStatus === 'needs_human';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{selectedContact.name || t('unnamedCustomer')}</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">LINE ID: {selectedContact.line_user_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={selectedContact.conversationStatus} />
            <button
              type="button"
              onClick={async () => {
                setActionLoading(true);
                try {
                  if (isNeedsHuman) await onHandback();
                  else await onTakeover();
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                isNeedsHuman ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              } disabled:opacity-50`}
            >
              {isNeedsHuman ? t('handBackToAi') : t('takeoverConversation')}
            </button>
            <button
              type="button"
              onClick={() => setSideOpen((v) => !v)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              {sideOpen ? t('hideCustomerInfo') : t('showCustomerInfo')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">💬</span>
                </div>
                <p className="text-gray-600 text-sm">{t('noConversationContent')}</p>
              </div>
            ) : (
              <>
                {conversations.map((conv) => {
                  const isUser = conv.role === 'user';
                  const isHuman = !isUser && conv.resolved_by === 'human';
                  return (
                    <div
                      key={conv.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`
                          max-w-[75%] rounded-2xl px-4 py-2
                          ${isUser ? 'bg-green-100 text-gray-900' : isHuman ? 'bg-blue-100 text-gray-900' : 'bg-gray-100 text-gray-900'}
                        `}
                      >
                        {!isUser && (
                          <p className="mb-1 text-[11px] font-semibold tracking-wide text-gray-600">
                            {isHuman ? t('sourceHuman') : t('sourceAi')}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{conv.message}</p>
                        <p
                          className={`mt-1 text-xs ${isUser ? 'text-gray-600' : 'text-gray-500'}`}
                        >
                          {new Date(conv.created_at).toLocaleString('zh-TW', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="border-t border-gray-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                placeholder={t('humanReplyPlaceholder')}
                className="min-h-[72px] flex-1 resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !replyText.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {sending ? t('sending') : t('sendHumanReply')}
              </button>
            </div>
          </div>
        </div>

        {sideOpen && (
          <aside className="hidden xl:block w-72 border-l border-gray-200 bg-white p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900">{t('customerInfo')}</h3>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="text-gray-500">{t('customerName')}</p>
                <p className="font-medium text-gray-900">{selectedContact.name || t('unnamedCustomer')}</p>
              </div>
              <div>
                <p className="text-gray-500">LINE ID</p>
                <p className="font-medium text-gray-900 break-all">{selectedContact.line_user_id}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('tagFilter')}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {selectedContact.tags.length > 0 ? (
                    selectedContact.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-gray-500">{t('conversationCount')}</p>
                <p className="font-medium text-gray-900">{selectedContact.conversationCount}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('firstInteraction')}</p>
                <p className="font-medium text-gray-900">
                  {selectedContact.firstInteraction
                    ? new Date(selectedContact.firstInteraction).toLocaleString('zh-TW')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">{t('lastInteraction')}</p>
                <p className="font-medium text-gray-900">
                  {selectedContact.lastInteraction
                    ? new Date(selectedContact.lastInteraction).toLocaleString('zh-TW')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">{t('customerNotes')}</p>
                <p className="rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 whitespace-pre-wrap">
                  {selectedContact.notes?.trim() || '—'}
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
