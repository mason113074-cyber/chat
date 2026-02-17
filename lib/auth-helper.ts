import { createClient, User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AuthResult = { user: User; supabase: SupabaseClient } | null;

/**
 * 從 request 取得已認證的 user（與可用的 supabase client）。
 * 先嘗試 Authorization: Bearer <token>，沒有或無效時回傳 null，由呼叫方改用 cookie 認證。
 */
export async function getAuthFromRequest(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return { user, supabase };
}
