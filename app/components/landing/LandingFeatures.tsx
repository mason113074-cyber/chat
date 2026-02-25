type Feature = { icon: string; titleKey: string; descKey: string };

type Props = { features: Feature[]; t: (key: string) => string };

export function LandingFeatures({ features, t }: Props) {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{t('sectionFeatures')}</p>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t('featuresTitle')}</h2>
        <p className="mt-3 max-w-2xl mx-auto text-base text-slate-200/80">{t('featuresSubtitle')}</p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.titleKey}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:-translate-y-0.5 hover:border-white/20 hover:shadow-indigo-500/10"
          >
            <span className="text-2xl" aria-hidden>
              {f.icon}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-white">{t(f.titleKey)}</h3>
            <p className="mt-2 text-sm text-slate-200/80">{t(f.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
