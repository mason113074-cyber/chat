import { NextResponse } from 'next/server';

/**
 * GET /api/auth/line/status
 * 診斷：檢查 LINE Login 環境變數是否已設定（不洩漏實際值）
 * 用於確認 Vercel 環境變數是否正確傳入
 */
export async function GET() {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;

  return NextResponse.json({
    configured: !!(channelId && channelSecret),
    hasChannelId: !!channelId,
    hasChannelSecret: !!channelSecret,
    channelIdLength: channelId ? channelId.length : 0,
    channelSecretLength: channelSecret ? channelSecret.length : 0,
  });
}
