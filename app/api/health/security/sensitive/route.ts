import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { filterAIOutput } from '@/lib/security/output-filter';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }
    const result = await filterAIOutput('我們會退還 100 元給您');
    if (result.isSafe) {
      return NextResponse.json({ status: 'error', message: 'Expected unsafe response to be filtered' }, { status: 500 });
    }
    return NextResponse.json({ status: 'ok', service: 'sensitive-filter' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Check failed';
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}
