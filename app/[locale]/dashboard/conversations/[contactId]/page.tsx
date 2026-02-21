'use client';

import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

const COLOR_CLASS: Record<string, string> = {
  red: 'bg-red-100 text-red-800',
  orange: 'bg-orange-100 text-orange-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  pink: 'bg-pink-100 text-pink-800',
  gray: 'bg-gray-100 text-gray-800',
};
function tagClass(color: string): string {
  return COLOR_CLASS[color] ?? COLOR_CLASS.gray;
}

type ContactTag = { id: string; name: string; color: string; assigned_by: string };
type Contact = {
  id: string;
  name: string | null;
  line_user_id: string;
  tags: ContactTag[];
  ticket_number?: string | null;
  ticket_priority?: string | null;
  assigned_to_id?: string | null;
};

type Note = { id: string; body: string; created_at: string; user_id: string };

type ConversationStatus = 'ai_handled' | 'needs_human' | 'resolved' | 'closed';

type Conversation = {
  id: string;
  message: string;
  role: string;
  created_at: string;
  status?: string | null;
};

type SuggestionSources =
  | { count?: number; titles?: string[]; items?: unknown[] }
  | unknown[]
  | null;

type AiSuggestion = {
  id: string;
  source_message_id: string | null;
  draft_text: string;
  action: 'AUTO' | 'SUGGEST' | 'ASK' | 'HANDOFF';
  category: string;
  confidence: number;
  reason: string | null;
  sources: SuggestionSources;
  status: 'pending' | 'approved' | 'sent';
  created_at: string;
};

