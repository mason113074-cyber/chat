import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** 只回傳對外公開的定價欄位，不暴露 id、limits 等內部結構 */
const PUBLIC_FIELDS = 'name, slug, price_monthly, price_yearly, features, sort_order';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('plans')
      .select(PUBLIC_FIELDS)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('GET /api/plans error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans: data ?? [] });
  } catch (error) {
    console.error('GET /api/plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
