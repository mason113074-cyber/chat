'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50 flex flex-col items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>
      <div className="relative z-10 text-center">
        <p className="text-8xl font-bold text-indigo-400/90 sm:text-9xl">404</p>
        <h1 className="mt-4 text-xl font-semibold text-white sm:text-2xl">{t('title')}</h1>
        <p className="mt-2 text-slate-400">{t('description')}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {t('backToHome')}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {t('goToDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
