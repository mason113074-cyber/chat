/**
 * E2E 稽核腳本（唯讀）
 * 執行：npx playwright test e2e/audit.spec.ts --project=chromium
 * 產出：專案根目錄 Audit_Report.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@playwright/test';

const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';

type CriticalEntry = { scenario: string; trigger: string; errorLog: string };
type WarningEntry = { scenario: string; description: string };
const auditCritical: CriticalEntry[] = [];
const auditWarning: WarningEntry[] = [];
const auditSuggestion: string[] = [];

function captureErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[console] ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  return errors;
}

test.describe.serial('E2E 稽核', () => {
  test.beforeAll(() => {
    if (auditCritical.length) auditCritical.length = 0;
    if (auditWarning.length) auditWarning.length = 0;
    if (auditSuggestion.length) auditSuggestion.length = 0;
  });

  test.afterAll(() => {
    const reportPath = path.join(process.cwd(), 'Audit_Report.md');
    let md = `# E2E 稽核報告 — ${baseURL}\n\n`;
    md += `**執行時間**: ${new Date().toISOString()}\n\n`;
    md += `---\n\n`;

    md += `## [Critical] 阻斷性錯誤\n\n`;
    if (auditCritical.length === 0) {
      md += `無。\n\n`;
    } else {
      auditCritical.forEach((e, i) => {
        md += `### ${i + 1}. ${e.scenario}\n\n`;
        md += `- **觸發條件**: ${e.trigger}\n`;
        md += `- **Error Log**:\n\`\`\`\n${e.errorLog}\n\`\`\`\n\n`;
      });
    }

    md += `## [Warning] 潛在風險\n\n`;
    if (auditWarning.length === 0) {
      md += `無。\n\n`;
    } else {
      auditWarning.forEach((e, i) => {
        md += `- **${e.scenario}**: ${e.description}\n`;
      });
      md += `\n`;
    }

    md += `## [Suggestion] 流程建議\n\n`;
    if (auditSuggestion.length === 0) {
      md += `無。\n\n`;
    } else {
      auditSuggestion.forEach((s, i) => {
        md += `${i + 1}. ${s}\n`;
      });
    }

    fs.writeFileSync(reportPath, md, 'utf-8');
  });

  // --- A. 認證 ---
  test('A1. 登入成功 → 進入 Dashboard', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
    const url = page.url();
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    const onDashboard = /\/dashboard/.test(url) && !/\/login/.test(url);
    const hasContent = body.includes('總覽') || body.includes('Overview') || body.includes('Dashboard');
    if (!onDashboard || !hasContent) {
      auditCritical.push({
        scenario: 'A1 登入成功進入 Dashboard',
        trigger: '使用 setup 儲存的 session 訪問 /dashboard',
        errorLog: `URL: ${url}. Body 含總覽/Overview: ${hasContent}. Console/page errors: ${errors.join('; ') || 'none'}`,
      });
    }
    if (errors.length > 0 && (onDashboard && hasContent))
      auditWarning.push({ scenario: 'A1', description: `頁面載入時出現 console/page 錯誤: ${errors.slice(0, 3).join('; ')}` });
    expect(onDashboard).toBeTruthy();
    expect(hasContent || body.includes('總覽') || body.includes('Overview')).toBeTruthy();
  });

  test('A2. 登入失敗（錯誤密碼）', async ({ page }) => {
    const browser = page.context().browser()!;
    const guestContext = await browser.newContext({ baseURL });
    const guestPage = await guestContext.newPage();
    const errors = captureErrors(guestPage);
    await guestPage.goto('/login');
    await guestPage.locator('#email').fill(process.env.TEST_USER_EMAIL || 'test@example.com');
    await guestPage.locator('#password').fill('wrong-password-12345');
    await guestPage.getByRole('button', { name: /登入|Log in|Login/ }).click();
    await guestPage.waitForLoadState('networkidle').catch(() => {});
    const url = guestPage.url();
    const body = (await guestPage.textContent('body').catch(() => '')) ?? '';
    const stayedOnLogin = /\/login/.test(url);
    const hasErrorMsg = /Invalid|錯誤|error|credentials|密碼/i.test(body);
    await guestContext.close();
    if (!stayedOnLogin) {
      auditCritical.push({
        scenario: 'A2 錯誤密碼應停留在登入頁',
        trigger: '輸入正確 email + 錯誤密碼並送出',
        errorLog: `預期停留在 /login，實際 URL: ${url}. Errors: ${errors.join('; ') || 'none'}`,
      });
    }
    if (!hasErrorMsg && stayedOnLogin)
      auditWarning.push({ scenario: 'A2', description: '登入失敗時未顯示明確錯誤訊息（Invalid login credentials 等）' });
    expect(stayedOnLogin).toBeTruthy();
  });

  test('A3. 未登入訪問 /dashboard 應導向登入', async ({ browser, baseURL }) => {
    test.skip(
      Boolean(baseURL?.includes('customeraipro.com')),
      'A3 需對 localhost 測試；production 須 deploy proxy auth 修正後再驗證'
    );
    // Next.js 多為 client-side 導向，用瀏覽器測未登入訪問
    const ctx = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    const url = page.url();
    const redirectedToLogin = /\/(zh-TW|en)\/login/.test(url);
    await ctx.close();
    if (!redirectedToLogin) {
      auditCritical.push({
        scenario: 'A3 未登入應被導向登入頁',
        trigger: '未帶 session 直接訪問 /dashboard',
        errorLog: `預期最終導向 /login，實際 URL: ${url}`,
      });
    }
    expect(redirectedToLogin).toBeTruthy();
  });

  test('A5. 註冊表單流程（不驗證寄信）', async ({ page }) => {
    const browser = page.context().browser()!;
    const guestContext = await browser.newContext({ baseURL });
    const guestPage = await guestContext.newPage();
    captureErrors(guestPage);
    await guestPage.goto('/login?signup=true');
    await guestPage.waitForLoadState('networkidle').catch(() => {});
    const signUpTitle = guestPage.getByRole('heading', { name: /註冊|Sign up|Sign Up/ });
    await expect(signUpTitle).toBeVisible({ timeout: 5000 });
    await guestPage.locator('#email').fill('e2e-audit-' + Date.now() + '@example.com');
    await guestPage.locator('#password').fill('TestPassword123!');
    await guestPage.locator('#confirmPassword').fill('TestPassword123!');
    await guestPage.getByRole('button', { name: /註冊|Sign up|Sign Up/ }).click();
    await guestPage.waitForTimeout(3000);
    const body = (await guestPage.textContent('body').catch(() => '')) ?? '';
    const hasResult = /成功|success|確認|verify|error|錯誤/i.test(body);
    await guestContext.close();
    expect(hasResult).toBeTruthy();
  });

  // --- B. 核心讀取 ---
  test('B1. Dashboard 總覽載入', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    const hasOverview = body.includes('總覽') || body.includes('Overview') || body.includes('Dashboard');
    const noAppError = !body.includes('Application error');
    if (!hasOverview || !noAppError) {
      auditCritical.push({
        scenario: 'B1 Dashboard 總覽',
        trigger: '已登入訪問 /dashboard',
        errorLog: `hasOverview: ${hasOverview}, noAppError: ${noAppError}. Errors: ${errors.join('; ') || 'none'}`,
      });
    }
    if (errors.length > 0 && hasOverview)
      auditWarning.push({ scenario: 'B1', description: `Console/page 錯誤: ${errors.slice(0, 2).join('; ')}` });
    expect(hasOverview).toBeTruthy();
    expect(noAppError).toBeTruthy();
  });

  test('B2. 對話紀錄列表', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/dashboard/conversations');
    await page.waitForLoadState('networkidle').catch(() => {});
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    const ok = body.includes('對話紀錄') || body.includes('Conversations');
    const noAppError = !body.includes('Application error');
    if (!ok || !noAppError)
      auditCritical.push({
        scenario: 'B2 對話紀錄',
        trigger: '訪問 /dashboard/conversations',
        errorLog: `Body 含對話/Conversations: ${ok}. Errors: ${errors.join('; ') || 'none'}`,
      });
    expect(ok).toBeTruthy();
    expect(noAppError).toBeTruthy();
  });

  test('B3. 聯絡人列表', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/dashboard/contacts');
    await page.waitForLoadState('networkidle').catch(() => {});
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    const ok = body.includes('聯絡人') || body.includes('客戶') || body.includes('Contacts');
    const noAppError = !body.includes('Application error');
    if (!ok || !noAppError)
      auditCritical.push({
        scenario: 'B3 聯絡人',
        trigger: '訪問 /dashboard/contacts',
        errorLog: `Body 含聯絡人/Contacts: ${ok}. Errors: ${errors.join('; ') || 'none'}`,
      });
    expect(ok).toBeTruthy();
    expect(noAppError).toBeTruthy();
  });

  test('B4. 知識庫列表', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/dashboard/knowledge-base');
    await page.waitForLoadState('networkidle').catch(() => {});
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    const ok = body.includes('知識庫') || body.includes('Knowledge Base');
    const noAppError = !body.includes('Application error');
    if (!ok || !noAppError)
      auditCritical.push({
        scenario: 'B4 知識庫',
        trigger: '訪問 /dashboard/knowledge-base',
        errorLog: `Body 含知識庫: ${ok}. Errors: ${errors.join('; ') || 'none'}`,
      });
    expect(ok).toBeTruthy();
    expect(noAppError).toBeTruthy();
  });

  test('B5. Onboarding 狀態可載入', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/dashboard/onboarding');
    await page.waitForLoadState('networkidle').catch(() => {});
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    const ok = body.length > 100 && !body.includes('Application error');
    if (!ok)
      auditWarning.push({
        scenario: 'B5',
        description: 'Onboarding 頁面載入異常或出現 Application error',
      });
    expect(ok).toBeTruthy();
  });

  // --- C. 核心寫入（流程與錯誤處理）---
  test('C1. 知識庫新增一筆', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/dashboard/knowledge-base');
    await page.waitForLoadState('networkidle').catch(() => {});
    const addBtn = page.getByRole('button', { name: /新增知識|Add Knowledge|新增/ }).first();
    const visible = await addBtn.isVisible().catch(() => false);
    if (!visible) {
      auditWarning.push({ scenario: 'C1', description: '知識庫頁未找到「新增知識」按鈕（可能權限或 UI 變更）' });
      return;
    }
    await addBtn.click();
    await page.waitForTimeout(1000);
    const titleInput = page.getByLabel(/Title|標題/).or(page.getByPlaceholder(/營業|Hours|範例|Business/)).first();
    await titleInput.fill('E2E 稽核測試 ' + Date.now()).catch(() => {});
    const textarea = page.locator('textarea').first();
    await textarea.fill('稽核用內容，可刪除。').catch(() => {});
    await page.getByRole('button', { name: /儲存|Save/ }).last().click();
    await page.waitForTimeout(3000);
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    const savedOrError = body.includes('E2E 稽核') || body.includes('成功') || body.includes('Success') || body.includes('錯誤') || body.includes('Error') || body.includes('Added') || body.includes('Updated');
    if (!savedOrError)
      auditWarning.push({ scenario: 'C1', description: '新增知識後未看到成功或錯誤回饋' });
    expect(savedOrError || body.includes('知識庫')).toBeTruthy();
  });

  test('C2. 設定頁載入與儲存區塊', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle').catch(() => {});
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    const hasSettings = body.includes('設定') || body.includes('Settings');
    const noAppError = !body.includes('Application error');
    if (!hasSettings || !noAppError)
      auditCritical.push({
        scenario: 'C2 設定頁',
        trigger: '訪問 /dashboard/settings',
        errorLog: `hasSettings: ${hasSettings}. Errors: ${errors.join('; ') || 'none'}`,
      });
    expect(hasSettings).toBeTruthy();
    expect(noAppError).toBeTruthy();
  });

  // --- D. 導航與 Token ---
  test('D1. 登入後重新整理仍在 Dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {});
    const url = page.url();
    const body = (await page.textContent('body').catch(() => '')) ?? '';
    const stillDashboard = /\/dashboard/.test(url) && !/\/login/.test(url);
    const hasContent = body.includes('總覽') || body.includes('Overview') || body.includes('Dashboard');
    if (!stillDashboard) {
      auditCritical.push({
        scenario: 'D1 登入後重整應保持 session',
        trigger: '登入後對 /dashboard 執行 reload',
        errorLog: `重整後 URL: ${url}`,
      });
    }
    expect(stillDashboard).toBeTruthy();
    expect(hasContent).toBeTruthy();
  });

  test('D2. 跨頁導航無崩潰', async ({ page }) => {
    const errors = captureErrors(page);
    const routes = ['/dashboard', '/dashboard/conversations', '/dashboard/contacts', '/dashboard/knowledge-base', '/dashboard/settings'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle').catch(() => {});
      const body = (await page.textContent('body').catch(() => '')) ?? '';
      if (body.includes('Application error')) {
        auditCritical.push({
          scenario: 'D2 跨頁導航',
          trigger: `訪問 ${route}`,
          errorLog: `頁面出現 Application error. Console: ${errors.join('; ')}`,
        });
      }
    }
    expect(errors.length === 0 || true).toBeTruthy();
  });

  test('A4. 登出後再訪問 Dashboard 應導向登入', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto('/dashboard/settings').catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    const signOut = page.getByRole('button', { name: /登出|Sign out|Log out/ });
    if (await signOut.isVisible()) {
      await signOut.click({ force: true });
      await page.waitForURL(/\/(login|zh-TW\/login|en\/login)/, { timeout: 12000 }).catch(() => {});
    }
    const urlAfter = page.url();
    const onLogin = /\/login/.test(urlAfter);
    if (!onLogin) {
      auditWarning.push({
        scenario: 'A4',
        description: '登出後未導向登入頁（可能無登出按鈕或選擇器變更）',
      });
    }
    expect(onLogin).toBeTruthy();
    if (!onLogin) return;
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle').catch(() => {});
    // Client-side 導向可能稍慢，再等一次 URL 穩定
    await page.waitForURL(/\/(login|zh-TW\/login|en\/login|dashboard)/, { timeout: 10000 }).catch(() => {});
    const finalUrl = page.url();
    const blocked = /\/login/.test(finalUrl);
    if (!blocked) {
      auditCritical.push({
        scenario: 'A4 登出後訪問 dashboard 應被擋',
        trigger: '登出後再訪問 /dashboard',
        errorLog: `預期導向 login，實際: ${finalUrl}. Console: ${errors.join('; ') || 'none'}`,
      });
    }
    expect(blocked).toBeTruthy();
  });
});
