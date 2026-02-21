import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

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

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
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
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
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
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
      }
    }
    return intlResponse;
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
    '/((?!api|_next|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
