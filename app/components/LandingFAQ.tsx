'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const FAQ_KEYS = [
  { q: 'faq1Question' as const, a: 'faq1Answer' as const },
  { q: 'faq2Question' as const, a: 'faq2Answer' as const },
  { q: 'faq3Question' as const, a: 'faq3Answer' as const },
  { q: 'faq4Question' as const, a: 'faq4Answer' as const },
  { q: 'faq5Question' as const, a: 'faq5Answer' as const },
  { q: 'faq6Question' as const, a: 'faq6Answer' as const },
];

export function LandingFAQ() {
  const t = useTranslations('landing');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{t('faqSectionLabel')}</p>
        <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{t('faqTitle')}</h2>
        <p className="mt-3 text-base text-slate-200/80">{t('faqSubtitle')}</p>
      </div>
      <div className="mx-auto max-w-3xl space-y-3">
        {FAQ_KEYS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                aria-expanded={isOpen ? 'true' : 'false'}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
              >
                <span className="font-semibold text-white">{t(item.q)}</span>
                <span className="text-indigo-200 text-xl shrink-0 ml-2" aria-hidden>{isOpen ? '−' : '+'}</span>
              </button>
              <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                hidden={!isOpen}
                className={isOpen ? 'block' : 'hidden'}
              >
                <div className="px-6 pb-4 text-sm text-slate-200/80">{t(item.a)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
