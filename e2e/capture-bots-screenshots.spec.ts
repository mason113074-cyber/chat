/**
 * 截圖：Bot 管理頁與設定 > 整合與連接，輸出到 docs/screenshots/
 * 執行：npx playwright test capture-bots-screenshots --project=chromium
 */
import * as path from 'path';
import { test, expect } from '@playwright/test';

const OUT_DIR = path.join(process.cwd(), 'docs', 'screenshots');

test.describe('Screenshots for Bot Management', () => {
  test('capture bots page and settings integrations', async ({ page }) => {
    await page.goto('/zh-TW/dashboard/settings/bots');
    await expect(page).toHaveURL(/\/dashboard\/settings\/bots/);
    await page.waitForLoadState('networkidle').catch(() => {});

    await page.screenshot({
      path: path.join(OUT_DIR, 'bots-page-zh.png'),
      fullPage: true,
    });

    await page.goto('/zh-TW/dashboard/settings#integrations');
    await expect(page).toHaveURL(/#integrations/);
    await page.waitForTimeout(800);

    await page.screenshot({
      path: path.join(OUT_DIR, 'settings-integrations-zh.png'),
      fullPage: false,
    });
  });
});
