'use client';

import { useState, useEffect, Suspense } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('login');
  const tCommon = useTranslations('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (searchParams.get('signup') === 'true') {
      setIsSignUp(true);
    }
    const err = searchParams.get('error');
    const hint = searchParams.get('hint');
    if (err === 'line_not_linked') {
      setError(hint || t('lineNotLinked'));
    } else if (err === 'line_not_configured') {
      setError(t('lineNotConfigured'));
    } else if (err === 'login_failed' || err === 'line_callback_failed') {
      setError(t('errorGeneric'));
    } else if (err === 'bind_requires_login') {
      setError(t('bindRequiresLogin'));
    }
  }, [searchParams, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const supabase = createClient();

      if (isSignUp) {
          if (password !== confirmPassword) {
            setError(t('errorPasswordMismatch'));
            setLoading(false);
            return;
          }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
        setSuccess(t('signUpSuccess'));
        setIsSignUp(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }
        router.push('/dashboard');
        router.refresh();
      }
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
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            {tCommon('backToHome')}
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            {isSignUp ? t('signUp') : t('title')}
          </h1>
          <p className="mt-2 text-center text-gray-600">
            {isSignUp ? t('signUpSubtitle') : t('subtitle')}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('email')}
              </label>
              <input
                id="email"
                data-testid="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('password')}
              </label>
              <input
                id="password"
                data-testid="login-password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {!isSignUp && (
                <p className="mt-2 text-right">
                  <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
                    {t('forgotPassword')}
                  </Link>
                </p>
              )}
            </div>
            {isSignUp && (
              <div className="mt-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  {t('confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
            <button
              type="submit"
              data-testid="login-submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (isSignUp ? t('signingUp') : t('loggingIn')) : (isSignUp ? t('signUpButton') : t('loginButton'))}
            </button>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-500">{locale === 'zh-TW' ? '或' : 'or'}</span>
              <span className="flex-1 border-t border-gray-200" />
            </div>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/auth/line?action=login"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('loginWithLine')}
            </a>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {isSignUp ? (
              <>
                {t('hasAccount')}{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(null); setSuccess(null); }}
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  {t('backToLogin')}
                </button>
              </>
            ) : (
              <>
                {t('noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(null); setSuccess(null); }}
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  {t('register')}
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-white items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
