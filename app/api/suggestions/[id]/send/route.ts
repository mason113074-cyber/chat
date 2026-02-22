import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { pushMessage } from '@/lib/line';
import { insertConversationMessage } from '@/lib/supabase';
import { decrypt } from '@/lib/encrypt';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/suggestions/[id]/send
 * Approve a draft suggestion: send to LINE, write conversation, update suggestion (sent_at, sent_by).
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id: suggestionId } = await params;
    if (!suggestionId) return NextResponse.json({ error: 'Missing suggestion id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: suggestion, error: sugError } = await supabase
      .from('ai_suggestions')
      .select('id, contact_id, user_id, bot_id, suggested_reply, status, expires_at')
      .eq('id', suggestionId)
      .maybeSingle();

    if (sugError || !suggestion) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (suggestion.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (suggestion.status !== 'draft') {
      return NextResponse.json({ error: 'Suggestion already sent or expired' }, { status: 400 });
    }
    if (new Date(suggestion.expires_at) <= new Date()) {
      return NextResponse.json({ error: 'Suggestion expired' }, { status: 400 });
    }

    const { data: contact } = await supabase
      .from('contacts')
      .select('id, line_user_id')
      .eq('id', suggestion.contact_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

    const admin = getSupabaseAdmin();
    const { data: bot } = await admin
      .from('line_bots')
      .select('encrypted_channel_access_token')
      .eq('id', suggestion.bot_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

    let channelAccessToken: string;
    try {
      channelAccessToken = decrypt(bot.encrypted_channel_access_token);
    } catch (e) {
      console.error('POST /api/suggestions/[id]/send decrypt error:', e);
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    await pushMessage(
      contact.line_user_id,
      { type: 'text', text: suggestion.suggested_reply },
      { channelSecret: '', channelAccessToken }
    );

    await insertConversationMessage(suggestion.contact_id, suggestion.suggested_reply, 'assistant', {
      status: 'needs_human',
      resolved_by: 'human',
      is_resolved: false,
    });

    const { error: updateErr } = await admin
      .from('ai_suggestions')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: user.id,
      })
      .eq('id', suggestionId);

    if (updateErr) {
      console.error('POST /api/suggestions/[id]/send update error:', updateErr);
      return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('POST /api/suggestions/[id]/send error:', e);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
