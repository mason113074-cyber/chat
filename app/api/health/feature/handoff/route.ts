import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const NEEDS_HUMAN_KEYWORDS = /不確定|無法回答|請聯繫|請聯絡|抱歉我不清楚|抱歉我無法|轉人工|真人客服/;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }
    if (!NEEDS_HUMAN_KEYWORDS.test('我要轉人工')) {
      return NextResponse.json({ status: 'error', message: 'Handoff pattern should match' }, { status: 500 });
    }
    return NextResponse.json({ status: 'ok', service: 'handoff-keywords' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Check failed';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
