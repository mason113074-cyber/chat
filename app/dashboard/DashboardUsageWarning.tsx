'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function DashboardUsageWarning() {
  const [overNinety, setOverNinety] = useState(false);
  const [isHundred, setIsHundred] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/billing/usage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.conversations) return;
        const { limit, percentage } = data.conversations;
        if (limit === -1) return;
        if (percentage >= 100) setIsHundred(true);
        else if (percentage >= 90) setOverNinety(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!overNinety && !isHundred) return null;

  return (
    <Link
      href="/dashboard/billing"
      className={`block w-full py-2 px-4 text-center text-sm font-medium border-b ${
        isHundred
          ? 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100'
          : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
      }`}
    >
      {isHundred
        ? '❌ 已達到本月對話上限，請至方案與計費升級以恢復服務'
        : '⚠️ 本月對話用量已超過 90%，請至方案與計費查看並考慮升級'}
    </Link>
  );
}
