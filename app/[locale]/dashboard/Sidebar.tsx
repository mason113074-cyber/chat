'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SignOutButton } from './SignOutButton';

interface SidebarProps {
  userEmail: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { emoji: '📊', label: '總覽', href: '/dashboard' },
    { emoji: '💬', label: '對話紀錄', href: '/dashboard/conversations' },
    { emoji: '👥', label: '客戶管理', href: '/dashboard/contacts' },
    { emoji: '⚙️', label: 'AI 設定', href: '/dashboard/settings' },
    { emoji: '📈', label: 'AI 品質', href: '/dashboard/ai-quality' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-indigo-600">CustomerAI Pro</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-600 hover:text-gray-900 text-2xl"
          aria-label="開啟選單"
        >
          ☰
        </button>
      </div>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-indigo-600"
              onClick={() => setMobileOpen(false)}
            >
              CustomerAI Pro
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-colors
                  ${
                    isActive(item.href)
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-lg">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">{userEmail}</p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
