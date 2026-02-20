'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useToast } from '@/components/Toast';

interface OnboardingStepProps {
  onNext: () => void;
  onSkip?: () => void;
}

const STEP_IDS = ['welcome', 'lineSetup', 'knowledgeBase', 'testChat', 'complete'] as const;

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function WelcomeStep({ onNext }: OnboardingStepProps) {
  const t = useTranslations('onboarding.welcome');
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3">{t('greeting')}</h3>
        <p className="text-blue-800 mb-4">{t('intro')}</p>
        <ul className="space-y-2">
          {(['step1', 'step2', 'step3', 'step4'] as const).map((key) => (
            <li key={key} className="flex items-start gap-3">
              <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-blue-900">{t(`steps.${key}`)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">⏱ {t('timeEstimate')}</p>
      </div>
    </div>
  );
}

function LineSetupStep({ onSkip }: OnboardingStepProps) {
  const t = useTranslations('onboarding.lineSetup');
  const [showGuide, setShowGuide] = useState(false);
  return (
    <div className="space-y-6">
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
        Video: LINE setup tutorial (add your video URL)
      </div>
      <button
        type="button"
        onClick={() => setShowGuide(!showGuide)}
        className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-blue-900">📖 {t('detailedGuide')}</span>
          <span className="text-blue-600">{showGuide ? '▲' : '▼'}</span>
        </div>
      </button>
      {showGuide && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <ol className="space-y-4 list-decimal list-inside">
            {(['step1', 'step2', 'step3', 'step4', 'step5'] as const).map((key) => (
              <li key={key} className="text-gray-700">
                <span className="font-medium">{t(`guide.${key}.title`)}</span>
                <p className="ml-6 mt-1 text-sm text-gray-600">{t(`guide.${key}.description`)}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="flex gap-4">
        <a
          href="https://developers.line.biz/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center text-sm font-medium"
        >
          {t('openLineDevelopers')} →
        </a>
        <a
          href="/dashboard/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
        >
          {t('goToSettings')} →
        </a>
      </div>
      {onSkip && (
        <button type="button" onClick={onSkip} className="w-full text-sm text-gray-500 hover:text-gray-700 underline">
          {t('skipForNow')}
        </button>
      )}
    </div>
  );
}

function KnowledgeBaseStep({ onSkip }: OnboardingStepProps) {
  const t = useTranslations('onboarding.knowledgeBase');
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {(['faq', 'productInfo', 'policies'] as const).map((template) => (
          <div key={template} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
            <div className="text-4xl mb-2">📄</div>
            <h4 className="font-medium text-gray-900 mb-1">{t(`templates.${template}.title`)}</h4>
            <p className="text-sm text-gray-600 mb-3">{t(`templates.${template}.description`)}</p>
            <span className="text-sm text-blue-600 font-medium">{t('downloadTemplate')} →</span>
          </div>
        ))}
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h4 className="font-medium text-purple-900 mb-3">{t('uploadInstructions.title')}</h4>
        <ul className="space-y-2">
          {(['format', 'size', 'content'] as const).map((key) => (
            <li key={key} className="flex items-start gap-2 text-sm text-purple-800">
              <span>•</span>
              <span>{t(`uploadInstructions.${key}`)}</span>
            </li>
          ))}
        </ul>
      </div>
      <a
        href="/dashboard/knowledge-base"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
      >
        {t('goToKnowledgeBase')} →
      </a>
      {onSkip && (
        <button type="button" onClick={onSkip} className="w-full text-sm text-gray-500 hover:text-gray-700 underline">
          {t('skipForNow')}
        </button>
      )}
    </div>
  );
}

function TestChatStep({ onNext }: OnboardingStepProps) {
  const t = useTranslations('onboarding.testChat');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const examples = t.raw('suggestions.examples') as string[];

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      const reply = data.content ?? data.error ?? t('error');
      setMessages((prev) => [...prev, { role: 'ai', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: t('error') }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">{t('suggestions.title')}</h4>
        <div className="flex flex-wrap gap-2">
          {examples.map((example: string, index: number) => (
            <button
              key={index}
              type="button"
              onClick={() => setInput(example)}
              className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-12">{t('emptyState')}</div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t('inputPlaceholder')}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('send')}
        </button>
      </div>
    </div>
  );
}

function CompleteStep() {
  const t = useTranslations('onboarding.complete');
  return (
    <div className="space-y-6 text-center">
      <div className="text-6xl">🎉</div>
      <h3 className="text-2xl font-bold text-gray-900">{t('congratulations')}</h3>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('message')}</p>
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        {(['customize', 'analytics', 'invite'] as const).map((action) => (
          <div key={action} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
            <div className="text-2xl font-semibold text-gray-700 mb-2">{t(`nextSteps.${action}.icon`)}</div>
            <h4 className="font-medium text-gray-900 mb-2">{t(`nextSteps.${action}.title`)}</h4>
            <p className="text-sm text-gray-600">{t(`nextSteps.${action}.description`)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const steps = STEP_IDS.length;
  const isLastStep = currentStep === steps - 1;

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/status');
      if (res.ok) {
        const data = await res.json();
        if (data.onboarding_completed) {
          router.replace('/dashboard');
          return;
        }
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleNext = () => {
    if (currentStep < steps - 1) setCurrentStep((s) => s + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.show(data.error ?? 'Save failed', 'error');
        return;
      }
      toast.show(t('complete.title'), 'success');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Onboarding complete error:', err);
      toast.show('Request failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">{t('progress', { current: 1, total: steps })}</p>
      </div>
    );
  }

  const stepTitles: Record<(typeof STEP_IDS)[number], string> = {
    welcome: t('welcome.title'),
    lineSetup: t('lineSetup.title'),
    knowledgeBase: t('knowledgeBase.title'),
    testChat: t('testChat.title'),
    complete: t('complete.title'),
  };

  const StepContent = {
    welcome: WelcomeStep,
    lineSetup: LineSetupStep,
    knowledgeBase: KnowledgeBaseStep,
    testChat: TestChatStep,
    complete: CompleteStep,
  }[STEP_IDS[currentStep]];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2 mb-4">
            {STEP_IDS.map((_, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => index <= currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      index === currentStep ? 'bg-blue-600 text-white scale-110 shadow-lg' : ''
                    } ${index < currentStep ? 'bg-green-500 text-white' : ''} ${
                      index > currentStep ? 'bg-gray-200 text-gray-400' : ''
                    }`}
                  >
                    {index < currentStep ? <CheckIcon className="w-6 h-6" /> : <span>{index + 1}</span>}
                  </button>
                  <span className="text-xs mt-2 text-gray-600 text-center hidden md:block truncate max-w-[80px]">
                    {stepTitles[STEP_IDS[index]]}
                  </span>
                </div>
                {index < steps - 1 && (
                  <div className="flex-1 h-1 mx-2 bg-gray-200 rounded">
                    <div
                      className={`h-full rounded transition-all ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`}
                      style={{ width: index < currentStep ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">
            {t('progress', { current: currentStep + 1, total: steps })}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{stepTitles[STEP_IDS[currentStep]]}</h2>
            <p className="text-lg text-gray-600">
              {t(`${STEP_IDS[currentStep]}.description`)}
            </p>
          </div>
          <StepContent
            onNext={handleNext}
            onSkip={currentStep < steps - 1 ? handleNext : undefined}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            {t('navigation.previous')}
          </button>
          <button
            type="button"
            onClick={isLastStep ? handleComplete : handleNext}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLastStep ? t('navigation.finish') : t('navigation.next')}
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
