'use client';

import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { BotItem } from '../hooks/use-bots';

type Props = {
  open: boolean;
  editBot: BotItem | null;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string, values?: Record<string, string>) => string;
};

export function BotFormDialog({ open, editBot, onClose, onSuccess, t }: Props) {
  const [name, setName] = useState('');
  const [channelSecret, setChannelSecret] = useState('');
  const [channelAccessToken, setChannelAccessToken] = useState('');
  const [webhookKey, setWebhookKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [reenterCredentials, setReenterCredentials] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testVerified, setTestVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!editBot;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTestVerified(false);
    if (editBot) {
      setName(editBot.name);
      setChannelSecret('');
      setChannelAccessToken('');
      setWebhookKey('');
      setReenterCredentials(false);
    } else {
      setName('');
      setChannelSecret('');
      setChannelAccessToken('');
      setWebhookKey('');
    }
    setAdvancedOpen(false);
  }, [open, editBot]);

  const handleTestConnection = async () => {
    const secret = channelSecret.trim();
    const token = channelAccessToken.trim();
    if (!secret || !token) {
      setError(t('channelSecretMin'));
      return;
    }
    setTesting(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/bots/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_secret: secret, channel_access_token: token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t('testFailed'));
        return;
      }
      setTestVerified(true);
    } catch {
      setError(t('networkError'));
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('nameRequired'));
      return;
    }
    if (isEdit && !reenterCredentials) {
      const body: { name: string } = { name: trimmedName };
      setSaving(true);
      try {
        const res = await fetch(`/api/settings/bots/${editBot.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? t('updateError'));
        }
        onSuccess();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('updateError'));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!isEdit || reenterCredentials) {
      if (channelSecret.trim().length < 32) {
        setError(t('channelSecretMin'));
        return;
      }
      if (channelAccessToken.trim().length < 100) {
        setError(t('channelTokenMin'));
        return;
      }
    }
    setSaving(true);
    try {
      const body: Record<string, string> = {
        name: trimmedName,
        channel_secret: channelSecret.trim(),
        channel_access_token: channelAccessToken.trim(),
      };
      if (webhookKey.trim()) body.webhook_key = webhookKey.trim();

      const url = isEdit ? `/api/settings/bots/${editBot.id}` : '/api/settings/bots';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? (isEdit ? t('updateError') : t('saveError')));
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateWebhookKey = async () => {
    if (!editBot || !window.confirm(t('regenerateWebhookKey') + '？')) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/bots/${editBot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate_webhook_key: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t('updateError'));
        return;
      }
      if (data.webhook_key) {
        setWebhookKey(data.webhook_key);
        setAdvancedOpen(true);
      }
      onSuccess();
    } catch {
      setError(t('updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="bot-form-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <h2 id="bot-form-title" className="text-lg font-semibold text-gray-900">
          {isEdit ? t('dialogEditTitle') : t('dialogAddTitle')}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('fieldName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('fieldNamePlaceholder')}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
          </div>
          {(!isEdit || reenterCredentials) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('fieldChannelSecret')}</label>
                <p className="mt-0.5 text-xs text-gray-500">{t('fieldChannelSecretHelp')}</p>
                <div className="mt-1 flex rounded-lg border border-gray-300 bg-white">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={channelSecret}
                    onChange={(e) => setChannelSecret(e.target.value)}
                    className="flex-1 rounded-l-lg px-3 py-2 text-sm text-gray-900 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((s) => !s)}
                    className="rounded-r-lg border-l border-gray-300 px-2 py-2 text-gray-500 hover:bg-gray-50"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('fieldChannelToken')}</label>
                <p className="mt-0.5 text-xs text-gray-500">{t('fieldChannelTokenHelp')}</p>
                <div className="mt-1 flex rounded-lg border border-gray-300 bg-white">
                  <textarea
                    rows={3}
                    value={channelAccessToken}
                    onChange={(e) => setChannelAccessToken(e.target.value)}
                    className={`flex-1 rounded-l-lg px-3 py-2 text-sm text-gray-900 min-w-0 resize-none ${showToken ? '' : 'font-mono'}`}
                    style={{ fontFamily: showToken ? 'inherit' : 'monospace' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((s) => !s)}
                    className="rounded-r-lg border-l border-gray-300 px-2 py-2 text-gray-500 hover:bg-gray-50 self-start"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
          {isEdit && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={reenterCredentials}
                onChange={(e) => setReenterCredentials(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{t('reenterCredentials')}</span>
            </label>
          )}
          <div>
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {advancedOpen ? '▼' : '▶'} {t('advancedOptions')}
            </button>
            {advancedOpen && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700">{t('fieldWebhookKey')}</label>
                <p className="mt-0.5 text-xs text-gray-500">{t('fieldWebhookKeyHelp')}</p>
                <input
                  type="text"
                  value={webhookKey}
                  onChange={(e) => setWebhookKey(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>
            )}
          </div>
          {isEdit && (
            <div>
              <button
                type="button"
                onClick={handleRegenerateWebhookKey}
                disabled={saving}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {t('regenerateWebhookKey')}
              </button>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('cancel')}
            </button>
            {(!isEdit || reenterCredentials) && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {testing && <Loader2 className="w-4 h-4 animate-spin" />}
                {testVerified ? '✓ ' + t('testSuccess').replace('！', '') : testing ? t('testing') : t('testConnection')}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
