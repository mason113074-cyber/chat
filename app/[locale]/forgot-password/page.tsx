'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const t = useTranslations('login');
  const tCommon = useTranslations('common');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            CustomerAI Pro
          </Link>
          <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
            {tCommon('backToHome')}
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            {t('forgotPassword')}
          </h1>
          <p className="mt-2 text-center text-gray-600 text-sm">
            {sent ? t('forgotPasswordSent') : t('forgotPasswordHint')}
          </p>
          {!sent ? (
            <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? t('forgotPasswordSending') : t('forgotPasswordSubmit')}
              </button>
            </form>
          ) : (
            <p className="mt-6 text-center">
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                {t('backToLogin')}
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
