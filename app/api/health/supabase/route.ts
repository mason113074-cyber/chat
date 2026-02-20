import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const TIMEOUT_MS = 10_000;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: 'error', message: '未授權，請先登入' },
        { status: 401 }
      );
    }

    const result = await Promise.race([
      supabase.from('users').select('id').limit(1).maybeSingle(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase connection timeout')), TIMEOUT_MS)
      ),
    ]);

    const { error } = result as { error: { message?: string } | null };
    if (error) {
      return NextResponse.json(
        { status: 'error', message: error.message ?? '資料庫查詢失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'ok', service: 'supabase' });
  } catch (e) {
    const message = e instanceof Error ? e.message : '連線失敗';
    console.error('[health/supabase]', e);
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    );
  }
}
