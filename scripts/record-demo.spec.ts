/**
 * CustomerAIPro 產品 Demo 錄影腳本
 * - 使用 video: { mode: 'on', size } 錄製 1920x1080 影片
 * - 對 production 執行完整 walkthrough，適合剪輯成產品介紹影片
 *
 * 執行錄製：
 *   npx playwright test record-demo.spec.ts --config=playwright.demo.config.ts
 * 或：npm run test:demo
 *
 * 帶 headed 看瀏覽器：npm run test:demo:headed
 *
 * 手動登入模式：執行 test:demo:headed，腳本會打開登入頁後等待您輸入帳密並登入，
 * 偵測到進入 dashboard 後自動從 Scene 3 開始錄製。
 *
 * 影片儲存位置：demo-recordings/（使用 demo config 時）或 test-results/（使用預設 config 時）
 */

import { test, expect } from '@playwright/test';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 手動登入時不需使用；若改回自動填寫可設 .env.demo.local
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@customeraipro.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'DemoPassword123!';

test.describe('CustomerAIPro Product Demo', () => {
  test('Complete product walkthrough', async ({ page }) => {
    // ========================================
    // Scene 1: Landing Page (10 秒)
    // ========================================
    console.log('Scene 1: Landing Page');

    await page.goto('https://www.customeraipro.com/en');
    await page.waitForLoadState('networkidle');
    await delay(3000);

    await page.evaluate(() => window.scrollTo(0, 600));
    await delay(2000);

    await page.evaluate(() => window.scrollTo(0, 1200));
    await delay(2000);

    await page.evaluate(() => window.scrollTo(0, 2000));
    await delay(2000);

    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(1000);

    // ========================================
    // Scene 2: 登入（有 .env.demo.local 則自動填寫，否則等待手動登入）
    // ========================================
    const hasDemoCreds = DEMO_EMAIL && DEMO_PASSWORD && !DEMO_EMAIL.includes('demo@customeraipro.com');
    if (hasDemoCreds) {
      // 已有帳號：直接到登入頁（避免 Get started free 帶到註冊頁）
      console.log('Scene 2: 使用 DEMO_EMAIL 自動登入…');
      await page.goto('https://www.customeraipro.com/en/login');
      await page.waitForLoadState('networkidle');
      await delay(1000);
      await page.getByTestId('login-email').fill(DEMO_EMAIL);
      await delay(300);
      await page.getByTestId('login-password').fill(DEMO_PASSWORD);
      await delay(300);
      await page.getByTestId('login-submit').click();
      await page.waitForURL(/.*dashboard/, { timeout: 25000 });
      await delay(2000);
    } else {
      await page.locator('main').getByRole('link', { name: /get started free/i }).first().click();
      await page.waitForLoadState('networkidle');
      await delay(1500);
      console.log('Scene 2: 請在瀏覽器中輸入 Email 與 Password 並登入（最多等 2 分鐘）…');
      await page.waitForURL(/.*dashboard/, { timeout: 120000 });
      await delay(2000);
    }
    console.log('已進入 Dashboard，開始錄製。');

    // ========================================
    // Scene 3: Dashboard Overview (20 秒)
    // ========================================
    console.log('Scene 3: Dashboard');

    await expect(page).toHaveURL(/.*dashboard/);
    await delay(3000);

    // Dashboard 統計卡片（依實際文案 hover，支援 en）
    await page.getByText(/Total customers|總客戶數/).first().hover();
    await delay(1500);
    await page.getByText(/Total conversations|總對話數/).first().hover();
    await delay(1500);
    await page.getByText(/Today's conversations|今日對話/).first().hover();
    await delay(1500);
    await page.getByText(/New customers this week|本週新客戶/).first().hover();
    await delay(1500);

    await page.evaluate(() => window.scrollTo(0, 400));
    await delay(2000);

    // ========================================
    // Scene 4: LINE Integration Setup (30 秒)
    // ========================================
    console.log('Scene 4: LINE Setup');

    await page.getByRole('link', { name: /settings/i }).click();
    await delay(2000);

    const editLineBtn = page.getByRole('button', { name: /edit line|line channel|line 設定/i });
    if (await editLineBtn.isVisible()) {
      await editLineBtn.click();
      await delay(2000);
      const secretInput = page.getByLabel(/channel secret/i);
      if (await secretInput.isVisible()) {
        await secretInput.click();
        await secretInput.fill('********************************');
        await delay(1500);
      }
      const tokenInput = page.getByLabel(/channel access token/i);
      if (await tokenInput.isVisible()) {
        await tokenInput.click();
        await tokenInput.fill('*'.repeat(40));
        await delay(1500);
      }
      await page.getByText('Webhook URL').first().hover();
      await delay(2000);
    }

    await page.evaluate(() => window.scrollTo(0, 300));
    await delay(2000);

    // ========================================
    // Scene 5: Upload Knowledge Base (25 秒)
    // ========================================
    console.log('Scene 5: Knowledge Base');

    await page.getByRole('link', { name: /knowledge base|知識庫/i }).first().click();
    await delay(2000);

    const uploadBtn = page.getByRole('button', { name: /import|add knowledge|上傳|新增/i }).first();
    if (await uploadBtn.isVisible()) {
      await uploadBtn.hover();
      await delay(1500);
    }
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      await fileInput.hover();
      await delay(1500);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(2000);

    const firstKBCard = page.locator('.rounded-xl.border.bg-white.p-4').first();
    if (await firstKBCard.isVisible()) {
      await firstKBCard.hover();
      await delay(1500);
      await firstKBCard.click();
      await delay(3000);
      const backLink = page.getByRole('link', { name: /overview|knowledge base|知識庫/i }).first();
      if (await backLink.isVisible()) await backLink.click();
      await delay(1500);
    }

    // ========================================
    // Scene 6: Test Chat (20 秒)
    // ========================================
    console.log('Scene 6: Test Chat');

    const chatInput = page.getByTestId('kb-test-question').or(
      page.locator('input[placeholder*="message"], textarea[placeholder*="message"], input[placeholder*="question"]')
    ).first();
    if (await chatInput.isVisible()) {
      await chatInput.fill('What are your business hours?');
      await delay(2000);
      const sendBtn = page.getByRole('button', { name: /send|送出/i }).first();
      if (await sendBtn.isVisible()) await sendBtn.click();
      await delay(4000);
      await chatInput.fill('How much does the Pro plan cost?');
      await delay(2000);
      if (await sendBtn.isVisible()) await sendBtn.click();
      await delay(4000);
    }
    await delay(2000);

    // ========================================
    // Scene 7: Analytics Dashboard (15 秒)
    // ========================================
    console.log('Scene 7: Analytics');

    await page.getByRole('link', { name: /analytics|分析/i }).click();
    await delay(2000);

    await page.evaluate(() => window.scrollTo(0, 400));
    await delay(2000);
    await page.evaluate(() => window.scrollTo(0, 800));
    await delay(2000);

    // ========================================
    // Scene 8: Help Center Preview (10 秒)
    // ========================================
    console.log('Scene 8: Help Center');

    await page.goto('https://www.customeraipro.com/en/help');
    await page.waitForLoadState('networkidle');
    await delay(3000);

    await page.evaluate(() => window.scrollTo(0, 400));
    await delay(2000);

    await page.click('text="Getting Started"');
    await delay(2000);

    await page.click('text="Welcome to CustomerAIPro"');
    await delay(3000);

    await page.evaluate(() => window.scrollTo(0, 600));
    await delay(2000);

    // ========================================
    // Scene 9: Final CTA (5 秒)
    // ========================================
    console.log('Scene 9: Ending');

    await page.goto('https://www.customeraipro.com/en');
    await page.waitForLoadState('networkidle');
    await delay(3000);

    console.log('Demo recording complete!');
  });
});
