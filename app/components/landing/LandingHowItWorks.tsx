type Step = { titleKey: string; descKey: string };

type Props = { steps: Step[]; t: (key: string) => string };

export function LandingHowItWorks({ steps, t }: Props) {
  return (
    <section className="border-t border-white/5 bg-slate-900/30 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            {t('sectionHowItWorks')}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            {t('howItWorksTitle')}
          </h2>
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
  );
}
