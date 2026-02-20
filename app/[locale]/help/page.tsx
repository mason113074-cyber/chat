'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LandingNavbar } from '@/app/components/LandingNavbar';
import { LandingFooter } from '@/app/components/LandingFooter';

const CATEGORIES = [
  { icon: '🚀', slug: 'getting-started', titleKey: 'categories.gettingStarted.title' as const, descKey: 'categories.gettingStarted.description' as const, articles: 8 },
  { icon: '💬', slug: 'line-integration', titleKey: 'categories.lineIntegration.title' as const, descKey: 'categories.lineIntegration.description' as const, articles: 12 },
  { icon: '🧠', slug: 'knowledge-base', titleKey: 'categories.knowledgeBase.title' as const, descKey: 'categories.knowledgeBase.description' as const, articles: 10 },
  { icon: '⚙️', slug: 'settings', titleKey: 'categories.settings.title' as const, descKey: 'categories.settings.description' as const, articles: 15 },
  { icon: '💳', slug: 'billing', titleKey: 'categories.billing.title' as const, descKey: 'categories.billing.description' as const, articles: 6 },
  { icon: '📊', slug: 'analytics', titleKey: 'categories.analytics.title' as const, descKey: 'categories.analytics.description' as const, articles: 8 },
] as const;

export default function HelpCenterPage() {
  const t = useTranslations('help');

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingNavbar />
      <main className="pt-[72px]">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1>
            <p className="text-xl text-blue-100 mb-8">{t('hero.subtitle')}</p>
            <div className="relative">
              <input
                type="text"
                placeholder={t('search.placeholder')}
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label={t('search.placeholder')}
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {(t.raw('search.popularTopics') as string[]).map((topic: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/help/${cat.slug}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 group"
            >
              <div className="text-4xl mb-3" aria-hidden>{cat.icon}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {t(cat.titleKey)}
              </h2>
              <p className="text-gray-600 mb-4">{t(cat.descKey)}</p>
              <p className="text-sm text-gray-500">{t('articleCount', { count: cat.articles })}</p>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('resources.title')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/demo"
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl" aria-hidden>🎬</span>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">{t('resources.demo.title')}</h3>
                <p className="text-sm text-gray-600">{t('resources.demo.description')}</p>
              </div>
            </Link>
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl" aria-hidden>📄</span>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">{t('resources.docs.title')}</h3>
                <p className="text-sm text-gray-600">{t('resources.docs.description')}</p>
              </div>
            </a>
            <a
              href="/support"
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl" aria-hidden>💬</span>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">{t('resources.support.title')}</h3>
                <p className="text-sm text-gray-600">{t('resources.support.description')}</p>
              </div>
            </a>
          </div>
        </div>
      </div>
      </main>
      <LandingFooter />
    </div>
  );
}
