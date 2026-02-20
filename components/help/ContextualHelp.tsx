'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface ContextualHelpProps {
  topic: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function ContextualHelp({ topic, position = 'bottom' }: ContextualHelpProps) {
  const t = useTranslations(`help.contextual.${topic}`);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const positionClasses = {
    bottom: 'top-full mt-2 left-0',
    top: 'bottom-full mb-2 left-0',
    right: 'left-full ml-2 top-0',
    left: 'right-full mr-2 top-0',
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded"
        aria-label="Help"
        aria-haspopup="dialog"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 ${positionClasses[position]}`}
          role="dialog"
          aria-label={t('title')}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-gray-900">{t('title')}</h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">{t('description')}</p>
          <Link
            href={t('link')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            onClick={() => setIsOpen(false)}
          >
            {t('linkText')} →
          </Link>
        </div>
      )}
    </div>
  );
}