export default function ConversationDetailPage() {
  const params = useParams();
  const contactId = params.contactId as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [allTags, setAllTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [tagsSaving, setTagsSaving] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationStatus, setConversationStatus] = useState<ConversationStatus>('ai_handled');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [suggestionDrafts, setSuggestionDrafts] = useState<Record<string, string>>({});
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionSendingId, setSuggestionSendingId] = useState<string | null>(null);
  const [suggestionDeletingId, setSuggestionDeletingId] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function getSourcesCount(sources: SuggestionSources): number {
    if (!sources) return 0;
    if (Array.isArray(sources)) return sources.length;
    if (typeof sources === 'object' && 'count' in sources) {
      const count = (sources as { count?: unknown }).count;
      return typeof count === 'number' ? count : 0;
    }
    return 0;
  }

  const loadSuggestions = useCallback(async () => {
    if (!contactId) return;
    setSuggestionLoading(true);
    setSuggestionError(null);
    try {
      const res = await fetch(`/api/conversations/${contactId}/suggestions?status=pending`);
      if (!res.ok) {
        setSuggestionError('無法取得 AI 建議回覆');
        return;
      }
      const json = await res.json();
      const list = Array.isArray(json.suggestions) ? (json.suggestions as AiSuggestion[]) : [];
      setSuggestions(list);
      setSuggestionDrafts((prev) => {
        const next: Record<string, string> = {};
        for (const item of list) {
          next[item.id] = prev[item.id] ?? item.draft_text;
        }
        return next;
      });
    } catch {
      setSuggestionError('無法取得 AI 建議回覆');
    } finally {
      setSuggestionLoading(false);
    }
  }, [contactId, loadSuggestions]);

  useEffect(() => {
    if (!contactId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      const supabase = createClient();

      const [contactRes, tagsRes] = await Promise.all([
        fetch(`/api/contacts/${contactId}`),
        fetch('/api/contacts/tags'),
      ]);

      if (!contactRes.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const contactJson = await contactRes.json();
      setContact(contactJson.contact ?? null);

      if (tagsRes.ok) {
        const tagsJson = await tagsRes.json();
        setAllTags(tagsJson.tags ?? []);
      }

      const notesRes = await fetch(`/api/contacts/${contactId}/notes`);
      if (notesRes.ok) {
        const notesJson = await notesRes.json();
        setNotes(notesJson.notes ?? []);
      }

      await loadSuggestions();

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

  async function addContactTag(tagId: string) {
    if (!contact || contact.tags.some((t) => t.id === tagId)) return;
    setTagsSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId }),
      });
      if (res.ok) {
        const json = await res.json();
        const tag = json.tag ?? allTags.find((t) => t.id === tagId);
        if (tag) setContact((c) => (c ? { ...c, tags: [...c.tags, { ...tag, assigned_by: 'manual' }] } : c));
      }
    } finally {
      setTagsSaving(false);
    }
  }

  async function removeContactTag(tagId: string) {
    if (!contact) return;
    setTagsSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/tags/${tagId}`, { method: 'DELETE' });
      if (res.ok) setContact((c) => (c ? { ...c, tags: c.tags.filter((t) => t.id !== tagId) } : c));
    } finally {
      setTagsSaving(false);
    }
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

  async function sendSuggestion(suggestion: AiSuggestion, useEditedDraft: boolean) {
    const edited = (suggestionDrafts[suggestion.id] ?? '').trim();
    const original = suggestion.draft_text.trim();
    const message = useEditedDraft ? edited : original;
    if (!message) return;

    setSuggestionSendingId(suggestion.id);
    setSuggestionError(null);
    try {
      const res = await fetch(`/api/conversations/${contactId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, suggestionId: suggestion.id }),
      });
      if (!res.ok) {
        setSuggestionError('送出建議回覆失敗');
        return;
      }
      const json = await res.json().catch(() => ({}));
      const inserted = json.item as Conversation | undefined;
      if (inserted) {
        setConversations((prev) => [...prev, inserted]);
      }
      setConversationStatus('needs_human');
      setSuggestions((prev) => prev.filter((item) => item.id !== suggestion.id));
      setSuggestionDrafts((prev) => {
        const next = { ...prev };
        delete next[suggestion.id];
        return next;
      });
    } catch {
      setSuggestionError('送出建議回覆失敗');
    } finally {
      setSuggestionSendingId(null);
    }
  }

  async function deleteSuggestion(suggestionId: string) {
    setSuggestionDeletingId(suggestionId);
    setSuggestionError(null);
    try {
      const res = await fetch(`/api/conversations/${contactId}/suggestions/${suggestionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setSuggestionError('刪除建議失敗');
        return;
      }
      setSuggestions((prev) => prev.filter((item) => item.id !== suggestionId));
      setSuggestionDrafts((prev) => {
        const next = { ...prev };
        delete next[suggestionId];
        return next;
      });
    } catch {
      setSuggestionError('刪除建議失敗');
    } finally {
      setSuggestionDeletingId(null);
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

      {/* 標籤（新系統：手動 / AI 自動） */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">標籤</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {contact.tags.map((t) => (
            <span
              key={t.id}
              className={`inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-0.5 text-xs font-medium ${tagClass(t.color)}`}
            >
              {t.name}
              <span className="text-[10px] opacity-80">({t.assigned_by === 'auto' ? 'AI 自動' : '手動'})</span>
              <button
                type="button"
                onClick={() => removeContactTag(t.id)}
                disabled={tagsSaving}
                className="rounded-full p-0.5 hover:bg-black/10 disabled:opacity-50"
                aria-label={`移除 ${t.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-1">新增標籤：</p>
        <div className="flex flex-wrap gap-1.5">
          {allTags.filter((t) => !contact.tags.some((ct) => ct.id === t.id)).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => addContactTag(t.id)}
              disabled={tagsSaving}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium hover:opacity-90 ${tagClass(t.color)}`}
            >
              + {t.name}
            </button>
          ))}
          {allTags.length === 0 && <span className="text-xs text-gray-400">尚無標籤，請至客戶管理建立</span>}
        </div>
      </div>

      {/* 工單（可選） */}
      {(contact.ticket_number || contact.ticket_priority || contact.assigned_to_id) && (
        <div className="bg-amber-50 border-b border-amber-100 p-4">
          <h3 className="text-sm font-medium text-amber-800 mb-2">工單</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {contact.ticket_number && (
              <span className="rounded bg-amber-200 px-2 py-0.5 font-mono text-amber-900">{contact.ticket_number}</span>
            )}
            {contact.ticket_priority && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">優先：{contact.ticket_priority}</span>
            )}
            {contact.assigned_to_id && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">指派：{contact.assigned_to_id.slice(0, 8)}…</span>
            )}
          </div>
        </div>
      )}

      {/* 內部備註（僅團隊可見） */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">內部備註</h3>
        <p className="text-xs text-gray-500 mb-2">僅團隊可見，不會傳送給客戶</p>
        <ul className="mb-3 space-y-1 max-h-32 overflow-y-auto">
          {notes.map((n) => (
            <li key={n.id} className="rounded bg-gray-100 px-2 py-1.5 text-sm text-gray-800">
              {n.body}
              <span className="ml-2 text-xs text-gray-400">{new Date(n.created_at).toLocaleString('zh-TW')}</span>
            </li>
          ))}
          {notes.length === 0 && <li className="text-xs text-gray-400">尚無備註</li>}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="新增備註…"
            className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={noteSaving || !noteInput.trim()}
            onClick={async () => {
              if (!noteInput.trim()) return;
              setNoteSaving(true);
              try {
                const res = await fetch(`/api/contacts/${contactId}/notes`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ body: noteInput.trim() }),
                });
                if (res.ok) {
                  const json = await res.json();
                  setNotes((prev) => [...prev, json.note]);
                  setNoteInput('');
                }
              } finally {
                setNoteSaving(false);
              }
            }}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            新增
          </button>
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

      {/* AI 建議回覆 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-gray-700">AI 建議回覆</h3>
            <p className="text-xs text-gray-500">草稿會先待人工確認，不會自動送給客戶</p>
          </div>
          <button
            type="button"
            onClick={() => void loadSuggestions()}
            disabled={suggestionLoading}
            className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            重新整理
          </button>
        </div>

        {suggestionError && (
          <p className="mb-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">{suggestionError}</p>
        )}

        {suggestionLoading ? (
          <p className="text-xs text-gray-500">載入建議中...</p>
        ) : suggestions.length === 0 ? (
          <p className="text-xs text-gray-500">目前沒有待處理的 AI 建議。</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => {
              const sourceCount = getSourcesCount(suggestion.sources);
              const confidence = Number(suggestion.confidence ?? 0);
              const confidenceText = Number.isFinite(confidence)
                ? `${Math.round(confidence * 100)}%`
                : '—';
              const editedDraft = suggestionDrafts[suggestion.id] ?? suggestion.draft_text;
              const isSending = suggestionSendingId === suggestion.id;
              const isDeleting = suggestionDeletingId === suggestion.id;

              return (
                <div key={suggestion.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-indigo-700">
                      {suggestion.action}
                    </span>
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-gray-700">
                      類別：{suggestion.category || 'general'}
                    </span>
                    <span className="text-gray-600">信心：{confidenceText}</span>
                    <span className="text-gray-600">來源：{sourceCount}</span>
                  </div>
                  <p className="mb-2 text-xs text-gray-600">
                    原因：{suggestion.reason?.trim() || '信心不足或涉及高風險，需人工確認'}
                  </p>
                  <textarea
                    value={editedDraft}
                    onChange={(e) =>
                      setSuggestionDrafts((prev) => ({ ...prev, [suggestion.id]: e.target.value }))
                    }
                    rows={4}
                    className="mb-2 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void sendSuggestion(suggestion, false)}
                      disabled={isSending || isDeleting}
                      className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSending ? '送出中...' : '一鍵送出'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendSuggestion(suggestion, true)}
                      disabled={isSending || isDeleting || !editedDraft.trim()}
                      className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      編輯後送出
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteSuggestion(suggestion.id)}
                      disabled={isSending || isDeleting}
                      className="rounded bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      {isDeleting ? '刪除中...' : '忽略 / 刪除建議'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
