import Link from 'next/link';

const highlights = [
  { title: '全通路接入', desc: '串接 LINE 官方帳號、網站與 CRM，統一管理所有客戶對話。' },
  { title: 'AI 智能回覆', desc: '使用 GPT-4o-mini 即時生成回覆，語氣與知識庫可自訂。' },
  { title: '資料安全', desc: '採用 Supabase 雙重權限控管，對話與聯絡人安全儲存。' },
];

const steps = [
  { label: 'Step 1', title: '連接品牌 LINE', desc: '三分鐘完成 Webhook 設定，讓訊息自動進入 CustomerAIPro。' },
  { label: 'Step 2', title: '訓練知識庫', desc: '匯入 FAQ、產品手冊與 CRM 資料，AI 立即上線。' },
  { label: 'Step 3', title: '啟用自動化', desc: '設定營業時間、自動交班與轉人工規則，24/7 不漏訊。' },
];

const stats = [
  { value: '24/7', label: '全年無休自動回覆' },
  { value: '99%', label: 'LINE Webhook 成功率' },
  { value: '2x', label: '提升客服處理效率' },
  { value: '10 min', label: '平均上線時間' },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 border-b border-white/10 bg-slate-950/70 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <span className="text-xl font-bold tracking-tight text-white">
              Customer<span className="text-indigo-400">AI</span>Pro
            </span>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/pricing"
                className="text-sm font-medium text-slate-200 hover:text-white"
              >
                方案與定價
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-500/30 hover:shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                登入
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">
          <section className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20 pt-14 sm:px-6 lg:flex-row lg:items-center lg:pt-20">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                AI 客服新體驗
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                  升級您的 LINE 客服
                  <span className="block text-indigo-300">用 AI 交付即時回覆</span>
                </h1>
                <p className="max-w-2xl text-lg text-slate-200/80">
                  CustomerAIPro 將 LINE、OpenAI、Supabase 一次串接，從自動回覆到聯絡人管理全自動。無需工程背景，十分鐘即可上線。
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/pricing"
                  className="rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  開始使用
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-white/20 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  登入後台
                </Link>
                <span className="text-sm text-slate-300/80">不需信用卡 · 隨時可取消</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                  >
                    <div>
                      <div className="text-lg font-semibold text-white">{item.value}</div>
                      <div className="text-slate-300/70">{item.label}</div>
                    </div>
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-100">
                      即刻啟用
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-indigo-500/20">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-indigo-100">
                        LINE 對話
                      </div>
                      <p className="text-sm text-slate-200">客戶：想了解最新方案？</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                      即時
                    </span>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400">AI 回覆示例</div>
                    <div className="space-y-2 text-sm text-slate-100">
                      <p>
                        ✅ 已為您比對最新方案：<span className="text-indigo-200">Growth 方案</span>
                      </p>
                      <p>・包含完整對話紀錄與 CRM 整合</p>
                      <p>・可設定自動轉人工與營業時間</p>
                      <p>需要我直接為您建立聯絡卡，並預約專人回電嗎？</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-400">CRM 同步</div>
                      <p className="mt-2 text-sm text-slate-100">聯絡人與對話自動寫入，內建標籤與搜尋。</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-400">任務自動化</div>
                      <p className="mt-2 text-sm text-slate-100">設定觸發條件、指派客服或推播通知。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-white/5 bg-slate-950/60">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    為什麼選擇我們
                  </p>
                  <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">專為 LINE 客服打造</h2>
                  <p className="mt-3 max-w-2xl text-base text-slate-200/80">
                    從第一則訊息到成交後關係維護，CustomerAIPro 讓您的客服團隊更快回覆、更懂客戶。
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 sm:inline-block"
                >
                  查看定價
                </Link>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/10 transition hover:-translate-y-1 hover:shadow-indigo-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                      <span className="text-lg">✨</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-200/80">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900 to-indigo-950/60 p-8 shadow-2xl shadow-indigo-500/20">
              <div className="grid gap-10 lg:grid-cols-[2fr,1.1fr]">
                <div className="space-y-6">
                  <div className="text-xs uppercase tracking-[0.2em] text-indigo-200/80">
                    10 分鐘完成部署
                  </div>
                  <h2 className="text-3xl font-bold text-white sm:text-4xl">三步驟上線您的 AI 客服</h2>
                  <p className="max-w-2xl text-base text-slate-200/80">
                    直覺的導引流程，協助團隊快速建立自動化回覆、交班規則與聯絡人同步，確保每次互動都被記錄與追蹤。
                  </p>
                  <div className="grid gap-4 md:grid-cols-3">
                    {steps.map((step) => (
                      <div
                        key={step.title}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-indigo-500/10"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-100">
                          {step.label}
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                        <p className="mt-2 text-sm text-slate-200/80">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">整合狀態</p>
                      <p className="text-lg font-semibold text-white">LINE、Supabase、OpenAI</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                      已連線
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-100">
                    <p className="font-semibold text-indigo-100">智慧路由</p>
                    <p className="mt-2 text-slate-200/80">
                      根據關鍵字自動轉派給專員，或觸發 CRM 任務，確保重要客戶被即時跟進。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-indigo-100">
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1">自動摘要</span>
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1">對話標籤</span>
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1">Webhook 事件</span>
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1">客服轉接</span>
                  </div>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    查看方案並開始
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-slate-950/80 py-8">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-300 sm:px-6">
            © {new Date().getFullYear()} CustomerAIPro · AI 智能客服平台。
          </div>
        </footer>
      </div>
    </div>
  );
}
