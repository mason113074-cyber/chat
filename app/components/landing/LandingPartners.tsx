type Props = { t: (key: string) => string };

export function LandingPartners({ t }: Props) {
  return (
    <section className="border-y border-white/5 bg-slate-900/30 py-8">
      <p className="text-center text-xs uppercase tracking-widest text-slate-500 mb-6">
        {t('trustedBy')}
      </p>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap gap-6 justify-center items-center">
          {(['partnerLINE', 'partnerOpenAI', 'partnerSupabase', 'partnerVercel'] as const).map(
            (key) => (
              <div
                key={key}
                className="px-5 py-2.5 rounded-lg bg-slate-700/60 text-slate-300 text-sm font-medium"
                aria-hidden
              >
                {t(key)}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
