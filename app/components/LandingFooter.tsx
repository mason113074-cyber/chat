import { Link } from '@/i18n/navigation';

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left */}
          <div>
            <p className="text-lg font-bold tracking-tight text-white">
              CustomerAI Pro
            </p>
            <p className="mt-2 text-sm text-slate-400">
              AI 驅動的全方位客服平台
            </p>
            <p className="mt-4 text-sm text-slate-500">
              © 2026 CustomerAI Pro
            </p>
          </div>

          {/* Center */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              產品
            </h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/#features" className="text-sm text-slate-300 hover:text-white">功能</Link></li>
              <li><Link href="/#pricing" className="text-sm text-slate-300 hover:text-white">定價</Link></li>
              <li><Link href="/#faq" className="text-sm text-slate-300 hover:text-white">常見問題</Link></li>
            </ul>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-white">公司</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/#about" className="text-sm text-slate-300 hover:text-white">關於我們</Link></li>
              <li><a href="mailto:support@customeraipro.com" className="text-sm text-slate-300 hover:text-white">聯絡我們</a></li>
            </ul>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-white">法律</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/terms" className="text-sm text-slate-300 hover:text-white">服務條款</Link></li>
              <li><Link href="/privacy" className="text-sm text-slate-300 hover:text-white">隱私政策</Link></li>
            </ul>
          </div>

          {/* Right - placeholder social */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              社群
            </h3>
            <div className="mt-4 flex gap-4">
              <span className="text-sm text-slate-500" title="即將推出">
                社群連結即將推出
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
