import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { getArticleContent, getCategoryArticleList } from '@/lib/help-articles';
import { LandingNavbar } from '@/app/components/LandingNavbar';
import { LandingFooter } from '@/app/components/LandingFooter';

type Props = { params: Promise<{ locale: string; category: string; article: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, article } = await params;
  const content = getArticleContent(category, article);
  if (!content) return { title: 'Help' };
  const t = await getTranslations('help');
  const title = t(content.titleKey);
  return { title: `${title} | Help` };
}

export default async function HelpArticlePage({ params }: Props) {
  const { locale, category, article } = await params;
  setRequestLocale(locale);

  const content = getArticleContent(category, article);
  if (!content) notFound();

  const t = await getTranslations('help');
  const categoryTitle = t(content.categoryNameKey);
  const articleTitle = t(content.titleKey);

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingNavbar />
      <main className="pt-[72px]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6" aria-label="Breadcrumb">
            <Link href="/help" className="hover:text-blue-600">Help</Link>
            <span>/</span>
            <Link href={`/help/${category}`} className="hover:text-blue-600">{categoryTitle}</Link>
            <span>/</span>
            <span className="text-gray-900">{articleTitle}</span>
          </nav>

          <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{articleTitle}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{content.readTime} min read</span>
              <span>Last updated: {content.lastUpdated}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
            <article
              className="prose prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded"
              dangerouslySetInnerHTML={{ __html: content.contentHtml.trim() }}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-700 mb-4">Was this article helpful?</p>
            <div className="flex gap-4 justify-center">
              <button type="button" className="flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                Yes
              </button>
              <button type="button" className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                No
              </button>
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
