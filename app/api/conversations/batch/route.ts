import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ACTIONS = ['resolve', 'unresolve', 'delete', 'add_tag', 'remove_tag'] as const;
type Action = (typeof ACTIONS)[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, conversationIds, tag } = body as {
      action?: string;
      conversationIds?: unknown;
      tag?: string;
    };

    if (!action || !ACTIONS.includes(action as Action)) {
      return NextResponse.json(
        { error: 'Invalid or missing action' },
        { status: 400 }
      );
    }

    const ids = Array.isArray(conversationIds)
      ? conversationIds.filter((id): id is string => typeof id === 'string')
      : [];
    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'conversationIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if ((action === 'add_tag' || action === 'remove_tag') && (!tag || typeof tag !== 'string')) {
      return NextResponse.json(
        { error: 'tag is required for add_tag and remove_tag' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify all ids belong to current user
    const { data: owned } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .in('id', ids);
    const ownedIds = (owned ?? []).map((r) => r.id);
    if (ownedIds.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some conversations do not belong to you' },
        { status: 403 }
      );
    }

    switch (action as Action) {
      case 'resolve': {
        const { error } = await supabase
          .from('contacts')
          .update({ status: 'resolved' })
          .in('id', ownedIds)
          .eq('user_id', user.id);
        if (error) {
          console.error('Batch resolve error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({
          success: true,
          message: `已將 ${ownedIds.length} 個對話標記為已解決`,
          count: ownedIds.length,
        });
      }
      case 'unresolve': {
        const { error } = await supabase
          .from('contacts')
          .update({ status: 'pending' })
          .in('id', ownedIds)
          .eq('user_id', user.id);
        if (error) {
          console.error('Batch unresolve error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({
          success: true,
          message: `已將 ${ownedIds.length} 個對話標記為未解決`,
          count: ownedIds.length,
        });
      }
      case 'delete': {
        const { error } = await supabase
          .from('contacts')
          .delete()
          .in('id', ownedIds)
          .eq('user_id', user.id);
        if (error) {
          console.error('Batch delete error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({
          success: true,
          message: `已刪除 ${ownedIds.length} 個對話`,
          count: ownedIds.length,
        });
      }
      case 'add_tag': {
        const tagTrim = (tag as string).trim();
        if (!tagTrim) {
          return NextResponse.json({ error: 'tag cannot be empty' }, { status: 400 });
        }
        for (const contactId of ownedIds) {
          const { data: row } = await supabase
            .from('contacts')
            .select('tags')
            .eq('id', contactId)
            .single();
          const current = (row?.tags as string[] | null) ?? [];
          if (current.includes(tagTrim)) continue;
          const next = [...current, tagTrim];
          await supabase.from('contacts').update({ tags: next }).eq('id', contactId);
        }
        return NextResponse.json({
          success: true,
          message: `已為 ${ownedIds.length} 個對話新增標籤「${tagTrim}」`,
          count: ownedIds.length,
        });
      }
      case 'remove_tag': {
        const tagTrim = (tag as string).trim();
        for (const contactId of ownedIds) {
          const { data: row } = await supabase
            .from('contacts')
            .select('tags')
            .eq('id', contactId)
            .single();
          const current = (row?.tags as string[] | null) ?? [];
          const next = current.filter((t) => t !== tagTrim);
          if (next.length !== current.length) {
            await supabase.from('contacts').update({ tags: next }).eq('id', contactId);
          }
        }
        return NextResponse.json({
          success: true,
          message: `已從 ${ownedIds.length} 個對話移除標籤「${tagTrim}」`,
          count: ownedIds.length,
        });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Batch API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform batch action' },
      { status: 500 }
    );
  }
}
