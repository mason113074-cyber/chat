import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LandingNavbar } from '@/app/components/LandingNavbar';
import { LandingFooter } from '@/app/components/LandingFooter';
import { LandingFAQ } from '@/app/components/LandingFAQ';

type Props = { params: Promise<{ locale: string }> };

const SITE_URL = 'https://www.customeraipro.com';

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
      url: `${SITE_URL}${localePath}`,
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
    url: SITE_URL,
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
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 md:pb-20 md:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="mt-6 text-lg text-slate-200/90 sm:text-xl">
              {t('heroSubtitle')}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login?signup=true"
                className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                {t('ctaFreeStart')}
              </Link>
              <Link
                href="/demo"
                className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                {t('ctaDemo')}
              </Link>
            </div>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              <span>🔒 {t('noCreditCard')}</span>
              <span>⚡ {t('tenMinSetup')}</span>
              <span>🤖 {t('aiAutoReply')}</span>
            </p>
          </div>
        </section>

        {/* 技術合作夥伴 */}
        <section className="border-y border-white/5 bg-slate-900/30 py-8">
          <p className="text-center text-xs uppercase tracking-widest text-slate-500 mb-6">
            {t('trustedBy')}
          </p>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap gap-6 justify-center items-center">
              {(['partnerLINE', 'partnerOpenAI', 'partnerSupabase', 'partnerVercel'] as const).map((key) => (
                <div
                  key={key}
                  className="px-5 py-2.5 rounded-lg bg-slate-700/60 text-slate-300 text-sm font-medium"
                  aria-hidden
                >
                  {t(key)}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-slate-900/40 py-8">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.labelKey} className="text-center">
                    <div className="text-2xl font-bold text-white sm:text-3xl">{s.value}</div>
                    <div className="mt-1 text-sm text-slate-400">{t(s.labelKey)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{t('sectionFeatures')}</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t('featuresTitle')}</h2>
            <p className="mt-3 max-w-2xl mx-auto text-base text-slate-200/80">
              {t('featuresSubtitle')}
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.titleKey}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:-translate-y-0.5 hover:border-white/20 hover:shadow-indigo-500/10"
              >
                <span className="text-2xl" aria-hidden>{f.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-white">{t(f.titleKey)}</h3>
                <p className="mt-2 text-sm text-slate-200/80">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t border-white/5 bg-slate-900/40 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{t('testimonialsTitle')}</p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t('testimonialsSubtitle')}</h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-200 font-semibold">
                      {t(`testimonial${i}Name` as 'testimonial1Name').charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t(`testimonial${i}Name` as 'testimonial1Name')}</p>
                      <p className="text-sm text-slate-400">{t(`testimonial${i}Role` as 'testimonial1Role')} · {t(`testimonial${i}Company` as 'testimonial1Company')}</p>
                    </div>
                  </div>
                  <p className="text-slate-200/90 text-sm leading-relaxed">
                    {locale === 'zh-TW' ? '「' : '"'}
                    {t(`testimonial${i}Quote` as 'testimonial1Quote')}
                    {locale === 'zh-TW' ? '」' : '"'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 bg-slate-900/30 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{t('sectionHowItWorks')}</p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t('howItWorksTitle')}</h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.titleKey} className="text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-indigo-400/50 bg-indigo-500/20 text-lg font-bold text-indigo-200">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{t(s.titleKey)}</h3>
                  <p className="mt-2 text-sm text-slate-400">{t(s.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why choose us */}
        <section className="border-t border-white/5 bg-slate-900/40 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{t('whyChooseUsTitle')}</p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t('whyChooseUsSubtitle')}</h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                  <p className="text-lg font-semibold text-white">{t(`why${i}Title` as 'why1Title')}</p>
                  <p className="mt-2 text-sm text-slate-400">{t(`why${i}Desc` as 'why1Desc')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{t('sectionPricing')}</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t('pricingTitle')}</h2>
            <p className="mt-3 text-base text-slate-200/80">{t('pricingSubtitle')}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: locale === 'zh-TW' ? '免費方案' : 'Free', price: locale === 'zh-TW' ? 'NT$ 0' : '$0', promotion: null, periodKey: 'perMonth', desc: t('planFreeDesc'), ctaKey: 'ctaFreeStartShort', primary: false, href: '/login?signup=true' },
              { name: locale === 'zh-TW' ? '入門方案' : 'Starter', price: locale === 'zh-TW' ? 'NT$ 799' : '$24', promotion: null, periodKey: 'perMonth', desc: t('planStarterDesc'), ctaKey: 'ctaFreeStartShort', primary: true, href: '/login?signup=true' },
              { name: locale === 'zh-TW' ? '專業方案' : 'Pro', price: locale === 'zh-TW' ? 'NT$ 1,899' : '$60', promotion: null, periodKey: 'perMonth', desc: t('planProDesc'), ctaKey: 'ctaFreeStartShort', primary: false, href: '/login?signup=true' },
              { name: locale === 'zh-TW' ? '企業方案' : 'Business', price: locale === 'zh-TW' ? 'NT$ 5,299' : '$149', promotion: null, periodKey: 'perMonth', desc: t('planBusinessDesc'), ctaKey: 'ctaContactUs', primary: false, href: 'mailto:support@customeraipro.com' },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 ${
                  plan.primary
                    ? 'border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <div className="mt-4 flex flex-wrap items-baseline gap-1">
                  {plan.promotion && (
                    <span className="text-slate-400 line-through text-lg">{plan.price}</span>
                  )}
                  <span className="text-3xl font-bold text-white">
                    {plan.promotion ?? plan.price}
                  </span>
                  {plan.periodKey && <span className="text-slate-400">{t(plan.periodKey)}</span>}
                </div>
                {plan.desc && <p className="mt-2 text-sm text-slate-400">{plan.desc}</p>}
                <Link
                  href={plan.href}
                  className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                    plan.primary
                      ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {t(plan.ctaKey)}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <LandingFAQ />

        {/* Security guarantee */}
        <section className="border-t border-white/5 bg-slate-900/30 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{t('securityTitle')}</p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t('securitySubtitle')}</h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                  <span className="text-3xl" aria-hidden>
                    {i === 1 ? '🔒' : i === 2 ? '🛡️' : '✓'}
                  </span>
                  <p className="mt-3 font-semibold text-white">{t(`security${i}Title` as 'security1Title')}</p>
                  <p className="mt-1 text-sm text-slate-400">{t(`security${i}Desc` as 'security1Desc')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 bg-gradient-to-b from-slate-900/50 to-slate-950 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              {t('finalCtaTitle')}
            </h2>
            <p className="mt-4 text-lg text-slate-200/80">
              {t('finalCtaSubtitle')}
            </p>
            <Link
              href="/login?signup=true"
              className="mt-8 inline-block rounded-xl bg-white px-10 py-4 text-base font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-indigo-500/30"
            >
              {t('ctaFreeStart')}
            </Link>
            <p className="mt-4 text-sm text-slate-500">{t('finalCtaNoCard')}</p>
          </div>
        </section>

        <LandingFooter />
      </main>
    </div>
  );
}
