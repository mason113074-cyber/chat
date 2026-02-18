'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  const t = useTranslations('common');

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-sm text-gray-500 hover:text-gray-700"
    >
      {t('logout')}
    </button>
  );
}
