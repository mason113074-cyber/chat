import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

type LineProfile = { userId: string; displayName?: string; pictureUrl?: string };

async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  channelId: string,
  channelSecret: string
): Promise<string> {
  const res = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: channelId,
      client_secret: channelSecret,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LINE token exchange failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('LINE token response missing access_token');
  return data.access_token;
}

async function getLineProfile(accessToken: string): Promise<LineProfile> {
  const res = await fetch(LINE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`LINE profile failed: ${res.status}`);
  const data = (await res.json()) as LineProfile;
  if (!data.userId) throw new Error('LINE profile missing userId');
  return data;
}

/**
 * GET /api/auth/line/callback?code=...&state=...
 * state 格式: "login:uuid" 或 "bind:uuid"
 * - login: 依 line_login_user_id 查使用者，以 magic link 登入並導向 /dashboard
 * - bind: 已登入使用者綁定 LINE，更新 public.users 後導向 /dashboard/settings
 */
function getLocaleFromRequest(request: NextRequest): string {
  const cookie = request.cookies.get('NEXT_LOCALE')?.value;
  return cookie === 'en' || cookie === 'zh-TW' ? cookie : 'zh-TW';
}

export async function GET(request: NextRequest) {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.customeraipro.com';
  const redirectUri = `${appUrl}/api/auth/line/callback`;
  const locale = getLocaleFromRequest(request);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state') || '';

  const [action] = state.split(':');

  if (!channelId || !channelSecret) {
    return NextResponse.redirect(`${appUrl}/${locale}/login?error=line_not_configured`);
  }
  if (!code) {
    return NextResponse.redirect(`${appUrl}/${locale}/login?error=missing_code`);
  }

  try {
    const accessToken = await exchangeCodeForToken(code, redirectUri, channelId, channelSecret);
    const profile = await getLineProfile(accessToken);

    if (action === 'bind') {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.redirect(`${appUrl}/${locale}/login?error=bind_requires_login`);
      }
      const { error } = await supabase
        .from('users')
        .update({
          line_login_user_id: profile.userId,
          line_login_display_name: profile.displayName ?? null,
          line_login_photo_url: profile.pictureUrl ?? null,
        })
        .eq('id', user.id);
      if (error) {
        console.error('LINE bind update error:', error);
        return NextResponse.redirect(`${appUrl}/${locale}/dashboard/settings?line_bind=error`);
      }
      return NextResponse.redirect(`${appUrl}/${locale}/dashboard/settings?line_bind=success`);
    }

    // login: find user by line_login_user_id, or sign up new user with LINE
    const admin = getSupabaseAdmin();
    let row: { id: string; email: string } | null = null;

    const { data: existingRow, error: findError } = await admin
      .from('users')
      .select('id, email')
      .eq('line_login_user_id', profile.userId)
      .maybeSingle();

    if (!findError && existingRow) {
      row = existingRow;
    }

    if (!row) {
      // LINE 帳號未綁定：嘗試用 LINE 直接註冊／登入
      const syntheticEmail = `line_${profile.userId}@line.customeraipro.com`;
      const { data: existingByEmail } = await admin
        .from('users')
        .select('id, email')
        .eq('email', syntheticEmail)
        .maybeSingle();

      if (existingByEmail) {
        row = existingByEmail;
        await admin
          .from('users')
          .update({
            line_login_user_id: profile.userId,
            line_login_display_name: profile.displayName ?? null,
            line_login_photo_url: profile.pictureUrl ?? null,
          })
          .eq('id', row.id);
      } else {
        const { data: newUserData, error: createError } = await admin.auth.admin.createUser({
          email: syntheticEmail,
          email_confirm: true,
        });
        if (createError || !newUserData.user) {
          console.error('LINE signup createUser error:', createError);
          return NextResponse.redirect(
            `${appUrl}/${locale}/login?error=line_not_linked&hint=請先註冊並在設定中綁定 LINE`
          );
        }
        row = { id: newUserData.user.id, email: syntheticEmail };
        await admin
          .from('users')
          .update({
            line_login_user_id: profile.userId,
            line_login_display_name: profile.displayName ?? null,
            line_login_photo_url: profile.pictureUrl ?? null,
          })
          .eq('id', row.id);
      }
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: row.email,
      options: { redirectTo: `${appUrl}/${locale}/dashboard` },
    });
    if (linkError || !linkData?.properties?.action_link) {
      console.error('LINE login magic link error:', linkError);
      return NextResponse.redirect(`${appUrl}/${locale}/login?error=login_failed`);
    }
    return NextResponse.redirect(linkData.properties.action_link);
  } catch (err) {
    console.error('LINE callback error:', err);
    return NextResponse.redirect(`${appUrl}/${locale}/login?error=line_callback_failed`);
  }
}
