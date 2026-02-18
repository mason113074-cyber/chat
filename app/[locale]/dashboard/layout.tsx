import { headers } from 'next/headers';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayoutClient } from './DashboardLayoutClient';
import { routing } from '@/i18n/routing';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const locale = (await headers()).get('x-next-intl-locale') ?? routing.defaultLocale;
    redirect({ href: '/login', locale });
  }

  return (
    <DashboardLayoutClient userEmail={user!.email ?? ''}>
      {children}
    </DashboardLayoutClient>
  );
}
