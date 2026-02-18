/**
 * 完整 E2E 流程（Production）
 * - 依賴 auth.setup 已登入（TEST_USER_EMAIL / TEST_USER_PASSWORD）
 * - 執行所有 user flow、每頁截圖、記錄錯誤、產生報告
 * 執行：TEST_BASE_URL=https://www.customeraipro.com npx playwright test e2e/full-flow-production.spec.ts --project=chromium
 * 或：npm run test:ui:headed:prod -- e2e/full-flow-production.spec.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = path.join(process.cwd(), 'e2e', 'screenshots', 'production');
const REPORT_JSON = path.join(process.cwd(), 'e2e', 'test-report.json');
const REPORT_MD = path.join(process.cwd(), 'e2e', 'test-report.md');

type ReportEntry = {
  page: string;
  url: string;
  screenshot: string;
  errors: string[];
  passed: boolean;
};

const reportEntries: ReportEntry[] = [];

function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

function writeReport() {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const total = reportEntries.length;
  const failed = reportEntries.filter((e) => !e.passed).length;
  const allErrors = reportEntries.flatMap((e) => e.errors);

  fs.writeFileSync(
    REPORT_JSON,
    JSON.stringify(
      { baseURL, runAt: new Date().toISOString(), total, failed, entries: reportEntries, allErrors },
      null,
      2
    ),
    'utf-8'
  );

  let md = `# E2E 測試報告 — ${baseURL}\n\n`;
  md += `- **執行時間**: ${new Date().toISOString()}\n`;
  md += `- **總頁數**: ${total}\n`;
  md += `- **失敗**: ${failed}\n`;
  md += `- **錯誤數**: ${allErrors.length}\n\n`;
  md += `## 頁面結果\n\n| 頁面 | URL | 通過 | 錯誤數 | 截圖 |\n|------|-----|------|--------|------|\n`;

  for (const e of reportEntries) {
    const rel = path.relative(process.cwd(), e.screenshot);
    md += `| ${e.page} | ${e.url} | ${e.passed ? '✅' : '❌'} | ${e.errors.length} | \`${rel}\` |\n`;
  }

  if (allErrors.length > 0) {
    md += `\n## 錯誤清單\n\n`;
    allErrors.forEach((err, i) => {
      md += `${i + 1}. ${String(err).replace(/\n/g, ' ')}\n`;
    });
  }

  fs.writeFileSync(REPORT_MD, md, 'utf-8');
}

test.describe.serial('Production 完整 User Flow', () => {
  test.beforeAll(() => {
    ensureScreenshotDir();
  });

  test.afterEach(({ }, testInfo) => {
    const last = reportEntries[reportEntries.length - 1];
    if (last) last.passed = testInfo.status === 'passed';
  });

  test.afterAll(() => {
    writeReport();
  });

  test('01. 總覽 Dashboard', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`[console] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      errors.push(`[pageerror] ${err.message}`);
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const screenshotPath = path.join(SCREENSHOT_DIR, '01-dashboard.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });

    const body = (await page.textContent('body').catch(() => '')) ?? '';
    expect(body).toContain('總覽');
    expect(body).not.toContain('Application error');

    reportEntries.push({
      page: '總覽 Dashboard',
      url,
      screenshot: screenshotPath,
      errors: [...errors],
      passed: true,
    });
  });

  test('02. 對話紀錄', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/dashboard/conversations');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const screenshotPath = path.join(SCREENSHOT_DIR, '02-conversations.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    expect(body).toContain('對話紀錄');
    expect(body).not.toContain('Application error');

    reportEntries.push({ page: '對話紀錄', url, screenshot: screenshotPath, errors: [...errors], passed: true });
  });

  test('03. 客戶聯絡人', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/dashboard/contacts');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const screenshotPath = path.join(SCREENSHOT_DIR, '03-contacts.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    expect(body?.includes('聯絡人') || body?.includes('客戶')).toBeTruthy();
    expect(body).not.toContain('Application error');

    reportEntries.push({ page: '客戶聯絡人', url, screenshot: screenshotPath, errors: [...errors], passed: true });
  });

  test('04. 數據分析', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const screenshotPath = path.join(SCREENSHOT_DIR, '04-analytics.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    expect(body?.includes('數據') || body?.includes('分析') || body?.includes('Analytics')).toBeTruthy();
    expect(body).not.toContain('Application error');

    reportEntries.push({ page: '數據分析', url, screenshot: screenshotPath, errors: [...errors], passed: true });
  });

  test('05. 方案與計費', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/dashboard/billing');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const screenshotPath = path.join(SCREENSHOT_DIR, '05-billing.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    expect(body?.includes('方案') || body?.includes('計費') || body?.includes('Free') || body?.includes('Basic')).toBeTruthy();
    expect(body).not.toContain('Application error');

    reportEntries.push({ page: '方案與計費', url, screenshot: screenshotPath, errors: [...errors], passed: true });
  });

  test('06. 知識庫', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/dashboard/knowledge-base');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const screenshotPath = path.join(SCREENSHOT_DIR, '06-knowledge-base.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    expect(body).toContain('知識庫');
    expect(body).not.toContain('Application error');

    reportEntries.push({ page: '知識庫', url, screenshot: screenshotPath, errors: [...errors], passed: true });
  });

  test('07. 設定', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const screenshotPath = path.join(SCREENSHOT_DIR, '07-settings.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    expect(body?.includes('設定') || body?.includes('Settings')).toBeTruthy();
    expect(body).not.toContain('Application error');

    reportEntries.push({ page: '設定', url, screenshot: screenshotPath, errors: [...errors], passed: true });
  });
});
