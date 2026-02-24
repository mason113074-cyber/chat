'use client';

import { useEffect, useState } from 'react';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Sidebar } from './Sidebar';
import { DashboardTopBar } from './DashboardTopBar';
import { DashboardUsageWarning } from './DashboardUsageWarning';

const SIDEBAR_STORAGE_KEY = 'dashboard-sidebar-expanded';

export function DashboardLayoutClient({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored !== null ? stored === 'true' : true;
  });

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const handleSidebarExpandedChange = (expanded: boolean) => {
    setSidebarExpanded(expanded);
    if (typeof window !== 'undefined') localStorage.setItem(SIDEBAR_STORAGE_KEY, String(expanded));
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar
        userEmail={userEmail}
        expanded={sidebarExpanded}
        onExpandedChange={handleSidebarExpandedChange}
      />
      <div
        className={`flex-1 flex flex-col min-w-0 pt-14 lg:pt-0 lg:transition-[margin] duration-200 ease-out ${sidebarExpanded ? 'lg:ml-[240px]' : 'lg:ml-16'}`}
      >
        <div className="sticky top-0 z-30 bg-gray-50">
          <DashboardTopBar onOpenSearch={() => setSearchOpen(true)} userEmail={userEmail} />
          <DashboardUsageWarning />
        </div>
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}
