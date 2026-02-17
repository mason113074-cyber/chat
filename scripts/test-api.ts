/**
 * API 端對端測試腳本
 * 從 .env.local 讀取：NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY（任務要求）
 * 登入需額外：NEXT_PUBLIC_SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD（用 Supabase Auth 取得 session）
 * 執行前請先啟動 dev server: npm run dev (localhost:3000)
 */

import { createClient, Session } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eq = trimmed.indexOf('=');
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      process.env[key] = value.slice(1, -1).replace(/\\n/g, '\n');
    } else if (value.startsWith("'") && value.endsWith("'")) {
      process.env[key] = value.slice(1, -1);
    } else {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? '';

const STORAGE_KEY = 'supabase.auth.token';
const MAX_CHUNK_SIZE = 3180;

function toBase64URL(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64url');
}

function getCookieHeader(session: Session | null): string {
  if (!session) return '';
  const raw = JSON.stringify(session);
  const encoded = 'base64-' + toBase64URL(raw);
  if (encoded.length <= MAX_CHUNK_SIZE) {
    return `${STORAGE_KEY}=${encodeURIComponent(encoded)}`;
  }
  const chunks: string[] = [];
  for (let i = 0; i < encoded.length; i += MAX_CHUNK_SIZE) {
    const chunk = encoded.slice(i, i + MAX_CHUNK_SIZE);
    chunks.push(`${STORAGE_KEY}.${chunks.length}=${encodeURIComponent(chunk)}`);
  }
  return chunks.join('; ');
}

async function getSession(): Promise<Session | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
    console.error('缺少 .env.local 設定：NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD');
    return null;
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error) {
    console.error('登入失敗:', error.message);
    return null;
  }
  return data.session;
}

async function api(
  session: Session | null,
  method: string,
  path: string,
  body?: object
): Promise<{ status: number; json: () => Promise<unknown> }> {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session) {
    headers['Cookie'] = getCookieHeader(session);
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return {
    status: res.status,
    json: () => res.json(),
  };
}

