import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from './SignOutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
            CustomerAIPro
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              {'\u7E3D\u89BD'}
            </Link>
            <Link
              href="/dashboard/conversations"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              {'\u5C0D\u8A71\u7D00\u9304'}
            </Link>
            <Link
              href="/dashboard/contacts"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              {'\u5BA2\u6236\u806F\u7D61\u4EBA'}
            </Link>
            <Link
              href="/dashboard/billing"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              {'\u65B9\u6848\u8207\u8A08\u8CBB'}
            </Link>
            <Link
              href="/dashboard/analytics"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              數據分析
            </Link>
            <Link
              href="/dashboard/knowledge-base"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              知識庫
            </Link>
            <Link
              href="/settings"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              {'\u8A2D\u5B9A'}
            </Link>
            <span className="text-sm text-gray-500">{user.email}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
