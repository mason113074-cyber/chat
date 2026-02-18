'use client';

import { useEffect } from 'react';

export function SetLocaleHtml({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
