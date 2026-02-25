import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendHealthCheckAlert } from '@/lib/alert-service';
import { filterAIOutput } from '@/lib/security/output-filter';
import { checkRateLimit } from '@/lib/rate-limit';
import OpenAI from 'openai';

const TEST_TIMEOUT_MS = 30_000;
const HEALTH_RATE_LIMIT_WINDOW = 60;
const HEALTH_RATE_LIMIT_MAX = 10;
const healthCheckCounts = new Map<string, { count: number; windowStart: number }>();

type TestStatus = 'success' | 'error' | 'warning';

interface TestDetail {
  category: string;
  test: string;
  status: TestStatus;
  duration: number;
  message?: string;
}

interface HealthCheckResponse {
  timestamp: string;
  summary: { total: number; passed: number; failed: number; warnings: number };
  categories: Record<string, { passed: number; failed: number }>;
  details: TestDetail[];
}

function isCronRequest(request: NextRequest): boolean {
  const secret = process.env.HEALTHCHECK_CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() === secret;
  }
  return request.headers.get('x-health-check-secret') === secret;
}

function healthCheckRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowStart = Math.floor(now / (HEALTH_RATE_LIMIT_WINDOW * 1000));
  const key = `health-check:${userId}:${windowStart}`;
  const entry = healthCheckCounts.get(key);
  const count = entry ? entry.count + 1 : 1;
  if (!entry) healthCheckCounts.set(key, { count, windowStart });
  else entry.count = count;
  return count <= HEALTH_RATE_LIMIT_MAX;
}

async function runWithTimeout<T>(
  _name: string,
  fn: () => Promise<T>,
  timeoutMs: number = TEST_TIMEOUT_MS
): Promise<{ status: TestStatus; duration: number; message?: string }> {
  const start = Date.now();
  try {
    await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      ),
    ]);
    return { status: 'success', duration: Date.now() - start };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { status: 'error', duration: Date.now() - start, message };
  }
}

async function persistHealthCheckLog(
  triggeredBy: 'user' | 'cron',
  userId: string | null,
  summary: HealthCheckResponse['summary'],
  details: TestDetail[]
): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    await admin.from('health_check_logs').insert({
      triggered_by: triggeredBy,
      user_id: userId,
      summary,
      details,
    });
  } catch (e) {
    console.error('[health-check] Failed to persist log:', e);
  }
}

