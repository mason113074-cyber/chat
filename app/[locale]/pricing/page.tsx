import { Link } from '@/i18n/navigation';

const plans = [
  {
    name: 'Starter',
    price: '1,500',
    period: '月',
    description: '適合剛開始使用 AI 客服的團隊',
    features: ['LINE 單一頻道', '基本對話紀錄', 'Email 支援'],
    cta: '開始使用',
    href: '/login',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '3,000',
    period: '月',
    description: '成長中的團隊，需要更多聯絡人與紀錄',
    features: ['LINE 單一頻道', '完整對話與聯絡人', '優先支援', '進階報表'],
    cta: '開始使用',
    href: '/login',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '6,000',
    period: '月',
    description: '企業級需求，多頻道與 API',
    features: ['多 LINE 頻道', '完整 CRM 與訂單', 'API 整合', '專屬客服'],
    cta: '開始使用',
    href: '/login',
    highlighted: false,
  },
];

export default function PricingPage() {
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
              方案與定價
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              登入
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">方案與定價</h1>
          <p className="mt-4 text-lg text-gray-600">
            選擇適合您團隊的方案，隨時可升級或調整。
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 ${
                plan.highlighted
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-lg'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
              <p className="mt-2 text-gray-600">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  NT${plan.price}
                </span>
                <span className="text-gray-500">/ {plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-gray-700">
                    <span className="text-indigo-600">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 block w-full rounded-lg py-3 text-center font-semibold ${
                  plan.highlighted
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {plan.cta}
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
