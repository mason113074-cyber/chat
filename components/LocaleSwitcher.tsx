'use client';

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

type Props = { className?: string };

export function LocaleSwitcher({ className }: Props) {
  const locale = useLocale();
  const pathname = usePathname();
  const nextLocale = locale === 'zh-TW' ? 'en' : 'zh-TW';

  return (
    <Link
      href={pathname}
      locale={nextLocale}
      className={className ?? 'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white transition'}
      aria-label={locale === 'zh-TW' ? 'Switch to English' : '切換至繁體中文'}
    >
      {locale === 'zh-TW' ? 'EN' : '繁中'}
    </Link>
  );
}
