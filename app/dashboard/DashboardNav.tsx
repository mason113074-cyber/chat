'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SignOutButton } from './SignOutButton';

const NAV_ITEMS = [
  { href: '/dashboard', label: '總覽' },
  { href: '/dashboard/conversations', label: '對話紀錄' },
  { href: '/dashboard/contacts', label: '客戶聯絡人' },
  { href: '/dashboard/billing', label: '方案與計費' },
  { href: '/dashboard/analytics', label: '數據分析' },
  { href: '/dashboard/knowledge-base', label: '知識庫' },
  { href: '/dashboard/settings', label: '設定' },
] as const;

export function DashboardNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
          CustomerAIPro
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
          <span className="text-sm text-gray-500">{userEmail}</span>
          <SignOutButton />
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label="開啟選單"
        >
          <span className="text-xl">☰</span>
        </button>
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
              className={`rounded-lg px-4 py-3 ${linkClass(item.href)}`}
            >
              {item.label}
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
