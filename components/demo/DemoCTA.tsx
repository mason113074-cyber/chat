'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function DemoCTA() {
  const t = useTranslations('demo');

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        {t('cta.title')}
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        {t('cta.subtitle')}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/login?signup=true"
          className="inline-flex justify-center rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {t('cta.signup')}
        </Link>
        <Link
          href="/pricing"
          className="inline-flex justify-center rounded-xl border-2 border-gray-300 px-8 py-4 text-base font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
        >
          {t('cta.pricing')}
        </Link>
      </div>
    </div>
  );
}
