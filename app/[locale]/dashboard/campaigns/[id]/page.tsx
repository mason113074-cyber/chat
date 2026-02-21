'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useEffect, useState } from 'react';

type Campaign = {
  id: string;
  name: string;
  status: string;
  channel: string;
  target_count: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
};

export default function CampaignDetailPage() {
  const t = useTranslations('campaigns');
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`/api/campaigns/${id}`);
        if (res.ok) {
          const json = await res.json();
          setCampaign(json.campaign);
        }
      } catch {
        setCampaign(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">{t('loading')}</p>
        <Link href="/dashboard/campaigns" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700">{t('back')}</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/dashboard/campaigns" className="text-sm text-gray-500 hover:text-gray-700">← {t('back')}</Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">{campaign.name}</h1>
      <p className="mt-1 text-gray-600">Status: {campaign.status} | Channel: {campaign.channel}</p>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">{t('colTarget')}</p>
          <p className="text-2xl font-bold">{campaign.target_count}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">{t('colDelivery')}</p>
          <p className="text-2xl font-bold">{campaign.sent_count > 0 ? `${Math.round((campaign.delivered_count / campaign.sent_count) * 100)}%` : '—'}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">{t('colRead')}</p>
          <p className="text-2xl font-bold">{campaign.delivered_count > 0 ? `${Math.round((campaign.read_count / campaign.delivered_count) * 100)}%` : '—'}</p>
        </div>
      </div>
    </div>
  );
}
