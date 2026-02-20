'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

export function LandingNavbar() {
  const t = useTranslations('nav');
  const tLanding = useTranslations('landing');
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/#features' as const, labelKey: 'features' as const },
    { href: '/demo' as const, labelKey: 'demo' as const },
    { href: '/help' as const, labelKey: 'help' as const },
    { href: '/#pricing' as const, labelKey: 'pricing' as const },
    { href: '/#faq' as const, labelKey: 'faq' as const },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-white transition hover:text-slate-200"
        >
          CustomerAI Pro
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-200 hover:text-white"
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <LocaleSwitcher />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-200 hover:text-white"
            >
              {tLanding('ctaLogin')}
            </Link>
            <Link
              href="/login?signup=true"
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-400 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              {tLanding('ctaFreeStartShort')}
            </Link>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-200 hover:bg-white/10 hover:text-white md:hidden"
          aria-label={t('openMenu')}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="sr-only">{t('openMenu')}</span>
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <LocaleSwitcher />
            </div>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              {tLanding('ctaLogin')}
            </Link>
            <Link
              href="/login?signup=true"
              className="rounded-xl bg-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setMenuOpen(false)}
            >
              {tLanding('ctaFreeStartShort')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
