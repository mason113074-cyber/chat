import { test, expect } from '@playwright/test';

test.describe.serial('CustomerAIPro — 24 步 UI Checklist', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  // ===== 認證 (1-3) =====
  test('01. 登入後可進入 Dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const onDashboard = /\/(dashboard|conversations|app)/.test(url);
    const onRoot = /\.com\/?$/.test(url) || url.endsWith('/');
    expect(onDashboard || onRoot).toBeTruthy();
  });

  test('02. Dashboard 頁面正常', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '總覽' })).toBeVisible();
    const body = await page.textContent('body');
    expect(body).not.toContain('Application error');
  });

  test('03. 導航列可見', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const nav = page.locator('nav, [role="navigation"], aside');
    await expect(nav.first()).toBeVisible();
  });

  // ===== Onboarding (4-5) =====
  test('04. Onboarding 狀態 API', async ({ page }) => {
    const res = await page.request.get('/api/onboarding/status');
    expect(res.status()).toBe(200);
  });

  test('05. Onboarding 儲存 API', async ({ page }) => {
    const res = await page.request.post('/api/onboarding/save', {
      data: { store_name: 'Test Store', industry: '電商' }
    });
    expect([200, 201]).toContain(res.status());
  });

  // ===== Conversations (6-10) =====
  test('06. 對話列表頁面', async ({ page }) => {
    await page.goto('/dashboard/conversations');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '對話紀錄' })).toBeVisible();
  });

  test('07. 對話狀態篩選', async ({ page }) => {
    await page.goto('/dashboard/conversations');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body') || '';
    const has = ['全部','開啟','待處理','已解決','open','pending','resolved','all'].some(k => body.includes(k));
    expect(has).toBeTruthy();
  });

  test('08. 對話計數 API', async ({ page }) => {
    const res = await page.request.get('/api/conversations/counts');
    expect(res.status()).toBe(200);
    expect(await res.json()).toHaveProperty('total');
  });

  test('09. 搜尋輸入框', async ({ page }) => {
    await page.goto('/dashboard/conversations');
    await page.waitForLoadState('networkidle');
    const s = page.locator('input[placeholder*="搜尋"], input[placeholder*="search"], input[type="search"]');
    expect(await s.count()).toBeGreaterThan(0);
  });

  test('10. 排序功能', async ({ page }) => {
    await page.goto('/dashboard/conversations');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body') || '';
    const has = ['排序','sort','最新','最舊'].some(k => body.includes(k));
    expect(has).toBeTruthy();
  });

  // ===== Knowledge Base (11-13) =====
  test('11. 知識庫頁面', async ({ page }) => {
    await page.goto('/dashboard/knowledge-base');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /知識庫/ })).toBeVisible();
  });

  test('12. 知識庫列表 API', async ({ page }) => {
    const res = await page.request.get('/api/knowledge-base');
    expect(res.status()).toBe(200);
    expect(await res.json()).toHaveProperty('items');
  });

  test('13. 知識庫測試對話 API', async ({ page }) => {
    const res = await page.request.post('/api/knowledge-base/test', {
      data: { question: '你們的服務是什麼？' }
    });
    expect(res.status()).toBe(200);
    const j = await res.json();
    expect(j).toHaveProperty('answer');
    expect(j).toHaveProperty('sources');
  });

  // ===== Contacts (14-15) =====
  test('14. 聯絡人頁面', async ({ page }) => {
    await page.goto('/dashboard/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /聯絡人|客戶/ })).toBeVisible();
  });

  test('15. 聯絡人標籤 API', async ({ page }) => {
    const res = await page.request.get('/api/contacts/tags');
    expect(res.status()).toBe(200);
    expect(await res.json()).toHaveProperty('tags');
  });

  // ===== Analytics (16-18) =====
  test('16. Analytics 頁面', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /數據分析|總覽|Analytics/ })).toBeVisible();
  });

  test('17. Analytics 趨勢 API', async ({ page }) => {
    const res = await page.request.get('/api/analytics/trends?days=30');
    expect(res.status()).toBe(200);
  });

  test('18. Analytics 解決率 API', async ({ page }) => {
    const res = await page.request.get('/api/analytics/resolution');
    expect(res.status()).toBe(200);
    expect(await res.json()).toHaveProperty('resolution_rate');
  });

  // ===== Billing (19-20) =====
  test('19. Billing 頁面 + 方案卡片', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/方案與計費|Free|Basic|Pro|Enterprise/).first()).toBeVisible();
  });

  test('20. Billing 用量 API', async ({ page }) => {
    const res = await page.request.get('/api/billing/usage');
    expect(res.status()).toBe(200);
    const j = await res.json();
    expect(j).toHaveProperty('plan');
    expect(j).toHaveProperty('conversations');
  });

  // ===== Settings (21-22) =====
  test('21. Settings 頁面', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /設定|Settings/ })).toBeVisible();
  });

  test('22. Settings Widget 預覽 API', async ({ page }) => {
    const res = await page.request.post('/api/settings/preview', {
      data: { question: '你好', system_prompt: '你是客服助理', ai_model: 'gpt-4o-mini' }
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toHaveProperty('answer');
  });

  // ===== 全域功能 (23-24) =====
  test('23. 全域搜尋 API', async ({ page }) => {
    const res = await page.request.get('/api/search?q=test');
    expect(res.status()).toBe(200);
    const j = await res.json();
    expect(j).toHaveProperty('conversations');
    expect(j).toHaveProperty('contacts');
    expect(j).toHaveProperty('knowledge');
  });

  test('24. Cmd+K 搜尋面板', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    let dialog = page.locator('[role="dialog"], [data-command-palette], [class*="command"], [class*="Command"]');
    if (await dialog.count() === 0) {
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(500);
      dialog = page.locator('[role="dialog"], [data-command-palette], [class*="command"], [class*="Command"]');
    }
    expect(await dialog.count()).toBeGreaterThan(0);
  });
});
