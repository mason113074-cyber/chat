import { NextRequest, NextResponse } from 'next/server';

const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const SCOPES = 'profile openid';

/**
 * GET /api/auth/line?action=login|bind
 * 導向 LINE Login 授權頁；callback 會依 action 執行「用 LINE 登入」或「綁定 LINE」。
 */
export async function GET(request: NextRequest) {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://www.customeraipro.com';

  if (!channelId || !channelSecret) {
    return NextResponse.json(
      { error: 'LINE Login is not configured (LINE_LOGIN_CHANNEL_ID / LINE_LOGIN_CHANNEL_SECRET)' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') === 'bind' ? 'bind' : 'login';
  const redirectUri = `${appUrl}/api/auth/line/callback`;
  const state = `${action}:${crypto.randomUUID()}`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: channelId,
    redirect_uri: redirectUri,
    state,
    scope: SCOPES,
  });

  return NextResponse.redirect(`${LINE_AUTH_URL}?${params.toString()}`);
}
