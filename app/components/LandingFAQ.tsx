'use client';

import { useState } from 'react';

const faqData = [
  {
    question: 'CustomerAI Pro 是什麼？',
    answer: 'CustomerAI Pro 是 AI 驅動的全方位客服平台，提供 AI 智能客服、多渠道對話管理、知識庫管理、聯絡人管理與數據分析，讓 AI 幫你處理大部分客戶問題，24/7 全天候服務。',
  },
  {
    question: '支援哪些溝通渠道？',
    answer: '目前支援 LINE、Facebook Messenger、網站 Widget 等渠道，所有對話可在一站後台集中管理。',
  },
  {
    question: 'AI 的回答準確嗎？',
    answer: '我們使用先進的 AI 模型，並透過您上傳的知識庫與 FAQ 進行訓練，回答準確且可自訂語氣與風格，符合您的品牌與業務需求。',
  },
  {
    question: '可以免費試用嗎？',
    answer: '可以。我們提供免費方案，不需信用卡即可註冊使用。付費方案也提供免費試用期，可隨時取消。',
  },
  {
    question: '資料安全嗎？',
    answer: '我們採用 SSL/TLS 加密傳輸、密碼加密儲存，並使用 Row Level Security 隔離租戶資料。詳見隱私政策。',
  },
  {
    question: '如何取消訂閱？',
    answer: '您可於後台「方案與計費」中隨時取消訂閱。取消後仍可使用至當期結束，不會再扣款。',
  },
];

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">常見問題</p>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">常見問題</h2>
        <p className="mt-3 text-base text-slate-200/80">快速了解我們的服務與功能</p>
      </div>
      <div className="mx-auto max-w-3xl space-y-3">
        {faqData.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="font-semibold text-white">{item.question}</span>
              <span className="text-indigo-200 text-xl">{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-sm text-slate-200/80">{item.answer}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
