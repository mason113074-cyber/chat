import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Run next-intl first (redirects / to /zh-TW or /en, etc.)
  const intlResponse = await intlMiddleware(request);
  if (intlResponse && (intlResponse.status === 307 || intlResponse.status === 302)) {
    return intlResponse;
  }

  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0] ?? '';
  const isLocalePath = (routing.locales as readonly string[]).includes(locale);
  const rest = isLocalePath ? segments.slice(1) : segments;
  const firstSegment = rest[0] ?? '';
  const isDashboard = isLocalePath && firstSegment === 'dashboard';
  const isSettings = isLocalePath && firstSegment === 'settings';
  const isDashboardOnboarding =
    isLocalePath && firstSegment === 'dashboard' && rest[1] === 'onboarding';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return intlResponse ?? NextResponse.next({ request });
  }

  let response = intlResponse ?? NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options ?? {})
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if ((isDashboard || isSettings) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}/login`;
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isDashboard && !isDashboardOnboarding) {
    const { data: row } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();
    const completed = row?.onboarding_completed === true;
    if (!completed) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = `/${locale}/dashboard/onboarding`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