async function main(): Promise<void> {
  console.log('\n🧪 API 端對端測試 (' + BASE + ')\n');

  const session = await getSession();
  if (!session) {
    console.log('⚠️ 無法取得 session，請在 .env.local 設定 TEST_USER_EMAIL、TEST_USER_PASSWORD、NEXT_PUBLIC_SUPABASE_ANON_KEY\n');
  }

  try {
    const probe = await fetch(BASE + '/api/onboarding/status');
    probe.json().catch(() => {});
  } catch {
    console.error('❌ 無法連線至 ' + BASE + '，請先啟動服務或設定 TEST_BASE_URL\n');
    process.exit(1);
  }

  let passed = 0;
  let total = 0;

  // --- Onboarding ---
  total++;
  const r0 = await api(session, 'GET', '/api/onboarding/status');
  if (r0.status === 200) {
    console.log('✅ GET /api/onboarding/status → 200');
    passed++;
  } else {
    const j = await r0.json() as { error?: string };
    console.log(`❌ GET /api/onboarding/status — ${r0.status} ${j?.error ?? ''}`);
  }

  total++;
  const r1 = await api(session, 'POST', '/api/onboarding/save', {
    store_name: 'Test Store',
    industry: '電商',
  });
  if (r1.status === 200) {
    console.log('✅ POST /api/onboarding/save → 200');
    passed++;
  } else {
    const j = await r1.json() as { error?: string };
    console.log(`❌ POST /api/onboarding/save — ${r1.status} ${j?.error ?? ''}`);
  }

  // --- Knowledge Base ---
  total++;
  const r2 = await api(session, 'GET', '/api/knowledge-base');
  let kbId: string | null = null;
  if (r2.status === 200) {
    const j = await r2.json() as { items?: unknown[] };
    if (Array.isArray(j?.items)) {
      console.log('✅ GET /api/knowledge-base → 200 + array');
      passed++;
    } else {
      console.log('❌ GET /api/knowledge-base — 回傳非 array');
    }
  } else {
    const j = await r2.json() as { error?: string };
    console.log(`❌ GET /api/knowledge-base — ${r2.status} ${j?.error ?? ''}`);
  }

  total++;
  const r3 = await api(session, 'POST', '/api/knowledge-base', {
    title: '測試FAQ',
    content: '這是測試內容',
    category: '常見問題',
  });
  if (r3.status === 201) {
    const j = await r3.json() as { item?: { id?: string } };
    kbId = j?.item?.id ?? null;
    console.log('✅ POST /api/knowledge-base → 201');
    passed++;
  } else {
    const j = await r3.json() as { error?: string };
    console.log(`❌ POST /api/knowledge-base — ${r3.status} ${j?.error ?? ''}`);
  }

  total++;
  const r4 = await api(session, 'POST', '/api/knowledge-base/test', {
    question: '你們的營業時間？',
  });
  if (r4.status === 200) {
    const j = await r4.json() as { answer?: unknown; sources?: unknown };
    if (j != null && 'answer' in j && 'sources' in j) {
      console.log('✅ POST /api/knowledge-base/test → answer + sources');
      passed++;
    } else {
      console.log('❌ POST /api/knowledge-base/test — 缺少 answer 或 sources');
    }
  } else {
    const j = await r4.json() as { error?: string };
    console.log(`❌ POST /api/knowledge-base/test — ${r4.status} ${j?.error ?? ''}`);
  }

  if (kbId) {
    const rDel = await api(session, 'DELETE', `/api/knowledge-base/${kbId}`);
    if (rDel.status === 200) {
      console.log('✅ DELETE /api/knowledge-base/[id] → 清理完成');
    }
  }

  // --- Analytics ---
  total++;
  const r5 = await api(session, 'GET', '/api/analytics/overview');
  if (r5.status === 200) {
    console.log('✅ GET /api/analytics/overview → 200');
    passed++;
  } else {
    const j = await r5.json() as { error?: string };
    console.log(`❌ GET /api/analytics/overview — ${r5.status} ${j?.error ?? ''}`);
  }

  total++;
  const r6 = await api(session, 'GET', '/api/analytics/trends?days=30');
  if (r6.status === 200) {
    console.log('✅ GET /api/analytics/trends?days=30 → 200');
    passed++;
  } else {
    const j = await r6.json() as { error?: string };
    console.log(`❌ GET /api/analytics/trends — ${r6.status} ${j?.error ?? ''}`);
  }

  total++;
  const r7 = await api(session, 'GET', '/api/analytics/resolution');
  if (r7.status === 200) {
    const j = await r7.json() as { resolution_rate?: unknown };
    if (j != null && 'resolution_rate' in j) {
      console.log('✅ GET /api/analytics/resolution → resolution_rate');
      passed++;
    } else {
      console.log('❌ GET /api/analytics/resolution — 缺少 resolution_rate');
    }
  } else {
    const j = await r7.json() as { error?: string };
    console.log(`❌ GET /api/analytics/resolution — ${r7.status} ${j?.error ?? ''}`);
  }

  // --- Billing ---
  total++;
  const r8 = await api(session, 'GET', '/api/billing/usage');
  if (r8.status === 200) {
    const j = await r8.json() as { plan?: unknown; conversations?: unknown; knowledge?: unknown };
    if (j != null && 'plan' in j && 'conversations' in j && 'knowledge' in j) {
      console.log('✅ GET /api/billing/usage → plan + conversations + knowledge');
      passed++;
    } else {
      console.log('❌ GET /api/billing/usage — 缺少 plan/conversations/knowledge');
    }
  } else {
    const j = await r8.json() as { error?: string };
    console.log(`❌ GET /api/billing/usage — ${r8.status} ${j?.error ?? ''}`);
  }

  // --- Conversations ---
  total++;
  const r9 = await api(session, 'GET', '/api/conversations/counts');
  if (r9.status === 200) {
    const j = await r9.json() as { total?: unknown; ai_handled?: unknown; needs_human?: unknown };
    if (j != null && 'total' in j && 'ai_handled' in j && 'needs_human' in j) {
      console.log('✅ GET /api/conversations/counts → total, ai_handled, needs_human');
      passed++;
    } else {
      console.log('❌ GET /api/conversations/counts — 缺少欄位');
    }
  } else {
    const j = await r9.json() as { error?: string };
    console.log(`❌ GET /api/conversations/counts — ${r9.status} ${j?.error ?? ''}`);
  }

  // --- Contacts ---
  total++;
  const r10 = await api(session, 'GET', '/api/contacts');
  if (r10.status === 200) {
    console.log('✅ GET /api/contacts → 200');
    passed++;
  } else {
    const j = await r10.json() as { error?: string };
    console.log(`❌ GET /api/contacts — ${r10.status} ${j?.error ?? ''}`);
  }

  total++;
  const r11 = await api(session, 'GET', '/api/contacts/tags');
  if (r11.status === 200) {
    const j = await r11.json() as { tags?: unknown };
    if (j != null && Array.isArray(j.tags)) {
      console.log('✅ GET /api/contacts/tags → 預設標籤');
      passed++;
    } else {
      console.log('❌ GET /api/contacts/tags — 回傳非 tags 陣列');
    }
  } else {
    const j = await r11.json() as { error?: string };
    console.log(`❌ GET /api/contacts/tags — ${r11.status} ${j?.error ?? ''}`);
  }

  // --- Settings ---
  total++;
  const r12 = await api(session, 'GET', '/api/settings');
  if (r12.status === 200) {
    const j = await r12.json() as { systemPrompt?: unknown; aiModel?: unknown };
    if (j != null && 'systemPrompt' in j && 'aiModel' in j) {
      console.log('✅ GET /api/settings → systemPrompt, aiModel');
      passed++;
    } else {
      console.log('❌ GET /api/settings — 缺少 systemPrompt 或 aiModel');
    }
  } else {
    const j = await r12.json() as { error?: string };
    console.log(`❌ GET /api/settings — ${r12.status} ${j?.error ?? ''}`);
  }

  total++;
  const r13 = await api(session, 'POST', '/api/settings/preview', {
    question: '你好',
    system_prompt: '你是客服',
    ai_model: 'gpt-4o-mini',
  });
  if (r13.status === 200) {
    const j = await r13.json() as { answer?: unknown };
    if (j != null && 'answer' in j) {
      console.log('✅ POST /api/settings/preview → answer');
      passed++;
    } else {
      console.log('❌ POST /api/settings/preview — 缺少 answer');
    }
  } else {
    const j = await r13.json() as { error?: string };
    console.log(`❌ POST /api/settings/preview — ${r13.status} ${j?.error ?? ''}`);
  }

  // --- Search ---
  total++;
  const r14 = await api(session, 'GET', '/api/search?q=test');
  if (r14.status === 200) {
    const j = await r14.json() as { conversations?: unknown; contacts?: unknown; knowledge?: unknown };
    if (j != null && 'conversations' in j && 'contacts' in j && 'knowledge' in j) {
      console.log('✅ GET /api/search?q=test → conversations, contacts, knowledge');
      passed++;
    } else {
      console.log('❌ GET /api/search — 缺少 conversations/contacts/knowledge');
    }
  } else {
    const j = await r14.json() as { error?: string };
    console.log(`❌ GET /api/search — ${r14.status} ${j?.error ?? ''}`);
  }

  console.log('\n' + '—'.repeat(40));
  console.log(`通過 ${passed}/${total} 個測試`);
  console.log('—'.repeat(40) + '\n');
  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
