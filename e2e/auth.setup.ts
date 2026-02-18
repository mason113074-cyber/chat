import * as fs from 'fs';
import * as path from 'path';
import { test as setup, expect } from '@playwright/test';

const authDir = path.join(process.cwd(), 'e2e', '.auth');
const authFile = path.join(authDir, 'user.json');

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const buf = fs.readFileSync(envPath);
  const isUtf16 = (buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff);
  let content = isUtf16 ? buf.toString('utf16le') : buf.toString('utf-8');
  content = content.replace(/\uFEFF/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (const line of content.split('\n')) {
    const trimmed = line.trim().replace(/\0/g, '');
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

const email = process.env.TEST_USER_EMAIL || '';
const password = process.env.TEST_USER_PASSWORD || '';

setup('登入並儲存 storageState', async ({ page }) => {
  if (!email || !password) {
    throw new Error('請在 .env.local 設定 TEST_USER_EMAIL 與 TEST_USER_PASSWORD');
  }

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('密碼').fill(password);
  await page.getByRole('button', { name: '登入' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: authFile });
});
