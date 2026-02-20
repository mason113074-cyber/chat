/** Single source of truth: only these 6 category slugs are valid. */
export const HELP_CATEGORIES = [
  'getting-started',
  'line-integration',
  'knowledge-base',
  'settings',
  'billing',
  'analytics',
] as const;

export type HelpCategorySlug = (typeof HELP_CATEGORIES)[number];

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

const ARTICLE_LIST: Record<HelpCategorySlug, ArticleMeta[]> = {
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
  'getting-started/quick-start': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.quickStart',
    readTime: 3,
    lastUpdated: '2026-02-15',
    contentHtml: `
      <h2>Quick start guide</h2>
      <p>Get your AI customer service up and running in minutes.</p>
      <h3>Step 1: Create your account</h3>
      <p>Sign up at CustomerAIPro and verify your email.</p>
      <h3>Step 2: Connect LINE (optional)</h3>
      <p>In Dashboard → Settings → LINE, add your Channel Secret and Access Token from LINE Developers Console.</p>
      <h3>Step 3: Add knowledge base</h3>
      <p>Go to Knowledge Base and upload your FAQ or product info (txt, pdf, or paste text).</p>
      <h3>Step 4: Test the chat</h3>
      <p>Use the test chat in Settings or send a message to your LINE bot to see AI replies.</p>
      <p><a href="/help">Back to Help Center</a></p>
    `,
  },
  'getting-started/first-chat': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.firstChat',
    readTime: 2,
    lastUpdated: '2026-02-14',
    contentHtml: `
      <h2>Send your first chat</h2>
      <p>After setting up your knowledge base and LINE (or using the built-in test), send a message to see the AI reply.</p>
      <h3>From LINE</h3>
      <p>Add your bot as a friend and send any question. The AI will answer based on your knowledge base.</p>
      <h3>From Dashboard</h3>
      <p>In Settings you can use the test chat box to try messages without LINE.</p>
      <p><a href="/help">Back to Help Center</a></p>
    `,
  },
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
      <p>需要協助？請查看 <a href="/help">幫助中心</a>。</p>
    `,
  },
  'line-integration/webhook': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.webhook',
    readTime: 3,
    lastUpdated: '2026-02-10',
    contentHtml: `
      <h2>Webhook setup</h2>
      <p>LINE sends events to your webhook URL. Set it in LINE Developers Console → Messaging API.</p>
      <h3>Webhook URL</h3>
      <p><code>https://www.customeraipro.com/api/webhook/line</code></p>
      <h3>Enable webhook</h3>
      <p>Turn on "Use webhook" and verify the connection. Disable "Auto-reply messages" in LINE Official Account Manager so our AI handles replies.</p>
      <p><a href="/help">Back to Help Center</a></p>
    `,
  },
  'knowledge-base/upload-faq': {
    categorySlug: 'knowledge-base',
    categoryNameKey: 'categories.knowledgeBase.title',
    titleKey: 'articles.uploadFaq',
    readTime: 4,
    lastUpdated: '2026-02-12',
    contentHtml: `
      <h2>Upload FAQ to knowledge base</h2>
      <p>Go to Dashboard → Knowledge Base. You can add entries by pasting text or uploading files (txt, pdf, docx).</p>
      <h3>Tips</h3>
      <ul>
        <li>Use clear Q&A format for best results.</li>
        <li>Include product specs, policies, and common questions.</li>
        <li>Download our <a href="/templates/faq-template.txt" download>FAQ template</a> to get started.</li>
      </ul>
      <p><a href="/help">Back to Help Center</a></p>
    `,
  },
};

/** Returns true if slug is a valid help category. */
export function getCategoryBySlug(slug: string): slug is HelpCategorySlug {
  return HELP_CATEGORIES.includes(slug as HelpCategorySlug);
}

/** Returns articles for a category (empty if invalid slug). */
export function getArticlesByCategory(categorySlug: string): ArticleMeta[] {
  return getCategoryBySlug(categorySlug) ? ARTICLE_LIST[categorySlug] ?? [] : [];
}

/** Alias for getArticlesByCategory. */
export function getCategoryArticleList(categorySlug: string): ArticleMeta[] {
  return getArticlesByCategory(categorySlug);
}

/** Returns article content or null if not found. */
export function getArticle(categorySlug: string, articleSlug: string): ArticleContent | null {
  return getArticleContent(categorySlug, articleSlug);
}

export function getArticleContent(categorySlug: string, articleSlug: string): ArticleContent | null {
  if (!getCategoryBySlug(categorySlug)) return null;
  const key = `${categorySlug}/${articleSlug}`;
  return ARTICLE_CONTENT[key] ?? null;
}

export function getAllCategorySlugs(): HelpCategorySlug[] {
  return [...HELP_CATEGORIES];
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
