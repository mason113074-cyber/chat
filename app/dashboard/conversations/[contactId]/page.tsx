'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

const PRESET_TAGS = ['退款', '技術問題', '帳號問題', '一般諮詢', '投訴', '已解決'];

const TAG_COLORS = [
  'bg-indigo-100 text-indigo-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
];
function tagColor(tag: string): string {
  const i = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return TAG_COLORS[Math.abs(i) % TAG_COLORS.length];
}

type Contact = {
  id: string;
  name: string | null;
  line_user_id: string;
  tags: string[];
};

type ConversationStatus = 'ai_handled' | 'needs_human' | 'resolved' | 'closed';

type Conversation = {
  id: string;
  message: string;
  role: string;
  created_at: string;
  status?: string | null;
};

export default function ConversationDetailPage() {
  const params = useParams();
  const contactId = params.contactId as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagsSaving, setTagsSaving] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationStatus, setConversationStatus] = useState<ConversationStatus>('ai_handled');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contactId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      const supabase = createClient();

      // Get contact info with tags
      const { data: contactData } = await supabase
        .from('contacts')
        .select('id, name, line_user_id, tags')
        .eq('id', contactId)
        .single();

      if (!contactData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const tagsArr = (contactData.tags as string[] | null) ?? [];
      setContact({
        id: contactData.id,
        name: contactData.name,
        line_user_id: contactData.line_user_id,
        tags: tagsArr,
      });
      setTags(tagsArr);

      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('id, message, role, created_at, status')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });

      setConversations(conversationsData || []);

      const latestAssistant = (conversationsData ?? [])
        .filter((c) => c.role === 'assistant')
        .pop();
      const status = latestAssistant?.status ?? 'ai_handled';
      setConversationStatus(
        ['ai_handled', 'needs_human', 'resolved', 'closed'].includes(status) ? (status as ConversationStatus) : 'ai_handled'
      );
      setLoading(false);
    };

    loadData();
  }, [contactId]);

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

  async function saveTags(newTags: string[]) {
    setTagsSaving(true);
    try {
      const res = await fetch(`/api/conversations/${contactId}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
      if (res.ok) {
        const json = await res.json();
        setTags(json.tags ?? newTags);
        setContact((c) => (c ? { ...c, tags: json.tags ?? newTags } : c));
      }
    } finally {
      setTagsSaving(false);
    }
  }

  function addTag(tag: string) {
    const t = tag.trim();
    if (!t || tags.includes(t)) return;
    saveTags([...tags, t]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    saveTags(tags.filter((x) => x !== tag));
  }

  async function changeStatus(newStatus: ConversationStatus) {
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/conversations/${contactId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setConversationStatus(newStatus);
    } finally {
      setStatusSaving(false);
    }
  }

  const STATUS_LABELS: Record<ConversationStatus, string> = {
    ai_handled: 'AI 已處理',
    needs_human: '需人工處理',
    resolved: '已解決',
    closed: '已關閉',
  };

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

      {/* Manage tags */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">管理標籤</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((t) => (
            <span
              key={t}
              className={`inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-0.5 text-xs font-medium ${tagColor(t)}`}
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                disabled={tagsSaving}
                className="rounded-full p-0.5 hover:bg-black/10 disabled:opacity-50"
                aria-label={`移除 ${t}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            placeholder="新增標籤"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-28"
          />
          <button
            type="button"
            onClick={() => addTag(tagInput)}
            disabled={tagsSaving || !tagInput.trim()}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            新增
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 mb-1">建議標籤：</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TAGS.filter((t) => !tags.includes(t)).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addTag(t)}
              disabled={tagsSaving}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              + {t}
            </button>
          ))}
          {PRESET_TAGS.every((t) => tags.includes(t)) && (
            <span className="text-xs text-gray-400">已全部加入</span>
          )}
        </div>
      </div>

      {/* 變更狀態 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">對話狀態</h3>
        <p className="text-xs text-gray-500 mb-2">目前：{STATUS_LABELS[conversationStatus]}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeStatus('resolved')}
            disabled={statusSaving || conversationStatus === 'resolved'}
            className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm text-blue-800 hover:bg-blue-200 disabled:opacity-50"
          >
            標記為已解決
          </button>
          <button
            type="button"
            onClick={() => changeStatus('needs_human')}
            disabled={statusSaving || conversationStatus === 'needs_human'}
            className="rounded-lg bg-orange-100 px-3 py-1.5 text-sm text-orange-800 hover:bg-orange-200 disabled:opacity-50"
          >
            標記為需人工
          </button>
          <button
            type="button"
            onClick={() => changeStatus('closed')}
            disabled={statusSaving || conversationStatus === 'closed'}
            className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            關閉對話
          </button>
          <button
            type="button"
            onClick={() => changeStatus('ai_handled')}
            disabled={statusSaving || conversationStatus === 'ai_handled'}
            className="rounded-lg bg-green-100 px-3 py-1.5 text-sm text-green-800 hover:bg-green-200 disabled:opacity-50"
          >
            重新開啟
          </button>
        </div>
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
