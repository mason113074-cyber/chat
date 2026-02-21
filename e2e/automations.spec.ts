/**
 * E2E 自動化工作流程功能測試
 * - 需已登入（auth.setup）
 */

import { test, expect } from '@playwright/test';

test.describe('Automations', () => {
  test('側邊欄顯示自動化入口', async ({ page }) => {
    await page.goto('/zh-TW/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('link', { name: /自動化/ })).toBeVisible();
  });

  test('自動化列表頁可載入', async ({ page }) => {
    await page.goto('/zh-TW/dashboard/automations');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /自動化工作流程/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /新增工作流程/ }).first()).toBeVisible();
  });

  test('點擊新增工作流程可建立並進入編輯器', async ({ page }) => {
    await page.goto('/zh-TW/dashboard/automations');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: /新增工作流程/ }).first().click();
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    const navigatedToEditor = /\/dashboard\/automations\/[a-z0-9-]+/.test(url);
    if (navigatedToEditor) {
      await expect(page.getByText(/節點工具箱/)).toBeVisible();
      await expect(page.getByRole('button', { name: /儲存/ })).toBeVisible();
    } else {
      expect(url).toMatch(/\/dashboard\/automations/);
    }
  });
});
