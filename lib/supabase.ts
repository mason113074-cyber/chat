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

// Type definitions for conversations table
export interface Conversation {
  id?: string;
  user_id: string;
  user_message: string;
  ai_response: string;
  platform: string;
  created_at?: string;
}

// Save conversation to database
export async function saveConversation(conversation: Conversation) {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('conversations')
    .insert([conversation])
    .select()
    .single();

  if (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }

  return data;
}
