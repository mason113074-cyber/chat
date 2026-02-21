/**
 * Sprint A：左側 Sidebar 導航 E2E 測試
 * - 需已登入（auth.setup）
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Sidebar', () => {
  test('Dashboard 顯示 Sidebar 品牌與導航', async ({ page }) => {
    await page.goto('/zh-TW/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('link', { name: 'CustomerAI Pro' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /總覽/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /對話紀錄/ })).toBeVisible();
  });

  test('TopBar 顯示搜尋與語言切換', async ({ page }) => {
    await page.goto('/zh-TW/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText(/搜尋/)).toBeVisible();
    await expect(page.locator('header').getByText(/EN|繁中/)).toBeVisible();
  });
});
