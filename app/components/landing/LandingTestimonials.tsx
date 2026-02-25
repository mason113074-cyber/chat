type Props = { locale: string; t: (key: string) => string };

export function LandingTestimonials({ locale, t }: Props) {
  return (
    <section className="border-t border-white/5 bg-slate-900/40 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            {t('testimonialsTitle')}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            {t('testimonialsSubtitle')}
          </h2>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-200 font-semibold">
                  {t(`testimonial${i}Name` as 'testimonial1Name').charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {t(`testimonial${i}Name` as 'testimonial1Name')}
                  </p>
                  <p className="text-sm text-slate-400">
                    {t(`testimonial${i}Role` as 'testimonial1Role')} ·{' '}
                    {t(`testimonial${i}Company` as 'testimonial1Company')}
                  </p>
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
  );
}
