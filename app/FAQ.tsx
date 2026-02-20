'use client';

import { useState } from 'react';

type FAQItem = {
  question: string;
  answer: string;
};

const faqData: FAQItem[] = [
  {
    question: '需要會寫程式嗎？',
    answer: '不需要，5 分鐘即可設定完成。我們提供直覺的圖形介面，只需按照步驟完成 LINE Bot 串接，即可開始使用 AI 客服功能。',
  },
  {
    question: '支援哪些通訊平台？',
    answer: '目前支援 LINE 官方帳號，未來將擴展更多平台如 Facebook Messenger、Instagram Direct 等社群平台。',
  },
  {
    question: '費用如何計算？',
    answer: '依方案月付，可隨時升降級。我們提供彈性的訂閱方案，從 Starter 到 Business 不等，依據您的使用量與功能需求選擇最適合的方案。',
  },
  {
    question: 'AI 回覆準確嗎？',
    answer: '使用 OpenAI GPT 技術，準確率高，且可自訂回覆內容。您可以上傳知識庫、調整回覆風格，讓 AI 更符合您的品牌語氣與專業需求。',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
          常見問題
        </p>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          關於 CustomerAI Pro
        </h2>
        <p className="mt-3 text-base text-slate-200/80">
          快速了解我們的服務與功能
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-3">
        {faqData.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="font-semibold text-white">{item.question}</span>
              <span className="text-indigo-200 text-xl">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-sm text-slate-200/80">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
