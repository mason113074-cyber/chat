import { Link } from '@/i18n/navigation';

type Plan = {
  name: string;
  price: string;
  promotion: string | null;
  periodKey: string;
  desc: string;
  ctaKey: string;
  primary: boolean;
  href: string;
};

type Props = { plans: Plan[]; t: (key: string) => string };

export function LandingPricing({ plans, t }: Props) {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{t('sectionPricing')}</p>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t('pricingTitle')}</h2>
        <p className="mt-3 text-base text-slate-200/80">{t('pricingSubtitle')}</p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-6 ${
              plan.primary
                ? 'border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
            <div className="mt-4 flex flex-wrap items-baseline gap-1">
              {plan.promotion && (
                <span className="text-slate-400 line-through text-lg">{plan.price}</span>
              )}
              <span className="text-3xl font-bold text-white">
                {plan.promotion ?? plan.price}
              </span>
              {plan.periodKey && (
                <span className="text-slate-400">{t(plan.periodKey)}</span>
              )}
            </div>
            {plan.desc && <p className="mt-2 text-sm text-slate-400">{plan.desc}</p>}
            {plan.href.startsWith('mailto:') ? (
              <a
                href={plan.href}
                className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                  plan.primary
                    ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                    : 'border border-white/20 text-white hover:bg-white/10'
                }`}
              >
                {t(plan.ctaKey)}
              </a>
            ) : (
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
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
