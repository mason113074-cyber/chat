import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { QuickReply } from './types';
import { getCached, deleteCached } from './cache';

const USER_SETTINGS_CACHE_TTL = 600; // 10 分鐘
const USER_SETTINGS_CACHE_PREFIX = 'user_settings:';

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

// Browser client (public) - lazy initialization
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error('Supabase environment variables are not set');
    }

    supabaseInstance = createClient(url, anonKey);
  }
  return supabaseInstance;
}

// Admin client (server-side only, with service role key) - lazy initialization
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error('Supabase admin environment variables are not set');
    }

    supabaseAdminInstance = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminInstance;
}

// Export aliases for backward compatibility
export { getSupabase as supabase, getSupabaseAdmin as supabaseAdmin };

// --- Phase 1 schema types ---

export type { QuickReply } from './types';

export interface User {
  id: string;
  email: string;
  plan: string;
  line_channel_id: string | null;
  system_prompt?: string | null;
  ai_model?: string | null;
  quick_replies?: QuickReply[] | null;
  created_at?: string;
}

export interface Contact {
  id: string;
  user_id: string;
  line_user_id: string;
  name: string | null;
  tags: string[];
  status?: 'pending' | 'resolved';
  created_at?: string;
}

export interface ConversationMessage {
  id?: string;
  contact_id: string;
  message: string;
  role: 'user' | 'assistant' | 'system';
  created_at?: string;
}

export interface Order {
  id: string;
  contact_id: string;
  order_number: string;
  status: string;
  created_at?: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: unknown;
  limits: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  payment_provider: string | null;
  provider_subscription_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  provider: string | null;
  provider_payment_id: string | null;
  paid_at: string | null;
  created_at?: string;
}

// --- Helpers (use admin client for webhook / server) ---

/** Get or create a contact for a LINE user under the given owner user. */
export async function getOrCreateContactByLineUserId(
  lineUserId: string,
  ownerUserId: string,
  name?: string
): Promise<Contact> {
  const client = getSupabaseAdmin();

  const { data: existing } = await client
    .from('contacts')
    .select('*')
    .eq('user_id', ownerUserId)
    .eq('line_user_id', lineUserId)
    .maybeSingle();

  if (existing) return existing as Contact;

  const { data: inserted, error } = await client
    .from('contacts')
    .insert([{ user_id: ownerUserId, line_user_id: lineUserId, name: name ?? null }])
    .select()
    .single();

  if (!error) return inserted as Contact;

  if (error.code === '23505') {
    const { data: row } = await client
      .from('contacts')
      .select('*')
      .eq('user_id', ownerUserId)
      .eq('line_user_id', lineUserId)
      .maybeSingle();
    if (row) return row as Contact;
  }

  console.error('Error creating contact:', error);
  throw error;
}

/** Fetch recent conversation messages for a contact (oldest first, for context). */
export async function getRecentConversationMessages(
  contactId: string,
  limit: number = 5
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('conversations')
    .select('role, message')
    .eq('contact_id', contactId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent conversation messages:', error);
    return [];
  }
  const list = (data ?? []).map((row) => ({
    role: row.role as 'user' | 'assistant',
    content: String(row.message ?? ''),
  }));
  list.reverse(); // oldest first for API context
  return list;
}

/** Insert a single conversation message (user or assistant). */
export async function insertConversationMessage(
  contactId: string,
  message: string,
  role: 'user' | 'assistant' | 'system',
  options?: {
    status?: string;
    resolved_by?: string;
    is_resolved?: boolean;
    confidence_score?: number;
    ab_test_id?: string;
    ab_variant?: string;
  }
) {
  const client = getSupabaseAdmin();
  const row: Record<string, unknown> = { contact_id: contactId, message, role };
  if (options?.status != null) row.status = options.status;
  if (options?.resolved_by != null) row.resolved_by = options.resolved_by;
  if (options?.is_resolved != null) row.is_resolved = options.is_resolved;
  if (options?.confidence_score != null) row.confidence_score = options.confidence_score;
  if (options?.ab_test_id != null) row.ab_test_id = options.ab_test_id;
  if (options?.ab_variant != null) row.ab_variant = options.ab_variant;
  const { data, error } = await client
    .from('conversations')
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error('Error inserting conversation message:', error);
    throw error;
  }
  return data;
}

