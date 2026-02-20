import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getArticlesByCategory, getAllCategorySlugs } from '@/lib/help-articles';
import { LandingNavbar } from '@/app/components/LandingNavbar';
import { LandingFooter } from '@/app/components/LandingFooter';
import { routing } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string; category: string }> };

const CATEGORY_TITLE_KEYS: Record<string, string> = {
  'getting-started': 'categories.gettingStarted.title',
  'line-integration': 'categories.lineIntegration.title',
  'knowledge-base': 'categories.knowledgeBase.title',
  'settings': 'categories.settings.title',
  'billing': 'categories.billing.title',
  'analytics': 'categories.analytics.title',
};

export async function generateStaticParams() {
  const slugs = getAllCategorySlugs();
  return routing.locales.flatMap((locale) => slugs.map((category) => ({ locale, category })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!getCategoryBySlug(category)) return { title: 'Help' };
  const t = await getTranslations('help');
  const title = t(CATEGORY_TITLE_KEYS[category]);
  return { title: `${title} | Help` };
}

export default async function HelpCategoryPage({ params }: Props) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!getCategoryBySlug(category)) notFound();

  const articles = getArticlesByCategory(category);
  const categoryTitleKey = CATEGORY_TITLE_KEYS[category];

  const t = await getTranslations('help');

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingNavbar />
      <main className="pt-[72px]">
        <div className="container mx-auto px-4 py-12">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6" aria-label="Breadcrumb">
            <Link href="/help" className="hover:text-blue-600">{t('breadcrumb.help')}</Link>
            <span>/</span>
            <span className="text-gray-900">{t(categoryTitleKey)}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{t(categoryTitleKey)}</h1>
          {articles.length === 0 ? (
            <p className="text-gray-600">{t('noArticles')}</p>
          ) : (
            <ul className="space-y-4">
              {articles.map((art) => (
                <li key={art.slug}>
                  <Link
                    href={`/help/${category}/${art.slug}`}
                    className="block bg-white rounded-xl shadow-sm hover:shadow-md p-6 transition-shadow"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">{t(art.titleKey)}</h2>
                    <p className="text-sm text-gray-500">
                      {art.readTime} {t('minuteRead')} · Updated {art.lastUpdated}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 text-center">
            <Link href="/help" className="text-blue-600 hover:text-blue-700 font-medium">
              ← {t('backToHelp')}
            </Link>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
