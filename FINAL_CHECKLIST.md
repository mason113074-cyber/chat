# 上線前最終檢查

## 功能測試
- [ ] 使用真實 LINE 帳號測試完整對話流程
- [ ] 上傳真實知識庫並測試回覆準確性
- [ ] 測試訂閱升級流程（使用 LemonSqueezy test mode）
- [ ] 測試所有 Dashboard 頁面無 console errors

## 安全性
- [ ] 所有 .env 變數都在 Vercel 設定（參考 .env.example）
- [ ] API Routes 有 authentication 檢查（Supabase Auth / getAuthFromRequest）
- [ ] Supabase RLS 已啟用並測試

## SEO
- [ ] Google Search Console 提交 sitemap
- [ ] 所有頁面有獨立 meta tags（next-intl / generateMetadata）
- [ ] Open Graph 圖片正確顯示

## 效能
- [ ] Lighthouse Mobile Score >90
- [ ] Lighthouse Desktop Score >95
- [ ] 所有圖片已壓縮或使用 next/image

## 監控
- [ ] Vercel Analytics 已啟用（若使用）
- [ ] Error tracking（如 Sentry）已設定（選用）
- [ ] Uptime monitor 已設定（選用）
- [ ] 健康檢查告警（lib/alert-service）已設定

## 法律
- [ ] 隱私權政策頁面完成
- [ ] 服務條款頁面完成
- [ ] Cookie 同意橫幅已加入（若適用）
