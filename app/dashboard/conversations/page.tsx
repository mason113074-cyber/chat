'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type Contact = {
  id: string;
  name: string | null;
  line_user_id: string;
  lastMessage: string;
  lastMessageTime: string;
};

type Conversation = {
  id: string;
  message: string;
  role: string;
  created_at: string;
};

export default function ConversationsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContactId) {
      loadConversations(selectedContactId);
    }
  }, [selectedContactId]);

  // 自動捲動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  // 訂閱對話即時更新
  useEffect(() => {
    if (!selectedContactId) return;
    
    const supabase = createClient();
    
    const channel = supabase
      .channel(`conversations:${selectedContactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `contact_id=eq.${selectedContactId}`,
        },
        (payload) => {
          setConversations((prev) => [...prev, payload.new as Conversation]);
          
          // 更新聯絡人列表的最新訊息
          setContacts((prev) => {
            const updated = prev.map((contact) => {
              if (contact.id === selectedContactId) {
                return {
                  ...contact,
                  lastMessage: (payload.new as Conversation).message,
                  lastMessageTime: (payload.new as Conversation).created_at,
                };
              }
              return contact;
            });
            
            // 重新排序，最新訊息的聯絡人排到最上面
            return updated.sort((a, b) => {
              if (!a.lastMessageTime) return 1;
              if (!b.lastMessageTime) return -1;
              return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
            });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContactId]);

  // 訂閱新聯絡人
  useEffect(() => {
    const supabase = createClient();
    
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return user.id;
    };

    fetchUserId().then((userId) => {
      if (!userId) return;

      const channel = supabase
        .channel('contacts:new')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'contacts',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newContact = payload.new as {
              id: string;
              name: string | null;
              line_user_id: string;
            };
            
            setContacts((prev) => [
              {
                id: newContact.id,
                name: newContact.name,
                line_user_id: newContact.line_user_id,
                lastMessage: '尚無對話',
                lastMessageTime: '',
              },
              ...prev,
            ]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, []);

  // 訂閱所有聯絡人的對話更新（用於更新聯絡人列表）
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('conversations:all')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          const newConv = payload.new as Conversation & { contact_id: string };
          
          // 如果不是當前選中的聯絡人，更新聯絡人列表
          setContacts((prev) => {
            const updated = prev.map((contact) => {
              if (contact.id === newConv.contact_id) {
                return {
                  ...contact,
                  lastMessage: newConv.message,
                  lastMessageTime: newConv.created_at,
                };
              }
              return contact;
            });
            
            // 重新排序
            return updated.sort((a, b) => {
              if (!a.lastMessageTime) return 1;
              if (!b.lastMessageTime) return -1;
              return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
            });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadContacts() {
    const supabase = createClient();
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all contacts with their latest conversation
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, name, line_user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!contactsData) {
      setLoading(false);
      return;
    }

    // For each contact, get the latest message
    const contactsWithMessages = await Promise.all(
      contactsData.map(async (contact) => {
        const { data: lastMsg } = await supabase
          .from('conversations')
          .select('message, created_at')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: contact.id,
          name: contact.name,
          line_user_id: contact.line_user_id,
          lastMessage: lastMsg?.message || '尚無對話',
          lastMessageTime: lastMsg?.created_at || '',
        };
      })
    );

    // Sort by last message time
    contactsWithMessages.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    setContacts(contactsWithMessages);
    setLoading(false);
  }

  async function loadConversations(contactId: string) {
    const supabase = createClient();
    
    const { data } = await supabase
      .from('conversations')
      .select('id, message, role, created_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });

    setConversations(data || []);
  }

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: Show only contact list */}
      <div className="lg:hidden">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">對話紀錄</h1>
        {contacts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mb-4">
                <span className="text-4xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                尚無對話紀錄
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md">
                當客戶透過 LINE 與 Bot 對話後，對話會顯示於此。
              </p>
              <a
                href="/dashboard/settings"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                查看 LINE 設定教學
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <a
                key={contact.id}
                href={`/dashboard/conversations/${contact.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {contact.name || '未命名客戶'}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                      {contact.lastMessage.length > 50
                        ? contact.lastMessage.substring(0, 50) + '...'
                        : contact.lastMessage}
                    </p>
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
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Two-column layout */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">對話紀錄</h1>
        
        <div className="flex gap-6 h-[calc(100vh-12rem)]">
          {/* Left: Contact list */}
          <div className="w-80 flex-shrink-0">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900">聯絡人</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {contacts.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="flex flex-col items-center py-8">
                      <div className="rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mb-3">
                        <span className="text-3xl">👥</span>
                      </div>
                      <p className="text-sm text-gray-600">尚無聯絡人對話</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {contacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContactId(contact.id)}
                        className={`
                          w-full text-left p-4 hover:bg-gray-50 transition-colors
                          ${selectedContactId === contact.id ? 'bg-indigo-50' : ''}
                        `}
                      >
                        <p className="font-medium text-gray-900">
                          {contact.name || '未命名客戶'}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                          {contact.lastMessage.length > 40
                            ? contact.lastMessage.substring(0, 40) + '...'
                            : contact.lastMessage}
                        </p>
                        {contact.lastMessageTime && (
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(contact.lastMessageTime).toLocaleString('zh-TW', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Conversation view */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden h-full flex flex-col">
              {!selectedContactId ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="rounded-full bg-indigo-100 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">💬</span>
                    </div>
                    <p className="text-gray-600">請選擇一個對話</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-semibold text-gray-900">
                      {selectedContact?.name || '未命名客戶'}
                    </h2>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversations.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                          <span className="text-3xl">💬</span>
                        </div>
                        <p className="text-gray-600 text-sm">尚無對話內容</p>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
