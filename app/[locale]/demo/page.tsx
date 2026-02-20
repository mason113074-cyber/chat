import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LandingNavbar } from '@/app/components/LandingNavbar';
import { LandingFooter } from '@/app/components/LandingFooter';
import { InteractiveTour } from '@/components/demo/InteractiveTour';
import { DemoVideo } from '@/components/demo/DemoVideo';
import { DemoCTA } from '@/components/demo/DemoCTA';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'demo' });
  const isZh = locale === 'zh-TW';
  const title = isZh ? 'CustomerAIPro 產品導覽 - AI 智能客服演示' : 'CustomerAIPro Product Tour - AI Customer Service Demo';
  const description = t('hero.subtitle');
  return {
    title,
    description,
    openGraph: {
      title: isZh ? 'CustomerAIPro 產品導覽' : 'CustomerAIPro Product Tour',
      description: isZh ? '互動式產品演示，快速了解 AI 客服系統' : 'Interactive product demo — see AI customer service in action',
      images: ['/og-demo.jpg'],
    },
  };
}

export default async function DemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('demo');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <LandingNavbar />

      <main className="pt-[72px]">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-20 pb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full text-blue-700 mb-8" aria-hidden>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{t('hero.duration')}</span>
          </div>
        </section>

        {/* Tour type choice */}
        <section className="container mx-auto px-4 pb-16" aria-labelledby="tour-type-heading">
          <h2 id="tour-type-heading" className="sr-only">
            {t('tourType.interactive.title')} / {t('tourType.video.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-500">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden>
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('tourType.interactive.title')}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('tourType.interactive.description')}
                </p>
                <Link
                  href="/demo#interactive-tour"
                  className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                >
                  {t('tourType.interactive.cta')}
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden>
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('tourType.video.title')}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('tourType.video.description')}
                </p>
                <Link
                  href="/demo#demo-video"
                  className="block w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors text-center"
                >
                  {t('tourType.video.cta')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive tour section */}
        <section id="interactive-tour" className="bg-white py-16" aria-labelledby="interactive-tour-heading">
          <div className="container mx-auto px-4">
            <h2 id="interactive-tour-heading" className="sr-only">
              {t('tour.title')}
            </h2>
            <InteractiveTour />
          </div>
        </section>

        {/* Video section */}
        <section id="demo-video" className="py-16 bg-gray-50" aria-labelledby="demo-video-heading">
          <div className="container mx-auto px-4">
            <DemoVideo />
          </div>
        </section>

        {/* CTA section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <DemoCTA />
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
