'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const AI_MODELS = [
  {
    id: 'gpt-4o',
    label: 'gpt-4o',
    description: '最強大，回覆品質最高',
    scenario: '需要高品質回覆的專業客服',
  },
  {
    id: 'gpt-4o-mini',
    label: 'gpt-4o-mini',
    description: '性價比最高，速度快',
    scenario: '一般客服場景，推薦大部分用戶',
  },
  {
    id: 'gpt-3.5-turbo',
    label: 'gpt-3.5-turbo',
    description: '最便宜，速度最快',
    scenario: '簡單問答、高流量場景',
  },
] as const;

type AiModelId = (typeof AI_MODELS)[number]['id'];

type Props = {
  userId: string;
  userEmail: string;
  initialPrompt: string;
  initialAiModel: string;
};

const VALID_MODEL_IDS = new Set<AiModelId>(AI_MODELS.map((m) => m.id));

function toAiModelId(value: string): AiModelId {
  return VALID_MODEL_IDS.has(value as AiModelId) ? (value as AiModelId) : 'gpt-4o-mini';
}

export default function SettingsForm({ userId, userEmail, initialPrompt, initialAiModel }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [aiModel, setAiModel] = useState<AiModelId>(toAiModelId(initialAiModel));
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
            ai_model: aiModel,
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI 模型選擇
        </label>
        <div className="space-y-3">
          {AI_MODELS.map((m) => (
            <label
              key={m.id}
              className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50/50"
            >
              <input
                type="radio"
                name="ai_model"
                value={m.id}
                checked={aiModel === m.id}
                onChange={() => setAiModel(m.id)}
                className="mt-1 h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-medium text-gray-900">{m.label}</span>
                {m.id === 'gpt-4o-mini' && (
                  <span className="ml-2 text-xs text-indigo-600">（預設）</span>
                )}
                <p className="text-sm text-gray-600 mt-0.5">{m.description}</p>
                <p className="text-xs text-gray-500">{m.scenario}</p>
              </div>
            </label>
          ))}
        </div>
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
