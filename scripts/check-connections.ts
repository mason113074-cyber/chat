/**
 * 檢查 Vercel / GitHub / Supabase / Upstash 連通
 * 執行：npx tsx scripts/check-connections.ts
 */

import * as fs from 'fs';
import * as path from 'path';

let envLoadCount = 0;

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }
  try {
    const buf = fs.readFileSync(envPath);
    const isUtf16 =
      (buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff);
    const content = (isUtf16 ? buf.toString('utf16le') : buf.toString('utf-8'))
      .replace(/\uFEFF/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    for (const line of content.split('\n')) {
      const trimmed = line.trim().replace(/\0/g, '');
      if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const eq = trimmed.indexOf('=');
      let key = trimmed.slice(0, eq).trim().replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '');
      const value = trimmed.slice(eq + 1).trim();
      if (!key) continue;
      if (value.startsWith('"') && value.endsWith('"')) {
        process.env[key] = value.slice(1, -1).replace(/\\n/g, '\n');
      } else if (value.startsWith("'") && value.endsWith("'")) {
        process.env[key] = value.slice(1, -1);
      } else {
        process.env[key] = value;
      }
      envLoadCount++;
    }
  } catch (err) {
    console.error('讀取 .env.local 失敗:', err instanceof Error ? err.message : String(err));
  }
}

loadEnvLocal();

// 支援常見別名（部分環境可能用不同名稱）
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}

const results: { service: string; ok: boolean; message: string }[] = [];

async function checkSupabase(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const hasUrl = !!url;
  const hasAnon = !!anon;
  const hasServiceRole = !!serviceRole;
  if (!hasUrl || !hasAnon || !hasServiceRole) {
    const supabaseKeys = Object.keys(process.env).filter((k) => k.includes('SUPABASE'));
    const hint =
      envLoadCount > 0 && !hasUrl && !hasAnon && !hasServiceRole
        ? ` process.env 中 SUPABASE 相關 key: ${supabaseKeys.length ? supabaseKeys.join(', ') : '(無)'}。請確認變數名為 NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY、SUPABASE_SERVICE_ROLE_KEY。`
        : ' 請在專案根目錄 .env.local 設定，或於 Vercel 後台設定。';
    results.push({
      service: 'Supabase',
      ok: false,
      message: `缺少變數: NEXT_PUBLIC_SUPABASE_URL=${hasUrl ? '✓' : '✗'} ANON_KEY=${hasAnon ? '✓' : '✗'} SERVICE_ROLE_KEY=${hasServiceRole ? '✓' : '✗'}。${hint}`,
    });
    return;
  }

  try {
    const healthUrl = url.replace(/\/$/, '') + '/auth/v1/health';
    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: { apikey: anon },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 200) {
      results.push({ service: 'Supabase', ok: true, message: '變數已設定且 Auth 可連通' });
    } else {
      results.push({ service: 'Supabase', ok: false, message: `Auth health 回傳 ${res.status}` });
    }
  } catch (e) {
    results.push({
      service: 'Supabase',
      ok: false,
      message: `連線失敗: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
}

async function checkUpstash(): Promise<void> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    results.push({
      service: 'Upstash Redis',
      ok: true,
      message: '未設定（使用記憶體 fallback，單實例可運作）',
    });
    return;
  }

  try {
    const pingUrl = redisUrl.replace(/\/$/, '') + '/ping';
    const res = await fetch(pingUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${redisToken}` },
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    if (res.ok && (text.includes('PONG') || text.includes('pong'))) {
      results.push({ service: 'Upstash Redis', ok: true, message: '變數已設定且 REST 可連通' });
    } else if (res.status === 401) {
      results.push({ service: 'Upstash Redis', ok: false, message: 'TOKEN 無效或過期' });
    } else {
      results.push({ service: 'Upstash Redis', ok: false, message: `REST 回傳 ${res.status}: ${text.slice(0, 80)}` });
    }
  } catch (e) {
    results.push({
      service: 'Upstash Redis',
      ok: false,
      message: `連線失敗: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
}

function checkVercel(): void {
  const onVercel = process.env.VERCEL === '1';
  const vercelUrl = process.env.VERCEL_URL;
  if (onVercel) {
    results.push({ service: 'Vercel', ok: true, message: `執行於 Vercel (VERCEL_URL=${vercelUrl || '-'})` });
  } else {
    results.push({
      service: 'Vercel',
      ok: true,
      message: '目前非 Vercel 環境（部署時由 Vercel 自動注入變數）',
    });
  }
}

async function checkGitHub(): Promise<void> {
  const gitDir = path.join(process.cwd(), '.git', 'config');
  if (!fs.existsSync(gitDir)) {
    results.push({ service: 'GitHub', ok: false, message: '非 Git 專案或缺少 .git/config' });
    return;
  }
  const config = fs.readFileSync(gitDir, 'utf-8');
  const match = config.match(/url\s*=\s*(.+)/);
  const remote = match ? match[1].trim() : '';
  const isGitHub = remote.includes('github.com');
  if (isGitHub) {
    results.push({ service: 'GitHub', ok: true, message: `remote: ${remote}` });
  } else {
    results.push({ service: 'GitHub', ok: false, message: `remote 非 GitHub: ${remote || '(無)'}` });
  }
}

async function main() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  console.log('檢查 Vercel / GitHub / Supabase / Upstash 連通...');
  if (fs.existsSync(envPath)) {
    console.log(`環境變數: ${envPath}（已載入 ${envLoadCount} 個）`);
  } else {
    console.log('環境變數: 無 .env.local，使用 process.env');
  }
  console.log('');

  checkVercel();
  await checkGitHub();
  await checkSupabase();
  await checkUpstash();

  let failed = 0;
  for (const r of results) {
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} ${r.service}: ${r.message}`);
    if (!r.ok) failed++;
  }

  console.log('');
  if (failed > 0) {
    console.log(`共 ${failed} 項異常，請依上方訊息修正。`);
    process.exit(1);
  }
  console.log('全部連通正常。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
