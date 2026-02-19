'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

export type Conversation = {
  id: string;
  message: string;
  role: string;
  created_at: string;
};

type ConversationPanelProps = {
  selectedContactName: string | null;
  conversations: Conversation[];
};

export function ConversationPanel({ selectedContactName, conversations }: ConversationPanelProps) {
  const t = useTranslations('conversations');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  if (!selectedContactName) {
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

  return (
    <>
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-gray-900">{selectedContactName}</h2>
      </div>
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
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex ${conv.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[70%] rounded-2xl px-4 py-2
                    ${conv.role === 'user' ? 'bg-green-100 text-gray-900' : 'bg-gray-100 text-gray-900'}
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{conv.message}</p>
                  <p
                    className={`mt-1 text-xs ${conv.role === 'user' ? 'text-gray-600' : 'text-gray-500'}`}
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
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </>
  );
}
