import { getAppUrl } from './app-url';

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

/** Stored shape: English required, zh-TW optional for i18n. */
type ArticleContentStored = Omit<ArticleContent, 'contentHtml'> & {
  contentHtmlEn: string;
  contentHtmlZhTW?: string;
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

const ARTICLE_CONTENT: Record<string, ArticleContentStored> = {
  'getting-started/welcome': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.welcome',
    readTime: 2,
    lastUpdated: '2026-02-21',
    contentHtmlEn: `
      <h2>Welcome to CustomerAIPro</h2>
      <p>Thank you for choosing CustomerAIPro — your AI-powered customer service platform.</p>
      <h3>What is CustomerAIPro?</h3>
      <p>CustomerAIPro helps businesses automate customer support through LINE messaging using advanced AI. You can:</p>
      <ul>
        <li><strong>Connect LINE Official Account</strong> in about 30 seconds</li>
        <li><strong>Upload Knowledge Base</strong> with FAQs and product information</li>
        <li><strong>Automate Responses</strong> with GPT-4 powered AI</li>
        <li><strong>Track Performance</strong> with real-time analytics</li>
      </ul>
      <h3>Who Should Use This?</h3>
      <p>E-commerce handling 100+ daily inquiries, customer service teams wanting to reduce workload, SMBs looking for 24/7 support, and any business with a LINE Official Account.</p>
      <h3>Getting Started (3 Steps)</h3>
      <ol>
        <li><strong>Set up your LINE Channel</strong> — about 5 minutes. <a href="/help/line-integration/line-setup-guide">LINE Setup Guide</a></li>
        <li><strong>Upload Knowledge Base</strong> — add FAQs and policies. <a href="/help/knowledge-base/upload-first-kb">Upload KB Guide</a></li>
        <li><strong>Test your AI</strong> — send a test message. <a href="/help/getting-started/first-chat-test">Testing Guide</a></li>
      </ol>
      <p><strong>Need help?</strong> Email support@customeraipro.com, LINE @customeraipro, or <a href="/help">browse all articles</a>.</p>
      <p><a href="/help">Back to Help Center</a></p>
    `,
    contentHtmlZhTW: `
      <h2>歡迎使用 CustomerAIPro</h2>
      <p>感謝您選擇 CustomerAIPro — 以 AI 驅動的智能客服平台。</p>
      <h3>什麼是 CustomerAIPro？</h3>
      <p>CustomerAIPro 協助企業透過 LINE 訊息與先進 AI 自動化客服。您可以：</p>
      <ul>
        <li><strong>串接 LINE 官方帳號</strong>，約 30 秒完成</li>
        <li><strong>上傳知識庫</strong>，包含常見問答與產品資訊</li>
        <li><strong>以 GPT-4 驅動 AI 自動回覆</strong></li>
        <li><strong>即時數據分析</strong>，掌握營運表現</li>
      </ul>
      <h3>適合誰使用？</h3>
      <p>每日詢問量 100+ 的電商、希望減輕負擔的客服團隊、需要 24/7 支援的中小企業，以及擁有 LINE 官方帳號的商家。</p>
      <h3>三步驟開始使用</h3>
      <ol>
        <li><strong>設定 LINE Channel</strong> — 約 5 分鐘。<a href="/help/line-integration/line-setup-guide">LINE 設定指南</a></li>
        <li><strong>上傳知識庫</strong> — 新增常見問答與政策。<a href="/help/knowledge-base/upload-first-kb">上傳知識庫指南</a></li>
        <li><strong>測試 AI</strong> — 發送測試訊息。<a href="/help/getting-started/first-chat-test">測試指南</a></li>
      </ol>
      <p><strong>需要協助？</strong> 請來信 support@customeraipro.com、LINE @customeraipro，或<a href="/help">瀏覽所有文章</a>。</p>
      <p><a href="/help">返回幫助中心</a></p>
    `,
  },
  'getting-started/account-setup': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.accountSetup',
    readTime: 3,
    lastUpdated: '2026-02-21',
    contentHtmlEn: `
      <h2>Account Setup Guide</h2>
      <p>Complete your CustomerAIPro account setup in a few minutes.</p>
      <h3>Create Your Account</h3>
      <ol>
        <li>Go to <a href="https://www.customeraipro.com" target="_blank" rel="noopener noreferrer">customeraipro.com</a></li>
        <li>Click <strong>Sign Up</strong></li>
        <li>Choose Email + Password or Google SSO (recommended)</li>
      </ol>
      <h3>Verify Your Email</h3>
      <p>If you signed up with email: check your inbox, click the verification link, then you’ll be redirected to the dashboard. Didn’t receive it? Check spam, wait 2–3 minutes, or use “Resend verification email”.</p>
      <h3>Complete Your Profile</h3>
      <p>After logging in: set company name, industry, team size, language (English / 繁體中文), and time zone in Settings.</p>
      <h3>What’s Next?</h3>
      <ul>
        <li>Connect your LINE Official Account</li>
        <li>Upload your first knowledge base</li>
        <li>Invite team members (optional)</li>
        <li>Test your AI chatbot</li>
      </ul>
      <p><a href="/help/line-integration/line-setup-guide">Start with LINE Setup</a> · <a href="/help">Back to Help Center</a></p>
    `,
    contentHtmlZhTW: `
      <h2>帳號設定指南</h2>
      <p>幾分鐘內完成您的 CustomerAIPro 帳號設定。</p>
      <h3>建立帳號</h3>
      <ol>
        <li>前往 <a href="https://www.customeraipro.com" target="_blank" rel="noopener noreferrer">customeraipro.com</a></li>
        <li>點擊 <strong>註冊</strong></li>
        <li>選擇「電子信箱 + 密碼」或 Google 登入（建議）</li>
      </ol>
      <h3>驗證電子信箱</h3>
      <p>若使用電子信箱註冊：請至收件匣點擊驗證連結，完成後將導向控制台。未收到？請檢查垃圾郵件、等候 2–3 分鐘，或使用「重新寄送驗證信」。</p>
      <h3>填寫個人資料</h3>
      <p>登入後請至「設定」填寫公司名稱、產業、團隊規模、語言（English / 繁體中文）與時區。</p>
      <h3>下一步</h3>
      <ul>
        <li>串接 LINE 官方帳號</li>
        <li>上傳第一份知識庫</li>
        <li>邀請團隊成員（選填）</li>
        <li>測試 AI 聊天機器人</li>
      </ul>
      <p><a href="/help/line-integration/line-setup-guide">開始 LINE 設定</a> · <a href="/help">返回幫助中心</a></p>
    `,
  },
  'getting-started/first-10-minutes': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.first10Minutes',
    readTime: 5,
    lastUpdated: '2026-02-21',
    contentHtmlEn: `
      <h2>Your First 10 Minutes with CustomerAIPro</h2>
      <p>Get your AI chatbot up and running in about 10 minutes.</p>
      <h3>Minute 1–5: Connect LINE</h3>
      <ol>
        <li>Open <a href="https://developers.line.biz/" target="_blank" rel="noopener noreferrer">LINE Developers Console</a></li>
        <li>Create a Messaging API Channel if needed</li>
        <li>Copy Channel Secret and Access Token</li>
        <li>Paste them in CustomerAIPro Settings → LINE Integration</li>
        <li>Click <strong>Test Connection</strong> — you should see “Connection Successful”</li>
      </ol>
      <p><a href="/help/line-integration/line-setup-guide">Detailed LINE Setup Guide</a></p>
      <h3>Minute 6–8: Upload Knowledge Base</h3>
      <ol>
        <li>Download our <a href="/templates/faq-template.txt" download>FAQ template</a> and fill in at least 5 Q&As</li>
        <li>Go to Dashboard → Knowledge Base and upload the file</li>
        <li>Wait 1–2 minutes for processing — you should see “Processing Complete”</li>
      </ol>
      <p><a href="/help/knowledge-base/kb-best-practices">Knowledge Base Best Practices</a></p>
      <h3>Minute 9–10: Test Your AI</h3>
      <p><strong>In Dashboard:</strong> Click “Test Chat”, type a question from your KB; the AI should answer correctly.</p>
      <p><strong>On LINE:</strong> Add your bot as a friend, send a message; you should get a reply within a few seconds.</p>
      <p><a href="/help/knowledge-base/troubleshoot-ai">Troubleshooting Guide</a></p>
      <h3>Common First-Timer Questions</h3>
      <p><strong>Do I need coding?</strong> No — everything is through our interface.</p>
      <p><strong>Can I edit AI responses?</strong> Yes — update your knowledge base and the AI uses the new information.</p>
      <p><strong>What if the AI is wrong?</strong> Add more specific Q&As; see <a href="/help/knowledge-base/kb-best-practices">KB Best Practices</a>.</p>
      <p><a href="/help">Back to Help Center</a></p>
    `,
    contentHtmlZhTW: `
      <h2>CustomerAIPro 前 10 分鐘入門</h2>
      <p>約 10 分鐘內讓 AI 聊天機器人上線。</p>
      <h3>第 1–5 分鐘：串接 LINE</h3>
      <ol>
        <li>開啟 <a href="https://developers.line.biz/" target="_blank" rel="noopener noreferrer">LINE Developers Console</a></li>
        <li>如尚未建立，請建立 Messaging API Channel</li>
        <li>複製 Channel Secret 與 Access Token</li>
        <li>貼到 CustomerAIPro「設定」→「LINE 整合」</li>
        <li>點擊 <strong>測試連線</strong> — 應顯示「連線成功」</li>
      </ol>
      <p><a href="/help/line-integration/line-setup-guide">詳細 LINE 設定指南</a></p>
      <h3>第 6–8 分鐘：上傳知識庫</h3>
      <ol>
        <li>下載我們的 <a href="/templates/faq-template.txt" download>FAQ 範本</a>，填寫至少 5 組問答</li>
        <li>前往控制台 → 知識庫並上傳檔案</li>
        <li>等候 1–2 分鐘處理 — 應顯示「處理完成」</li>
      </ol>
      <p><a href="/help/knowledge-base/kb-best-practices">知識庫最佳實踐</a></p>
      <h3>第 9–10 分鐘：測試 AI</h3>
      <p><strong>在控制台：</strong> 點擊「測試對話」，輸入知識庫中的問題，AI 應正確回覆。</p>
      <p><strong>在 LINE：</strong> 將機器人加為好友並發送訊息，幾秒內應收到回覆。</p>
      <p><a href="/help/knowledge-base/troubleshoot-ai">疑難排解指南</a></p>
      <h3>常見問題</h3>
      <p><strong>需要會寫程式嗎？</strong> 不需要 — 全部透過介面操作。</p>
      <p><strong>可以修改 AI 回覆嗎？</strong> 可以 — 更新知識庫後 AI 會使用新內容。</p>
      <p><strong>AI 答錯怎麼辦？</strong> 新增更明確的問答；請參考 <a href="/help/knowledge-base/kb-best-practices">知識庫最佳實踐</a>。</p>
      <p><a href="/help">返回幫助中心</a></p>
    `,
  },
  'getting-started/dashboard-overview': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.dashboardOverview',
    readTime: 4,
    lastUpdated: '2026-02-21',
    contentHtmlEn: `
      <h2>Understanding Your Dashboard</h2>
      <p>Your CustomerAIPro dashboard is your command center.</p>
      <h3>Key Metrics (Top Section)</h3>
      <ul>
        <li><strong>Today’s Conversations</strong> — number of customer messages today</li>
        <li><strong>AI Response Rate</strong> — % handled by AI (target 80%+)</li>
        <li><strong>Average Response Time</strong> — under 2 seconds is excellent</li>
        <li><strong>Customer Satisfaction</strong> — from feedback when enabled</li>
      </ul>
      <h3>Sidebar Navigation</h3>
      <ul>
        <li><strong>Dashboard</strong> — overview (you are here)</li>
        <li><strong>Conversations</strong> — view and search all chats</li>
        <li><strong>Knowledge Base</strong> — upload, edit, delete content</li>
        <li><strong>Analytics</strong> — trends, popular questions, accuracy</li>
        <li><strong>Settings</strong> — LINE, AI, team, billing</li>
      </ul>
      <h3>Main Area</h3>
      <p>Live conversation feed with recent chats; click to view full thread and AI confidence score. Quick actions: Test Chat, Upload KB, Invite Team.</p>
      <p>On mobile (&lt;768px) the sidebar becomes a hamburger menu.</p>
      <p><a href="/help/analytics/understanding-analytics">Understanding Analytics</a> · <a href="/help">Back to Help Center</a></p>
    `,
    contentHtmlZhTW: `
      <h2>認識您的控制台</h2>
      <p>CustomerAIPro 控制台是您的營運中心。</p>
      <h3>關鍵指標（上方區塊）</h3>
      <ul>
        <li><strong>今日對話數</strong> — 今日客戶訊息數量</li>
        <li><strong>AI 回覆率</strong> — 由 AI 處理的比例（目標 80%+）</li>
        <li><strong>平均回覆時間</strong> — 2 秒內為佳</li>
        <li><strong>客戶滿意度</strong> — 開啟回饋後可查看</li>
      </ul>
      <h3>側邊欄導覽</h3>
      <ul>
        <li><strong>控制台</strong> — 總覽（目前頁面）</li>
        <li><strong>對話</strong> — 檢視與搜尋所有聊天</li>
        <li><strong>知識庫</strong> — 上傳、編輯、刪除內容</li>
        <li><strong>數據分析</strong> — 趨勢、熱門問題、準確度</li>
        <li><strong>設定</strong> — LINE、AI、團隊、帳單</li>
      </ul>
      <h3>主畫面</h3>
      <p>即時對話列表與近期聊天；點擊可查看完整對話與 AI 信心分數。快捷操作：測試對話、上傳知識庫、邀請團隊。</p>
      <p>在手機（&lt;768px）側邊欄會收合為選單圖示。</p>
      <p><a href="/help/analytics/understanding-analytics">認識數據分析</a> · <a href="/help">返回幫助中心</a></p>
    `,
  },
  'getting-started/first-chat-test': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.firstChatTest',
    readTime: 3,
    lastUpdated: '2026-02-21',
    contentHtmlEn: `
      <h2>First Chat Test Guide</h2>
      <p>Make sure your AI works correctly before going live.</p>
      <h3>Method 1: Dashboard Test Chat</h3>
      <ol>
        <li>Go to Dashboard and click <strong>Test Chat</strong></li>
        <li>Send a question from your knowledge base — AI should answer correctly</li>
        <li>Ask something not in your KB — AI should say it doesn’t have that information</li>
      </ol>
      <h3>Method 2: LINE App</h3>
      <p>Add your bot as a friend (QR in LINE Developers Console → Messaging API), then send real messages. Ensure “Use webhook” is enabled in LINE.</p>
      <h3>If AI Responds Incorrectly</h3>
      <ul>
        <li><strong>AI says “I don’t know” but you have the info</strong> — add more Q&A variations and use the customer’s wording</li>
        <li><strong>Wrong answer</strong> — remove contradictions in your KB and make answers more specific</li>
        <li><strong>Wrong language</strong> — add bilingual content or adjust Settings → AI Config</li>
      </ul>
      <h3>Confidence Score</h3>
      <p>Each response has a confidence score (0–100%). 90–100% is highly reliable; under 70% consider improving your KB. You can set a threshold in Settings (e.g. auto-reply only if &gt;70%).</p>
      <p><a href="/help/knowledge-base/troubleshoot-ai">Improve AI Accuracy</a> · <a href="/help">Back to Help Center</a></p>
    `,
    contentHtmlZhTW: `
      <h2>第一次對話測試指南</h2>
      <p>上線前請確認 AI 回覆正確。</p>
      <h3>方式一：控制台測試對話</h3>
      <ol>
        <li>前往控制台並點擊 <strong>測試對話</strong></li>
        <li>輸入知識庫中的問題 — AI 應正確回答</li>
        <li>問一個知識庫沒有的問題 — AI 應表示沒有該資訊</li>
      </ol>
      <h3>方式二：LINE App</h3>
      <p>將機器人加為好友（QR 碼在 LINE Developers Console → Messaging API），再發送真實訊息。請確認 LINE 已開啟「Use webhook」。</p>
      <h3>若 AI 回覆不正確</h3>
      <ul>
        <li><strong>AI 說「不知道」但您有該資訊</strong> — 增加更多問答變化，並使用客戶常用說法</li>
        <li><strong>答錯</strong> — 移除知識庫中的矛盾、讓答案更具體</li>
        <li><strong>語言錯誤</strong> — 新增雙語內容或調整「設定」→「AI 設定」</li>
      </ul>
      <h3>信心分數</h3>
      <p>每則回覆都有信心分數（0–100%）。90–100% 表示高可信度；低於 70% 建議優化知識庫。您可在「設定」中設定門檻（例如僅在 &gt;70% 時自動回覆）。</p>
      <p><a href="/help/knowledge-base/troubleshoot-ai">提升 AI 準確度</a> · <a href="/help">返回幫助中心</a></p>
    `,
  },
  'line-integration/line-setup-guide': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.lineSetupGuide',
    readTime: 10,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
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
    lastUpdated: '2026-02-21',
    contentHtmlEn: `
      <h2>What is a Webhook?</h2>
      <p>A webhook lets LINE send real-time messages to CustomerAIPro when customers message you. We identify your account using the Channel Secret and Access Token you configured.</p>
      <h3>Webhook URL</h3>
      <p><code>https://www.customeraipro.com/api/webhook/line</code></p>
      <p><strong>Important</strong>: No trailing slash; use <code>https://</code> (not <code>http://</code>).</p>
      <h3>Step-by-Step Setup</h3>
      <ol>
        <li>Go to <a href="https://developers.line.biz/" target="_blank" rel="noopener noreferrer">LINE Developers Console</a> → your Provider → Messaging API Channel.</li>
        <li>Open the <strong>Messaging API</strong> tab and find <strong>Webhook settings</strong>.</li>
        <li>Click <strong>Edit</strong>, paste the webhook URL above, then <strong>Update</strong>.</li>
        <li>Turn <strong>Use webhook</strong> to ON.</li>
        <li>Click <strong>Verify</strong>. Success means webhook is working.</li>
      </ol>
      <h3>Events We Handle</h3>
      <table class="min-w-full border border-gray-200 my-4">
        <thead><tr class="bg-gray-50"><th class="border px-2 py-1 text-left">Event</th><th class="border px-2 py-1 text-left">Action</th></tr></thead>
        <tbody>
          <tr><td class="border px-2 py-1">message</td><td class="border px-2 py-1">AI responds</td></tr>
          <tr><td class="border px-2 py-1">follow</td><td class="border px-2 py-1">Welcome message</td></tr>
          <tr><td class="border px-2 py-1">unfollow</td><td class="border px-2 py-1">Log only</td></tr>
          <tr><td class="border px-2 py-1">postback</td><td class="border px-2 py-1">Rich Menu action</td></tr>
        </tbody>
      </table>
      <h3>Troubleshooting</h3>
      <ul>
        <li><strong>401 Unauthorized</strong>: Re-enter Channel Secret and Access Token in CustomerAIPro Settings → LINE. Remove extra spaces.</li>
        <li><strong>404 Not Found</strong>: Check URL is exact; no trailing slash.</li>
        <li><strong>500 Error</strong>: Wait 2–3 minutes and verify again; ensure LINE setup is complete in CustomerAIPro.</li>
      </ul>
      <p><strong>Checklist</strong>: Webhook URL correct, Use webhook ON, verification success, LINE auto-reply OFF. Test with a real LINE account.</p>
      <h3>Security</h3>
      <p>We verify requests from LINE and do not store display names or profile pictures. Never share your Channel Secret.</p>
      <p><a href="/help/line-integration/line-setup-guide">LINE Setup Guide</a> · <a href="/help/line-integration/auto-reply-vs-webhook">Auto-Reply vs Webhook</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'line-integration/rich-menu-setup': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.richMenuSetup',
    readTime: 7,
    lastUpdated: '2026-02-21',
    contentHtmlEn: `
      <h2>What is a Rich Menu?</h2>
      <p>A Rich Menu is a customizable menu at the bottom of your LINE chat for quick actions: contact support, track order, FAQs, etc.</p>
      <h3>Image Specifications</h3>
      <ul>
        <li><strong>Full</strong>: 2500×1686 px (6–12 buttons)</li>
        <li><strong>Half</strong>: 2500×843 px (3–6 buttons)</li>
        <li>Format: JPG or PNG, max 1 MB</li>
      </ul>
      <h3>Setup in LINE Official Account Manager</h3>
      <p>Rich Menus are set in <a href="https://manager.line.biz/" target="_blank" rel="noopener noreferrer">LINE Official Account Manager</a>, not LINE Developers Console.</p>
      <ol>
        <li>Go to LINE Official Account Manager → your account → <strong>Rich menus</strong>.</li>
        <li>Click <strong>Create</strong>, upload your image (correct dimensions).</li>
        <li><strong>Define tap areas</strong>: Add action areas over each button. Choose <strong>Text</strong> (sends a message to the bot), <strong>URI</strong> (opens a link), or <strong>Postback</strong>.</li>
        <li>Example: Button "Contact Support" → Action: Text → Message: "I need help from a human agent".</li>
        <li>Set display conditions (e.g. Always). Save and set <strong>Published</strong> to ON.</li>
      </ol>
      <h3>Best Practices</h3>
      <ul>
        <li>Use icon + short label (max ~10 characters).</li>
        <li>Put most-used actions in the top row.</li>
        <li>4–6 buttons is ideal; test on real devices.</li>
      </ul>
      <h3>Troubleshooting</h3>
      <p><strong>Not showing</strong>: Ensure Published is ON and display conditions include your test account. Only one Rich Menu can be active.</p>
      <p><strong>Tap not working</strong>: Check tap area coordinates and action type (Text vs URI).</p>
      <p><a href="/help/line-integration/message-types">LINE Message Types</a> · <a href="/help/settings/customize-ai-style">Customize AI Style</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'line-integration/message-types': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.messageTypes',
    readTime: 6,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>LINE Message Types</h2>
      <p>CustomerAIPro handles different types of messages from LINE users. Here is what is supported and how each is treated.</p>
      <h3>Fully Supported</h3>
      <ul>
        <li><strong>Text</strong> — The main type we use. The AI reads the customer's text, searches your knowledge base, and replies with an answer. This is where most support conversations happen.</li>
        <li><strong>Image</strong> — Images are received and can be used for context. Depending on your setup, the AI may reply with a default message or you can configure how image messages are handled.</li>
      </ul>
      <h3>Default or Limited Support</h3>
      <ul>
        <li><strong>Stickers</strong> — LINE stickers do not contain text, so the AI cannot answer based on content. We send a default reply (e.g. "Got your sticker! Type a message if you have a question."). You can customize this in Settings.</li>
        <li><strong>Location and voice</strong> — Not yet fully supported. Customers may send location or voice messages; you can set a default reply in Settings so they know to send text instead or contact support.</li>
      </ul>
      <h3>Customizing Default Replies</h3>
      <p>In Settings you can set default messages for unsupported or non-text message types. Keep them friendly and direct users to send a text message or contact support if they need help.</p>
      <p><a href="/help/line-integration/auto-reply-vs-webhook">Auto-Reply vs Webhook</a> · <a href="/help/settings/customize-ai-style">Customize AI Style</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'line-integration/auto-reply-vs-webhook': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.autoReplyVsWebhook',
    readTime: 4,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Auto-Reply vs Webhook</h2>
      <p>LINE has two ways to respond to customers: its own auto-reply (simple, fixed messages) and webhooks (real-time delivery to an external service like CustomerAIPro). For AI-powered replies, the webhook must receive the message first — so LINE's built-in auto-reply must be turned off.</p>
      <h3>Why Turn Off LINE Auto-Reply?</h3>
      <p>When LINE's auto-reply is on, LINE may send a preset message (e.g. "We received your message") before or instead of forwarding the message to your webhook. That can prevent CustomerAIPro from receiving the message and replying with the AI. Turning it off ensures every message goes to our webhook so the AI can answer.</p>
      <h3>Where to Change It</h3>
      <p>Go to <a href="https://manager.line.biz/" target="_blank" rel="noopener noreferrer">LINE Official Account Manager</a> (not LINE Developers Console). Open your account → <strong>Settings</strong> → <strong>Response settings</strong> or <strong>Messaging API</strong>. Find "Auto-response messages" or similar and set it to <strong>Off</strong> or disable the greeting message that sends automatically.</p>
      <h3>After Changing</h3>
      <p>Send a test message from your LINE app to the bot. You should get an AI reply from CustomerAIPro within a few seconds. If you still get a generic LINE message, double-check that "Use webhook" is enabled in LINE Developers Console and that the webhook URL is correct.</p>
      <p><a href="/help/line-integration/webhook-setup">Webhook Setup</a> · <a href="/help/line-integration/line-setup-guide">LINE Setup Guide</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'line-integration/switch-channels': {
    categorySlug: 'line-integration',
    categoryNameKey: 'categories.lineIntegration.title',
    titleKey: 'articles.switchChannels',
    readTime: 3,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Switching LINE Channels</h2>
      <p>If you create a new LINE channel (e.g. a new Official Account or Messaging API channel) or want to connect a different channel to CustomerAIPro, you need to update the credentials and webhook. Your account and historical data stay; only the connected channel changes.</p>
      <h3>Steps to Switch</h3>
      <ol>
        <li>In <a href="https://developers.line.biz/" target="_blank" rel="noopener noreferrer">LINE Developers Console</a>, open the new channel and copy the <strong>Channel Secret</strong> and <strong>Channel Access Token</strong> (issue a long-lived token if needed).</li>
        <li>In CustomerAIPro go to <strong>Settings → LINE</strong> (or LINE Integration). Paste the new Channel Secret and Access Token, then click <strong>Test connection</strong> or <strong>Verify</strong>. Save when it succeeds.</li>
        <li>In LINE Developers Console, open the new channel's Messaging API tab. Set the <strong>Webhook URL</strong> to <code>https://www.customeraipro.com/api/webhook/line</code> (no trailing slash). Turn <strong>Use webhook</strong> ON.</li>
        <li>Optional: In the old channel, turn Use webhook OFF or remove the webhook URL so LINE stops sending messages there.</li>
      </ol>
      <h3>What Happens to Data?</h3>
      <p>Your CustomerAIPro account, conversation history, and knowledge base are unchanged. Only the LINE channel that receives and sends messages is updated. New conversations will come from the new channel; old conversations remain in your dashboard.</p>
      <p><a href="/help/line-integration/line-setup-guide">LINE Setup Guide</a> · <a href="/help/line-integration/webhook-setup">Webhook Setup</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'knowledge-base/upload-first-kb': {
    categorySlug: 'knowledge-base',
    categoryNameKey: 'categories.knowledgeBase.title',
    titleKey: 'articles.uploadFirstKb',
    readTime: 4,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
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
    lastUpdated: '2026-02-21',
    contentHtmlEn: `
      <h2>Why Knowledge Base Quality Matters</h2>
      <p>Better knowledge base = better AI responses. Good KB can reach 90%+ accuracy; vague content drops to ~50%.</p>
      <h3>The Golden Rule: Be Specific</h3>
      <p><strong>Good example</strong>:</p>
      <p>Q: 運費怎麼計算？<br>A: 台灣本島滿 NT$ 1,000 免運。未滿收取 NT$ 80。離島固定 NT$ 150。</p>
      <p><strong>Bad example</strong>: Q: 運費 A: 看情況 — too vague; AI cannot give a useful answer.</p>
      <h3>Best Practices</h3>
      <ol>
        <li><strong>Use Q&A format</strong>: Every entry as Question → Answer.</li>
        <li><strong>Include variations</strong>: "營業時間？" / "幾點開門？" / "When are you open?" — same answer.</li>
        <li><strong>Be comprehensive</strong>: Who, what, when, where, how. Use exact numbers (e.g. "3–5 工作天" not "很快").</li>
        <li><strong>Format clearly</strong>: Bold, bullets, numbered steps, tables for comparisons.</li>
        <li><strong>Update regularly</strong>: Prices, new products, remove discontinued items; fix answers based on real customer questions.</li>
      </ol>
      <h3>Common Mistakes</h3>
      <ul>
        <li>Avoid pronouns without context ("這個多少錢?" → use product name in Q and A).</li>
        <li>Don't assume context ("可以用嗎?" → specify product and scenario).</li>
        <li>One source of truth per topic (no contradictory "運費 NT$ 80" vs "NT$ 100").</li>
        <li>Remove outdated dates or update quarterly.</li>
      </ul>
      <h3>Testing Your Knowledge Base</h3>
      <p>Use Dashboard → Test Chat; ask as a customer would. Ensure coverage for: products, pricing, shipping, returns, payment, hours, contact info.</p>
      <h3>Maintenance</h3>
      <p>Weekly: add 5–10 Q&As from real questions. Monthly: audit coverage, remove outdated content. Quarterly: major refresh and user feedback.</p>
      <p><a href="/help/knowledge-base/upload-first-kb">Upload Your First KB</a> · <a href="/help/knowledge-base/using-templates">Using Templates</a> · <a href="/help/knowledge-base/troubleshoot-ai">Troubleshoot AI</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'knowledge-base/using-templates': {
    categorySlug: 'knowledge-base',
    categoryNameKey: 'categories.knowledgeBase.title',
    titleKey: 'articles.usingTemplates',
    readTime: 5,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Using Knowledge Base Templates</h2>
      <p>CustomerAIPro provides ready-made templates so you can build a solid knowledge base quickly without starting from scratch.</p>
      <h3>Available Templates</h3>
      <ul>
        <li><strong>FAQ template</strong> — Structured Q&A format. Download from onboarding, the Help Center, or Dashboard → Knowledge Base. Includes examples for shipping, returns, and contact.</li>
        <li><strong>Product info template</strong> — For catalog-style content: product name, description, price, availability.</li>
        <li><strong>Policy template</strong> — Covers refunds, privacy, terms of service. Customize with your company details.</li>
      </ul>
      <h3>How to Use</h3>
      <ol>
        <li>Download the template (e.g. <a href="/templates/faq-template.txt" download>FAQ template</a>) from the link in onboarding or Help.</li>
        <li>Open in a text editor or spreadsheet. Fill in at least 5–10 Q&As with your real content; use clear questions and specific answers.</li>
        <li>Save as .txt, .pdf, or .docx. Go to Dashboard → Knowledge Base and upload the file.</li>
        <li>Wait 1–3 minutes for processing, then test with Test Chat.</li>
      </ol>
      <h3>Tips</h3>
      <p>Keep the same structure as the template so the AI can parse it correctly. Add variations of the same question (e.g. "運費多少？" and "怎麼算運費？") to improve match rate. Update templates when your policies change.</p>
      <p><a href="/help/knowledge-base/upload-first-kb">Upload Your First KB</a> · <a href="/help/knowledge-base/kb-best-practices">KB Best Practices</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'knowledge-base/manage-multiple-kb': {
    categorySlug: 'knowledge-base',
    categoryNameKey: 'categories.knowledgeBase.title',
    titleKey: 'articles.manageMultipleKb',
    readTime: 6,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Managing Multiple Knowledge Bases</h2>
      <p>As your business grows, you may want to organize content into multiple knowledge bases. This keeps answers focused and makes updates easier.</p>
      <h3>When to Use Multiple KBs</h3>
      <ul>
        <li><strong>By product or service</strong> — e.g. "Product A FAQ", "Product B FAQ", "General company FAQ".</li>
        <li><strong>By language</strong> — Separate KBs for 繁體中文 and English if content differs a lot.</li>
        <li><strong>By department</strong> — Sales vs support vs shipping, each with its own set of Q&As.</li>
      </ul>
      <h3>How It Works</h3>
      <p>All knowledge bases you upload are used together when the AI answers. The AI searches across every file, so there is no need to "switch" KBs — just upload and the system includes new content automatically.</p>
      <h3>Editing and Deleting</h3>
      <p>In Dashboard → Knowledge Base you can view all uploaded files. Use <strong>Edit</strong> to replace a file with an updated version (same name or new). Use <strong>Delete</strong> to remove a file; the AI will stop using that content immediately. There is no undo, so export or back up important content before deleting.</p>
      <h3>Best Practices</h3>
      <p>Avoid duplicate or conflicting answers across files; keep one source of truth per topic. Name files clearly (e.g. "faq-shipping-2026.txt") so your team knows what each one contains.</p>
      <p><a href="/help/knowledge-base/upload-first-kb">Upload Your First KB</a> · <a href="/help/knowledge-base/kb-best-practices">KB Best Practices</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'knowledge-base/troubleshoot-ai': {
    categorySlug: 'knowledge-base',
    categoryNameKey: 'categories.knowledgeBase.title',
    titleKey: 'articles.troubleshootAi',
    readTime: 7,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Troubleshooting AI Responses</h2>
      <p>If the AI gives wrong answers, says "I don't know" when it should know, or replies in the wrong tone, follow these steps to improve accuracy.</p>
      <h3>AI Says "I Don't Know" But You Have the Info</h3>
      <p>Usually the question does not match how the answer is written. Add more question variations (e.g. "運費怎麼算？" and "怎麼算運費？") and use wording similar to what customers actually type. Keep answers specific and avoid vague phrases.</p>
      <h3>Wrong or Incomplete Answers</h3>
      <p>Remove contradictory entries (e.g. two different shipping fees). Make each answer self-contained: include who, what, when, where. If the AI cuts off, shorten answers or split into multiple Q&As. Check Analytics for low-confidence replies and add or refine content for those topics.</p>
      <h3>Wrong Language or Tone</h3>
      <p>Add bilingual Q&As if you serve both 繁體中文 and English. In Settings → AI, adjust the system prompt to specify language and tone (e.g. "Always reply in 繁體中文, friendly and professional").</p>
      <h3>Using Analytics</h3>
      <p>Use the Analytics page to see which questions get low confidence scores or wrong answers. Focus on improving knowledge base content for those first. You can also set a confidence threshold in Settings so the AI only auto-replies when confidence is above a certain level (e.g. 70%).</p>
      <p><a href="/help/knowledge-base/kb-best-practices">KB Best Practices</a> · <a href="/help/settings/customize-ai-style">Customize AI Style</a> · <a href="/help/analytics/understanding-analytics">Understanding Analytics</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'settings/customize-ai-style': {
    categorySlug: 'settings',
    categoryNameKey: 'categories.settings.title',
    titleKey: 'articles.customizeAiStyle',
    readTime: 6,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Customizing AI Response Style</h2>
      <p>You can control how the AI speaks and behaves by editing the system prompt and model parameters in Settings → AI.</p>
      <h3>System Prompt</h3>
      <p>The system prompt is the main instruction set for the AI. Use it to set tone (e.g. "Reply in a friendly, professional way in 繁體中文"), scope ("Only answer based on the knowledge base; if unsure, say you don't have that information"), and rules (e.g. "Never share internal links or prices not in the KB").</p>
      <h3>Temperature (0–1)</h3>
      <p>Lower (e.g. 0.3) makes answers more consistent and factual; higher (e.g. 0.7) allows more variation and creativity. For customer support, 0.2–0.4 is usually best so answers stay accurate and on-brand.</p>
      <h3>Max Tokens</h3>
      <p>This limits the length of each reply. Too low and the AI may cut off; too high and replies can be long. Start with 300–500 and adjust based on your Test Chat results.</p>
      <h3>Best Practices</h3>
      <p>Keep the prompt clear and short. Test after every change. If the AI ignores the knowledge base, add a line like "Always use the provided knowledge base to answer; do not make up information."</p>
      <p><a href="/help/settings/fallback-messages">Fallback Messages</a> · <a href="/help/knowledge-base/troubleshoot-ai">Troubleshoot AI</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'settings/fallback-messages': {
    categorySlug: 'settings',
    categoryNameKey: 'categories.settings.title',
    titleKey: 'articles.fallbackMessages',
    readTime: 4,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Fallback Messages</h2>
      <p>When the AI cannot find a good answer or confidence is below your threshold, it sends a fallback message instead of guessing. This keeps customers from getting wrong information and gives you a chance to step in.</p>
      <h3>When Fallback Is Used</h3>
      <ul>
        <li>No matching content in the knowledge base.</li>
        <li>AI confidence score below the threshold you set in Settings.</li>
        <li>Question is unclear or out of scope (e.g. spam, off-topic).</li>
      </ul>
      <h3>Configuring the Message</h3>
      <p>In Settings → AI you can set the fallback message text. Keep it helpful and clear, for example: "Sorry, I couldn't find an answer to that. Please contact our support team at support@example.com or leave a message and we'll get back to you within 24 hours."</p>
      <h3>Best Practices</h3>
      <p>Always give a next step (contact support, link to help center, or "We'll look into it"). You can mention your response time or business hours. Avoid generic phrases like "I don't know" without offering help. Review Analytics to see which questions trigger fallback and consider adding them to your knowledge base.</p>
      <p><a href="/help/settings/customize-ai-style">Customize AI Style</a> · <a href="/help/knowledge-base/troubleshoot-ai">Troubleshoot AI</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'settings/team-management': {
    categorySlug: 'settings',
    categoryNameKey: 'categories.settings.title',
    titleKey: 'articles.teamManagement',
    readTime: 5,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Team Member Management</h2>
      <p>CustomerAIPro lets you invite team members and control what they can do. This is useful for customer support teams, marketing, or anyone who needs to view or manage the AI and knowledge base.</p>
      <h3>Roles</h3>
      <ul>
        <li><strong>Owner</strong> — Full access: settings, billing, team, knowledge base, analytics. There is usually one owner per account.</li>
        <li><strong>Admin</strong> — Same as Owner except billing. Can invite or remove members, edit LINE and AI settings, upload knowledge base, view analytics.</li>
        <li><strong>Member</strong> — View and test only. Can use the dashboard, Test Chat, and view conversations and analytics, but cannot change settings or billing.</li>
      </ul>
      <h3>Inviting Members</h3>
      <p>Go to Settings → Team. Enter the member's email and choose a role, then send the invite. They receive an email with a link to join. If they don't have an account, they will be prompted to sign up.</p>
      <h3>Changing Roles or Removing Members</h3>
      <p>In the same Team list you can change a member's role or remove them. Removing a member revokes access immediately. They will not be able to log in or see any data. You can re-invite them later if needed.</p>
      <p><a href="/help/settings/notifications">Notification Settings</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'settings/notifications': {
    categorySlug: 'settings',
    categoryNameKey: 'categories.settings.title',
    titleKey: 'articles.notifications',
    readTime: 3,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Notification Settings</h2>
      <p>Stay on top of your AI customer service with email notifications. You can choose what to receive and how often.</p>
      <h3>Types of Notifications</h3>
      <ul>
        <li><strong>Daily or weekly reports</strong> — Summary of conversation volume, AI response rate, and key metrics. Useful for tracking performance over time.</li>
        <li><strong>System alerts</strong> — Important issues such as LINE connection failures, webhook errors, or service updates. We recommend keeping these on.</li>
        <li><strong>New conversation alerts</strong> — Optional. Get notified when a new conversation starts so you can follow up or hand off to a human if needed.</li>
      </ul>
      <h3>Where to Configure</h3>
      <p>Go to Settings → Notifications. You can turn each type on or off and set frequency (e.g. daily digest at 9:00). Use the same email as your login unless you set a separate notification email.</p>
      <h3>Opting Out</h3>
      <p>You can disable any notification type at any time. System alerts can also be turned off, but we suggest leaving them on so you know about connection or billing issues quickly.</p>
      <p><a href="/help/settings/team-management">Team Management</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'billing/pricing-plans': {
    categorySlug: 'billing',
    categoryNameKey: 'categories.billing.title',
    titleKey: 'articles.pricingPlans',
    readTime: 5,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
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
    contentHtmlEn: `
      <h2>How to Upgrade</h2>
      <p>When you need more conversations or knowledge base capacity, you can upgrade your plan in a few steps. Upgrades take effect immediately.</p>
      <h3>Steps to Upgrade</h3>
      <ol>
        <li>Log in to CustomerAIPro and go to <strong>Settings → Billing</strong>.</li>
        <li>Review the available plans (Basic, Pro, Enterprise). Compare conversation limits, knowledge base limits, and team seats.</li>
        <li>Click <strong>Upgrade</strong> or <strong>Change plan</strong> for the plan you want.</li>
        <li>You will be redirected to our payment partner (e.g. Lemon Squeezy). Enter your payment details and complete the checkout.</li>
        <li>Once payment is confirmed, your new plan is active. You can use the higher limits right away.</li>
      </ol>
      <h3>What Happens to My Data?</h3>
      <p>Your account, conversations, and knowledge base stay the same. Only your plan limits and billing change. No downtime.</p>
      <h3>Invoices</h3>
      <p>Invoices are available from the billing page or by email. For custom or annual plans, contact support@customeraipro.com.</p>
      <p><a href="/help/billing/pricing-plans">Pricing Plans</a> · <a href="/help/billing/billing-faq">Billing FAQ</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'billing/billing-faq': {
    categorySlug: 'billing',
    categoryNameKey: 'categories.billing.title',
    titleKey: 'articles.billingFaq',
    readTime: 6,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Billing FAQ</h2>
      <h3>What counts as a conversation?</h3>
      <p>One conversation = one customer message. Each time a customer sends a message (and the AI or system replies), that counts as one conversation toward your monthly limit. Multiple messages in the same thread still count as multiple conversations for billing.</p>
      <h3>Annual vs monthly billing</h3>
      <p>You can choose monthly or annual billing where available. Annual billing is paid once a year and may include a discount. Check the pricing page or Settings → Billing for current offers.</p>
      <h3>How do I cancel?</h3>
      <p>Go to Settings → Billing and select Cancel or Downgrade. Your access continues until the end of the current billing period. After that, you will not be charged. Your data (conversations, knowledge base) is retained for 30 days so you can export or reactivate. After 30 days, data may be removed according to our policy.</p>
      <h3>Refunds</h3>
      <p>If you are not satisfied, contact support@customeraipro.com within 7 days of the charge. We will review your case and may issue a refund. Refund policy may vary by region; see our terms for details.</p>
      <h3>Invoices and payment methods</h3>
      <p>Invoices are available from the Billing page or by email. You can update your payment method in the same place. Failed payments may result in a temporary restriction; we will notify you by email.</p>
      <p><a href="/help/billing/pricing-plans">Pricing Plans</a> · <a href="/help/billing/how-to-upgrade">How to Upgrade</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'analytics/understanding-analytics': {
    categorySlug: 'analytics',
    categoryNameKey: 'categories.analytics.title',
    titleKey: 'articles.understandingAnalytics',
    readTime: 7,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Understanding Analytics</h2>
      <p>The Analytics page shows how your AI customer service is performing. Use it to spot trends, improve your knowledge base, and report to your team.</p>
      <h3>Key Metrics</h3>
      <ul>
        <li><strong>Total conversations</strong> — Number of customer messages in the selected period. Use this to see volume and compare days or weeks.</li>
        <li><strong>AI response rate</strong> — Percentage of conversations answered by the AI without human help. A good target is 80% or higher.</li>
        <li><strong>Average response time</strong> — How quickly the AI replies. Under 2 seconds is usually excellent.</li>
        <li><strong>Customer satisfaction</strong> — If you enable feedback (e.g. thumbs up/down), you can see how satisfied customers are with AI answers.</li>
      </ul>
      <h3>Filters and Date Range</h3>
      <p>Use the date picker to view last 7 days, 30 days, or a custom range. You can often filter by channel (e.g. LINE) or by tag if you use them. This helps you compare busy vs quiet periods and see the impact of knowledge base updates.</p>
      <h3>Export</h3>
      <p>Export data as CSV or PDF from the Analytics page for reports or sharing. Useful for monthly reviews or stakeholder updates.</p>
      <p><a href="/help/analytics/conversation-history">Conversation History</a> · <a href="/help/analytics/improve-performance">Improve Performance</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'analytics/conversation-history': {
    categorySlug: 'analytics',
    categoryNameKey: 'categories.analytics.title',
    titleKey: 'articles.conversationHistory',
    readTime: 5,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Conversation History</h2>
      <p>Every customer conversation is stored so you can review what was said, check AI accuracy, and follow up when needed.</p>
      <h3>Viewing Conversations</h3>
      <p>From the Dashboard or Conversations page you see a list of recent chats. Each row usually shows the contact (e.g. LINE user), last message preview, time, and sometimes AI confidence score. Click a row to open the full thread and see the complete back-and-forth.</p>
      <h3>Search and Filters</h3>
      <p>Search by keyword to find conversations that mention a product, topic, or phrase. Filter by date range to narrow to a specific week or month. You can often filter by channel (LINE) or by tag if you use contact tags. This makes it easy to find escalations, complaints, or topics you want to improve in the knowledge base.</p>
      <h3>What You See in a Thread</h3>
      <p>Each message shows who said it (customer vs AI), the text, timestamp, and for AI messages the confidence score. Use this to spot wrong answers, low-confidence replies, or cases where the customer needed more help.</p>
      <h3>Data Retention</h3>
      <p>Conversation history is kept according to your plan and our data policy. Check your plan details or Settings for how long data is retained. You can export or back up important threads if needed.</p>
      <p><a href="/help/analytics/understanding-analytics">Understanding Analytics</a> · <a href="/help/analytics/improve-performance">Improve Performance</a> · <a href="/help">Back to Help Center</a></p>
    `,
  },
  'analytics/improve-performance': {
    categorySlug: 'analytics',
    categoryNameKey: 'categories.analytics.title',
    titleKey: 'articles.improvePerformance',
    readTime: 8,
    lastUpdated: '2026-02-20',
    contentHtmlEn: `
      <h2>Improving AI Performance</h2>
      <p>Use your analytics and conversation history to find where the AI falls short, then improve the knowledge base and settings. Over time this raises accuracy and customer satisfaction.</p>
      <h3>Find Weak Spots</h3>
      <p>In Analytics, look for low AI response rates, low confidence scores, or a high share of fallback messages. In Conversation History, search for topics that often get wrong answers or "I don't know". These are the best candidates for new or updated knowledge base content.</p>
      <h3>Add and Refine Content</h3>
      <p>For each weak topic, add clear Q&As with the exact questions customers ask and specific answers. Use variations (e.g. "運費？" and "怎麼算運費？"). Remove duplicate or conflicting entries. See <a href="/help/knowledge-base/kb-best-practices">KB Best Practices</a> for structure and wording tips.</p>
      <h3>Adjust Prompts and Thresholds</h3>
      <p>In Settings → AI you can tighten the system prompt (e.g. "Only answer from the knowledge base") and set a confidence threshold. For example, if the AI only auto-replies when confidence is above 70%, low-confidence questions get your fallback message instead of a wrong answer. You can then add content for those questions and try again.</p>
      <h3>When to Hand Off to Humans</h3>
      <p>Use the fallback message to direct customers to support (email, phone, or ticket). Optionally use tags or notifications so your team knows when to follow up. Review hand-offs weekly to see if some topics can be moved into the knowledge base to reduce human workload.</p>
      <p><a href="/help/analytics/understanding-analytics">Understanding Analytics</a> · <a href="/help/knowledge-base/troubleshoot-ai">Troubleshoot AI</a> · <a href="/help/settings/fallback-messages">Fallback Messages</a> · <a href="/help">Back to Help Center</a></p>
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

/** Returns article content or null if not found. Locale defaults to 'en' if omitted. */
export function getArticle(categorySlug: string, articleSlug: string, locale?: string): ArticleContent | null {
  return getArticleContent(categorySlug, articleSlug, locale);
}

export function getArticleContent(categorySlug: string, articleSlug: string, locale?: string): ArticleContent | null {
  if (!getCategoryBySlug(categorySlug)) return null;
  const key = `${categorySlug}/${articleSlug}`;
  const stored = ARTICLE_CONTENT[key] ?? null;
  if (!stored) return null;
  let contentHtml =
    locale === 'zh-TW' && stored.contentHtmlZhTW ? stored.contentHtmlZhTW : stored.contentHtmlEn;
  // 讓文章內連結保留語系：/help -> /zh-TW/help 或 /en/help，避免點擊後跳回預設語系
  if (locale === 'zh-TW' || locale === 'en') {
    contentHtml = contentHtml.replace(/href="\/help/g, `href="/${locale}/help`);
  }
  contentHtml = contentHtml.replace(/https:\/\/www\.customeraipro\.com/g, getAppUrl());
  return { ...stored, contentHtml };
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
