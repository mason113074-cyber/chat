import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** POST /api/auth/line/unbind — 解除目前帳號的 LINE 登入綁定 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('users')
    .update({
      line_login_user_id: null,
      line_login_display_name: null,
      line_login_photo_url: null,
    })
    .eq('id', user.id);

  if (error) {
    console.error('LINE unbind error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
