'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function LandingFooter() {
  const t = useTranslations('landing');
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold tracking-tight text-white">CustomerAI Pro</p>
            <p className="mt-2 text-sm text-slate-400">{t('footerTagline')}</p>
            <p className="mt-4 text-sm text-slate-500">© 2026 CustomerAI Pro</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">{t('footerProduct')}</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/#features" className="text-sm text-slate-300 hover:text-white">{t('footerFeatures')}</Link></li>
              <li><Link href="/#pricing" className="text-sm text-slate-300 hover:text-white">{t('footerPricing')}</Link></li>
              <li><Link href="/#faq" className="text-sm text-slate-300 hover:text-white">{t('footerFaq')}</Link></li>
            </ul>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-white">{t('footerCompany')}</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="mailto:support@customeraipro.com" className="text-sm text-slate-300 hover:text-white">{t('footerContact')}</a></li>
            </ul>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-white">{t('footerLegal')}</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/terms" className="text-sm text-slate-300 hover:text-white">{t('footerTerms')}</Link></li>
              <li><Link href="/privacy" className="text-sm text-slate-300 hover:text-white">{t('footerPrivacy')}</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
