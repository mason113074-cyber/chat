import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-xl font-bold text-indigo-600">CustomerAIPro</span>
          <div className="flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              方案與定價
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              登入
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              AI 智能客服平台
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              整合 LINE、OpenAI 與 CRM，讓每個客戶都獲得即時、專業的 AI 客服體驗。
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/pricing"
                className="rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                開始使用
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                登入後台
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 bg-gray-50/50 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              為什麼選擇 CustomerAIPro
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
              一站式客服與 CRM 解決方案，專為台灣中小企業設計。
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-2xl font-semibold text-indigo-600">LINE 整合</div>
                <p className="mt-2 text-gray-600">
                  客戶在 LINE 發問，AI 即時回覆，無需額外 App。
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-2xl font-semibold text-indigo-600">GPT 驅動</div>
                <p className="mt-2 text-gray-600">
                  使用 OpenAI 模型，回答自然、專業，可依產業調整。
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-2xl font-semibold text-indigo-600">CRM 與紀錄</div>
                <p className="mt-2 text-gray-600">
                  聯絡人、對話紀錄、訂單集中管理，數據一目了然。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              方案預覽
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
              依用量選擇方案，月付即可開始。
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                href="/pricing"
                className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700"
              >
                查看完整定價
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500 sm:px-6">
          © {new Date().getFullYear()} CustomerAIPro. AI 智能客服平台。
        </div>
      </footer>
    </div>
  );
}
