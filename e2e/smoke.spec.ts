import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('首頁可載入', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/\w+/);
  });
});
