/**
 * 本機 E2E 前檢查：NEXT_PUBLIC_SUPABASE_URL 是否對應 chat 專案（測試帳號所在專案）
 * 執行：npx tsx scripts/check-e2e-supabase.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const CHAT_PROJECT_REF = 'aqnjiyuyopyuklragaau';

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const buf = fs.readFileSync(envPath);
  const isUtf16 =
    (buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff);
  const content = (isUtf16 ? buf.toString('utf16le') : buf.toString('utf-8'))
    .replace(/\uFEFF/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eq = trimmed.indexOf('=');
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!key) continue;
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ok = url.includes(CHAT_PROJECT_REF);

if (!url) {
  console.warn(
    '[check-e2e-supabase] 未設定 NEXT_PUBLIC_SUPABASE_URL，本機 E2E 登入可能失敗。'
  );
  process.exit(0); // 不阻擋，僅提示
}

if (!ok) {
  console.warn(
    `[check-e2e-supabase] NEXT_PUBLIC_SUPABASE_URL 未指向 chat 專案 (${CHAT_PROJECT_REF})。`
  );
  console.warn(
    `  目前: ${url}\n  測試帳號 (testuser2026@test.com) 在 chat 專案，若 URL 不同則登入會失敗。`
  );
  process.exit(0); // 不阻擋，僅提示
}

console.log('[check-e2e-supabase] Supabase 專案與 E2E 測試帳號一致 (chat)。');