export async function GET(request: NextRequest) {
  const details: TestDetail[] = [];
  const categories: Record<string, { passed: number; failed: number }> = {
    API: { passed: 0, failed: 0 },
    Database: { passed: 0, failed: 0 },
    External: { passed: 0, failed: 0 },
    Security: { passed: 0, failed: 0 },
    Feature: { passed: 0, failed: 0 },
    i18n: { passed: 0, failed: 0 },
  };

  try {
    const cronMode = isCronRequest(request);
    const supabase = await createClient();

    if (cronMode) {
      // Cron: run only tests that don't require a logged-in user
      const add = (category: string, test: string, result: { status: TestStatus; duration: number; message?: string }) => {
        details.push({ category, test, status: result.status, duration: result.duration, message: result.message });
        if (result.status === 'success') categories[category].passed++;
        else categories[category].failed++;
      };

      let r = await runWithTimeout('Supabase connection', async () => {
        const { error } = await supabase.from('users').select('id').limit(1).maybeSingle();
        if (error) throw new Error(error.message);
      });
      add('Database', 'Supabase connection', r);

      r = await runWithTimeout('OpenAI API', async () => {
        if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: 'Test.' }, { role: 'user', content: 'Say ok' }],
          max_tokens: 5,
        });
      });
      add('External', 'OpenAI API', r);

      r = await runWithTimeout('Sensitive filter', async () => {
        const result = await filterAIOutput('我們會退還 100 元給您');
        if (result.isSafe) throw new Error('Expected unsafe response to be filtered');
      });
      add('Security', 'Sensitive filter', r);

      r = await runWithTimeout('Rate limiting', async () => {
        const result = await checkRateLimit('health-check-verify');
        if (typeof result.allowed !== 'boolean' || result.remaining == null) throw new Error('Invalid rate limit response');
      });
      add('Security', 'Rate limiting', r);

      r = await runWithTimeout('Handoff keywords', async () => {
        const NEEDS_HUMAN = /不確定|無法回答|請聯繫|請聯絡|抱歉我不清楚|抱歉我無法|轉人工|真人客服/;
        if (!NEEDS_HUMAN.test('我要轉人工')) throw new Error('Handoff pattern should match');
      });
      add('Feature', 'Handoff keywords', r);

      r = await runWithTimeout('i18n', async () => {
        const { readFileSync } = await import('fs');
        const { join } = await import('path');
        const cwd = process.cwd();
        const en = JSON.parse(readFileSync(join(cwd, 'messages', 'en.json'), 'utf-8')) as Record<string, unknown>;
        const zh = JSON.parse(readFileSync(join(cwd, 'messages', 'zh-TW.json'), 'utf-8')) as Record<string, unknown>;
        if (!en?.common || !zh?.common) throw new Error('Missing common keys');
      });
      add('i18n', 'i18n', r);

      const total = details.length;
      const passed = details.filter((d) => d.status === 'success').length;
      const failed = details.filter((d) => d.status === 'error').length;
      const warnings = details.filter((d) => d.status === 'warning').length;

      const body: HealthCheckResponse = {
        timestamp: new Date().toISOString(),
        summary: { total, passed, failed, warnings },
        categories,
        details,
      };

      await persistHealthCheckLog('cron', null, body.summary, details);

      if (body.summary.failed > 0) {
        const failedTests = details.filter((d) => d.status === 'error');
        await sendHealthCheckAlert(body.summary, failedTests);
      }

      return NextResponse.json(body);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授權，請先登入' },
        { status: 401 }
      );
    }

    if (!healthCheckRateLimit(user.id)) {
      return NextResponse.json(
        { error: '請求過於頻繁，請稍後再試' },
        { status: 429 }
      );
    }

    const origin =
      request.headers.get('x-forwarded-host') != null
        ? `https://${request.headers.get('x-forwarded-host')}`
        : new URL(request.url).origin;
    const cookie = request.headers.get('cookie') ?? '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    };

    const add = (category: string, test: string, result: { status: TestStatus; duration: number; message?: string }) => {
      details.push({
        category,
        test,
        status: result.status,
        duration: result.duration,
        message: result.message,
      });
      if (result.status === 'success') categories[category].passed++;
      else categories[category].failed++;
    };

    // 1. API: Settings
    let r = await runWithTimeout('Settings API', async () => {
      const res = await fetch(`${origin}/api/settings`, { credentials: 'include', headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data == null) throw new Error('No data');
    });
    add('API', 'Settings API', r);

    // 2. API: Settings LINE
    r = await runWithTimeout('Settings LINE API', async () => {
      const res = await fetch(`${origin}/api/settings/line`, { credentials: 'include', headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    });
    add('API', 'Settings LINE API', r);

    // 3. API: Knowledge base
    r = await runWithTimeout('Knowledge Base API', async () => {
      const res = await fetch(`${origin}/api/knowledge-base`, { credentials: 'include', headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data?.items)) throw new Error('Invalid response');
    });
    add('API', 'Knowledge Base API', r);

    // 4. API: Chat (AI)
    r = await runWithTimeout('Chat API', async () => {
      const res = await fetch(`${origin}/api/chat`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ message: '你好' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.content == null) throw new Error('No content');
    });
    add('API', 'Chat API', r);

    // 5. API: LINE test (POST settings/line/test) — also counts as External "LINE Messaging API"
    r = await runWithTimeout('LINE Test API', async () => {
      const res = await fetch(`${origin}/api/settings/line/test`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j?.error as string) ?? `HTTP ${res.status}`);
      }
    });
    add('API', 'LINE Test API', r);
    add('External', 'LINE Messaging API', r);

    // 6. Database: Supabase
    r = await runWithTimeout('Supabase connection', async () => {
      const { error } = await supabase.from('users').select('id').limit(1).maybeSingle();
      if (error) throw new Error(error.message);
    });
    add('Database', 'Supabase connection', r);

    // 7. External: OpenAI
    r = await runWithTimeout('OpenAI API', async () => {
      if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Test.' },
          { role: 'user', content: 'Say ok' },
        ],
        max_tokens: 5,
      });
    });
    add('External', 'OpenAI API', r);

    // 9. Security: Anti-hallucination（使用不含敏感詞的訊息，避免 /api/chat 回 400）
    r = await runWithTimeout('Anti-hallucination', async () => {
      const res = await fetch(`${origin}/api/chat`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          message: '請提供聯絡方式或最新活動',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const content = (data?.content as string) ?? '';
      const forbidden = ['免費送你', '八折優惠', '直接給你電話'];
      const found = forbidden.some((p) => content.includes(p));
      if (found) throw new Error('Forbidden phrase in reply');
    });
    add('Security', 'Anti-hallucination', r);

    // 10. Security: Sensitive filter
    r = await runWithTimeout('Sensitive filter', async () => {
      const result = await filterAIOutput('我們會退還 100 元給您');
      if (result.isSafe) throw new Error('Expected unsafe response to be filtered');
    });
    add('Security', 'Sensitive filter', r);

    // 11. Security: Rate limiting
    r = await runWithTimeout('Rate limiting', async () => {
      const result = await checkRateLimit('health-check-verify');
      if (typeof result.allowed !== 'boolean' || result.remaining == null) throw new Error('Invalid rate limit response');
    });
    add('Security', 'Rate limiting', r);

    // 12. Feature: Handoff keywords
    r = await runWithTimeout('Handoff keywords', async () => {
      const NEEDS_HUMAN = /不確定|無法回答|請聯繫|請聯絡|抱歉我不清楚|抱歉我無法|轉人工|真人客服/;
      if (!NEEDS_HUMAN.test('我要轉人工')) throw new Error('Handoff pattern should match');
    });
    add('Feature', 'Handoff keywords', r);

    // 13. Feature: RAG
    r = await runWithTimeout('RAG search', async () => {
      const res = await fetch(`${origin}/api/knowledge-base/test`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ question: '測試' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.answer == null && data?.sources == null) throw new Error('Invalid RAG response');
    });
    add('Feature', 'RAG search', r);

    // 14. i18n
    r = await runWithTimeout('i18n', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const cwd = process.cwd();
      const en = JSON.parse(readFileSync(join(cwd, 'messages', 'en.json'), 'utf-8')) as Record<string, unknown>;
      const zh = JSON.parse(readFileSync(join(cwd, 'messages', 'zh-TW.json'), 'utf-8')) as Record<string, unknown>;
      if (!en?.common || !zh?.common) throw new Error('Missing common keys');
    });
    add('i18n', 'i18n', r);

    const total = details.length;
    const passed = details.filter((d) => d.status === 'success').length;
    const failed = details.filter((d) => d.status === 'error').length;
    const warnings = details.filter((d) => d.status === 'warning').length;

    const body: HealthCheckResponse = {
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed, warnings },
      categories,
      details,
    };

    await persistHealthCheckLog('user', user.id, body.summary, details);

    return NextResponse.json(body);
  } catch (e) {
    console.error('[health-check]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '伺服器錯誤' },
      { status: 500 }
    );
  }
}
