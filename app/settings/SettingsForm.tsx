'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  userId: string;
  userEmail: string;
  initialPrompt: string;
};

export default function SettingsForm({ userId, userEmail, initialPrompt }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setError(null);

    if (!userEmail) {
      setStatus('error');
      setError(
        '\u627E\u4E0D\u5230\u4F7F\u7528\u8005 Email\uFF0C\u7121\u6CD5\u5132\u5B58\u8A2D\u5B9A\u3002'
      );
      return;
    }

    try {
      const supabase = createClient();
      const { error: saveError } = await supabase
        .from('users')
        .upsert(
          {
            id: userId,
            email: userEmail,
            system_prompt: prompt,
          },
          { onConflict: 'id' }
        );

      if (saveError) {
        setStatus('error');
        setError(saveError.message);
        return;
      }

      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setError('\u5132\u5B58\u5931\u6557\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66\u3002');
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700">
          System Prompt
        </label>
        <textarea
          id="systemPrompt"
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            '\u4F8B\u5982\uFF1A\u4F60\u662F\u4E00\u500B\u5C08\u696D\u5BA2\u670D\uFF0C\u56DE\u7B54\u8981\u7C21\u6F54\u660E\u78BA...'
          }
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-2 text-sm text-gray-500">
          {'\u9019\u6BB5\u5167\u5BB9\u6703\u4F5C\u70BA OpenAI messages \u7684\u7B2C\u4E00\u689D system \u8A0A\u606F\u3002'}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {status === 'saving'
            ? '\u5132\u5B58\u4E2D...'
            : '\u5132\u5B58\u8A2D\u5B9A'}
        </button>
        {status === 'saved' && (
          <span className="text-sm text-green-600">{'\u5DF2\u5132\u5B58'}</span>
        )}
      </div>
    </form>
  );
}
