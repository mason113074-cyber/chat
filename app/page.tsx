import Link from 'next/link';
import type { Metadata } from 'next';
import { LandingNavbar } from './components/LandingNavbar';
import { LandingFooter } from './components/LandingFooter';
import { LandingFAQ } from './components/LandingFAQ';

export const metadata: Metadata = {
  title: 'CustomerAI Pro — AI 驅動的全方位客服平台',
  description: '讓 AI 幫你處理 80% 的客戶問題，24/7 全天候服務，10 分鐘完成設定。免費開始使用。',
};

const features = [
  {
    icon: '🤖',
    title: 'AI 智能客服',
    desc: '上傳產品資料、FAQ，AI 自動學習你的業務，精準回答客戶問題。',
  },
  {
    icon: '💬',
    title: '多渠道對話管理',
    desc: 'LINE、Facebook Messenger、網站 Widget 一站整合，所有對話集中管理。',
  },
  {
    icon: '📊',
    title: '數據洞察分析',
    desc: '即時追蹤解決率、回應時間、客戶滿意度，用數據優化客服品質。',
  },
  {
    icon: '👥',
    title: '智能聯絡人管理',
    desc: '自動建立客戶檔案、標記偏好、追蹤互動歷史，打造個人化體驗。',
  },
  {
    icon: '🧠',
    title: '知識庫管理',
    desc: '建立公司專屬知識庫，AI 從中學習，回答更精準、更一致。',
  },
  {
    icon: '⚙️',
    title: '可自訂 Widget',
    desc: '品牌色彩、歡迎訊息、AI 語氣全都可以自訂，完美融入你的網站。',
  },
];

const steps = [
  { step: 'Step 1', title: '建立帳號', desc: '10 分鐘設定' },
  { step: 'Step 2', title: '上傳知識庫', desc: '匯入 FAQ、產品資料' },
  { step: 'Step 3', title: '啟動 AI 客服', desc: '嵌入 Widget 到你的網站' },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/月',
    desc: '50 則對話、基本 AI',
    cta: '免費開始',
    href: '/login?signup=true',
    primary: false,
  },
  {
    name: 'Basic',
    price: '$29',
    period: '/月',
    desc: '500 則對話、進階 AI',
    cta: '開始免費試用',
    href: '/login?signup=true',
    primary: false,
  },
  {
    name: 'Pro',
    price: '$79',
    period: '/月',
    desc: '2000 則對話、多渠道',
    cta: '開始免費試用',
    href: '/login?signup=true',
    primary: true,
  },
  {
    name: 'Enterprise',
    price: '聯絡我們',
    period: '',
    desc: '無限對話、專屬支援',
    cta: '聯絡我們',
    href: 'mailto:support@customeraipro.com',
    primary: false,
  },
];

const stats = [
  { value: '500+', label: '商家信賴使用' },
  { value: '50,000+', label: '對話已處理' },
  { value: '95%', label: '客戶滿意度' },
  { value: '<30 秒', label: '平均回覆時間' },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      <LandingNavbar />

      <main className="relative z-10 pt-[72px]">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 md:pb-20 md:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              AI 驅動的全方位客服平台
            </h1>
            <p className="mt-6 text-lg text-slate-200/90 sm:text-xl">
              讓 AI 幫你處理 80% 的客戶問題，24/7 全天候服務，10 分鐘完成設定
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login?signup=true"
                className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                免費開始使用
              </Link>
              <Link
                href="/#features"
                className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                觀看示範
              </Link>
            </div>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              <span>🔒 不需要信用卡</span>
              <span>⚡ 10 分鐘設定</span>
              <span>🤖 AI 自動回覆</span>
            </p>
          </div>
        </section>

        {/* Social proof */}
        <section className="border-y border-white/5 bg-slate-900/40 py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-white sm:text-3xl">{s.value}</div>
                  <div className="mt-1 text-sm text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">功能</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">功能展示</h2>
            <p className="mt-3 max-w-2xl mx-auto text-base text-slate-200/80">
              從 AI 客服到數據分析，一站滿足客服團隊所需
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg transition hover:-translate-y-0.5 hover:border-white/20 hover:shadow-indigo-500/10"
              >
                <span className="text-2xl" aria-hidden>{f.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-200/80">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/5 bg-slate-900/30 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">使用流程</p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">How it Works</h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.step} className="text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-indigo-400/50 bg-indigo-500/20 text-lg font-bold text-indigo-200">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">定價</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">定價方案</h2>
            <p className="mt-3 text-base text-slate-200/80">選擇適合的方案，隨時可升級或取消</p>
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
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{plan.desc}</p>
                <Link
                  href={plan.href}
                  className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                    plan.primary
                      ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <LandingFAQ />

        {/* Final CTA */}
        <section className="border-t border-white/5 bg-gradient-to-b from-slate-900/50 to-slate-950 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              準備好提升你的客服體驗了嗎？
            </h2>
            <p className="mt-4 text-lg text-slate-200/80">
              加入 500+ 已在使用 CustomerAI Pro 的商家
            </p>
            <Link
              href="/login?signup=true"
              className="mt-8 inline-block rounded-xl bg-white px-10 py-4 text-base font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-indigo-500/30"
            >
              免費開始使用
            </Link>
            <p className="mt-4 text-sm text-slate-500">不需要信用卡，隨時可取消</p>
          </div>
        </section>

        <LandingFooter />
      </main>
    </div>
  );
}
