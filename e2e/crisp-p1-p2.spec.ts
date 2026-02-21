import { test, expect } from '@playwright/test';

/**
 * E2E 對齊 Crisp P1-P2 功能（內部備註、工單、AI 品質納入知識庫、Status、分析匯出）。
 * 需已登入（storageState）。本機測試前建議套用 migration 028。
 */
test.describe('Crisp P1-P2 對齊', () => {
  test('對話詳情頁有內部備註區塊', async ({ page }) => {
    await page.goto('/dashboard/conversations');
    await page.waitForLoadState('networkidle');
    const firstLink = page.locator('a[href*="/dashboard/conversations/"]').first();
    if ((await firstLink.count()) === 0) {
      test.skip(true, 'No conversations to open');
      return;
    }
    await firstLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=內部備註')).toBeVisible();
  });

  test('AI 品質頁有低信心區與納入知識庫', async ({ page }) => {
    await page.goto('/dashboard/ai-quality');
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/login')) {
      test.skip(true, 'Not logged in');
      return;
    }
    await expect(page.locator('body')).toContainText(/AI 品質|品質|信心|confidence/i);
    // 等資料載入後，低信心區會顯示「納入知識庫」按鈕或空狀態（中/英）
    await expect(
      page.getByRole('button', { name: /納入知識庫/ }).or(
        page.getByText(/尚無數據|No data yet|No data/i)
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('分析匯出 API 回傳 CSV', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const res = await page.request.get('/api/analytics/export?format=csv&days=7');
    if (res.status() === 401) {
      test.skip(true, 'Session invalid');
      return;
    }
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toMatch(/date|conversations|resolution/);
  });

  test('Status 頁可載入', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/服務狀態|正常|運作/);
  });
});
