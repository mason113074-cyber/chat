import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }
    const cwd = process.cwd();
    const en = JSON.parse(readFileSync(join(cwd, 'messages', 'en.json'), 'utf-8')) as Record<string, unknown>;
    const zh = JSON.parse(readFileSync(join(cwd, 'messages', 'zh-TW.json'), 'utf-8')) as Record<string, unknown>;
    if (!en?.common || !zh?.common) {
      return NextResponse.json({ status: 'error', message: 'Missing common keys in messages' }, { status: 500 });
    }
    return NextResponse.json({ status: 'ok', service: 'i18n' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Check failed';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
