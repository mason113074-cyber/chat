type Props = { t: (key: string) => string };

export function LandingWhyChooseUs({ t }: Props) {
  return (
    <section className="border-t border-white/5 bg-slate-900/40 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            {t('whyChooseUsTitle')}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            {t('whyChooseUsSubtitle')}
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-lg font-semibold text-white">
                {t(`why${i}Title` as 'why1Title')}
              </p>
              <p className="mt-2 text-sm text-slate-400">{t(`why${i}Desc` as 'why1Desc')}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
