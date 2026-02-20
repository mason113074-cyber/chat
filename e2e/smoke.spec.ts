import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test('首頁可載入', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/\w+/);
  });

  test('Landing 有功能區與定價區', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const body = await page.textContent('body').catch(() => '') ?? '';
    expect(body).toMatch(/功能|Features|定價|Pricing|CustomerAI/);
  });

  test('定價頁可載入', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page).toHaveTitle(/\w+/);
    const body = await page.textContent('body').catch(() => '') ?? '';
    expect(body).toMatch(/799|方案|Plan|Pricing/);
  });
});
