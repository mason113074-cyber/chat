import { getSupabaseAdmin } from '@/lib/supabase';
import { AUTO_TAG_NAMES } from '@/lib/contact-tags';

const INQUIRY_KEYWORDS = /價格|費用|多少錢|報價/;
const SUPPORT_KEYWORDS = /壞了|故障|不能用|錯誤|怎麼用/;

/**
 * Async auto-tag contact by keywords and conversation count. Do not await in caller so it doesn't block reply.
 */
export async function autoTagContact(
  contactId: string,
  ownerUserId: string,
  userMessage: string
): Promise<void> {
  try {
    const admin = getSupabaseAdmin();

    const { count: convCount } = await admin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('contact_id', contactId);

    const { data: tagRows } = await admin
      .from('contact_tags')
      .select('id, name')
      .eq('user_id', ownerUserId)
      .in('name', [AUTO_TAG_NAMES.inquiry, AUTO_TAG_NAMES.support, AUTO_TAG_NAMES.highValue]);

    const tagByName = new Map((tagRows ?? []).map((t) => [t.name, t.id]));

    const { data: existing } = await admin
      .from('contact_tag_assignments')
      .select('tag_id')
      .eq('contact_id', contactId);
    const existingIds = new Set((existing ?? []).map((a) => a.tag_id));

    const toAdd: string[] = [];
    if (INQUIRY_KEYWORDS.test(userMessage)) {
      const id = tagByName.get(AUTO_TAG_NAMES.inquiry);
      if (id && !existingIds.has(id)) toAdd.push(id);
    }
    if (SUPPORT_KEYWORDS.test(userMessage)) {
      const id = tagByName.get(AUTO_TAG_NAMES.support);
      if (id && !existingIds.has(id)) toAdd.push(id);
    }
    if (typeof convCount === 'number' && convCount >= 5) {
      const id = tagByName.get(AUTO_TAG_NAMES.highValue);
      if (id && !existingIds.has(id)) toAdd.push(id);
    }

    for (const tagId of toAdd) {
      await admin
        .from('contact_tag_assignments')
        .insert([{ contact_id: contactId, tag_id: tagId, assigned_by: 'auto' }])
        .select()
        .single();
    }
  } catch (err) {
    console.error('autoTagContact error:', err);
  }
}
