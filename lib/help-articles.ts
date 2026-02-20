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
    { slug: 'welcome', titleKey: 'articles.welcome', readTime: 2, lastUpdated: '2026-02-20' },
    { slug: 'account-setup', titleKey: 'articles.accountSetup', readTime: 3, lastUpdated: '2026-02-20' },
    { slug: 'first-10-minutes', titleKey: 'articles.first10Minutes', readTime: 5, lastUpdated: '2026-02-20' },
    { slug: 'dashboard-overview', titleKey: 'articles.dashboardOverview', readTime: 4, lastUpdated: '2026-02-20' },
    { slug: 'first-chat-test', titleKey: 'articles.firstChatTest', readTime: 3, lastUpdated: '2026-02-20' },
  ],
  'line-integration': [
    { slug: 'line-setup-guide', titleKey: 'articles.lineSetupGuide', readTime: 10, lastUpdated: '2026-02-20' },
    { slug: 'webhook-setup', titleKey: 'articles.webhookSetup', readTime: 5, lastUpdated: '2026-02-20' },
    { slug: 'rich-menu-setup', titleKey: 'articles.richMenuSetup', readTime: 7, lastUpdated: '2026-02-20' },
    { slug: 'message-types', titleKey: 'articles.messageTypes', readTime: 6, lastUpdated: '2026-02-20' },
    { slug: 'auto-reply-vs-webhook', titleKey: 'articles.autoReplyVsWebhook', readTime: 4, lastUpdated: '2026-02-20' },
    { slug: 'switch-channels', titleKey: 'articles.switchChannels', readTime: 3, lastUpdated: '2026-02-20' },
  ],
  'knowledge-base': [
    { slug: 'upload-first-kb', titleKey: 'articles.uploadFirstKb', readTime: 4, lastUpdated: '2026-02-20' },
    { slug: 'kb-best-practices', titleKey: 'articles.kbBestPractices', readTime: 8, lastUpdated: '2026-02-20' },
    { slug: 'using-templates', titleKey: 'articles.usingTemplates', readTime: 5, lastUpdated: '2026-02-20' },
    { slug: 'manage-multiple-kb', titleKey: 'articles.manageMultipleKb', readTime: 6, lastUpdated: '2026-02-20' },
    { slug: 'troubleshoot-ai', titleKey: 'articles.troubleshootAi', readTime: 7, lastUpdated: '2026-02-20' },
  ],
  'settings': [
    { slug: 'customize-ai-style', titleKey: 'articles.customizeAiStyle', readTime: 6, lastUpdated: '2026-02-20' },
    { slug: 'fallback-messages', titleKey: 'articles.fallbackMessages', readTime: 4, lastUpdated: '2026-02-20' },
    { slug: 'team-management', titleKey: 'articles.teamManagement', readTime: 5, lastUpdated: '2026-02-20' },
    { slug: 'notifications', titleKey: 'articles.notifications', readTime: 3, lastUpdated: '2026-02-20' },
  ],
  'billing': [
    { slug: 'pricing-plans', titleKey: 'articles.pricingPlans', readTime: 5, lastUpdated: '2026-02-20' },
    { slug: 'how-to-upgrade', titleKey: 'articles.howToUpgrade', readTime: 4, lastUpdated: '2026-02-20' },
    { slug: 'billing-faq', titleKey: 'articles.billingFaq', readTime: 6, lastUpdated: '2026-02-20' },
  ],
  'analytics': [
    { slug: 'understanding-analytics', titleKey: 'articles.understandingAnalytics', readTime: 7, lastUpdated: '2026-02-20' },
    { slug: 'conversation-history', titleKey: 'articles.conversationHistory', readTime: 5, lastUpdated: '2026-02-20' },
    { slug: 'improve-performance', titleKey: 'articles.improvePerformance', readTime: 8, lastUpdated: '2026-02-20' },
  ],
};

