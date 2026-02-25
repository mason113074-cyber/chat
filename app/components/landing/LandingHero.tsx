import { Link } from '@/i18n/navigation';

type Props = {
  t: (key: string) => string;
};

export function LandingHero({ t }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 md:pb-20 md:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          {t('heroTitle')}
        </h1>
        <p className="mt-6 text-lg text-slate-200/90 sm:text-xl">{t('heroSubtitle')}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login?signup=true"
            className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {t('ctaFreeStart')}
          </Link>
          <Link
            href="#features"
            className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {t('ctaLearnMore')}
          </Link>
        </div>
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
          <span>🔒 {t('noCreditCard')}</span>
          <span>⚡ {t('tenMinSetup')}</span>
          <span>🤖 {t('aiAutoReply')}</span>
        </p>
      </div>
    </section>
  );
}
