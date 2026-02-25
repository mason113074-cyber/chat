import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  );
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  return res;
}

async function getSupabaseUser(
  request: NextRequest
): Promise<{ user: { id: string } | null; response: NextResponse }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  if (!url || !anonKey) return { user: null, response };
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
  const { data: { user } } = await supabase.auth.getUser();
  return { user, response };
}

const isPublicApiPath = (pathname: string): boolean =>
  pathname.startsWith('/api/webhook/') ||
  pathname.startsWith('/api/health') ||
  pathname.startsWith('/api/health-check') ||
  pathname.startsWith('/api/auth/');

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // API 路由：未登入且非公開 API 回 401
  if (pathname.startsWith('/api/')) {
    if (isPublicApiPath(pathname)) {
      return NextResponse.next();
    }
    const { user } = await getSupabaseUser(request);
    if (!user) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    return addSecurityHeaders(NextResponse.next());
  }

  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] ?? '';
  const isDashboardOrSettingsPath =
    firstSegment === 'dashboard' ||
    firstSegment === 'settings' ||
    ((firstSegment === 'zh-TW' || firstSegment === 'en') &&
      (segments[1] === 'dashboard' || segments[1] === 'settings'));

  if (isDashboardOrSettingsPath) {
    const { user } = await getSupabaseUser(request);
    if (!user) {
      const locale =
        firstSegment === 'zh-TW' || firstSegment === 'en' ? firstSegment : routing.defaultLocale;
      return addSecurityHeaders(
        NextResponse.redirect(new URL(`/${locale}/login`, request.url))
      );
    }
  }

  const intlResponse = await intlMiddleware(request);
  if (intlResponse && (intlResponse.status === 307 || intlResponse.status === 302)) {
    const location = intlResponse.headers.get('location') || '';
    const targetPath = new URL(location, request.url).pathname;
    if (/^\/(zh-TW|en)\/(dashboard|settings)/.test(targetPath)) {
      const { user } = await getSupabaseUser(request);
      if (!user) {
        const locale = /^\/(zh-TW|en)/.exec(targetPath)?.[1] ?? routing.defaultLocale;
        return addSecurityHeaders(
          NextResponse.redirect(new URL(`/${locale}/login`, request.url))
        );
      }
    }
    return addSecurityHeaders(intlResponse);
  }

  const pathSegs = request.nextUrl.pathname.split('/').filter(Boolean);
  const locale = pathSegs[0] ?? '';
  const isLocalePath = (routing.locales as readonly string[]).includes(locale);
  const rest = isLocalePath ? pathSegs.slice(1) : pathSegs;
  const restFirst = rest[0] ?? '';
  const isDashboard = isLocalePath && restFirst === 'dashboard';
  const isSettings = isLocalePath && restFirst === 'settings';
  const isDashboardOnboarding =
    isLocalePath && restFirst === 'dashboard' && rest[1] === 'onboarding';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    const res = intlResponse ?? NextResponse.next({ request });
    return addSecurityHeaders(res);
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
    return addSecurityHeaders(NextResponse.redirect(redirectUrl));
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
      return addSecurityHeaders(NextResponse.redirect(redirectUrl));
    }
  }

  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    '/api/((?!webhook|health|auth).*)',
  ],
};
