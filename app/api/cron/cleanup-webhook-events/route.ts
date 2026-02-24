import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Retention policy (days)
const RETENTION_DAYS: Record<string, number> = {
  processed: 7,
  failed: 30,
  pending: 1,
};

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
    const deleted: Record<string, number> = {};
    const errors: Record<string, string> = {};

    for (const [status, days] of Object.entries(RETENTION_DAYS)) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await admin
        .from('webhook_events')
        .delete({ count: 'exact' })
        .eq('status', status)
        .lt('created_at', cutoff);

      if (error) {
        console.error('[cleanup-webhook-events] Delete failed', { status, error: error.message });
        errors[status] = error.message;
      } else {
        deleted[status] = count ?? 0;
      }
    }

    const total = Object.values(deleted).reduce((sum, n) => sum + n, 0);
    const hasErrors = Object.keys(errors).length > 0;
    console.info('[cleanup-webhook-events] Cleanup complete', { deleted, total, errors: hasErrors ? errors : undefined });

    return NextResponse.json({
      success: !hasErrors,
      deleted,
      total,
      ...(hasErrors && { errors }),
      timestamp: new Date().toISOString(),
    }, { status: hasErrors ? 207 : 200 });
  } catch (e) {
    console.error('[cleanup-webhook-events] Unexpected error', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
