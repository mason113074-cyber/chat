import { headers } from 'next/headers';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayoutClient } from './DashboardLayoutClient';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

type Props = {
  children: React.ReactNode;
  params?: Promise<{ locale?: string }>;
};

export default async function DashboardLayout({ children, params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const resolvedParams = params ? await params : {};
    const localeFromParams = resolvedParams.locale;
    const localeFromHeader = (await headers()).get('x-next-intl-locale');
    const locale = localeFromParams ?? localeFromHeader ?? routing.defaultLocale;
    const safeLocale = (routing.locales as readonly string[]).includes(locale) ? locale : routing.defaultLocale;
    redirect({ href: '/login', locale: safeLocale as 'zh-TW' | 'en' });
  }

  return (
    <DashboardLayoutClient userEmail={user!.email ?? ''}>
      {children}
    </DashboardLayoutClient>
  );
}
