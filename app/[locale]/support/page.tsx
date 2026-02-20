import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LandingNavbar } from '@/app/components/LandingNavbar';
import { LandingFooter } from '@/app/components/LandingFooter';

type Props = { params: Promise<{ locale: string }> };

export default async function SupportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('support');

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingNavbar />
      <main className="pt-[72px]">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
            <p className="text-xl text-gray-600">{t('subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="mailto:support@customeraipro.com"
              className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow text-center"
            >
              <span className="text-4xl block mb-4" aria-hidden>✉️</span>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t('emailTitle')}</h2>
              <p className="text-gray-600 mb-4">support@customeraipro.com</p>
              <p className="text-sm text-gray-500">{t('emailResponse')}</p>
            </a>

            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <span className="text-4xl block mb-4" aria-hidden>💬</span>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t('lineTitle')}</h2>
              <p className="text-gray-600 mb-4">@customeraipro</p>
              <p className="text-sm text-gray-500">{t('lineResponse')}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <span className="text-4xl block mb-4" aria-hidden>📞</span>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t('phoneTitle')}</h2>
              <p className="text-gray-600 mb-4">{t('phoneComingSoon')}</p>
              <p className="text-sm text-gray-500">{t('phoneHours')}</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">{t('faqHint')}</p>
            <Link
              href="/help"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('browseHelp')}
            </Link>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
