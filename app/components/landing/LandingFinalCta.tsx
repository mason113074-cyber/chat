import { Link } from '@/i18n/navigation';

type Props = { t: (key: string) => string };

export function LandingFinalCta({ t }: Props) {
  return (
    <section className="border-t border-white/5 bg-gradient-to-b from-slate-900/50 to-slate-950 py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">{t('finalCtaTitle')}</h2>
        <p className="mt-4 text-lg text-slate-200/80">{t('finalCtaSubtitle')}</p>
        <Link
          href="/login?signup=true"
          className="mt-8 inline-block rounded-xl bg-white px-10 py-4 text-base font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-indigo-500/30"
        >
          {t('ctaFreeStart')}
        </Link>
        <p className="mt-4 text-sm text-slate-500">{t('finalCtaNoCard')}</p>
      </div>
    </section>
  );
}
