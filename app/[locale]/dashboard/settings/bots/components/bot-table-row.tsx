'use client';

import { useState, useRef, useEffect } from 'react';
import { Edit2, Copy, Activity, Pencil, Trash2, Loader2 } from 'lucide-react';
import { formatRelativeTime } from '../lib/format-relative-time';
import type { BotItem } from '../hooks/use-bots';

type Props = {
  bot: BotItem;
  webhookUrl: string;
  onCopy: (url: string) => void;
  onTest: (id: string) => Promise<void>;
  onEdit: (bot: BotItem) => void;
  onDelete: (bot: BotItem) => void;
  onNameSaved: () => void;
  locale?: string;
  t: (key: string, values?: Record<string, string>) => string;
};

export function BotTableRow({
  bot,
  webhookUrl,
  onCopy,
  onTest,
  onEdit,
  onDelete,
  onNameSaved,
  locale,
  t,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(bot.name);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(bot.name);
  }, [bot.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (trimmed === bot.name || !trimmed) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/bots/${bot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Update failed');
      }
      setIsEditing(false);
      onNameSaved();
    } catch {
      setSaving(false);
    }
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleSave();
    if (e.key === 'Escape') {
      setEditValue(bot.name);
      setIsEditing(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest(bot.id);
    } finally {
      setTesting(false);
    }
  };

  const displayUrl = webhookUrl.length > 50 ? `${webhookUrl.slice(0, 47)}...` : webhookUrl;

  return (
    <tr className="group border-b border-gray-200 hover:bg-gray-50/80 transition-colors">
      <td className="py-4 px-4" style={{ width: '25%' }}>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => void handleSave()}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm w-full max-w-[200px]"
            />
          ) : (
            <>
              <span className="font-medium text-gray-900">{bot.name}</span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity"
                aria-label={t('edit')}
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </>
          )}
        </div>
      </td>
      <td className="py-4 px-4" style={{ width: '10%' }}>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            bot.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {bot.is_active ? '●' : '○'} {bot.is_active ? t('statusActive') : t('statusInactive')}
        </span>
      </td>
      <td className="py-4 px-4" style={{ width: '40%' }}>
        <div className="flex items-center gap-2">
          <code
            className="flex-1 truncate text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded max-w-[280px]"
            title={webhookUrl}
          >
            {displayUrl}
          </code>
          <button
            type="button"
            onClick={() => onCopy(webhookUrl)}
            className="shrink-0 p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={t('copySuccess')}
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </td>
      <td className="py-4 px-4 text-sm text-gray-500" style={{ width: '15%' }}>
        {formatRelativeTime(new Date(bot.created_at), { locale: locale ?? 'zh-TW' })}
      </td>
      <td className="py-4 px-4" style={{ width: '10%' }}>
        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="p-2 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title={t('testConnection')}
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => onEdit(bot)}
            className="p-2 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
            title={t('edit')}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(bot)}
            className="p-2 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
            title={t('delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
