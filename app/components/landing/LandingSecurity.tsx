type Props = { t: (key: string) => string };

export function LandingSecurity({ t }: Props) {
  return (
    <section className="border-t border-white/5 bg-slate-900/30 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            {t('securityTitle')}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            {t('securitySubtitle')}
          </h2>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <span className="text-3xl" aria-hidden>
                {i === 1 ? '🔒' : i === 2 ? '🛡️' : '✓'}
              </span>
              <p className="mt-3 font-semibold text-white">
                {t(`security${i}Title` as 'security1Title')}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {t(`security${i}Desc` as 'security1Desc')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
