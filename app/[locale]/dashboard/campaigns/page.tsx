'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useEffect, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';

type Campaign = {
  id: string;
  name: string;
  status: string;
  channel: string;
  target_count: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  scheduled_at: string | null;
  sent_at: string | null;
};

export default function CampaignsPage() {
  const t = useTranslations('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/campaigns');
        if (res.ok) {
          const json = await res.json();
          setCampaigns(json.campaigns ?? []);
        }
      } catch {
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      sending: 'bg-amber-100 text-amber-700',
      sent: 'bg-green-100 text-green-700',
      paused: 'bg-orange-100 text-orange-700',
    };
    return m[s] ?? 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-3 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-gray-600">{t('subtitle')}</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          {t('createCampaign')}
        </Link>
      </div>

      <div className="mt-8">
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 shadow-sm text-center">
            <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">{t('emptyTitle')}</h2>
            <p className="mt-2 text-sm text-gray-500">{t('emptyDesc')}</p>
            <Link
              href="/dashboard/campaigns/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('createCampaign')}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('colName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('colStatus')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('colChannel')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('colTarget')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('colDelivery')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('colRead')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('colSentAt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link href={`/dashboard/campaigns/${c.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">{c.name}</Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{c.channel}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{c.target_count}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{c.sent_count > 0 ? `${Math.round((c.delivered_count / c.sent_count) * 100)}%` : '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{c.delivered_count > 0 ? `${Math.round((c.read_count / c.delivered_count) * 100)}%` : '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{c.sent_at ? new Date(c.sent_at).toLocaleString() : c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
