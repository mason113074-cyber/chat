import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const INDUSTRIES = ['餐飲', '零售', '美業', '教育', '電商', '其他'];
const AI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const body = await request.json();

    // Step 1: store_name, industry
    if (body.store_name !== undefined) {
      const storeName = typeof body.store_name === 'string' ? body.store_name.trim() : '';
      if (!storeName) {
        return NextResponse.json({ error: '請填寫商店名稱' }, { status: 400 });
      }
      const industry = body.industry && INDUSTRIES.includes(body.industry) ? body.industry : null;
      const { error: updateError } = await supabase
        .from('users')
        .update({ store_name: storeName.slice(0, 100), industry })
        .eq('id', user.id);
      if (updateError) {
        console.error(updateError);
        return NextResponse.json({ error: '儲存失敗' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Step 3: system_prompt, ai_model
    if (body.system_prompt !== undefined || body.ai_model !== undefined) {
      const updates: { system_prompt?: string; ai_model?: string } = {};
      if (typeof body.system_prompt === 'string') {
        updates.system_prompt = body.system_prompt.trim().slice(0, 5000) || null;
      }
      if (typeof body.ai_model === 'string' && AI_MODELS.includes(body.ai_model)) {
        updates.ai_model = body.ai_model;
      }
      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: '無有效欄位可儲存' }, { status: 400 });
      }
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);
      if (updateError) {
        console.error(updateError);
        return NextResponse.json({ error: '儲存失敗' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Step 4: mark onboarding_completed
    if (body.complete === true) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      if (updateError) {
        console.error(updateError);
        return NextResponse.json({ error: '儲存失敗' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '無效的請求內容' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
