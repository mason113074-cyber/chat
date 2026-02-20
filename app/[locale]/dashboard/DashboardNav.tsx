'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { SignOutButton } from './SignOutButton';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

const NAV_ITEMS = [
  { href: '/dashboard', labelKey: 'overview' as const },
  { href: '/dashboard/conversations', labelKey: 'conversations' as const, countsKey: 'conversations' as const },
  { href: '/dashboard/contacts', labelKey: 'contacts' as const },
  { href: '/dashboard/billing', labelKey: 'billing' as const },
  { href: '/dashboard/analytics', labelKey: 'analytics' as const },
  { href: '/dashboard/knowledge-base', labelKey: 'knowledgeBase' as const },
  { href: '/dashboard/settings', labelKey: 'settings' as const },
  { href: '/dashboard/system-test', labelKey: 'systemTest' as const },
] as const;

export function DashboardNav({
  userEmail,
  onOpenSearch,
}: {
  userEmail: string;
  onOpenSearch?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [needsHumanCount, setNeedsHumanCount] = useState(0);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/conversations/counts');
        if (res.ok) {
          const json = await res.json();
          const n = Number(json.needs_human) || 0;
          if (n !== prevCountRef.current) {
            prevCountRef.current = n;
            setNeedsHumanCount(n);
          }
        }
      } catch {
        // ignore
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const linkClass = (href: string) => {
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return isActive
      ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
      : 'text-gray-600 hover:text-gray-900 font-medium';
  };

  return (
    <>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
          CustomerAI Pro
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
            >
              <span>🔍</span>
              <span>{tCommon('search')}</span>
              <span className="text-xs text-gray-400 font-normal">⌘K</span>
            </button>
          )}
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${linkClass(item.href)} relative inline-flex items-center gap-1`}
            >
              {t(item.labelKey)}
              {'countsKey' in item && item.countsKey === 'conversations' && needsHumanCount > 0 && (
                <span
                  key={needsHumanCount}
                  className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-xs font-bold text-white animate-badge-pop"
                >
                  {needsHumanCount > 99 ? '99+' : needsHumanCount}
                </span>
              )}
            </Link>
          ))}
          <LocaleSwitcher className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900" />
          <span className="text-sm text-gray-500">{userEmail}</span>
          <SignOutButton />
        </nav>

        <div className="md:hidden flex items-center gap-1">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              aria-label={tCommon('search')}
            >
              <span className="text-xl">🔍</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            aria-label={t('openMenu')}
          >
            <span className="text-xl">☰</span>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-64 max-w-[85vw] border-l border-gray-200 bg-white shadow-xl transition-transform duration-200 ease-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-1 p-4 pt-16">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`rounded-lg px-4 py-3 ${linkClass(item.href)} relative inline-flex items-center gap-2`}
            >
              {t(item.labelKey)}
              {'countsKey' in item && item.countsKey === 'conversations' && needsHumanCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-xs font-bold text-white">
                  {needsHumanCount > 99 ? '99+' : needsHumanCount}
                </span>
              )}
            </Link>
          ))}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="px-4 text-sm text-gray-500 truncate">{userEmail}</p>
            <div className="mt-2 px-4">
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
