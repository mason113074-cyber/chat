'use client';

import { useEffect, useState } from 'react';
import { GlobalSearch } from '@/components/GlobalSearch';
import { DashboardNav } from './DashboardNav';
import { DashboardUsageWarning } from './DashboardUsageWarning';

export function DashboardLayoutClient({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white relative">
        <DashboardNav
          userEmail={userEmail}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <DashboardUsageWarning />
      </header>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
