type Stat = { value: string; labelKey: string };

type Props = { stats: Stat[]; t: (key: string) => string };

export function LandingStats({ stats, t }: Props) {
  return (
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
  );
}
