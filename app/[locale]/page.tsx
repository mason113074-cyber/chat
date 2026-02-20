import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LandingNavbar } from '@/app/components/LandingNavbar';
import { LandingFooter } from '@/app/components/LandingFooter';
import { LandingFAQ } from '@/app/components/LandingFAQ';
import { getSupabaseAdmin } from '@/lib/supabase';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });
  return {
    title: `CustomerAI Pro — ${t('heroTitle')}`,
    description: t('heroSubtitle'),
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

  let totalUsers = 0;
  let totalConversations = 0;
  let totalKnowledgeBase = 0;
  try {
    const supabase = getSupabaseAdmin();
    const [usersRes, convsRes, kbRes] = await Promise.all([
      supabase.from('contacts').select('*', { count: 'exact', head: true }),
      supabase.from('conversations').select('*', { count: 'exact', head: true }),
      supabase.from('knowledge_base').select('*', { count: 'exact', head: true }),
    ]);
    totalUsers = usersRes.count ?? 0;
    totalConversations = convsRes.count ?? 0;
    totalKnowledgeBase = kbRes.count ?? 0;
  } catch (error) {
    console.error('Failed to fetch landing page stats:', error);
  }

  const stats =
    locale === 'en'
      ? [
          { value: '500+', labelKey: 'trustedMerchants' as const },
          { value: '10,000+', labelKey: 'conversationsHandled' as const },
          { value: '150+', labelKey: 'knowledgeBaseEntries' as const },
          { value: '< 30s', labelKey: 'avgResponseTime' as const },
        ]
      : [
          {
            value: totalUsers > 0 ? `${totalUsers}+` : '—',
            labelKey: 'trustedMerchants' as const,
          },
          {
            value: totalConversations > 0 ? totalConversations.toLocaleString() : '—',
            labelKey: 'conversationsHandled' as const,
          },
          {
            value: totalKnowledgeBase > 0 ? `${totalKnowledgeBase}+` : '—',
            labelKey: 'knowledgeBaseEntries' as const,
          },
          {
            value: '<30 秒',
            labelKey: 'avgResponseTime' as const,
          },
        ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
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
                href="/#features"
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

        {(locale === 'en' || totalUsers > 0 || totalConversations > 0) ? (
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
        ) : (
          <section className="border-y border-white/5 bg-slate-900/40 py-6">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
              <p className="text-sm text-slate-400">{t('betaBanner')}</p>
            </div>
          </section>
        )}

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

        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{t('sectionPricing')}</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t('pricingTitle')}</h2>
            <p className="mt-3 text-base text-slate-200/80">{t('pricingSubtitle')}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Free', price: 'NT$ 0', periodKey: 'perMonth', desc: t('planFreeDesc'), ctaKey: 'ctaFreeStartShort', primary: false, href: '/login?signup=true' },
              { name: 'Basic', price: locale === 'en' ? t('planBasicPriceDual') : 'NT$ 990', periodKey: locale === 'en' ? '' : 'perMonth', desc: t('planBasicDesc'), ctaKey: 'ctaFreeStartShort', primary: false, href: '/login?signup=true' },
              { name: 'Pro', price: 'NT$ 2,990', periodKey: 'perMonth', desc: t('planProDesc'), ctaKey: 'ctaFreeStartShort', primary: true, href: '/login?signup=true' },
              { name: 'Enterprise', price: t('planEnterprisePrice'), periodKey: '', desc: t('planEnterpriseDesc'), ctaKey: 'ctaContactUs', primary: false, href: 'mailto:support@customeraipro.com' },
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
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
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
