import Link from 'next/link';
import { LandingNavbar } from '../components/LandingNavbar';
import { LandingFooter } from '../components/LandingFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '服務條款 — Terms of Service | CustomerAI Pro',
  description: 'CustomerAI Pro 服務條款',
};

export default function TermsPage() {
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
            服務條款 — Terms of Service
          </h1>
          <p className="mt-2 text-sm text-gray-500">最後更新日期：2026 年 2 月 18 日</p>

          <div className="prose prose-gray mt-10 max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700">
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">1. 服務說明</h2>
              <p>
                CustomerAI Pro（以下稱「本服務」）是由本公司提供的 AI 驅動客服自動化 SaaS 平台。本服務提供 AI 聊天機器人、對話管理、知識庫管理、聯絡人管理及數據分析等功能。
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">2. 帳號與註冊</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>您必須年滿 18 歲或具有法定行為能力方可註冊帳號。</li>
                <li>您有責任維護帳號安全，不得將帳號分享給他人。</li>
                <li>您提供的註冊資訊必須真實、準確且完整。</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">3. 使用規範</h2>
              <p>使用本服務時，您同意不得：</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>違反任何適用法律或法規</li>
                <li>發送垃圾郵件或未經授權的商業訊息</li>
                <li>上傳含有惡意軟體或有害內容</li>
                <li>試圖未經授權存取本服務的系統或資料</li>
                <li>使用本服務進行任何非法活動</li>
                <li>干擾或破壞本服務的正常運作</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">4. 訂閱與付款</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>本服務提供免費方案及多種付費方案。</li>
                <li>付費方案按月計費，到期自動續訂。</li>
                <li>您可隨時取消訂閱，取消後仍可使用至當期結束。</li>
                <li>所有費用以美元（USD）計價。</li>
                <li>退款政策：付款後 14 天內可申請全額退款。</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">5. 智慧財產權</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>本服務及其所有相關內容、功能和技術均為本公司之智慧財產。</li>
                <li>您上傳至本服務的內容，其智慧財產權仍歸您所有。</li>
                <li>您授權本公司在提供服務所必需的範圍內使用您上傳的內容。</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">6. 資料處理</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>我們如何收集、使用和保護您的資料，請參閱我們的隱私政策（<Link href="/privacy" className="text-indigo-600 hover:underline">/privacy</Link>）。</li>
                <li>您上傳的知識庫內容和對話資料，我們僅用於為您提供服務。</li>
                <li>您可以隨時匯出或刪除您的資料。</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">7. 服務可用性</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>我們致力於提供 99.9% 的服務可用性，但不保證服務永不中斷。</li>
                <li>我們保留因維護、更新或安全原因暫時中斷服務的權利。</li>
                <li>對於因不可抗力造成的服務中斷，我們不承擔責任。</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">8. 責任限制</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>在法律允許的最大範圍內，本公司對因使用或無法使用本服務而造成的任何間接損害不承擔責任。</li>
                <li>本公司的總責任不超過您在過去 12 個月內支付的服務費用總額。</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">9. 條款修改</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>我們保留隨時修改本條款的權利。</li>
                <li>重大變更將在生效前 30 天通知您。</li>
                <li>繼續使用本服務即表示您接受修改後的條款。</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900">10. 適用法律</h2>
              <p>本條款受中華民國（台灣）法律管轄。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">聯絡我們</h2>
              <p>如有任何問題，請聯絡：<a href="mailto:support@customeraipro.com" className="text-indigo-600 hover:underline">support@customeraipro.com</a></p>
            </section>
          </div>
        </div>
        <LandingFooter />
      </main>
    </div>
  );
}
