export type ArticleMeta = {
  slug: string;
  titleKey: string;
  readTime: number;
  lastUpdated: string;
};

export type ArticleContent = {
  categorySlug: string;
  categoryNameKey: string;
  titleKey: string;
  readTime: number;
  lastUpdated: string;
  contentHtml: string;
};

const ARTICLE_LIST: Record<string, ArticleMeta[]> = {
  'getting-started': [
    { slug: 'quick-start', titleKey: 'articles.quickStart', readTime: 3, lastUpdated: '2026-02-15' },
    { slug: 'first-chat', titleKey: 'articles.firstChat', readTime: 2, lastUpdated: '2026-02-14' },
  ],
  'line-integration': [
    { slug: 'line-setup-guide', titleKey: 'articles.lineSetupGuide', readTime: 5, lastUpdated: '2026-02-15' },
    { slug: 'webhook', titleKey: 'articles.webhook', readTime: 3, lastUpdated: '2026-02-10' },
  ],
  'knowledge-base': [
    { slug: 'upload-faq', titleKey: 'articles.uploadFaq', readTime: 4, lastUpdated: '2026-02-12' },
  ],
  'settings': [],
  'billing': [],
  'analytics': [],
};

const ARTICLE_CONTENT: Record<string, ArticleContent> = {
  'line-integration/line-setup-guide': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.lineSetupGuide',
    readTime: 5,
    lastUpdated: '2026-02-15',
    contentHtml: `
      <h2>LINE Channel 設定完整指南</h2>
      <h3>步驟 1: 創建 LINE Developers 帳號</h3>
      <ol>
        <li>前往 <a href="https://developers.line.biz/" target="_blank" rel="noopener noreferrer">LINE Developers Console</a></li>
        <li>點擊右上角「登入」按鈕</li>
        <li>使用您的 LINE 帳號登入</li>
      </ol>
      <h3>步驟 2: 創建 Provider</h3>
      <p>Provider 是管理多個 Channel 的容器。</p>
      <ol>
        <li>點擊「Create a new provider」</li>
        <li>輸入 Provider 名稱（例如：您的公司名稱）</li>
        <li>點擊「Create」</li>
      </ol>
      <h3>步驟 3: 創建 Messaging API Channel</h3>
      <ol>
        <li>在 Provider 頁面點擊「Create a channel」</li>
        <li>選擇「Messaging API」</li>
        <li>填寫 Channel name、description、Category 等</li>
        <li>閱讀並同意條款後點擊「Create」</li>
      </ol>
      <h3>步驟 4: 取得 Channel Secret 與 Access Token</h3>
      <p><strong>Channel Secret</strong>：在 Basic settings 分頁找到「Channel secret」並複製。</p>
      <p><strong>Channel Access Token</strong>：在 Messaging API 分頁點擊「Issue」生成 Long-lived token 並複製。</p>
      <h3>步驟 5: 在 CustomerAIPro 中設定</h3>
      <ol>
        <li>登入 CustomerAIPro Dashboard</li>
        <li>前往「設定」→「LINE 整合」</li>
        <li>貼上 Channel Secret 和 Access Token</li>
        <li>點擊「驗證連線」後儲存</li>
      </ol>
      <h3>步驟 6: 設定 Webhook URL</h3>
      <p>在 LINE Developers Console 的 Messaging API 分頁，將 Webhook URL 設為：<code>https://www.customeraipro.com/api/webhook/line</code>，並開啟「Use webhook」。</p>
      <p>需要協助？請查看 <a href="/help">幫助中心</a> 或 <a href="/demo">產品導覽</a>。</p>
    `,
  },
};

export function getCategoryArticleList(categorySlug: string): ArticleMeta[] {
  return ARTICLE_LIST[categorySlug] ?? [];
}

export function getArticleContent(categorySlug: string, articleSlug: string): ArticleContent | null {
  const key = `${categorySlug}/${articleSlug}`;
  return ARTICLE_CONTENT[key] ?? null;
}

export function getAllCategorySlugs(): string[] {
  return Object.keys(ARTICLE_LIST);
}

export type SearchArticle = { categorySlug: string; slug: string; titleKey: string };

export function getAllArticlesForSearch(): SearchArticle[] {
  return getAllCategorySlugs().flatMap((categorySlug) =>
    (ARTICLE_LIST[categorySlug] ?? []).map((art) => ({
      categorySlug,
      slug: art.slug,
      titleKey: art.titleKey,
    }))
  );
}
