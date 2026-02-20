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
    lastUpdated: '2026-02-21',
    contentHtml: `
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
  },
  'getting-started/account-setup': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.accountSetup',
    readTime: 3,
    lastUpdated: '2026-02-21',
    contentHtml: `
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
  },
  'getting-started/first-10-minutes': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.first10Minutes',
    readTime: 5,
    lastUpdated: '2026-02-21',
    contentHtml: `
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
  },
  'getting-started/dashboard-overview': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.dashboardOverview',
    readTime: 4,
    lastUpdated: '2026-02-21',
    contentHtml: `
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
  },
  'getting-started/first-chat-test': {
    categorySlug: 'getting-started',
    categoryNameKey: 'categories.gettingStarted.title',
    titleKey: 'articles.firstChatTest',
    readTime: 3,
    lastUpdated: '2026-02-21',
    contentHtml: `
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
    lastUpdated: '2026-02-21',
    contentHtml: `
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
    contentHtml: `
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
    lastUpdated: '2026-02-21',
    contentHtml: `
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
