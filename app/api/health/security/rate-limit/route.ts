import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }
    const result = await checkRateLimit('health-verify');
    if (typeof result.allowed !== 'boolean' || result.remaining == null) {
      return NextResponse.json({ status: 'error', message: 'Invalid rate limit response' }, { status: 500 });
    }
    return NextResponse.json({ status: 'ok', service: 'rate-limit' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Check failed';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
