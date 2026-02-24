import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

const DRAIN_LIMIT = 20;
const PROCESS_URL_PATH = '/api/internal/webhook-events/process';

/** B1: Cron fallback – drain pending webhook_events by calling process for each. */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.HEALTHCHECK_CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const hasAuth = cronSecret && (authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret);
  if (!hasAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: 'APP_URL or VERCEL_URL not set' }, { status: 500 });
  }
  const processUrl = baseUrl.startsWith('http') ? `${baseUrl}${PROCESS_URL_PATH}` : `https://${baseUrl}${PROCESS_URL_PATH}`;
  const internalSecret = process.env.INTERNAL_QUEUE_SECRET;

  const admin = getSupabaseAdmin();
  const { data: rows } = await admin
    .from('webhook_events')
    .select('id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(DRAIN_LIMIT);

  if (!rows?.length) {
    return NextResponse.json({ drained: 0 });
  }

  let drained = 0;
  for (const row of rows) {
    try {
      const res = await fetch(processUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(internalSecret ? { Authorization: `Bearer ${internalSecret}` } : {}),
        },
        body: JSON.stringify({ webhook_event_id: row.id }),
      });
      if (res.ok) drained++;
    } catch {
      // continue with next
    }
  }

  return NextResponse.json({ drained });
}
