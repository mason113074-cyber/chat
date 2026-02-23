import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Retention policy (days)
const RETENTION = {
  processed: 7,
  failed: 30,
  pending: 1,
} as const;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.WEBHOOK_CLEANUP_CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() === secret;
  }
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const now = new Date();
    const results: Record<string, number> = {};

    for (const [status, days] of Object.entries(RETENTION) as [keyof typeof RETENTION, number][]) {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await admin
        .from('webhook_events')
        .delete()
        .eq('status', status)
        .lt('created_at', cutoff)
        .select('id', { count: 'exact', head: true });

      if (error) {
        console.error('[cleanup-webhook-events] Delete failed', { status, error: error.message });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      results[status] = count ?? 0;
    }

    console.info('[cleanup-webhook-events] Cleanup complete', results);
    return NextResponse.json({ success: true, deleted: results });
  } catch (error) {
    console.error('[cleanup-webhook-events] Unexpected error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