const ARTICLE_CONTENT: Record<string, ArticleContent> = {
  'getting-started/welcome': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.welcome',
    readTime: 2,
    lastUpdated: '2026-02-20',
    contentHtml: `
      <h2>Welcome to CustomerAIPro</h2>
      <p>CustomerAIPro is an AI-powered customer service platform that helps businesses automate responses via LINE messaging using GPT-4 and custom knowledge bases.</p>
      <h3>What Can You Do?</h3>
      <ul>
        <li><strong>Connect LINE</strong>: Integrate your LINE Official Account in minutes</li>
        <li><strong>Upload Knowledge</strong>: Add your FAQs, product info, and policies</li>
        <li><strong>AI Responses</strong>: Let AI handle most customer inquiries automatically</li>
        <li><strong>Track Performance</strong>: Monitor conversation volume and satisfaction</li>
      </ul>
      <h3>Who Is This For?</h3>
      <p>E-commerce businesses, customer service teams, and SMBs looking for 24/7 AI-powered support.</p>
      <h3>Next Steps</h3>
      <ol>
        <li><a href="/help/line-integration/line-setup-guide">Set up your LINE Channel</a></li>
        <li><a href="/help/knowledge-base/upload-first-kb">Upload your first knowledge base</a></li>
        <li><a href="/help/getting-started/first-chat-test">Test your AI chatbot</a></li>
      </ol>
      <p><a href="/help">Back to Help Center</a></p>
    `,
  },
  'getting-started/account-setup': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.accountSetup',
    readTime: 3,
    lastUpdated: '2026-02-20',
    contentHtml: `
      <h2>Account Setup Guide</h2>
      <p>Complete your account registration and profile so you can start using CustomerAIPro.</p>
      <h3>Register</h3>
      <p>Sign up with email or Google. Verify your email if you use email registration.</p>
      <h3>Profile & Language</h3>
      <p>Set your display name, choose language (English / 繁體中文), and timezone in Settings.</p>
      <p><a href="/help">Back to Help Center</a></p>
    `,
  },
  'getting-started/first-10-minutes': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.first10Minutes',
    readTime: 5,
    lastUpdated: '2026-02-20',
    contentHtml: `
      <h2>Your First 10 Minutes</h2>
      <p>A quick checklist to get your AI customer service running.</p>
      <ol>
        <li><strong>Connect LINE</strong> (about 2 min) — <a href="/help/line-integration/line-setup-guide">LINE Setup Guide</a></li>
        <li><strong>Upload a knowledge base</strong> (about 3 min) — Use our templates or paste your FAQ</li>
        <li><strong>Test the AI</strong> (about 2 min) — Send a message from LINE or the Dashboard test chat</li>
        <li><strong>Invite team members</strong> (optional) — <a href="/help/settings/team-management">Team Management</a></li>
      </ol>
      <p><a href="/help">Back to Help Center</a></p>
    `,
  },
  'getting-started/dashboard-overview': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.dashboardOverview',
    readTime: 4,
    lastUpdated: '2026-02-20',
    contentHtml: `
      <h2>Understanding the Dashboard</h2>
      <p>The Dashboard shows today's conversations, AI metrics, and the latest chat list. Use the sidebar to open Conversations, Knowledge Base, Analytics, and Settings.</p>
      <p><a href="/help">Back to Help Center</a></p>
    `,
  },
  'getting-started/first-chat-test': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.firstChatTest',
    readTime: 3,
    lastUpdated: '2026-02-20',
    contentHtml: `
      <h2>First Chat Test</h2>
      <p>Test your AI in the Dashboard (Settings → test chat) or by sending a message to your LINE bot. If replies are wrong, add or refine content in your <a href="/help/knowledge-base/upload-first-kb">knowledge base</a> or adjust <a href="/help/settings/customize-ai-style">AI style</a> (temperature, max tokens).</p>
      <p><a href="/help">Back to Help Center</a></p>
    `,
  },
  'line-integration/line-setup-guide': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.lineSetupGuide',
    readTime: 10,
    lastUpdated: '2026-02-20',
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
  'line-integration/webhook-setup': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.webhookSetup',
    readTime: 5,
    lastUpdated: '2026-02-20',
    contentHtml: `
      <h2>Webhook Configuration</h2>
      <p>LINE sends events to your webhook URL. Use <code>https://www.customeraipro.com/api/webhook/line</code> in LINE Developers Console → Messaging API. Turn on "Use webhook" and disable "Auto-reply messages" so our AI handles replies.</p>
      <p><a href="/help">Back to Help Center</a></p>
    `,
  },
  'line-integration/rich-menu-setup': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.richMenuSetup',
    readTime: 7,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>LINE Rich Menu Setup</h2><p>Create a Rich Menu in LINE Official Account Manager. Recommended sizes: 2500×1686px or 2500×843px. Add shortcuts for common actions and a "Contact support" button.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'line-integration/message-types': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.messageTypes',
    readTime: 6,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>LINE Message Types</h2><p>We support text and image messages. Stickers get a default reply; location and voice are not yet fully supported. You can customize default replies in Settings.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'line-integration/auto-reply-vs-webhook': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.autoReplyVsWebhook',
    readTime: 4,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Auto-Reply vs Webhook</h2><p>Turn off LINE's built-in auto-reply in Official Account Manager so our webhook can handle messages with AI. After changing, verify by sending a test message.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'line-integration/switch-channels': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.switchChannels',
    readTime: 3,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Switching LINE Channels</h2><p>Update Channel Secret and Access Token in Settings → LINE. Set the new Webhook URL in LINE Developers Console. Historical data stays on your account.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'knowledge-base/upload-first-kb': {
    categorySlug: 'knowledge-base',
    categoryNameKey: 'categories.knowledgeBase.title',
    titleKey: 'articles.uploadFirstKb',
    readTime: 4,
    lastUpdated: '2026-02-20',
    contentHtml: `
      <h2>Upload Your First Knowledge Base</h2>
      <p>Supported formats: .txt, .pdf, .docx. Max 10MB per file. Drag and drop or click to upload in Dashboard → Knowledge Base. Processing usually takes 1–3 minutes.</p>
      <p>Download our <a href="/templates/faq-template.txt" download>FAQ template</a> to get started.</p>
      <p><a href="/help">Back to Help Center</a></p>
    `,
  },
  'knowledge-base/kb-best-practices': {
    categorySlug: 'knowledge-base',
    categoryNameKey: 'categories.knowledgeBase.title',
    titleKey: 'articles.kbBestPractices',
    readTime: 8,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Knowledge Base Best Practices</h2><p>Use full Q&A sentences and concrete details. Avoid vague answers. Structure content clearly and update it regularly for better AI accuracy.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'knowledge-base/using-templates': {
    categorySlug: 'knowledge-base',
    categoryNameKey: 'categories.knowledgeBase.title',
    titleKey: 'articles.usingTemplates',
    readTime: 5,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Using Knowledge Base Templates</h2><p>We provide FAQ, product info, and policy templates. Download from onboarding or Help, fill them in, then upload in Knowledge Base.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'knowledge-base/manage-multiple-kb': {
    categorySlug: 'knowledge-base',
    categoryNameKey: 'categories.knowledgeBase.title',
    titleKey: 'articles.manageMultipleKb',
    readTime: 6,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Managing Multiple Knowledge Bases</h2><p>Organize by topic (e.g. product A, product B, general FAQ). Edit or delete entries in Dashboard → Knowledge Base.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'knowledge-base/troubleshoot-ai': {
    categorySlug: 'knowledge-base',
    categoryNameKey: 'categories.knowledgeBase.title',
    titleKey: 'articles.troubleshootAi',
    readTime: 7,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Troubleshooting AI Responses</h2><p>If answers are wrong, add more Q&As, use clearer wording, and remove duplicate or outdated content. Check AI confidence in Analytics and adjust prompts in Settings.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'settings/customize-ai-style': {
    categorySlug: 'settings',
    categoryNameKey: 'categories.settings.title',
    titleKey: 'articles.customizeAiStyle',
    readTime: 6,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Customizing AI Response Style</h2><p>Set the system prompt in Settings to control tone (formal/friendly) and behavior. Adjust Temperature (0–1) and Max Tokens for creativity and length.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'settings/fallback-messages': {
    categorySlug: 'settings',
    categoryNameKey: 'categories.settings.title',
    titleKey: 'articles.fallbackMessages',
    readTime: 4,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Fallback Messages</h2><p>When the AI has no answer or confidence is low, a fallback message is sent. Configure it in Settings and keep it helpful (e.g. suggest contacting support).</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'settings/team-management': {
    categorySlug: 'settings',
    categoryNameKey: 'categories.settings.title',
    titleKey: 'articles.teamManagement',
    readTime: 5,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Team Member Management</h2><p>Invite members from Settings. Roles: Owner (full access), Admin (all except billing), Member (view and test only). You can change roles or remove members.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'settings/notifications': {
    categorySlug: 'settings',
    categoryNameKey: 'categories.settings.title',
    titleKey: 'articles.notifications',
    readTime: 3,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Notification Settings</h2><p>Configure email for daily reports, system alerts, and new conversation notifications. Frequency and opt-out are in Settings.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'billing/pricing-plans': {
    categorySlug: 'billing',
    categoryNameKey: 'categories.billing.title',
    titleKey: 'articles.pricingPlans',
    readTime: 5,
    lastUpdated: '2026-02-20',
    contentHtml: `
      <h2>Pricing Plans Explained</h2>
      <p>Free: limited conversations and knowledge base files. Pro: higher limits and more team seats. Enterprise: custom. Conversation count is per customer message. Exceeding limits may require upgrading.</p>
      <p><a href="/help/billing/how-to-upgrade">How to upgrade</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'billing/how-to-upgrade': {
    categorySlug: 'billing',
    categoryNameKey: 'categories.billing.title',
    titleKey: 'articles.howToUpgrade',
    readTime: 4,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>How to Upgrade</h2><p>Go to Settings → Billing, choose a plan, enter payment details (e.g. Lemon Squeezy). Upgrades take effect immediately. Invoices available on request.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'billing/billing-faq': {
    categorySlug: 'billing',
    categoryNameKey: 'categories.billing.title',
    titleKey: 'articles.billingFaq',
    readTime: 6,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Billing FAQ</h2><p>Conversations = one per customer message. Annual billing may offer a discount. Cancel in Settings → Billing; data is retained for 30 days after cancellation. Refund policy: contact support within 7 days.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'analytics/understanding-analytics': {
    categorySlug: 'analytics',
    categoryNameKey: 'categories.analytics.title',
    titleKey: 'articles.understandingAnalytics',
    readTime: 7,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Understanding Analytics</h2><p>Key metrics: total conversations, AI response rate, average response time, satisfaction. Use date range filters and export (CSV/PDF) from the Analytics page.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'analytics/conversation-history': {
    categorySlug: 'analytics',
    categoryNameKey: 'categories.analytics.title',
    titleKey: 'articles.conversationHistory',
    readTime: 5,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Conversation History</h2><p>View and search conversations by date, contact, or keyword. Open a thread for full detail. Data is retained according to your plan.</p><p><a href="/help">Back to Help Center</a></p>`,
  },
  'analytics/improve-performance': {
    categorySlug: 'analytics',
    categoryNameKey: 'categories.analytics.title',
    titleKey: 'articles.improvePerformance',
    readTime: 8,
    lastUpdated: '2026-02-20',
    contentHtml: `<h2>Improving AI Performance</h2><p>Use analytics to find questions the AI often misses, then add or refine knowledge base content and adjust prompts. Set confidence thresholds and when to hand off to human support.</p><p><a href="/help">Back to Help Center</a></p>`,
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