/** Fetch the system prompt for a specific user. */
export async function getUserSystemPrompt(userId: string): Promise<string | null> {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('users')
    .select('system_prompt')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching system prompt:', error);
    return null;
  }

  return data?.system_prompt ?? null;
}

export interface UserSettings {
  system_prompt: string | null;
  ai_model: string | null;
  // Sprint 1–4
  max_reply_length?: number;
  reply_temperature?: number;
  reply_format?: string;
  custom_sensitive_words?: string[];
  sensitive_word_reply?: string | null;
  reply_delay_seconds?: number;
  show_typing_indicator?: boolean;
  auto_detect_language?: boolean;
  supported_languages?: string[];
  fallback_language?: string;
  // Sprint 6–10
  confidence_threshold?: number;
  low_confidence_action?: string;
  handoff_message?: string | null;
  business_hours_enabled?: boolean;
  business_hours?: { timezone?: string; schedule?: Record<string, { enabled: boolean; start: string; end: string }> } | null;
  outside_hours_mode?: string;
  outside_hours_message?: string | null;
  feedback_enabled?: boolean;
  feedback_message?: string | null;
  conversation_memory_count?: number;
  conversation_memory_mode?: string;
  welcome_message_enabled?: boolean;
  welcome_message?: string | null;
  quick_replies?: QuickReply[] | null;
}

/** Fetch user settings (e.g. for webhook). Cached 10 min. */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const cacheKey = USER_SETTINGS_CACHE_PREFIX + userId;

  return getCached(
    cacheKey,
    async () => {
      const client = getSupabaseAdmin();
      const { data, error } = await client
        .from('users')
        .select(`
          system_prompt, ai_model, quick_replies,
          max_reply_length, reply_temperature, reply_format,
          custom_sensitive_words, sensitive_word_reply,
          reply_delay_seconds, show_typing_indicator,
          auto_detect_language, supported_languages, fallback_language,
          confidence_threshold, low_confidence_action, handoff_message,
          business_hours_enabled, business_hours, outside_hours_mode, outside_hours_message,
          feedback_enabled, feedback_message,
          conversation_memory_count, conversation_memory_mode,
          welcome_message_enabled, welcome_message
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user settings:', error);
        return { system_prompt: null, ai_model: null };
      }

      return {
        system_prompt: data?.system_prompt ?? null,
        ai_model: data?.ai_model ?? null,
        max_reply_length: data?.max_reply_length ?? 500,
        reply_temperature: data?.reply_temperature ?? 0.2,
        reply_format: data?.reply_format ?? 'plain',
        custom_sensitive_words: Array.isArray(data?.custom_sensitive_words)
          ? data.custom_sensitive_words
          : [],
        sensitive_word_reply: data?.sensitive_word_reply ?? null,
        reply_delay_seconds: Number(data?.reply_delay_seconds ?? 0),
        show_typing_indicator: Boolean(data?.show_typing_indicator),
        auto_detect_language: Boolean(data?.auto_detect_language),
        supported_languages: Array.isArray(data?.supported_languages)
          ? data.supported_languages
          : ['zh-TW'],
        fallback_language: data?.fallback_language ?? 'zh-TW',
        confidence_threshold: Number(data?.confidence_threshold ?? 0.6),
        low_confidence_action: data?.low_confidence_action ?? 'handoff',
        handoff_message: data?.handoff_message ?? null,
        business_hours_enabled: Boolean(data?.business_hours_enabled),
        business_hours: data?.business_hours ?? null,
        outside_hours_mode: data?.outside_hours_mode ?? 'auto_reply',
        outside_hours_message: data?.outside_hours_message ?? null,
        feedback_enabled: Boolean(data?.feedback_enabled),
        feedback_message: data?.feedback_message ?? null,
        conversation_memory_count: Number(data?.conversation_memory_count ?? 5),
        conversation_memory_mode: data?.conversation_memory_mode ?? 'recent',
        welcome_message_enabled: Boolean(data?.welcome_message_enabled),
        welcome_message: data?.welcome_message ?? null,
        quick_replies: Array.isArray(data?.quick_replies) ? data.quick_replies : [],
      };
    },
    { ttl: USER_SETTINGS_CACHE_TTL }
  );
}

/** 更新使用者設定後呼叫，清除該使用者的設定快取 */
export async function invalidateUserSettingsCache(userId: string): Promise<void> {
  await deleteCached(USER_SETTINGS_CACHE_PREFIX + userId);
}
