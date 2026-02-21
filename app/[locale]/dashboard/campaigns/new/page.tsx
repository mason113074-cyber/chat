'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';

export default function NewCampaignPage() {
  const t = useTranslations('campaigns');
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const n = name.trim();
    if (!n) return;
    setSaving(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, status: 'draft' }),
      });
      if (res.ok) {
        const { campaign } = await res.json();
        if (campaign?.id) router.push(`/dashboard/campaigns/${campaign.id}`);
      }
    } catch {
      setSaving(false);
    }
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{t('createCampaign')}</h1>
      <p className="mt-1 text-gray-600">{t('subtitle')}</p>
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-md">
        <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700">{t('colName')}</label>
        <input
          id="campaign-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          placeholder="e.g. 週末優惠推播"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '...' : t('createCampaign')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/campaigns')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
