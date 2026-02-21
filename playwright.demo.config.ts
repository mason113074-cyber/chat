/**
 * Playwright 設定：產品 Demo 錄影用
 * 執行：npx playwright test --config=playwright.demo.config.ts
 * 或：npx playwright test --config=playwright.demo.config.ts --headed
 *
 * 與主 config 分離，不影響 e2e 測試；錄影輸出至 demo-recordings/
 * Demo 帳密：可設於 .env.demo.local 的 DEMO_EMAIL / DEMO_PASSWORD，見 scripts/DEMO_SETUP.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { defineConfig, devices } from '@playwright/test';

function loadEnvDemoLocal(): void {
  const envPath = path.resolve(process.cwd(), '.env.demo.local');
  if (!fs.existsSync(envPath)) return;
  const buf = fs.readFileSync(envPath);
  const isUtf16 = (buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff);
  const content = (isUtf16 ? buf.toString('utf16le') : buf.toString('utf-8'))
    .replace(/\uFEFF/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
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

loadEnvDemoLocal();

export default defineConfig({
  testDir: './scripts',
  timeout: 180000, // 3 分鐘總時長
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'https://www.customeraipro.com',
    trace: 'on-first-retry',

    // 錄影設定
    video: {
      mode: 'on',
      size: { width: 1920, height: 1080 },
    },

    // 截圖設定
    screenshot: 'only-on-failure',

    // 瀏覽器視窗
    viewport: { width: 1920, height: 1080 },

    // 注意：Playwright 不支援 launchOptions.slowMo，放慢節奏請在 spec 內用 delay() 控制
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 錄影與測試產物輸出目錄
  outputDir: 'demo-recordings/',
});
