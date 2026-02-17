'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

type Contact = {
  id: string;
  name: string | null;
  line_user_id: string;
};

type Conversation = {
  id: string;
  message: string;
  role: string;
  created_at: string;
};

export default function ConversationDetailPage() {
  const params = useParams();
  const contactId = params.contactId as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    // Get contact info
    const { data: contactData } = await supabase
      .from('contacts')
      .select('id, name, line_user_id')
      .eq('id', contactId)
      .single();

    if (!contactData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setContact(contactData);

    // Get all conversations for this contact
    const { data: conversationsData } = await supabase
      .from('conversations')
      .select('id, message, role, created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });

    setConversations(conversationsData || []);
    setLoading(false);
  }, [contactId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 自動捲動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  // 訂閱對話即時更新
  useEffect(() => {
    if (!contactId) return;
    
    const supabase = createClient();
    
    const channel = supabase
      .channel(`conversations:${contactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          setConversations((prev) => [...prev, payload.new as Conversation]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  if (notFound || !contact) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-gray-500 mb-4">找不到此對話</div>
        <Link
          href="/dashboard/conversations"
          className="text-indigo-600 hover:text-indigo-700"
        >
          返回對話列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-h-screen flex flex-col">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
        <Link
          href="/dashboard/conversations"
          className="text-gray-600 hover:text-gray-900"
        >
          ← 返回
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 flex-1">
          {contact.name || '未命名客戶'}
        </h1>
      </div>

      {/* Conversation messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!conversations || conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            尚無對話內容
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
                    max-w-[80%] rounded-2xl px-4 py-2
                    ${
                      conv.role === 'user'
                        ? 'bg-green-100 text-gray-900'
                        : 'bg-gray-100 text-gray-900'
                    }
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {conv.message}
                  </p>
                  <p
                    className={`
                      mt-1 text-xs
                      ${conv.role === 'user' ? 'text-gray-600' : 'text-gray-500'}
                    `}
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
    </div>
  );
}
