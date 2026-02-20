import { NextResponse } from 'next/server';
import { sendAlert } from '@/lib/alert-service';

/**
 * 測試用 API：發送一則告警以驗證 Discord/Slack Webhook 是否正常。
 * 驗證完成後可刪除此檔案。
 */
export async function GET() {
  const sent = await sendAlert({
    type: 'warning',
    title: '測試告警',
    message: '這是一個測試告警訊息',
    details: { test: 'success' },
  });

  return NextResponse.json({ sent });
}
