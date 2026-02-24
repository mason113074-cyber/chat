'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BookOpen,
  BarChart3,
  Zap,
  Megaphone,
  Settings,
  CreditCard,
  TestTube,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { SignOutButton } from './SignOutButton';

const SIDEBAR_STORAGE_KEY = 'dashboard-sidebar-expanded';

interface SidebarProps {
  userEmail: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const MAIN_NAV = [
  { href: '/dashboard', labelKey: 'overview' as const, Icon: LayoutDashboard },
  { href: '/dashboard/conversations', labelKey: 'conversations' as const, Icon: MessageSquare, countsKey: 'conversations' as const },
  { href: '/dashboard/contacts', labelKey: 'contacts' as const, Icon: Users },
  { href: '/dashboard/knowledge-base', labelKey: 'knowledgeBase' as const, Icon: BookOpen },
  { href: '/dashboard/analytics', labelKey: 'analytics' as const, Icon: BarChart3 },
  { href: '/dashboard/automations', labelKey: 'automations' as const, Icon: Zap },
  { href: '/dashboard/campaigns', labelKey: 'campaigns' as const, Icon: Megaphone },
  { href: '/dashboard/settings', labelKey: 'settings' as const, Icon: Settings },
] as const;

const BOTTOM_NAV = [
  { href: '/dashboard/billing', labelKey: 'billing' as const, Icon: CreditCard },
  { href: '/dashboard/system-test', labelKey: 'systemTest' as const, Icon: TestTube },
] as const;

export function Sidebar({ userEmail, expanded: controlledExpanded, onExpandedChange }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const [internalExpanded, setInternalExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored !== null ? stored === 'true' : true;
  });
  const expanded = controlledExpanded ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [needsHumanCount, setNeedsHumanCount] = useState(0);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const fn = async () => {
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
    fn();
    const interval = setInterval(fn, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (typeof window !== 'undefined') localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const showLabels = expanded || mobileOpen;

  const linkClassName = (href: string) =>
    `flex items-center rounded-lg text-sm font-medium transition-colors ${
      showLabels ? 'gap-3 px-3 py-2.5' : 'gap-0 justify-center px-0 py-2.5'
    } ${
      isActive(href)
        ? 'bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600'
        : 'text-gray-700 hover:bg-gray-100 border-l-2 border-transparent'
    }`;

  const navContent = (
    <>
      <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
        <nav className="p-3 space-y-0.5" aria-label={t('overview')}>
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={linkClassName(item.href)}
              title={!showLabels ? t(item.labelKey) : undefined}
            >
              <span className="relative shrink-0 flex items-center">
                <item.Icon className="h-5 w-5" aria-hidden />
                {'countsKey' in item && item.countsKey === 'conversations' && needsHumanCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[1rem] h-4 px-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {needsHumanCount > 99 ? '99+' : needsHumanCount}
                  </span>
                )}
              </span>
              {showLabels && (
                <span className="flex-1 truncate">{t(item.labelKey)}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
        <nav className="p-3 space-y-0.5 border-t border-gray-200">
          {BOTTOM_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={linkClassName(item.href)}
              title={!showLabels ? t(item.labelKey) : undefined}
            >
              <item.Icon className="h-5 w-5 shrink-0" aria-hidden />
              {showLabels && <span className="truncate">{t(item.labelKey)}</span>}
            </Link>
          ))}
        </nav>
        {showLabels && (
          <div className="p-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 truncate px-3" title={userEmail}>{userEmail}</p>
            <div className="mt-2 px-3">
              <SignOutButton />
            </div>
          </div>
        )}
      </div>
      {!showLabels && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center border-t border-gray-200 pt-3">
          <SignOutButton />
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <span className="text-lg font-bold text-indigo-600">CustomerAI Pro</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label={t('openMenu')}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar - Desktop: fixed left; Mobile: drawer from left */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
          flex flex-col transition-[width,transform] duration-200 ease-out
          lg:translate-x-0
          ${expanded ? 'w-[240px]' : 'w-16 lg:w-16'}
          ${mobileOpen ? 'translate-x-0 w-[240px]' : '-translate-x-full lg:block'}
        `}
      >
        <div className="flex flex-col h-full pt-14 lg:pt-0">
          {/* Logo + collapse toggle */}
          <div className={`flex items-center border-b border-gray-200 shrink-0 h-14 lg:h-[56px] ${expanded ? 'justify-between p-4' : 'justify-center p-2'}`}>
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`font-bold text-indigo-600 truncate ${expanded ? 'text-lg' : 'lg:hidden'}`}
            >
              CustomerAI Pro
            </Link>
            {expanded && (
              <button
                type="button"
                onClick={toggleExpand}
                className="hidden lg:flex p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label={tCommon('collapse')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {!expanded && (
              <button
                type="button"
                onClick={toggleExpand}
                className="hidden lg:flex p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 w-full justify-center"
                aria-label="展開側邊欄"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {navContent}
        </div>
      </aside>
    </>
  );
}
