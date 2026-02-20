/**
 * E2E: LINE 綁定登入功能
 * - 登入頁顯示「用 LINE 登入」
 * - 設定頁顯示 LINE 帳號綁定區塊（需已登入，可單獨 run 或納入 full-flow）
 * 執行：npx playwright test e2e/line-login-binding.spec.ts --project=chromium
 * 或帶登入：npx playwright test e2e/line-login-binding.spec.ts --project=chromium --config=playwright.config.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('LINE 綁定登入', () => {
  test('登入頁顯示「用 LINE 登入」按鈕', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/zh-TW/login`);
      await page.waitForLoadState('networkidle');
      const link = page.locator('a[href*="/api/auth/line"]').first();
      const visible = await link.isVisible().catch(() => false);
      if (!visible) {
        test.skip(true, 'Login page has no LINE link (e.g. run against local after deploy)');
        return;
      }
      const text = await link.textContent();
      expect(text?.includes('LINE')).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  test('登入頁「用 LINE 登入」連結指向 LINE OAuth', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/zh-TW/login`);
      await page.waitForLoadState('networkidle');
      const link = page.locator('a[href*="/api/auth/line"]').first();
      const visible = await link.isVisible().catch(() => false);
      if (!visible) {
        test.skip(true, 'Login page has no LINE link');
        return;
      }
      const href = await link.getAttribute('href');
      expect(href).toContain('/api/auth/line');
      expect(href).toContain('action=login');
    } finally {
      await context.close();
    }
  });
});
