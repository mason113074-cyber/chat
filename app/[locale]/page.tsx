import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LandingNavbar } from '@/app/components/LandingNavbar';
import { LandingFooter } from '@/app/components/LandingFooter';
import { LandingFAQ } from '@/app/components/LandingFAQ';
import {
  LandingHero,
  LandingPartners,
  LandingStats,
  LandingFeatures,
  LandingTestimonials,
  LandingHowItWorks,
  LandingWhyChooseUs,
  LandingPricing,
  LandingSecurity,
  LandingFinalCta,
} from '@/app/components/landing';
import { getAppUrl } from '@/lib/app-url';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });
  const title = `CustomerAI Pro — ${t('heroTitle')}`;
  const description = t('heroSubtitle');
  const localePath = locale === 'zh-TW' ? '/zh-TW' : '/en';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${getAppUrl()}${localePath}`,
      siteName: 'CustomerAI Pro',
      locale: locale === 'zh-TW' ? 'zh_TW' : 'en',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing');

  const features = [
    { icon: '🤖', titleKey: 'featureAiCs' as const, descKey: 'featureAiCsDesc' as const },
    { icon: '💬', titleKey: 'featureMultiChannel' as const, descKey: 'featureMultiChannelDesc' as const },
    { icon: '📊', titleKey: 'featureDataInsight' as const, descKey: 'featureDataInsightDesc' as const },
    { icon: '👥', titleKey: 'featureSmartContact' as const, descKey: 'featureSmartContactDesc' as const },
    { icon: '🧠', titleKey: 'featureKnowledge' as const, descKey: 'featureKnowledgeDesc' as const },
    { icon: '⚙️', titleKey: 'featureCustomWidget' as const, descKey: 'featureCustomWidgetDesc' as const },
  ];

  const steps = [
    { titleKey: 'step1Title' as const, descKey: 'step1Desc' as const },
    { titleKey: 'step2Title' as const, descKey: 'step2Desc' as const },
    { titleKey: 'step3Title' as const, descKey: 'step3Desc' as const },
  ];

  const stats =
    locale === 'en'
      ? [
          { value: '10 min', labelKey: 'statSetup' as const },
          { value: '24/7', labelKey: 'statAvailability' as const },
          { value: 'RAG', labelKey: 'statKnowledge' as const },
          { value: '< 30s', labelKey: 'avgResponseTime' as const },
        ]
      : [
          { value: '10 分鐘', labelKey: 'statSetup' as const },
          { value: '24/7', labelKey: 'statAvailability' as const },
          { value: 'RAG', labelKey: 'statKnowledge' as const },
          { value: '<30 秒', labelKey: 'avgResponseTime' as const },
        ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CustomerAI Pro',
    applicationCategory: 'BusinessApplication',
    description: typeof t('heroSubtitle') === 'string' ? t('heroSubtitle') : '',
    url: getAppUrl(),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      <LandingNavbar />

      <main className="relative z-10 pt-[72px]">
        <LandingHero t={t} />
        <LandingPartners t={t} />
        <LandingStats stats={stats} t={t} />
        <LandingFeatures features={features} t={t} />
        <LandingTestimonials locale={locale} t={t} />
        <LandingHowItWorks steps={steps} t={t} />
        <LandingWhyChooseUs t={t} />
        <LandingPricing
          plans={[
            { name: locale === 'zh-TW' ? '免費方案' : 'Free', price: locale === 'zh-TW' ? 'NT$ 0' : '$0', promotion: null, periodKey: 'perMonth', desc: t('planFreeDesc'), ctaKey: 'ctaFreeStartShort', primary: false, href: '/login?signup=true' },
            { name: locale === 'zh-TW' ? '入門方案' : 'Starter', price: locale === 'zh-TW' ? 'NT$ 799' : '$24', promotion: null, periodKey: 'perMonth', desc: t('planStarterDesc'), ctaKey: 'ctaFreeStartShort', primary: true, href: '/login?signup=true' },
            { name: locale === 'zh-TW' ? '專業方案' : 'Pro', price: locale === 'zh-TW' ? 'NT$ 1,899' : '$60', promotion: null, periodKey: 'perMonth', desc: t('planProDesc'), ctaKey: 'ctaFreeStartShort', primary: false, href: '/login?signup=true' },
            { name: locale === 'zh-TW' ? '企業方案' : 'Business', price: locale === 'zh-TW' ? 'NT$ 5,299' : '$149', promotion: null, periodKey: 'perMonth', desc: t('planBusinessDesc'), ctaKey: 'ctaContactUs', primary: false, href: 'mailto:support@customeraipro.com' },
          ]}
          t={t}
        />
        <LandingFAQ />
        <LandingSecurity t={t} />
        <LandingFinalCta t={t} />
        <LandingFooter />
      </main>
    </div>
  );
}
