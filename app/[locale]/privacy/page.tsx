import { Link } from '@/i18n/navigation';
import { LandingNavbar } from '@/app/components/LandingNavbar';
import { LandingFooter } from '@/app/components/LandingFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隱私政策 — Privacy Policy | CustomerAI Pro',
  description: 'CustomerAI Pro 隱私政策',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNavbar />
      <main className="relative z-10 pt-[72px]">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← 返回首頁
          </Link>

          <h1 className="mt-8 text-3xl font-bold text-gray-900">
            隱私政策 — Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500">最後更新日期：2026 年 2 月 18 日</p>

          <div className="prose prose-gray mt-10 max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700">
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">1. 概述</h2>
              <p>
                CustomerAI Pro（以下稱「本服務」）重視您的隱私。本隱私政策說明我們如何收集、使用、儲存和保護您的個人資料。
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">2. 我們收集的資料</h2>
              <h3 className="mt-4 text-lg font-medium text-gray-800">2.1 您主動提供的資料</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>帳號資訊：電子郵件、密碼（加密儲存）、姓名</li>
                <li>商家資訊：店名、產業類別、網站網址</li>
                <li>付款資訊：由第三方支付處理商（Lemon Squeezy）處理，我們不直接儲存信用卡資訊</li>
              </ul>
              <h3 className="mt-4 text-lg font-medium text-gray-800">2.2 自動收集的資料</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>使用數據：登入時間、功能使用頻率、頁面瀏覽紀錄</li>
                <li>裝置資訊：瀏覽器類型、作業系統、IP 位址</li>
                <li>Cookie 與類似技術：用於維持登入狀態和改善使用體驗</li>
              </ul>
              <h3 className="mt-4 text-lg font-medium text-gray-800">2.3 您的客戶資料</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>對話內容：您的客戶透過 Widget 發送的訊息</li>
                <li>聯絡人資料：您建立的客戶聯絡資訊</li>
                <li>知識庫內容：您上傳的 FAQ、產品資料等</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">3. 資料使用目的</h2>
              <p>我們使用您的資料用於：</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>提供、維護和改善本服務</li>
                <li>處理帳號註冊和驗證</li>
                <li>處理付款和帳單</li>
                <li>提供 AI 客服功能（使用您的知識庫回答客戶問題）</li>
                <li>發送服務通知和更新</li>
                <li>分析使用趨勢以改善產品</li>
                <li>防止濫用和確保安全</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">4. 資料分享</h2>
              <p>我們不會出售您的個人資料。我們僅在以下情況分享您的資料：</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>第三方服務供應商：Supabase（資料庫）、OpenAI（AI 模型）、Vercel（託管）、Lemon Squeezy（支付）</li>
                <li>法律要求：回應合法的法律程序或政府要求</li>
                <li>商業轉讓：如公司合併或收購</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">5. 資料安全</h2>
              <p>我們採取以下安全措施：</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>所有資料傳輸使用 SSL/TLS 加密</li>
                <li>密碼使用 bcrypt 加密儲存</li>
                <li>資料庫使用 Row Level Security (RLS) 隔離租戶資料</li>
                <li>定期進行安全審查</li>
                <li>員工遵守嚴格的資料存取政策</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">6. 資料保留</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>帳號資料：在您的帳號有效期間保留，刪除帳號後 30 天內清除。</li>
                <li>對話資料：根據您的方案保留 90 天至無限期。</li>
                <li>付款記錄：依法保留 7 年。</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">7. 您的權利</h2>
              <p>您擁有以下權利：</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>存取權：查看我們持有的您的資料</li>
                <li>更正權：更新不正確的個人資料</li>
                <li>刪除權：要求刪除您的帳號和資料</li>
                <li>匯出權：匯出您的資料（JSON 格式）</li>
                <li>撤回同意權：隨時撤回對資料處理的同意</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">8. Cookie 政策</h2>
              <p>我們使用以下類型的 Cookie：</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>必要 Cookie：維持登入狀態和安全（無法停用）</li>
                <li>分析 Cookie：了解使用者如何使用本服務（可選擇退出）</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">9. 兒童隱私</h2>
              <p>本服務不面向 18 歲以下的未成年人。我們不會故意收集未成年人的資料。</p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">10. 國際資料傳輸</h2>
              <p>
                您的資料可能會傳輸至並儲存在台灣以外的國家（如美國），因為我們的服務供應商可能位於其他國家。我們會確保適當的資料保護措施。
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">11. 政策更新</h2>
              <p>我們可能會不定期更新本隱私政策。重大變更將在生效前 30 天通知您。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">12. 聯絡我們</h2>
              <p>如有隱私相關問題，請聯絡：</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>電子郵件：<a href="mailto:privacy@customeraipro.com" className="text-indigo-600 hover:underline">privacy@customeraipro.com</a></li>
                <li>地址：台灣基隆市</li>
              </ul>
            </section>
          </div>
        </div>
        <LandingFooter />
      </main>
    </div>
  );
}
