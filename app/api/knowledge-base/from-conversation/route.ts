import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getKnowledgeLimit } from '@/lib/plans';

/**
 * Create a knowledge base entry from a conversation message (e.g. from AI quality "add to KB").
 * POST body: { conversation_id: string, title: string, content?: string }
 * If content is omitted, the conversation message text is used.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const conversationId = body.conversation_id;
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
    let content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!conversationId || !title) {
      return NextResponse.json({ error: 'conversation_id and title are required' }, { status: 400 });
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('id, message, contact_id')
      .eq('id', conversationId)
      .single();
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const { data: contact } = await supabase
      .from('contacts')
      .select('user_id')
      .eq('id', conv.contact_id)
      .single();
    if (!contact || contact.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!content) content = conv.message ?? '';

    const { data: planRow } = await supabase.from('users').select('plan').eq('id', user.id).single();
    const plan = (planRow?.plan as string) ?? 'free';
    const limit = getKnowledgeLimit(plan);
    const { count } = await supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    if (count != null && count >= limit) {
      return NextResponse.json({ error: 'Knowledge base limit reached' }, { status: 403 });
    }

    const { data: entry, error } = await supabase
      .from('knowledge_base')
      .insert({
        user_id: user.id,
        title,
        content,
        category: 'general',
        is_active: true,
      })
      .select('id, title, content, category, created_at')
      .single();

    if (error) {
      console.error('knowledge_base insert error:', error);
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }
    return NextResponse.json({ entry });
  } catch (err) {
    console.error('POST /api/knowledge-base/from-conversation error:', err);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
