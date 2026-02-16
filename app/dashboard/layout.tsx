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
              總覽
            </Link>
            <Link
              href="/dashboard/conversations"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              對話紀錄
            </Link>
            <Link
              href="/dashboard/contacts"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              客戶聯絡人
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
