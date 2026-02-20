import { Link } from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

type PlanData = {
  name: string;
  nameEn: string;
  price: number;
  originalPrice: number | null;
  promotionPrice: number | null;
  popular?: boolean;
  features: string[];
};

const PLANS_ZH: PlanData[] = [
  {
    name: '免費方案',
    nameEn: 'Free',
    price: 0,
    originalPrice: null,
    promotionPrice: null,
    features: [
      '100 次 AI 對話/月',
      '50 條知識庫',
      '基礎分析報表',
      'LINE 自動回覆',
      '社群支援',
    ],
  },
  {
    name: '入門方案',
    nameEn: 'Starter',
    price: 799,
    originalPrice: 799,
    promotionPrice: 599,
    popular: true,
    features: [
      '1,000 次 AI 對話/月',
      '200 條知識庫',
      '完整分析報表',
      'LINE 自動回覆',
      '自動轉人工客服',
      'Email 支援',
    ],
  },
  {
    name: '專業方案',
    nameEn: 'Pro',
    price: 1899,
    originalPrice: 1899,
    promotionPrice: 1399,
    features: [
      '5,000 次 AI 對話/月',
      '1,000 條知識庫',
      '進階 AI 訓練',
      '多渠道整合',
      '防幻覺機制',
      '優先支援',
    ],
  },
  {
    name: '企業方案',
    nameEn: 'Business',
    price: 5299,
    originalPrice: 5299,
    promotionPrice: 3999,
    features: [
      '20,000 次 AI 對話/月',
      '5,000 條知識庫',
      '客製化 AI 模型',
      '專屬客戶經理',
      'API 存取',
      'SLA 保證',
      '24/7 優先支援',
    ],
  },
];

const PLANS_EN: PlanData[] = [
  {
    name: 'Free',
    nameEn: 'Free',
    price: 0,
    originalPrice: null,
    promotionPrice: null,
    features: [
      '100 AI conversations/month',
      '50 knowledge base items',
      'Basic analytics',
      'LINE auto-reply',
      'Community support',
    ],
  },
  {
    name: 'Starter',
    nameEn: 'Starter',
    price: 799,
    originalPrice: 799,
    promotionPrice: 599,
    popular: true,
    features: [
      '1,000 AI conversations/month',
      '200 knowledge base items',
      'Full analytics',
      'LINE auto-reply',
      'Auto handoff to human',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    nameEn: 'Pro',
    price: 1899,
    originalPrice: 1899,
    promotionPrice: 1399,
    features: [
      '5,000 AI conversations/month',
      '1,000 knowledge base items',
      'Advanced AI training',
      'Multi-channel integration',
      'Hallucination prevention',
      'Priority support',
    ],
  },
  {
    name: 'Business',
    nameEn: 'Business',
    price: 5299,
    originalPrice: 5299,
    promotionPrice: 3999,
    features: [
      '20,000 AI conversations/month',
      '5,000 knowledge base items',
      'Custom AI model',
      'Dedicated account manager',
      'API access',
      'SLA guarantee',
      '24/7 priority support',
    ],
  },
];

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pricing');
  const isZh = locale === 'zh-TW';
  const plans = isZh ? PLANS_ZH : PLANS_EN;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            CustomerAIPro
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              {locale === 'zh-TW' ? '方案與定價' : 'Pricing'}
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {locale === 'zh-TW' ? '登入' : 'Log in'}
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">{t('pageTitle')}</h1>
          <p className="mt-4 text-lg text-gray-600">{t('pageSubtitle')}</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.nameEn}
              className={`rounded-2xl border p-8 relative ${
                plan.popular
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-lg ring-2 ring-indigo-500/20'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  {t('badgePopular')}
                </div>
              )}
              {plan.promotionPrice != null && (
                <div
                  className="mb-3 inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-sm font-semibold text-white"
                >
                  {t('badgePromotion')}
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
              <div className="mt-6">
                {plan.promotionPrice != null ? (
                  <>
                    <div className="text-base text-gray-500 mb-1">
                      <span className="line-through">
                        NT${plan.originalPrice!.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-emerald-600">
                        NT${plan.promotionPrice.toLocaleString()}
                      </span>
                      <span className="text-gray-500">{t('perMonth')}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 italic">
                      {t('promotionNote', {
                        regularPrice: plan.price.toLocaleString(),
                      })}
                    </p>
                  </>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      NT${plan.price.toLocaleString()}
                    </span>
                    <span className="text-gray-500">{t('perMonth')}</span>
                  </div>
                )}
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <span className="text-indigo-600 shrink-0">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.price === 0 ? '/login?signup=true' : '/login?signup=true'}
                className={`mt-8 block w-full rounded-lg py-3 text-center font-semibold transition ${
                  plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {plan.price === 0 ? t('ctaFreeStart') : t('ctaTryNow')}
              </Link>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8 mt-auto">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500 sm:px-6">
          © {new Date().getFullYear()} CustomerAIPro.
        </div>
      </footer>
    </div>
  );
}
