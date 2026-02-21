import { test, expect } from '@playwright/test';

test.describe('Status Page', () => {
  test('服務狀態頁可載入', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/服務狀態|Status/);
    await expect(page.locator('body')).toContainText(/正常運作|Operational|運作/);
  });

  test('Status 頁無需登入', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toMatch(/\/login/);
  });
});
