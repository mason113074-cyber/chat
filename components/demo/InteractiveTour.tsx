'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const;

export function InteractiveTour() {
  const t = useTranslations('demo');
  const [step, setStep] = useState(0);
  const total = STEP_KEYS.length;
  const isFirst = step === 0;
  const isLast = step === total - 1;

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        {t('tour.title')}
      </h3>

      {/* Progress */}
      <div className="flex gap-2 mb-8" aria-label={`Step ${step + 1} of ${total}`}>
        {STEP_KEYS.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="bg-gray-50 rounded-xl p-8 mb-8 min-h-[200px]">
        <h4 className="text-xl font-semibold text-gray-900 mb-4">
          {t(`tour.${STEP_KEYS[step]}Title`)}
        </h4>
        <p className="text-gray-600">
          {t(`tour.${STEP_KEYS[step]}Desc`)}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={isFirst}
          className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          {t('tour.back')}
        </button>
        {isLast ? (
          <span className="px-6 py-3 rounded-lg font-medium text-blue-600 bg-blue-100">
            {t('tour.finish')}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
            className="px-6 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {t('tour.next')}
          </button>
        )}
      </div>
    </div>
  );
}
