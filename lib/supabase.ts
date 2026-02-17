import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export interface User {
  id: string;
  email: string;
  plan: string;
  line_channel_id: string | null;
  system_prompt?: string | null;
  ai_model?: string | null;
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

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  expires_at: string | null;
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

/** Insert a single conversation message (user or assistant). */
export async function insertConversationMessage(
  contactId: string,
  message: string,
  role: 'user' | 'assistant' | 'system'
) {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('conversations')
    .insert([{ contact_id: contactId, message, role }])
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
}

/** Fetch system_prompt and ai_model for a user (e.g. for webhook). */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('users')
    .select('system_prompt, ai_model')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user settings:', error);
    return { system_prompt: null, ai_model: null };
  }

  return {
    system_prompt: data?.system_prompt ?? null,
    ai_model: data?.ai_model ?? null,
  };
}
